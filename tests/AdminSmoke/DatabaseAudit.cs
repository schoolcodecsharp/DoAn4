using System.Diagnostics;
using Dapper;
using Microsoft.Extensions.Configuration;
using MySqlConnector;

static class DatabaseAudit
{
    public static async Task Run(MySqlConnection db, IConfiguration config, string root, bool removeToken)
    {
        static string Q(string name) => "`" + name.Replace("`", "``") + "`";
        var tables = (await db.QueryAsync<string>("SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_TYPE='BASE TABLE' ORDER BY TABLE_NAME")).ToArray();
        Console.WriteLine($"DATABASE: {db.Database}; tables={tables.Length}");
        foreach (var table in tables) Console.WriteLine($"TABLE {table}: {await db.ExecuteScalarAsync<long>($"SELECT COUNT(*) FROM {Q(table)}")} rows");
        var keys = await db.QueryAsync("""
            SELECT TABLE_NAME AS ChildTable, COLUMN_NAME AS ChildColumn,
              REFERENCED_TABLE_NAME AS ParentTable, REFERENCED_COLUMN_NAME AS ParentColumn
            FROM information_schema.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA=DATABASE() AND REFERENCED_TABLE_NAME IS NOT NULL
            """);
        long orphans = 0; int checkedKeys = 0;
        foreach (var key in keys) {
            long count = await db.ExecuteScalarAsync<long>($"SELECT COUNT(*) FROM {Q(key.ChildTable)} c LEFT JOIN {Q(key.ParentTable)} p ON c.{Q(key.ChildColumn)}=p.{Q(key.ParentColumn)} WHERE c.{Q(key.ChildColumn)} IS NOT NULL AND p.{Q(key.ParentColumn)} IS NULL");
            orphans += count; checkedKeys++;
            if (count > 0) Console.WriteLine($"FAIL orphan: {key.ChildTable}.{key.ChildColumn}: {count}");
        }
        Console.WriteLine($"FOREIGN KEYS checked={checkedKeys}; orphan rows={orphans}");
        var seats = await db.QueryAsync("""
            SELECT k.MaKhoiHanh,k.SoChoDaDat,COALESCE(SUM(CASE WHEN d.TrangThai IN ('Pending','Confirmed','Completed') THEN d.SoNguoi ELSE 0 END),0) AS Actual
            FROM TourKhoiHanh k LEFT JOIN DatTour d ON d.MaKhoiHanh=k.MaKhoiHanh
            GROUP BY k.MaKhoiHanh,k.SoChoDaDat HAVING SoChoDaDat <> Actual
            """);
        foreach (var row in seats) Console.WriteLine($"FAIL seat counter: departure={row.MaKhoiHanh}, stored={row.SoChoDaDat}, bookings={row.Actual}");
        var days = await db.QueryAsync("""
            SELECT t.MaTour,t.SoNgay,COUNT(DISTINCT c.NgayThu) AS PopulatedDays
            FROM Tour t LEFT JOIN TourChiTiet c ON c.MaTour=t.MaTour AND c.NgayThu BETWEEN 1 AND t.SoNgay
            GROUP BY t.MaTour,t.SoNgay HAVING PopulatedDays < SoNgay
            """);
        foreach (var row in days) Console.WriteLine($"WARN incomplete itinerary: tour={row.MaTour}, populated={row.PopulatedDays}/{row.SoNgay}");
        foreach (var owner in new[] { "Tour", "DiaDiem" }) {
            var count = await db.ExecuteScalarAsync<int>($"SELECT COUNT(*) FROM {Q(owner)} t WHERE (SELECT COUNT(*) FROM HinhAnh h WHERE h.{Q("Ma"+owner)}=t.{Q("Ma"+owner)}) < 2");
            Console.WriteLine($"{(count == 0 ? "PASS" : "WARN")} {owner} with fewer than 2 photos: {count}");
        }
        var paths = await db.QueryAsync<string>("SELECT DISTINCT DuongDan FROM HinhAnh");
        var missing = paths.Count(path => !path.StartsWith("/media/") || path.Contains("..") || !File.Exists(Path.Combine(root,"wwwroot",path.TrimStart('/'))));
        Console.WriteLine($"IMAGE FILES missing/invalid: {missing}");
        if (!removeToken) return;
        if (!tables.Contains("RefreshToken", StringComparer.OrdinalIgnoreCase)) { Console.WriteLine("RefreshToken already absent; nothing deleted."); return; }
        var inbound = await db.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE WHERE REFERENCED_TABLE_SCHEMA=DATABASE() AND REFERENCED_TABLE_NAME='RefreshToken'");
        if (inbound != 0) throw new Exception("Refusing removal: RefreshToken is referenced by another table.");
        var backupFolder = Path.Combine(root,"backups"); Directory.CreateDirectory(backupFolder);
        var backup = Path.Combine(backupFolder,$"before-remove-refresh-token-{DateTime.Now:yyyyMMdd-HHmmss}.sql");
        var cs = new MySqlConnectionStringBuilder(config.GetConnectionString("DefaultConnection")!);
        var start = new ProcessStartInfo(@"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe") { UseShellExecute=false, CreateNoWindow=true, RedirectStandardError=true };
        foreach (var arg in new[] { "--host="+cs.Server,"--port="+cs.Port,"--user="+cs.UserID,"--single-transaction","--routines","--triggers","--no-tablespaces","--databases",cs.Database,"--result-file="+backup }) start.ArgumentList.Add(arg);
        start.Environment["MYSQL_PWD"] = cs.Password;
        using var process = Process.Start(start)!;
        var errors = await process.StandardError.ReadToEndAsync();
        await process.WaitForExitAsync();
        if (process.ExitCode != 0 || !File.Exists(backup) || new FileInfo(backup).Length < 100) throw new Exception("Backup failed. No tables removed. " + errors);
        var tokenCount = await db.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM RefreshToken");
        await db.ExecuteAsync("DROP TABLE RefreshToken");
        Console.WriteLine($"BACKUP: {backup} ({new FileInfo(backup).Length} bytes)");
        Console.WriteLine($"REMOVED: RefreshToken ({tokenCount} rows). No other table removed.");
    }
}
