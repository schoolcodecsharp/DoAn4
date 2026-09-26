using System.Diagnostics;
using Dapper;
using Microsoft.Extensions.Configuration;
using MySqlConnector;

static class DatabaseRepair
{
    public static async Task Run(MySqlConnection db,IConfiguration config,string root) {
        var cs = new MySqlConnectionStringBuilder(config.GetConnectionString("DefaultConnection")!);
        var backup = Path.Combine(root,"backups",$"before-integrity-repair-{DateTime.Now:yyyyMMdd-HHmmss}.sql");
        Directory.CreateDirectory(Path.GetDirectoryName(backup)!);
        var processInfo = new ProcessStartInfo(@"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe") { UseShellExecute=false,CreateNoWindow=true,RedirectStandardError=true };
        foreach(var arg in new[]{"--host="+cs.Server,"--port="+cs.Port,"--user="+cs.UserID,"--single-transaction","--routines","--triggers","--no-tablespaces","--databases",cs.Database,"--result-file="+backup}) processInfo.ArgumentList.Add(arg);
        processInfo.Environment["MYSQL_PWD"]=cs.Password;
        using var process=Process.Start(processInfo)!; var err=await process.StandardError.ReadToEndAsync(); await process.WaitForExitAsync();
        if(process.ExitCode!=0 || !File.Exists(backup) || new FileInfo(backup).Length<100) throw new Exception("Backup failed; no repair applied. " + err);
        Console.WriteLine("BACKUP: " + backup);
        foreach(var (column,index) in new[]{("MaTour","uq_yeuthich_tour"),("MaDiaDiem","uq_yeuthich_diadiem"),("MaNhaHang","uq_yeuthich_nhahang"),("MaKhachSan","uq_yeuthich_khachsan")}) {
            var duplicates=await db.ExecuteScalarAsync<int>($"SELECT COUNT(*) FROM (SELECT MaNguoiDung,{column} FROM YeuThich WHERE {column} IS NOT NULL GROUP BY MaNguoiDung,{column} HAVING COUNT(*)>1) d");
            if(duplicates>0) throw new Exception("Existing duplicates need manual review; no favorite rows deleted.");
            if(await db.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='yeuthich' AND INDEX_NAME=@index",new{index})==0)
                await db.ExecuteAsync($"ALTER TABLE YeuThich ADD UNIQUE KEY {index}(MaNguoiDung,{column})");
        }
        using var tx=await db.BeginTransactionAsync(System.Data.IsolationLevel.ReadCommitted);
        await db.QueryAsync<int>("SELECT MaKhoiHanh FROM TourKhoiHanh ORDER BY MaKhoiHanh FOR UPDATE",transaction:tx);
        var impossible=await db.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM TourKhoiHanh k WHERE (SELECT COALESCE(SUM(d.SoNguoi),0) FROM DatTour d WHERE d.MaKhoiHanh=k.MaKhoiHanh AND d.TrangThai<>'Cancelled')>k.SoChoToiDa",transaction:tx);
        if(impossible>0) throw new Exception("Overbooked departure requires review; counters unchanged.");
        await db.ExecuteAsync("UPDATE TourKhoiHanh k SET SoChoDaDat=(SELECT COALESCE(SUM(d.SoNguoi),0) FROM DatTour d WHERE d.MaKhoiHanh=k.MaKhoiHanh AND d.TrangThai<>'Cancelled')",transaction:tx);
        await tx.CommitAsync();
        Console.WriteLine("REPAIRED: four per-owner favorite unique indexes; departure counters reconciled. No business rows deleted.");
    }
}
