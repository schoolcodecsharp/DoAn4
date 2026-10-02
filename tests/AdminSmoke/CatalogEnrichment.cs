using System.Diagnostics;
using System.Security.Cryptography;
using System.Text.Json;
using System.Text.RegularExpressions;
using backend.Services;
using Dapper;
using Microsoft.Extensions.Configuration;
using MySqlConnector;

// Opt-in catalog-only import; never initializes or resets an existing database.
static class CatalogEnrichment
{
    record Place(string Key, string Name, string Province, string? Category, string? Address, string Description, string Source);
    record Trip(string Name, string Province, string[] Stops, string Description);
    record Catalog(string VerifiedOn, string Policy, Place[] Destinations, Place[] Hotels, Trip[] Tours);
    record Photo(string Key, int Id, string Title, string Source, string Author, string License, string LicenseUrl, string Download, string Caption);
    record Integrity(string Table, string PrimaryKey, long[] Ids, string Hash);
    static readonly JsonSerializerOptions Json = new() { PropertyNameCaseInsensitive = true, WriteIndented = true };
    static string Hash(byte[] bytes) => Convert.ToHexString(SHA256.HashData(bytes)).ToLowerInvariant();
    static string Digest(IEnumerable<dynamic> rows) => Hash(JsonSerializer.SerializeToUtf8Bytes(rows, Json));
    static bool SafeIdentifier(string value) => Regex.IsMatch(value, "^[A-Za-z][A-Za-z0-9_]*$");
    static string ImagePath(string root, Photo p) => Path.Combine(root, "wwwroot/media/catalog-20261001", $"{p.Key}-{p.Id}.jpg");
    static void Https(string value)
    {
        if (!Uri.TryCreate(value, UriKind.Absolute, out var uri) || uri.Scheme != "https") throw new Exception("Invalid source URL");
    }

