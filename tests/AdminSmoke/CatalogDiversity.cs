using System.Security.Cryptography;
using System.Text.Json;
using System.Text.RegularExpressions;
using backend.Services;
using Dapper;
using Microsoft.Extensions.Configuration;
using MySqlConnector;

// Explicit, additive catalog import. No synthetic customers, orders, ratings or stock.
static class CatalogDiversity
{
    record Place(string Key, string Kind, string Name, string Province, string? Category,
        string? AccommodationType, string Address, string Description, string Source);
    record Stop(int Day, string? Key, string? Kind, string? Name, string? Province, string Note);
    record Trip(string Key, string Name, string Province, int Days, string Description, Stop[] Stops);
    record Manifest(string VerifiedOn, string Policy, Place[] Places, Trip[] Tours);
    record Target(string Kind, int Id, string Name, string Province, string Source);
    record Snapshot(string Table, string PrimaryKey, long[] Ids, string Hash);
    record PhotoLink(string DuongDan, string? MoTa, string Nguon, string TacGia, string GiayPhep, string? UrlGiayPhep);
    static readonly JsonSerializerOptions Json = new() { PropertyNameCaseInsensitive = true, WriteIndented = true };
    static readonly HashSet<string> Kinds = ["DiaDiem", "KhachSan", "NhaHang"];
    static string Digest(IEnumerable<dynamic> rows) => Convert.ToHexString(SHA256.HashData(JsonSerializer.SerializeToUtf8Bytes(rows, Json)));
    static void Require(bool condition, string message) { if (!condition) throw new InvalidOperationException(message); }

