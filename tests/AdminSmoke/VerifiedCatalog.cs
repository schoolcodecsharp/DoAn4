using System.Diagnostics;
using System.Text.Json;
using Dapper;
using Microsoft.Extensions.Configuration;
using MySqlConnector;
using backend.Services;

// Explicit opt-in import. Never executes the destructive bootstrap SQL.
static class VerifiedCatalog
{
    record Stay(string Province, string? Hotel, string? Restaurant, string Address, string Description, string Source);
    record Destination(string Name, string Province, string Description, string Source);
    record Tour(string Name, string Province, string Origin, int Days, int Nights, decimal ReferencePrice, string Description, string Source);
    record Manifest(string VerifiedOn, Stay[] Stays, Destination[] Destinations, Tour[] Tours);
    public static async Task Run(MySqlConnection db, IConfiguration config, string root, bool apply)
    {
        var file = Path.GetFullPath(Path.Combine(root, "../database/verified-catalog-20260929.json"));
        var manifest = JsonSerializer.Deserialize<Manifest>(await File.ReadAllTextAsync(file), new JsonSerializerOptions { PropertyNameCaseInsensitive = true })!;
        // Re-running this older import must not reintroduce pre-merger province names.
        manifest = manifest with {
            Stays = manifest.Stays.Select(s => s with { Province = ProvinceCatalog.Require(s.Province)! }).ToArray(),
            Destinations = manifest.Destinations.Select(d => d with { Province = ProvinceCatalog.Require(d.Province)! }).ToArray(),
            Tours = manifest.Tours.Select(t => t with { Province = ProvinceCatalog.Require(t.Province)! }).ToArray()
        };
        foreach (var url in manifest.Stays.Select(x => x.Source).Concat(manifest.Destinations.Select(x => x.Source)).Concat(manifest.Tours.Select(x => x.Source)))
            if (!Uri.TryCreate(url, UriKind.Absolute, out var uri) || uri.Scheme != "https") throw new Exception("Invalid provenance URL");
        if (apply)
        {
            if (await db.ExecuteScalarAsync<int>("SELECT GET_LOCK('nvt_verified_catalog',10)") != 1) throw new Exception("Import already running");
            try
            {
                var folder = Path.Combine(root, "backups"); Directory.CreateDirectory(folder);
                var backup = Path.Combine(folder, $"before-verified-catalog-{DateTime.Now:yyyyMMdd-HHmmssfff}.sql");
                var cs = new MySqlConnectionStringBuilder(config.GetConnectionString("DefaultConnection") ?? throw new Exception("Missing database connection"));
                var start = new ProcessStartInfo(@"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe") { UseShellExecute = false, CreateNoWindow = true, RedirectStandardError = true };
                foreach (var arg in new[] { "--host=" + cs.Server, "--port=" + cs.Port, "--user=" + cs.UserID, "--single-transaction", "--routines", "--triggers", "--no-tablespaces", "--databases", cs.Database, "--result-file=" + backup }) start.ArgumentList.Add(arg);
                start.Environment["MYSQL_PWD"] = cs.Password;
                using (var process = Process.Start(start)!)
                {
                    var error = await process.StandardError.ReadToEndAsync(); await process.WaitForExitAsync();
                    if (process.ExitCode != 0 || !File.Exists(backup) || new FileInfo(backup).Length < 100) throw new Exception("Backup failed; no import. " + error);
                }
                Console.WriteLine("BACKUP: " + backup);
                await using var tx = await db.BeginTransactionAsync();
                var added = new List<string>();
                string Description(string text, string source) => text + "\n\nNguồn đối chiếu: " + source + "\nNgày đối chiếu: " + manifest.VerifiedOn + ". Chỉ xác minh thông tin danh mục; giá, khả năng phục vụ và tình trạng chỗ cần liên hệ cơ sở. Chưa nhập ảnh khi chưa xác minh quyền sử dụng.";
                foreach (var stay in manifest.Stays)
                {
                    foreach (var (table, name) in new[] { ("KhachSan", stay.Hotel), ("NhaHang", stay.Restaurant) })
                    {
                        if (string.IsNullOrWhiteSpace(name)) continue;
                        if (await db.ExecuteScalarAsync<int>($"SELECT COUNT(*) FROM {table} WHERE Ten{table}=@name AND TinhThanh=@Province", new { name, stay.Province }, tx) > 0) continue;
                        // SQL zero is the legacy schema's unknown-price sentinel, never free service.
                        var id = await db.ExecuteScalarAsync<int>($"INSERT INTO {table}(Ten{table},TinhThanh,DiaChi,MoTa,TrangThai) VALUES(@name,@Province,@Address,@description,1); SELECT LAST_INSERT_ID();",
                            new { name, stay.Province, stay.Address, description = Description(stay.Description, stay.Source) }, tx);
                        added.Add($"{table}#{id}: {name}");
                    }
                }
                var category = await db.ExecuteScalarAsync<int>("SELECT MaLoai FROM LoaiDiaDiem WHERE TrangThai=1 AND (TenLoai LIKE '%Văn hóa%' OR TenLoai LIKE '%lịch sử%' OR TenLoai LIKE '%Tâm linh%') ORDER BY MaLoai LIMIT 1", transaction: tx);
                if (category == 0) throw new Exception("No suitable destination category; transaction rolled back");
                foreach (var destination in manifest.Destinations)
                {
                    if (await db.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM DiaDiem WHERE TenDiaDiem=@Name AND TinhThanh=@Province", destination, tx) > 0) continue;
                    var id = await db.ExecuteScalarAsync<int>("INSERT INTO DiaDiem(MaLoai,TenDiaDiem,TinhThanh,MoTa,ThoiGianThamQuan,TrangThai) VALUES(@category,@Name,@Province,@description,NULL,1); SELECT LAST_INSERT_ID();",
                        new { category, destination.Name, destination.Province, description = Description(destination.Description, destination.Source) }, tx);
                    added.Add($"DiaDiem#{id}: {destination.Name}");
                }
                var actor = await db.ExecuteScalarAsync<int>("SELECT MaNguoiDung FROM NguoiDung WHERE MaVaiTro=1 AND TrangThai=1 ORDER BY MaNguoiDung LIMIT 1", transaction: tx);
                if (actor == 0) throw new Exception("Existing administrator required");
                foreach (var tour in manifest.Tours)
                {
                    if (await db.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM Tour WHERE TenTour=@Name", tour, tx) > 0) continue;
                    // No departures and no room stock: this is a reference listing, not NVT inventory.
                    var id = await db.ExecuteScalarAsync<int>("INSERT INTO Tour(MaNguoiTao,TenTour,MoTa,DiemKhoiHanh,DiemDen,SoNgay,SoDem,GiaTour,SoNguoiToiDa,SoNguoiToiThieu,TrangThai) VALUES(@actor,@Name,@description,@Origin,@Province,@Days,@Nights,@ReferencePrice,0,0,'Active'); SELECT LAST_INSERT_ID();",
                        new { actor, tour.Name, tour.Origin, tour.Province, tour.Days, tour.Nights, tour.ReferencePrice, description = Description(tour.Description, tour.Source) }, tx);
                    var destination = await db.ExecuteScalarAsync<int>("SELECT MaDiaDiem FROM DiaDiem WHERE TenDiaDiem='Đền Mẫu - Phố Hiến' AND TinhThanh='Hưng Yên'", transaction: tx);
                    if (destination == 0) throw new Exception("Missing verified tour stop");
                    await db.ExecuteAsync("INSERT INTO TourChiTiet(MaTour,NgayThu,ThuTu,LoaiDiaDiem,MaDiaDiem,GhiChu) VALUES(@id,1,1,'DiaDiem',@destination,@note)",
                        new { id, destination, note = "Điểm dừng tại Hưng Yên trong chương trình tham khảo. Nguồn ghi 13:30 rời nơi ăn trưa đi Hưng Yên, thăm Đền Mẫu; 16:30 trở về Hà Nội. Không suy diễn giờ đến/rời đền. Các điểm buổi sáng được tóm tắt trong phần giới thiệu; đây không phải toàn bộ lịch trình mở bán." }, tx);
                    added.Add($"Tour#{id}: {tour.Name}");
                }
                await tx.CommitAsync();
                Console.WriteLine(JsonSerializer.Serialize(new { added }, new JsonSerializerOptions { WriteIndented = true }));
            }
            finally { await db.ExecuteAsync("SELECT RELEASE_LOCK('nvt_verified_catalog')"); }
        }
        var coverage = await db.QueryAsync("""
            SELECT p.Province,
              (SELECT COUNT(*) FROM DiaDiem d WHERE d.TinhThanh=p.Province AND d.TrangThai=1) Destinations,
              (SELECT COUNT(*) FROM KhachSan h WHERE h.TinhThanh=p.Province AND h.TrangThai=1) Hotels,
              (SELECT COUNT(*) FROM NhaHang r WHERE r.TinhThanh=p.Province AND r.TrangThai=1) Restaurants,
              (SELECT COUNT(DISTINCT t.MaTour) FROM Tour t WHERE t.TrangThai='Active' AND
                (t.DiemDen LIKE CONCAT('%',p.Province,'%') OR EXISTS(SELECT 1 FROM TourChiTiet c JOIN DiaDiem d ON d.MaDiaDiem=c.MaDiaDiem WHERE c.MaTour=t.MaTour AND d.TinhThanh=p.Province))) Tours
            FROM (SELECT DISTINCT TinhThanh Province FROM DiaDiem WHERE TrangThai=1 AND NULLIF(TRIM(TinhThanh),'') IS NOT NULL
              UNION SELECT DISTINCT TinhThanh FROM KhachSan WHERE TrangThai=1 AND NULLIF(TRIM(TinhThanh),'') IS NOT NULL
              UNION SELECT DISTINCT TinhThanh FROM NhaHang WHERE TrangThai=1 AND NULLIF(TRIM(TinhThanh),'') IS NOT NULL) p ORDER BY p.Province
            """);
        Console.WriteLine(JsonSerializer.Serialize(new { coverage }, new JsonSerializerOptions { WriteIndented = true }));
    }
}
