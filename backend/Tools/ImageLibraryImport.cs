using System.Net;
using System.Text.Json;
using System.Text.RegularExpressions;
using Dapper;
using MySqlConnector;

namespace backend.Tools;

// Explicit maintenance command, never an HTTP endpoint or automatic startup seed.
public static class ImageLibraryImport
{
    private static readonly JsonSerializerOptions Json = new() { PropertyNameCaseInsensitive = true, WriteIndented = true };
    private static readonly Dictionary<string, string> OwnerKeys = new()
    { ["Tour"] = "MaTour", ["DiaDiem"] = "MaDiaDiem", ["KhachSan"] = "MaKhachSan", ["NhaHang"] = "MaNhaHang", ["LoaiPhong"] = "MaLoaiPhong" };

    public static async Task RunAsync(IConfiguration config, string root, bool downloadOnly)
    {
        var entries = JsonSerializer.Deserialize<List<ImageEntry>>(await File.ReadAllTextAsync(Path.Combine(root, "data", "vietnam-images.json")), Json)!;
        var folder = Path.Combine(root, "wwwroot", "media", "vietnam");
        Directory.CreateDirectory(folder);
        using var http = new HttpClient { Timeout = TimeSpan.FromSeconds(45) };
        http.DefaultRequestHeaders.UserAgent.ParseAdd("NVTTravelImageImporter/1.0 (local educational travel website)");
        var metadata = new List<ImportedImage>();
        foreach (var entry in entries)
        {
            if (!Regex.IsMatch(entry.File, @"^[a-z0-9-]+\.jpg$") || entry.Caption.Length > 255 || entry.Targets.Any(t => !OwnerKeys.ContainsKey(t.Key) || t.Value.Any(id => id < 1)))
                throw new InvalidOperationException("Invalid image manifest entry.");
            var metaFile = Path.Combine(folder, entry.File + ".source.json");
            ImportedImage image;
            if (File.Exists(metaFile) && File.Exists(Path.Combine(folder, entry.File)))
            {
                image = JsonSerializer.Deserialize<ImportedImage>(await File.ReadAllTextAsync(metaFile), Json)!;
                if (image.Title != entry.Title) throw new InvalidOperationException("Existing image source changed; choose a new filename.");
                Console.WriteLine($"Reuse {entry.File}");
            }
            else
            {
                var url = "https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url%7Cextmetadata&iiurlwidth=1280&titles=" + Uri.EscapeDataString(entry.Title);
                using var doc = JsonDocument.Parse(await GetAsync(http, url));
                var info = doc.RootElement.GetProperty("query").GetProperty("pages").EnumerateObject().Single().Value.GetProperty("imageinfo")[0];
                var ext = info.GetProperty("extmetadata");
                string Meta(string key) => ext.TryGetProperty(key, out var value) ? WebUtility.HtmlDecode(Regex.Replace(value.GetProperty("value").GetString() ?? "", "<[^>]+>", "")).Trim() : "";
                var license = Meta("LicenseShortName");
                if (!(license.StartsWith("CC BY") || license.StartsWith("CC0") || license.Contains("Public domain", StringComparison.OrdinalIgnoreCase)))
                    throw new InvalidOperationException($"Review image license before use: {entry.File}: {license}");
                var imageUrl = info.TryGetProperty("thumburl", out var thumb) ? thumb.GetString()! : info.GetProperty("url").GetString()!;
                var host = new Uri(imageUrl).Host;
                if (host is not ("upload.wikimedia.org" or "thumb.wikimedia.org")) throw new InvalidOperationException("Unexpected image host.");
                var bytes = await GetAsync(http, imageUrl);
                if (bytes.Length < 1000 || bytes.Length > 20_000_000 || bytes[0] != 0xff || bytes[1] != 0xd8)
                    throw new InvalidOperationException($"Download is not a supported JPEG: {entry.File}");
                if (File.Exists(Path.Combine(folder, entry.File))) throw new InvalidOperationException("Untracked local image exists; refusing overwrite.");
                await File.WriteAllBytesAsync(Path.Combine(folder, entry.File), bytes);
                image = new ImportedImage { Title = entry.Title, DuongDan = "/media/vietnam/" + entry.File, MoTa = entry.Caption,
                    Nguon = info.GetProperty("descriptionurl").GetString()!, TacGia = Meta("Artist"), GiayPhep = license,
                    UrlGiayPhep = Meta("LicenseUrl"), DownloadUrl = imageUrl, DownloadedAt = DateTime.UtcNow,
                    Sha256 = Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(bytes)).ToLowerInvariant() };
                await File.WriteAllTextAsync(metaFile, JsonSerializer.Serialize(image, Json));
                Console.WriteLine($"Downloaded {entry.File}: {bytes.Length / 1024} KB; {license}");
            }
            var localBytes = await File.ReadAllBytesAsync(Path.Combine(folder, entry.File));
            if (Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(localBytes)).ToLowerInvariant() != image.Sha256)
                throw new InvalidOperationException($"Checksum mismatch: {entry.File}");
            image.MoTa = entry.Caption;
            metadata.Add(image);
        }
        if (downloadOnly) { Console.WriteLine($"Downloaded and verified {metadata.Count} images. No database changes."); return; }

        await using var conn = new MySqlConnection(config.GetConnectionString("DefaultConnection"));
        await conn.OpenAsync();
        if (await conn.ExecuteScalarAsync<int>("SELECT GET_LOCK('nvt_image_library_import', 10)") != 1) throw new InvalidOperationException("Another import is running.");
        try
        {
            var backupDir = Path.Combine(root, "backups");
            Directory.CreateDirectory(backupDir);
            var backup = Path.Combine(backupDir, $"hinhanh-before-{DateTime.UtcNow:yyyyMMdd-HHmmssfff}.json");
            await File.WriteAllTextAsync(backup, JsonSerializer.Serialize(await conn.QueryAsync("SELECT * FROM HinhAnh"), Json));
            Console.WriteLine($"Image-table backup: {backup}");
            // Additive migration: existing rows and legacy AnhDaiDien columns are retained.
            foreach (var (column, definition) in new Dictionary<string, string> {
                ["Nguon"] = "VARCHAR(1000) NULL", ["TacGia"] = "TEXT NULL", ["GiayPhep"] = "VARCHAR(100) NULL", ["UrlGiayPhep"] = "VARCHAR(500) NULL" })
                if (await conn.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM information_schema.columns WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='HinhAnh' AND COLUMN_NAME=@column", new { column }) == 0)
                    await conn.ExecuteAsync($"ALTER TABLE HinhAnh ADD COLUMN {column} {definition}");
            var enumType = await conn.ExecuteScalarAsync<string>("SELECT COLUMN_TYPE FROM information_schema.columns WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='HinhAnh' AND COLUMN_NAME='LoaiDoiTuong'");
            if (enumType != null && !enumType.Contains("'LoaiPhong'"))
                await conn.ExecuteAsync("ALTER TABLE HinhAnh MODIFY LoaiDoiTuong ENUM('DiaDiem','NhaHang','KhachSan','Tour','LoaiPhong') NOT NULL");

            await using var tx = await conn.BeginTransactionAsync();
            var added = 0;
            for (var i = 0; i < entries.Count; i++)
                foreach (var target in entries[i].Targets)
                    foreach (var id in target.Value)
                    {
                        if (await conn.ExecuteScalarAsync<int>($"SELECT COUNT(*) FROM {target.Key} WHERE {OwnerKeys[target.Key]}=@id", new { id }, tx) != 1)
                            throw new InvalidOperationException($"Missing image owner: {target.Key}/{id}; import rolled back.");
                        var photo = metadata[i];
                        var exists = await conn.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM HinhAnh WHERE LoaiDoiTuong=@type AND MaDoiTuong=@id AND DuongDan=@DuongDan", new { type = target.Key, id, photo.DuongDan }, tx);
                        if (exists != 0) continue;
                        var order = await conn.ExecuteScalarAsync<int>("SELECT COALESCE(MAX(ThuTu),-1)+1 FROM HinhAnh WHERE LoaiDoiTuong=@type AND MaDoiTuong=@id", new { type = target.Key, id }, tx);
                        added += await conn.ExecuteAsync("""
                            INSERT INTO HinhAnh (LoaiDoiTuong,MaDoiTuong,DuongDan,MoTa,ThuTu,Nguon,TacGia,GiayPhep,UrlGiayPhep)
                            VALUES (@type,@id,@DuongDan,@MoTa,@order,@Nguon,@TacGia,@GiayPhep,@UrlGiayPhep)
                            """, new { type = target.Key, id, photo.DuongDan, photo.MoTa, order, photo.Nguon, photo.TacGia, photo.GiayPhep, photo.UrlGiayPhep }, tx);
                    }
            await tx.CommitAsync();
            Console.WriteLine($"Imported {added} new HinhAnh rows from {metadata.Count} local photos. Existing rows preserved.");
        }
        finally { await conn.ExecuteAsync("SELECT RELEASE_LOCK('nvt_image_library_import')"); }
    }

    private static async Task<byte[]> GetAsync(HttpClient http, string url)
    {
        for (var attempt = 0; ; attempt++)
        {
            using var response = await http.GetAsync(url);
            if (((int)response.StatusCode == 429 || (int)response.StatusCode >= 500) && attempt < 3)
            { await Task.Delay(TimeSpan.FromSeconds(2 + attempt * 3)); continue; }
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadAsByteArrayAsync();
        }
    }
    public sealed class ImageEntry
    {
        public string File { get; set; } = "";
        public string Title { get; set; } = "";
        public string Caption { get; set; } = "";
        public Dictionary<string, int[]> Targets { get; set; } = new();
    }
    public sealed class ImportedImage
    {
        public string Title { get; set; } = "";
        public string DuongDan { get; set; } = "";
        public string MoTa { get; set; } = "";
        public string Nguon { get; set; } = "";
        public string TacGia { get; set; } = "";
        public string GiayPhep { get; set; } = "";
        public string UrlGiayPhep { get; set; } = "";
        public string DownloadUrl { get; set; } = "";
        public string Sha256 { get; set; } = "";
        public DateTime DownloadedAt { get; set; }
    }
}