    public static async Task Run(MySqlConnection db, IConfiguration config, string root, bool apply)
    {
        var manifest = JsonSerializer.Deserialize<Catalog>(await File.ReadAllTextAsync(Path.Combine(root, "../database/catalog-enrichment-20261001.json")), Json)!;
        var photos = JsonSerializer.Deserialize<Photo[]>(await File.ReadAllTextAsync(Path.Combine(root, "Data/catalog-photos-20261001.json")), Json)!;
        var places = manifest.Destinations.Concat(manifest.Hotels).ToArray();
        if (places.Select(p => p.Key).Distinct().Count() != places.Length) throw new Exception("Duplicate place key");
        foreach (var place in places)
        {
            if (ProvinceCatalog.Require(place.Province) != place.Province) throw new Exception("Noncanonical province");
            Https(place.Source);
        }
        foreach (var photo in photos)
        {
            if (!places.Any(p => p.Key == photo.Key) || !Regex.IsMatch(photo.Key, "^[a-z0-9-]+$") || photo.Id <= 0 ||
                !Regex.IsMatch(photo.License, "^CC BY(-SA)? [1-4]\\.0$|^CC0") || string.IsNullOrWhiteSpace(photo.Author) || photo.Caption.Length > 255)
                throw new Exception("Invalid photo manifest");
            Https(photo.Source); Https(photo.LicenseUrl);
            var bytes = await File.ReadAllBytesAsync(ImagePath(root, photo));
            using var meta = JsonDocument.Parse(await File.ReadAllTextAsync(Path.Combine(root, "Data/photo-sources", $"{photo.Key}-{photo.Id}.jpg.source.json")));
            if (bytes.Length < 10000 || bytes[0] != 255 || bytes[1] != 216 || meta.RootElement.GetProperty("Sha256").GetString() != Hash(bytes) ||
                meta.RootElement.GetProperty("Title").GetString() != photo.Title || meta.RootElement.GetProperty("Nguon").GetString() != photo.Source)
                throw new Exception("Image integrity failed: " + photo.Key);
        }
        if (photos.Select(p => p.Id).Distinct().Count() != photos.Length) throw new Exception("Duplicate photo");
        if (apply)
        {
            if (await db.ExecuteScalarAsync<int>("SELECT GET_LOCK('nvt_verified_catalog',10)") != 1) throw new Exception("Catalog import busy");
            try
            {
                await Backup(config, root);
                await using var tx = await db.BeginTransactionAsync();
                // Fingerprint every existing row, including catalog rows. New rows alone are allowed.
                var before = new List<Integrity>();
                var tables = await db.QueryAsync<(string Table, string PrimaryKey)>("""
                    SELECT TABLE_NAME,COLUMN_NAME FROM information_schema.KEY_COLUMN_USAGE
                    WHERE TABLE_SCHEMA=DATABASE() AND CONSTRAINT_NAME='PRIMARY' ORDER BY TABLE_NAME,ORDINAL_POSITION
                    """, transaction: tx);
                foreach (var t in tables)
                {
                    if (!SafeIdentifier(t.Table) || !SafeIdentifier(t.PrimaryKey)) throw new Exception("Unsafe table identifier");
                    var ids = (await db.QueryAsync<long>($"SELECT `{t.PrimaryKey}` FROM `{t.Table}` ORDER BY `{t.PrimaryKey}`", transaction: tx)).ToArray();
                    before.Add(new(t.Table, t.PrimaryKey, ids, Digest(await db.QueryAsync($"SELECT * FROM `{t.Table}` ORDER BY `{t.PrimaryKey}`", transaction: tx))));
                }
                var added = new List<string>();
                var idsByKey = new Dictionary<string, int>();
                string Description(string text, string source) => text + "\n\nNguồn đối chiếu: " + source + "\nNgày đối chiếu: " + manifest.VerifiedOn +
                    ". Thông tin giới thiệu đã đối chiếu; giá, giờ hoạt động và khả năng phục vụ cần xác nhận trực tiếp. Ảnh có thời điểm chụp riêng tại nguồn, không bảo đảm hiện trạng hôm nay.";
                foreach (var (table, entries) in new[] { ("DiaDiem", manifest.Destinations), ("KhachSan", manifest.Hotels) })
                    foreach (var p in entries)
                    {
                        var matches = (await db.QueryAsync<int>($"SELECT Ma{table} FROM {table} WHERE Ten{table}=@Name AND TinhThanh=@Province", p, tx)).ToArray();
                        if (matches.Length > 1) throw new Exception("Ambiguous place: " + p.Name);
                        var id = matches.SingleOrDefault();
                        if (id == 0)
                        {
                            var description = Description(p.Description, p.Source);
                            if (table == "DiaDiem")
                            {
                                var category = await db.ExecuteScalarAsync<int>("SELECT MaLoai FROM LoaiDiaDiem WHERE TenLoai=@Category AND TrangThai=1", p, tx);
                                if (category == 0) throw new Exception("Required category missing: " + p.Category);
                                id = await db.ExecuteScalarAsync<int>("""
                                    INSERT INTO DiaDiem(MaLoai,TenDiaDiem,TinhThanh,MoTa,ThoiGianThamQuan,MienPhi,TrangThai)
                                    VALUES(@category,@Name,@Province,@description,NULL,0,1); SELECT LAST_INSERT_ID();
                                    """, new { category, p.Name, p.Province, description }, tx);
                            }
                            else id = await db.ExecuteScalarAsync<int>("""
                                INSERT INTO KhachSan(TenKhachSan,TinhThanh,DiaChi,MoTa,LoaiLuuTru,TrangThai)
                                VALUES(@Name,@Province,@Address,@description,@kind,1); SELECT LAST_INSERT_ID();
                                """, new { p.Name, p.Province, p.Address, description, kind = p.Key == "furama" ? "Resort" : "Hotel" }, tx);
                            added.Add($"{table}#{id}: {p.Name}");
                        }
                        idsByKey[p.Key] = id;
                    }
                async Task Link(string table, int id, Photo photo)
                {
                    var url = $"/media/catalog-20261001/{photo.Key}-{photo.Id}.jpg";
                    if (await db.ExecuteScalarAsync<int>($"SELECT COUNT(*) FROM HinhAnh WHERE Ma{table}=@id AND DuongDan=@url", new { id, url }, tx) > 0) return;
                    var order = await db.ExecuteScalarAsync<int>($"SELECT COALESCE(MAX(ThuTu),-1)+1 FROM HinhAnh WHERE Ma{table}=@id", new { id }, tx);
                    await db.ExecuteAsync($"""
                        INSERT INTO HinhAnh(Ma{table},DuongDan,MoTa,ThuTu,Nguon,TacGia,GiayPhep,UrlGiayPhep)
                        VALUES(@id,@url,@Caption,@order,@Source,@Author,@License,@LicenseUrl)
                        """, new { id, url, order, photo.Caption, photo.Source, photo.Author, photo.License, photo.LicenseUrl }, tx);
                    added.Add($"HinhAnh: {table}#{id} {photo.Key}-{photo.Id}");
                }
                foreach (var p in photos)
                    await Link(manifest.Destinations.Any(d => d.Key == p.Key) ? "DiaDiem" : "KhachSan", idsByKey[p.Key], p);
                var actor = await db.ExecuteScalarAsync<int>("SELECT MaNguoiDung FROM NguoiDung WHERE MaVaiTro=1 AND TrangThai=1 ORDER BY MaNguoiDung LIMIT 1", transaction: tx);
                if (actor == 0) throw new Exception("Existing administrator required");
                foreach (var tour in manifest.Tours)
                {
                    var matches = (await db.QueryAsync<int>("SELECT MaTour FROM Tour WHERE TenTour=@Name", tour, tx)).ToArray();
                    if (matches.Length > 1) throw new Exception("Ambiguous tour");
                    // Do not modify existing tour activities or booking history on rerun.
                    if (matches.Length == 1) continue;
                    var sources = manifest.Destinations.Where(p => tour.Stops.Contains(p.Key)).Select(p => p.Source).Distinct();
                    var description = tour.Description + "\n\n" + manifest.Policy + "\nNgày biên soạn: " + manifest.VerifiedOn +
                        "\n" + string.Join("\n", sources.Select(s => "Nguồn đối chiếu: " + s));
                    var id = await db.ExecuteScalarAsync<int>("""
                        INSERT INTO Tour(MaNguoiTao,TenTour,MoTa,DiemKhoiHanh,DiemDen,SoNgay,SoDem,GiaTour,SoNguoiToiDa,SoNguoiToiThieu,TrangThai)
                        VALUES(@actor,@Name,@description,@Province,@Province,1,0,0,0,0,'Active'); SELECT LAST_INSERT_ID();
                        """, new { actor, tour.Name, tour.Province, description }, tx);
                    var order = 0;
                    foreach (var stop in tour.Stops)
                    {
                        var destination = idsByKey.GetValueOrDefault(stop);
                        if (destination == 0)
                        {
                            var stops = (await db.QueryAsync<int>("SELECT MaDiaDiem FROM DiaDiem WHERE TenDiaDiem=@stop AND TinhThanh=@Province AND TrangThai=1", new { stop, tour.Province }, tx)).ToArray();
                            if (stops.Length != 1) throw new Exception("Missing/ambiguous existing stop " + stop);
                            destination = stops[0];
                        }
                        await db.ExecuteAsync("""
                            INSERT INTO TourChiTiet(MaTour,NgayThu,ThuTu,LoaiDiaDiem,MaDiaDiem,GhiChu)
                            VALUES(@id,1,@order,'DiaDiem',@destination,@note)
                            """, new { id, order = ++order, destination, note = "Điểm gợi ý " + order + ". Tự chọn giờ sau khi xác nhận mở cửa và vé; chưa gồm xe, bữa ăn, lưu trú hoặc dịch vụ đặt chỗ." }, tx);
                        foreach (var photo in photos.Where(p => p.Key == stop)) await Link("Tour", id, photo);
                    }
                    added.Add($"Tour#{id}: {tour.Name}");
                }
                var writable = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "DiaDiem", "KhachSan", "Tour", "TourChiTiet", "HinhAnh" };
                foreach (var table in before)
                {
                    var rows = table.Ids.Length == 0 ? Array.Empty<dynamic>() : await db.QueryAsync($"SELECT * FROM `{table.Table}` WHERE `{table.PrimaryKey}` IN @Ids ORDER BY `{table.PrimaryKey}`", table, tx);
                    if (Digest(rows) != table.Hash) throw new Exception("Existing records changed; rolling back: " + table.Table);
                    if (!writable.Contains(table.Table) && await db.ExecuteScalarAsync<long>($"SELECT COUNT(*) FROM `{table.Table}`", transaction: tx) != table.Ids.Length)
                        throw new Exception("Protected table gained rows; rolling back: " + table.Table);
                }
                await tx.CommitAsync();
                Console.WriteLine(JsonSerializer.Serialize(new { added, existingTablesPreserved = before.Count }, Json));
            }
            finally { await db.ExecuteAsync("SELECT RELEASE_LOCK('nvt_verified_catalog')"); }
        }
        var totals = await db.QuerySingleAsync("""
            SELECT (SELECT COUNT(*) FROM DiaDiem) destinations,(SELECT COUNT(*) FROM KhachSan) hotels,
              (SELECT COUNT(*) FROM Tour) tours,(SELECT COUNT(*) FROM HinhAnh) imageLinks
            """);
        Console.WriteLine(JsonSerializer.Serialize(new { totals, verifiedFiles = photos.Length }, Json));
    }

    public static async Task Backup(IConfiguration config, string root)
    {
        var folder = Path.Combine(root, "backups"); Directory.CreateDirectory(folder);
        var backup = Path.Combine(folder, $"before-enrichment-{DateTime.Now:yyyyMMdd-HHmmssfff}.sql");
        var cs = new MySqlConnectionStringBuilder(config.GetConnectionString("DefaultConnection")!);
        var start = new ProcessStartInfo(@"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe") { UseShellExecute = false, CreateNoWindow = true, RedirectStandardError = true };
        foreach (var arg in new[] { "--host=" + cs.Server, "--port=" + cs.Port, "--user=" + cs.UserID, "--single-transaction", "--routines", "--triggers", "--no-tablespaces", "--databases", cs.Database, "--result-file=" + backup }) start.ArgumentList.Add(arg);
        start.Environment["MYSQL_PWD"] = cs.Password;
        using var process = Process.Start(start)!;
        var error = await process.StandardError.ReadToEndAsync(); await process.WaitForExitAsync();
        if (process.ExitCode != 0 || !File.Exists(backup) || new FileInfo(backup).Length < 100) throw new Exception("Backup failed; no writes. " + error);
        Console.WriteLine("BACKUP: " + backup);
    }
}