    public static async Task Run(MySqlConnection db, IConfiguration config, string root, bool apply)
    {
        var manifest = JsonSerializer.Deserialize<Manifest>(await File.ReadAllTextAsync(Path.Combine(root, "../database/catalog-diversity-20261002.json")), Json)!;
        Require(DateOnly.TryParseExact(manifest.VerifiedOn, "yyyy-MM-dd", out _), "Invalid verification date");
        Require(manifest.Places.Select(p => p.Key).Distinct().Count() == manifest.Places.Length, "Duplicate place key");
        Require(manifest.Tours.Select(t => t.Name).Distinct().Count() == manifest.Tours.Length, "Duplicate tour name");
        foreach (var p in manifest.Places)
        {
            Require(Kinds.Contains(p.Kind) && Regex.IsMatch(p.Key, "^[a-z0-9-]+$"), "Invalid kind/key");
            Require(!string.IsNullOrWhiteSpace(p.Name) && p.Name.Length <= 200 && p.Address.Length <= 300 && p.Description.Length > 30, "Invalid place text");
            Require(ProvinceCatalog.Require(p.Province) == p.Province, "Noncanonical province: " + p.Province);
            Require(Uri.TryCreate(p.Source, UriKind.Absolute, out var uri) && uri.Scheme == "https", "Invalid source URL");
            if (p.Kind == "KhachSan") Require(new[] { "Hotel", "Resort", "Homestay", "Hostel", "Villa" }.Contains(p.AccommodationType), "Invalid accommodation kind");
            if (p.Kind == "DiaDiem") Require(!string.IsNullOrWhiteSpace(p.Category), "Missing category");
        }
        foreach (var t in manifest.Tours)
        {
            Require(t.Name.Length <= 200 && t.Name.Contains("tham khảo") && t.Days is >= 1 and <= 30, "Invalid reference tour");
            Require(ProvinceCatalog.Require(t.Province) == t.Province, "Noncanonical tour province");
            Require(Enumerable.Range(1, t.Days).All(day => t.Stops.Any(s => s.Day == day)), "Empty tour day");
            foreach (var s in t.Stops)
            {
                Require(s.Day >= 1 && s.Day <= t.Days && s.Note.Length <= 400, "Invalid activity");
                if (s.Key is not null) Require(manifest.Places.Any(p => p.Key == s.Key && p.Province == t.Province), "Unknown/wrong-province stop");
                else Require(s.Kind is not null && Kinds.Contains(s.Kind) && !string.IsNullOrWhiteSpace(s.Name) && s.Province == t.Province, "Invalid existing stop");
            }
        }
        var added = new Dictionary<string, int>();
        void Added(string table) => added[table] = added.GetValueOrDefault(table) + 1;
        if (apply)
        {
            Require(await db.ExecuteScalarAsync<int>("SELECT GET_LOCK('nvt_verified_catalog',10)") == 1, "Another catalog import is running");
            try
            {
                await CatalogEnrichment.Backup(config, root);
                await using var tx = await db.BeginTransactionAsync();
                var tables = (await db.QueryAsync<(string Table, string PrimaryKey)>("""
                    SELECT TABLE_NAME,COLUMN_NAME FROM information_schema.KEY_COLUMN_USAGE
                    WHERE TABLE_SCHEMA=DATABASE() AND CONSTRAINT_NAME='PRIMARY' ORDER BY TABLE_NAME,ORDINAL_POSITION
                    """, transaction: tx)).ToArray();
                Require(tables.Select(t => t.Table).Distinct().Count() == tables.Length, "Composite keys require a dedicated integrity reader");
                var snapshots = new List<Snapshot>();
                foreach (var table in tables)
                {
                    Require(Regex.IsMatch(table.Table, "^[A-Za-z][A-Za-z0-9_]*$") && Regex.IsMatch(table.PrimaryKey, "^[A-Za-z][A-Za-z0-9_]*$"), "Unsafe table identifier");
                    var ids = (await db.QueryAsync<long>($"SELECT `{table.PrimaryKey}` FROM `{table.Table}` ORDER BY `{table.PrimaryKey}`", transaction: tx)).ToArray();
                    snapshots.Add(new(table.Table, table.PrimaryKey, ids, Digest(await db.QueryAsync($"SELECT * FROM `{table.Table}` ORDER BY `{table.PrimaryKey}`", transaction: tx))));
                }
                var targets = new Dictionary<string, Target>();
                foreach (var p in manifest.Places)
                {
                    var ids = (await db.QueryAsync<int>($"SELECT Ma{p.Kind} FROM {p.Kind} WHERE Ten{p.Kind}=@Name AND TinhThanh=@Province", p, tx)).ToArray();
                    Require(ids.Length <= 1, "Ambiguous existing place: " + p.Name);
                    var id = ids.SingleOrDefault();
                    if (id == 0)
                    {
                        var description = p.Description + "\n\nNguồn đối chiếu: " + p.Source + "\nNgày đối chiếu: " + manifest.VerifiedOn +
                            ". Thông tin giới thiệu; giá, giờ phục vụ và khả năng tiếp nhận cần xác nhận trực tiếp. Chưa có ảnh khi chưa xác minh quyền sử dụng. Tên tỉnh/thành được chuẩn hóa theo danh mục hiện tại; nguồn có thể dùng địa danh trước sắp xếp.";
                        if (p.Kind == "DiaDiem")
                        {
                            var categories = (await db.QueryAsync<int>("SELECT MaLoai FROM LoaiDiaDiem WHERE TenLoai=@Category AND TrangThai=1", p, tx)).ToArray();
                            Require(categories.Length == 1, "Missing/ambiguous category: " + p.Category);
                            id = await db.ExecuteScalarAsync<int>("""
                                INSERT INTO DiaDiem(MaLoai,TenDiaDiem,TinhThanh,DiaChi,MoTa,ThoiGianThamQuan,MienPhi,TrangThai)
                                VALUES(@category,@Name,@Province,@Address,@description,NULL,0,1); SELECT LAST_INSERT_ID();
                                """, new { category = categories[0], p.Name, p.Province, p.Address, description }, tx);
                        }
                        else if (p.Kind == "KhachSan") id = await db.ExecuteScalarAsync<int>("""
                            INSERT INTO KhachSan(TenKhachSan,TinhThanh,DiaChi,MoTa,LoaiLuuTru,TrangThai)
                            VALUES(@Name,@Province,@Address,@description,@AccommodationType,1); SELECT LAST_INSERT_ID();
                            """, new { p.Name, p.Province, p.Address, description, p.AccommodationType }, tx);
                        else id = await db.ExecuteScalarAsync<int>("""
                            INSERT INTO NhaHang(TenNhaHang,TinhThanh,DiaChi,MoTa,TrangThai)
                            VALUES(@Name,@Province,@Address,@description,1); SELECT LAST_INSERT_ID();
                            """, new { p.Name, p.Province, p.Address, description }, tx);
                        Added(p.Kind);
                    }
                    targets[p.Key] = new(p.Kind, id, p.Name, p.Province, p.Source);
                }
                var actor = await db.ExecuteScalarAsync<int>("SELECT MaNguoiDung FROM NguoiDung WHERE MaVaiTro=1 AND TrangThai=1 ORDER BY MaNguoiDung LIMIT 1", transaction: tx);
                Require(actor > 0, "An existing administrator is required");
                foreach (var t in manifest.Tours)
                {
                    var ids = (await db.QueryAsync<int>("SELECT MaTour FROM Tour WHERE TenTour=@Name", t, tx)).ToArray();
                    Require(ids.Length <= 1, "Ambiguous tour: " + t.Name);
                    if (ids.Length == 1) continue; // Never rewrite a saved itinerary/history.
                    var sources = t.Stops.Where(s => s.Key is not null).Select(s => targets[s.Key!].Source).Distinct();
                    var description = t.Description + "\n\n" + manifest.Policy + "\nNgày biên soạn: " + manifest.VerifiedOn + "\n" + string.Join("\n", sources.Select(s => "Nguồn đối chiếu: " + s));
                    var tourId = await db.ExecuteScalarAsync<int>("""
                        INSERT INTO Tour(MaNguoiTao,TenTour,MoTa,DiemKhoiHanh,DiemDen,SoNgay,SoDem,GiaTour,SoNguoiToiDa,SoNguoiToiThieu,TrangThai)
                        VALUES(@actor,@Name,@description,@Province,@Province,@Days,@nights,0,0,0,'Active'); SELECT LAST_INSERT_ID();
                        """, new { actor, t.Name, description, t.Province, t.Days, nights = t.Days - 1 }, tx);
                    Added("Tour");
                    var ordering = new Dictionary<int, int>();
                    foreach (var stop in t.Stops)
                    {
                        Target target;
                        if (stop.Key is not null) target = targets[stop.Key];
                        else
                        {
                            var matches = (await db.QueryAsync<int>($"SELECT Ma{stop.Kind} FROM {stop.Kind} WHERE Ten{stop.Kind}=@Name AND TinhThanh=@Province AND TrangThai=1", stop, tx)).ToArray();
                            Require(matches.Length == 1, "Missing/ambiguous existing stop: " + stop.Name);
                            target = new(stop.Kind!, matches[0], stop.Name!, stop.Province!, "");
                        }
                        ordering[stop.Day] = ordering.GetValueOrDefault(stop.Day) + 1;
                        var note = string.IsNullOrWhiteSpace(stop.Note) ? "Điểm gợi ý; xác nhận giờ mở cửa, vé và thời gian di chuyển trước khi chốt kế hoạch." : stop.Note;
                        await db.ExecuteAsync($"""
                            INSERT INTO TourChiTiet(MaTour,NgayThu,ThuTu,LoaiDiaDiem,Ma{target.Kind},GhiChu)
                            VALUES(@tourId,@Day,@order,@Kind,@Id,@note)
                            """, new { tourId, stop.Day, order = ordering[stop.Day], target.Kind, target.Id, note }, tx);
                        Added("TourChiTiet");
                        // Reuse only credited images of this exact stop, never a regional stand-in for a hotel.
                        var photos = await db.QueryAsync<PhotoLink>($"""
                            SELECT DuongDan,MoTa,Nguon,TacGia,GiayPhep,UrlGiayPhep FROM HinhAnh
                            WHERE Ma{target.Kind}=@Id AND DuongDan LIKE '/media/%'
                              AND Nguon LIKE 'https://%' AND GiayPhep LIKE 'CC BY%' AND NULLIF(TRIM(TacGia),'') IS NOT NULL
                            ORDER BY ThuTu,MaHinhAnh
                            """, new { target.Id }, tx);
                        foreach (var photo in photos.DistinctBy(p => p.DuongDan))
                        {
                            Require(!photo.DuongDan.Contains("..") && !photo.DuongDan.Contains('\\') && File.Exists(Path.Combine(root,"wwwroot",photo.DuongDan.TrimStart('/'))), "Invalid local photo");
                            if (await db.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM HinhAnh WHERE MaTour=@tourId AND DuongDan=@DuongDan", new { tourId, photo.DuongDan }, tx) > 0) continue;
                            var order = await db.ExecuteScalarAsync<int>("SELECT COALESCE(MAX(ThuTu),-1)+1 FROM HinhAnh WHERE MaTour=@tourId", new { tourId }, tx);
                            var caption = target.Name + ": " + photo.MoTa;
                            await db.ExecuteAsync("""
                                INSERT INTO HinhAnh(MaTour,DuongDan,MoTa,ThuTu,Nguon,TacGia,GiayPhep,UrlGiayPhep)
                                VALUES(@tourId,@DuongDan,@caption,@order,@Nguon,@TacGia,@GiayPhep,@UrlGiayPhep)
                                """, new { tourId, photo.DuongDan, caption = caption[..Math.Min(caption.Length,255)], order, photo.Nguon, photo.TacGia, photo.GiayPhep, photo.UrlGiayPhep }, tx);
                            Added("HinhAnh");
                        }
                    }
                }
                var writable = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "DiaDiem", "KhachSan", "NhaHang", "Tour", "TourChiTiet", "HinhAnh" };
                foreach (var snapshot in snapshots)
                {
                    var oldRows = snapshot.Ids.Length == 0 ? Array.Empty<dynamic>() : await db.QueryAsync($"SELECT * FROM `{snapshot.Table}` WHERE `{snapshot.PrimaryKey}` IN @Ids ORDER BY `{snapshot.PrimaryKey}`", snapshot, tx);
                    Require(Digest(oldRows) == snapshot.Hash, "Existing rows changed; rolling back " + snapshot.Table);
                    if (!writable.Contains(snapshot.Table)) Require(await db.ExecuteScalarAsync<long>($"SELECT COUNT(*) FROM `{snapshot.Table}`", transaction: tx) == snapshot.Ids.Length, "Protected table gained rows");
                }
                await tx.CommitAsync();
                Console.WriteLine(JsonSerializer.Serialize(new { added, existingTablesPreserved = snapshots.Count }, Json));
            }
            finally { await db.ExecuteAsync("SELECT RELEASE_LOCK('nvt_verified_catalog')"); }
        }
        var missing = new List<string>();
        foreach (var p in manifest.Places)
            if (await db.ExecuteScalarAsync<int>($"SELECT COUNT(*) FROM {p.Kind} WHERE Ten{p.Kind}=@Name AND TinhThanh=@Province", p) != 1) missing.Add(p.Key);
        foreach (var t in manifest.Tours)
        {
            var found = (await db.QueryAsync<int>("SELECT MaTour FROM Tour WHERE TenTour=@Name", t)).ToArray();
            if (found.Length != 1) { missing.Add(t.Key); continue; }
            Require(await db.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM TourChiTiet WHERE MaTour=@id", new { id = found[0] }) == t.Stops.Length, "Unexpected imported activity count");
        }
        var totals = await db.QuerySingleAsync("""
            SELECT (SELECT COUNT(*) FROM DiaDiem) destinations,(SELECT COUNT(*) FROM KhachSan) hotels,
                (SELECT COUNT(*) FROM NhaHang) restaurants,(SELECT COUNT(*) FROM Tour) tours,
                (SELECT COUNT(*) FROM TourChiTiet) activities,(SELECT COUNT(*) FROM HinhAnh) imageLinks
            """);
        Console.WriteLine(JsonSerializer.Serialize(new { totals, manifestPlaces = manifest.Places.Length, manifestTours = manifest.Tours.Length, missing }, Json));
        if (apply) Require(missing.Count == 0, "Import incomplete");
    }
}
