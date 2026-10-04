using System.Security.Cryptography;
using System.Text.Json;
using System.Text.RegularExpressions;
using Dapper;
using Microsoft.Extensions.Configuration;
using MySqlConnector;

// Additive, reviewed image links only. Never invent stock, ratings or booking records.
static class PhotoCoverage
{
    record Selection(string Key, long Id, string Kind, string Name, string Province,
        string Title, string Source, string Author, string License, string LicenseUrl, string Caption);
    record Photo(string DuongDan, string MoTa, string Nguon, string TacGia, string GiayPhep,
        string UrlGiayPhep, string Sha256, string Title);
    record Snapshot(string Table, string PrimaryKey, long[] Ids, string Hash);
    static readonly JsonSerializerOptions Json = new() { PropertyNameCaseInsensitive = true, WriteIndented = true };
    static void Require(bool ok, string message) { if (!ok) throw new InvalidOperationException(message); }
    static string Digest(IEnumerable<dynamic> rows) => Convert.ToHexString(SHA256.HashData(JsonSerializer.SerializeToUtf8Bytes(rows, Json)));
    static void ValidateLocal(string root, string url)
    {
        Require(url.StartsWith("/media/") && !url.Contains("..") && !url.Contains('\\'), "Unsafe photo path");
        Require(File.Exists(Path.Combine(root, "wwwroot", url.TrimStart('/'))), "Missing local photo: " + url);
    }

