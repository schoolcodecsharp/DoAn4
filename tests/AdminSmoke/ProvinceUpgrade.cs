using System.Diagnostics;
using System.Text.Json;
using backend.Services;
using Dapper;
using Microsoft.Extensions.Configuration;
using MySqlConnector;

// Explicit opt-in, additive, backed-up import. Does not touch bookings, users or media.
static class ProvinceUpgrade
{
    record Stay(string Province, string Hotel, string Restaurant, string Address, string[] Sources);
    record Destination(string Province, string Name, string Category, string Description, string Source);
    record Manifest(string VerifiedOn, string ReferenceTourPolicy, Stay[] Stays, Destination[] Destinations);
    public sealed record CoverageRow(string Province, long Destinations, long Hotels, long Restaurants, long Tours);
    static readonly JsonSerializerOptions Json = new() { PropertyNameCaseInsensitive = true, WriteIndented = true };

    public static async Task Run(MySqlConnection db, IConfiguration config, string root, bool apply)
    {
        if (!apply) {
            await Report(db);
            Console.WriteLine(JsonSerializer.Serialize(new { categories = await db.QueryAsync("SELECT MaLoai,TenLoai,TrangThai FROM LoaiDiaDiem") }, Json));
            return;
        }
        var manifest = JsonSerializer.Deserialize<Manifest>(await File.ReadAllTextAsync(Path.Combine(root, "../database/verified-catalog-20261001.json")), Json)!;
        if (ProvinceCatalog.All.Count != 34 || ProvinceCatalog.All.Select(p => p.Code).Distinct().Count() != 34 ||
            manifest.Stays.Length != 18 || manifest.Destinations.Length != 18) throw new Exception("Unexpected manifest coverage.");
        foreach (var province in manifest.Stays.Select(s => s.Province).Concat(manifest.Destinations.Select(d => d.Province)))
            if (ProvinceCatalog.Require(province) != province) throw new Exception("Manifest must use canonical names.");
        foreach (var source in manifest.Stays.SelectMany(s => s.Sources).Concat(manifest.Destinations.Select(d => d.Source)))
            if (!Uri.TryCreate(source, UriKind.Absolute, out var uri) || uri.Scheme != "https") throw new Exception("Invalid source URL.");
        if (await db.ExecuteScalarAsync<int>("SELECT GET_LOCK('nvt_verified_catalog',10)") != 1) throw new Exception("Catalog import already running.");
        try
        {
            // Preflight every current name, including archived rows; fail instead of guessing.
            foreach (var table in new[] { "DiaDiem", "KhachSan", "NhaHang" })
                foreach (var name in await db.QueryAsync<string>($"SELECT DISTINCT TinhThanh FROM {table} WHERE NULLIF(TRIM(TinhThanh),'') IS NOT NULL"))
                    if (ProvinceCatalog.Resolve(name) is null) throw new Exception($"Unmapped province in {table}: {name}");
            await Backup(db, config, root);
            // MySQL DDL commits implicitly. Only the empty, additive table is outside the transaction.
            await db.ExecuteAsync(await File.ReadAllTextAsync(Path.Combine(root, "../database/migrations/20261001_provinces.sql")));
            await using var tx = await db.BeginTransactionAsync();
            var extra = await db.QueryAsync<int>("SELECT Code FROM TinhThanh WHERE Code NOT IN @codes", new { codes = ProvinceCatalog.All.Select(p => p.Code).ToArray() }, tx);
            if (extra.Any()) throw new Exception("Unexpected province IDs; migration will not delete them.");
            foreach (var p in ProvinceCatalog.All)
                await db.ExecuteAsync("""
                    INSERT INTO TinhThanh(Code,Name,DivisionType,Aliases,VerifiedOn) VALUES(@Code,@Name,@DivisionType,@aliases,@VerifiedOn)
                    ON DUPLICATE KEY UPDATE Name=@Name,DivisionType=@DivisionType,Aliases=@aliases,VerifiedOn=@VerifiedOn
                    """, new { p.Code, p.Name, p.DivisionType, aliases = JsonSerializer.Serialize(p.Aliases), p.VerifiedOn }, tx);
            var normalized = 0;
            foreach (var table in new[] { "DiaDiem", "KhachSan", "NhaHang" })
                foreach (var old in await db.QueryAsync<string>($"SELECT DISTINCT TinhThanh FROM {table} WHERE NULLIF(TRIM(TinhThanh),'') IS NOT NULL FOR UPDATE", transaction: tx))
                {
                    var name = ProvinceCatalog.Require(old);
                    if (old != name) normalized += await db.ExecuteAsync($"UPDATE {table} SET TinhThanh=@name WHERE BINARY TinhThanh=BINARY @old", new { name, old }, tx);
                }
            var added = new List<string>();
            string Provenance(string text, IEnumerable<string> sources) => text + "\n\nNguồn đối chiếu: " +
                string.Join("\nNguồn bổ sung: ", sources) + "\nNgày đối chiếu: " + manifest.VerifiedOn +
                ". Xác minh tên, địa phương và mô tả danh mục; không xác nhận giá, giờ hoạt động hay khả năng phục vụ. Chưa có ảnh được cấp quyền sử dụng.";
            foreach (var stay in manifest.Stays)
                foreach (var (table, name, description) in new[] {
                    ("KhachSan",stay.Hotel,$"Cơ sở lưu trú {stay.Hotel} tại {stay.Province}."),
                    ("NhaHang",stay.Restaurant,$"Nhà hàng thuộc {stay.Hotel} tại {stay.Province}. Thêm vào lịch trình không phải đặt bàn.") })
                {
                    if (await db.ExecuteScalarAsync<int>($"SELECT COUNT(*) FROM {table} WHERE Ten{table}=@name AND TinhThanh=@Province", new { name, stay.Province }, tx) > 0) continue;
                    var id = await db.ExecuteScalarAsync<int>($"INSERT INTO {table}(Ten{table},TinhThanh,DiaChi,MoTa,TrangThai) VALUES(@name,@Province,@Address,@description,1); SELECT LAST_INSERT_ID();",
                        new { name, stay.Province, stay.Address, description = Provenance(description, stay.Sources) }, tx);
                    added.Add($"{table}#{id}");
                }
            var actor = await db.ExecuteScalarAsync<int>("SELECT MaNguoiDung FROM NguoiDung WHERE MaVaiTro=1 AND TrangThai=1 ORDER BY MaNguoiDung LIMIT 1", transaction: tx);
            if (actor == 0) throw new Exception("Existing active admin required.");
            foreach (var d in manifest.Destinations)
            {
                var destinationId = await db.ExecuteScalarAsync<int>("SELECT MaDiaDiem FROM DiaDiem WHERE TenDiaDiem=@Name AND TinhThanh=@Province LIMIT 1", d, tx);
                if (destinationId == 0)
                {
                    // Use existing meaningful categories; never assign natural sites to a history category.
                    var categoryName = d.Name.Contains("Bảo tàng") ? "Bảo tàng" :
                        d.Name.StartsWith("Núi") ? "Núi cao - Đèo" :
                        d.Name.StartsWith("Vườn") ? "Công viên - Vườn" :
                        d.Name.StartsWith("Bản") || d.Name.StartsWith("Làng") ? "Làng nghề - Phố cổ" :
                        d.Category == "Văn hóa" ? "Di tích lịch sử" : "Danh lam thắng cảnh";
                    var category = await db.ExecuteScalarAsync<int>("SELECT MaLoai FROM LoaiDiaDiem WHERE TenLoai=@categoryName ORDER BY MaLoai LIMIT 1", new { categoryName }, tx);
                    if (category == 0)
                    {
                        category = await db.ExecuteScalarAsync<int>("INSERT INTO LoaiDiaDiem(TenLoai,MoTa,TrangThai) VALUES(@categoryName,@note,1); SELECT LAST_INSERT_ID();",
                            new { categoryName, note = "Phân loại danh mục điểm tham quan." }, tx);
                        added.Add($"LoaiDiaDiem#{category}");
                    }
                    else if (await db.ExecuteScalarAsync<int>("SELECT TrangThai FROM LoaiDiaDiem WHERE MaLoai=@category", new { category }, tx) != 1)
                        throw new Exception("Required category is archived; not reactivating it.");
                    destinationId = await db.ExecuteScalarAsync<int>("INSERT INTO DiaDiem(MaLoai,TenDiaDiem,TinhThanh,MoTa,ThoiGianThamQuan,TrangThai) VALUES(@category,@Name,@Province,@description,NULL,1); SELECT LAST_INSERT_ID();",
                        new { category, d.Name, d.Province, description = Provenance(d.Description, [d.Source]) }, tx);
                    added.Add($"DiaDiem#{destinationId}");
                }
                var name = $"Tham khảo {d.Province}: {d.Name}";
                if (await db.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM Tour WHERE TenTour=@name", new { name }, tx) > 0) continue;
                var tourId = await db.ExecuteScalarAsync<int>("""
                    INSERT INTO Tour(MaNguoiTao,TenTour,MoTa,DiemKhoiHanh,DiemDen,SoNgay,SoDem,GiaTour,SoNguoiToiDa,SoNguoiToiThieu,TrangThai)
                    VALUES(@actor,@name,@description,@origin,@Province,1,0,0,0,0,'Active'); SELECT LAST_INSERT_ID();
                    """, new { actor, name, origin = d.Name, d.Province,
                        description = Provenance(manifest.ReferenceTourPolicy + "\n\nĐiểm gợi ý: " + d.Description, [d.Source]) }, tx);
                await db.ExecuteAsync("""
                    INSERT INTO TourChiTiet(MaTour,NgayThu,ThuTu,LoaiDiaDiem,MaDiaDiem,GhiChu)
                    VALUES(@tourId,1,1,'DiaDiem',@destinationId,@note)
                    """, new { tourId, destinationId, note = "Gợi ý ngày tham quan tại địa phương: tìm hiểu điểm đến này. Tự chọn khung giờ sau khi liên hệ xác nhận mở cửa và vé. Không gồm xe, ăn uống hay lưu trú; đây không phải lịch trình tour đang mở bán." }, tx);
                added.Add($"Tour#{tourId}");
            }
            var coverage = (await Coverage(db, tx)).ToArray();
            if (coverage.Length != 34 || coverage.Any(p => p.Destinations == 0 || p.Hotels == 0 || p.Restaurants == 0 || p.Tours == 0))
                throw new Exception("Coverage incomplete; catalog transaction rolled back: " + JsonSerializer.Serialize(coverage, Json));
            await tx.CommitAsync();
            Console.WriteLine(JsonSerializer.Serialize(new { normalized, added, provinces = coverage.Length }, Json));
        }
        finally { await db.ExecuteAsync("SELECT RELEASE_LOCK('nvt_verified_catalog')"); }
        await Report(db);
    }

    public static Task<IEnumerable<CoverageRow>> Coverage(MySqlConnection db, MySqlTransaction? tx = null) => db.QueryAsync<CoverageRow>("""
        SELECT p.Name Province,
          (SELECT COUNT(*) FROM DiaDiem d WHERE d.TinhThanh=p.Name AND d.TrangThai=1) Destinations,
          (SELECT COUNT(*) FROM KhachSan h WHERE h.TinhThanh=p.Name AND h.TrangThai=1) Hotels,
          (SELECT COUNT(*) FROM NhaHang r WHERE r.TinhThanh=p.Name AND r.TrangThai=1) Restaurants,
          (SELECT COUNT(DISTINCT t.MaTour) FROM Tour t JOIN TourChiTiet c ON c.MaTour=t.MaTour
            JOIN DiaDiem d ON d.MaDiaDiem=c.MaDiaDiem WHERE t.TrangThai='Active' AND d.TinhThanh=p.Name) Tours
        FROM TinhThanh p ORDER BY p.Name
        """, transaction: tx);

    static async Task Report(MySqlConnection db) => Console.WriteLine(JsonSerializer.Serialize(new { coverage = await Coverage(db) }, Json));

    static async Task Backup(MySqlConnection db, IConfiguration config, string root)
    {
        var folder = Path.Combine(root, "backups"); Directory.CreateDirectory(folder);
        var backup = Path.Combine(folder, $"before-provinces-{DateTime.Now:yyyyMMdd-HHmmssfff}.sql");
        var cs = new MySqlConnectionStringBuilder(config.GetConnectionString("DefaultConnection")!);
        var start = new ProcessStartInfo(@"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe") { UseShellExecute = false, CreateNoWindow = true, RedirectStandardError = true };
        foreach (var arg in new[] { "--host=" + cs.Server, "--port=" + cs.Port, "--user=" + cs.UserID, "--single-transaction", "--routines", "--triggers", "--no-tablespaces", "--databases", cs.Database, "--result-file=" + backup }) start.ArgumentList.Add(arg);
        start.Environment["MYSQL_PWD"] = cs.Password;
        using var process = Process.Start(start)!;
        var error = await process.StandardError.ReadToEndAsync(); await process.WaitForExitAsync();
        if (process.ExitCode != 0 || !File.Exists(backup) || new FileInfo(backup).Length < 100) throw new Exception("Backup failed; database unchanged. " + error);
        Console.WriteLine("BACKUP: " + backup);
    }
}