    public static async Task Run(MySqlConnection db, IConfiguration config, string root, bool apply, bool journey = false)
    {
        var manifest = journey ? "Data/journey-photos-20261003.json" : "Data/photo-coverage-20261002.json";
        var mediaFolder = journey ? "journey-20261003" : "coverage-20261002";
        var selections = JsonSerializer.Deserialize<Selection[]>(await File.ReadAllTextAsync(Path.Combine(root, manifest)), Json)!;
        var prepared = new List<(Selection Target, Photo Image)>();
        foreach (var p in selections)
        {
            Require(p.Kind is "DiaDiem" or "NhaHang" or "KhachSan" && Regex.IsMatch(p.Key, "^[a-z0-9-]+$") && p.Id > 0, "Invalid manifest target");
            Require(Regex.IsMatch(p.License, "^(CC BY(-SA)? [1-4]\\.0|CC0)$"), "Unapproved license");
            Require(p.Source.StartsWith("https://commons.wikimedia.org/wiki/File:") && !string.IsNullOrWhiteSpace(p.Author), "Missing provenance");
            var filename = $"{p.Key}-{p.Id}.jpg";
            var photo = JsonSerializer.Deserialize<Photo>(await File.ReadAllTextAsync(Path.Combine(root, "Data/photo-sources", filename + ".source.json")), Json)!;
            Require(photo.DuongDan == $"/media/{mediaFolder}/" + filename && photo.MoTa == p.Caption && photo.Title == p.Title &&
                photo.Nguon == p.Source && photo.TacGia == p.Author && photo.GiayPhep == p.License && photo.UrlGiayPhep == p.LicenseUrl, "Photo metadata mismatch");
            Require(photo.MoTa.Length <= 255, "Caption too long");
            ValidateLocal(root, photo.DuongDan);
            var hash = Convert.ToHexString(SHA256.HashData(await File.ReadAllBytesAsync(Path.Combine(root, "wwwroot", photo.DuongDan.TrimStart('/')))));
            Require(hash.Equals(photo.Sha256, StringComparison.OrdinalIgnoreCase), "Photo hash mismatch");
            prepared.Add((p, photo));
        }
        int placeLinks = 0, tourLinks = 0;
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
                Require(tables.Select(t => t.Table).Distinct().Count() == tables.Length, "Composite key needs dedicated reader");
                var snapshots = new List<Snapshot>();
                foreach (var table in tables)
                {
                    Require(Regex.IsMatch(table.Table, "^[A-Za-z][A-Za-z0-9_]*$") && Regex.IsMatch(table.PrimaryKey, "^[A-Za-z][A-Za-z0-9_]*$"), "Unsafe table identifier");
                    var ids = (await db.QueryAsync<long>($"SELECT `{table.PrimaryKey}` FROM `{table.Table}` ORDER BY `{table.PrimaryKey}`", transaction: tx)).ToArray();
                    snapshots.Add(new(table.Table, table.PrimaryKey, ids, Digest(await db.QueryAsync($"SELECT * FROM `{table.Table}` ORDER BY `{table.PrimaryKey}`", transaction: tx))));
                }
                foreach (var (target, photo) in prepared)
                {
                    // Names + canonical province are portable; never trust discovery-time database IDs.
                    var ids = (await db.QueryAsync<int>($"SELECT Ma{target.Kind} FROM {target.Kind} WHERE Ten{target.Kind}=@Name AND TinhThanh=@Province AND TrangThai=1", target, tx)).ToArray();
                    Require(ids.Length == 1, "Missing/ambiguous active owner: " + target.Name);
                    placeLinks += await Insert(target.Kind, ids[0], photo, tx);
                }
                var emptyTours = (await db.QueryAsync<int>("""
                    SELECT MaTour FROM Tour t WHERE TrangThai='Active'
                    AND NOT EXISTS(SELECT 1 FROM HinhAnh h WHERE h.MaTour=t.MaTour)
                    """, transaction: tx)).ToArray();
                foreach (var id in emptyTours)
                {
                    // Use only actual destination stops; do not substitute regional images for restaurants.
                    var photos = await db.QueryAsync<Photo>("""
                        SELECT h.DuongDan,h.MoTa,h.Nguon,h.TacGia,h.GiayPhep,h.UrlGiayPhep,'' Sha256,'' Title
                        FROM TourChiTiet s JOIN HinhAnh h ON h.MaDiaDiem=s.MaDiaDiem
                        WHERE s.MaTour=@id AND h.DuongDan LIKE '/media/%'
                          AND h.Nguon LIKE 'https://%' AND NULLIF(TRIM(h.TacGia),'') IS NOT NULL
                          AND (h.GiayPhep LIKE 'CC BY%' OR h.GiayPhep='CC0')
                        ORDER BY s.NgayThu,s.ThuTu,h.ThuTu,h.MaHinhAnh
                        """, new { id }, tx);
                    foreach (var photo in photos.DistinctBy(p => p.DuongDan)) tourLinks += await Insert("Tour", id, photo, tx);
                }
                foreach (var snapshot in snapshots)
                {
                    var oldRows = snapshot.Ids.Length == 0 ? Array.Empty<dynamic>() : await db.QueryAsync($"SELECT * FROM `{snapshot.Table}` WHERE `{snapshot.PrimaryKey}` IN @Ids ORDER BY `{snapshot.PrimaryKey}`", snapshot, tx);
                    Require(Digest(oldRows) == snapshot.Hash, "Existing rows changed: " + snapshot.Table);
                    if (!snapshot.Table.Equals("HinhAnh", StringComparison.OrdinalIgnoreCase)) Require(await db.ExecuteScalarAsync<long>($"SELECT COUNT(*) FROM `{snapshot.Table}`", transaction: tx) == snapshot.Ids.Length, "Unexpected new rows: " + snapshot.Table);
                }
                await tx.CommitAsync();
                Console.WriteLine(JsonSerializer.Serialize(new { placeLinks, tourLinks, existingTablesPreserved = snapshots.Count }, Json));
            }
            finally { await db.ExecuteAsync("SELECT RELEASE_LOCK('nvt_verified_catalog')"); }
        }
        var coverage = new List<object>();
        foreach (var kind in new[] { "DiaDiem", "KhachSan", "NhaHang", "Tour" })
        {
            var active = kind == "Tour" ? "t.TrangThai='Active'" : "t.TrangThai=1";
            var missing = (await db.QueryAsync($"SELECT Ma{kind} id,Ten{kind} name FROM {kind} t WHERE {active} AND NOT EXISTS(SELECT 1 FROM HinhAnh h WHERE h.Ma{kind}=t.Ma{kind}) ORDER BY Ma{kind}")).ToArray();
            var total = await db.ExecuteScalarAsync<int>($"SELECT COUNT(*) FROM {kind} t WHERE {active}");
            coverage.Add(new { kind, total, withImages = total - missing.Length, missing });
        }
        foreach (var url in await db.QueryAsync<string>("SELECT DISTINCT DuongDan FROM HinhAnh WHERE DuongDan LIKE '/media/%'")) ValidateLocal(root, url);
        Console.WriteLine(JsonSerializer.Serialize(new { verifiedFiles = prepared.Count, coverage }, Json));

        async Task<int> Insert(string kind, int id, Photo photo, MySqlTransaction tx)
        {
            ValidateLocal(root, photo.DuongDan);
            if (await db.ExecuteScalarAsync<int>($"SELECT COUNT(*) FROM HinhAnh WHERE Ma{kind}=@id AND DuongDan=@DuongDan", new { id, photo.DuongDan }, tx) > 0) return 0;
            var order = await db.ExecuteScalarAsync<int>($"SELECT COALESCE(MAX(ThuTu),-1)+1 FROM HinhAnh WHERE Ma{kind}=@id", new { id }, tx);
            await db.ExecuteAsync($"""
                INSERT INTO HinhAnh(Ma{kind},DuongDan,MoTa,ThuTu,Nguon,TacGia,GiayPhep,UrlGiayPhep)
                VALUES(@id,@DuongDan,@MoTa,@order,@Nguon,@TacGia,@GiayPhep,@UrlGiayPhep)
                """, new { id, order, photo.DuongDan, photo.MoTa, photo.Nguon, photo.TacGia, photo.GiayPhep, photo.UrlGiayPhep }, tx);
            return 1;
        }
    }
}
