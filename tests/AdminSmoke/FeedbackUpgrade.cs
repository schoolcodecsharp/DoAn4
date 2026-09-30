using System.Diagnostics;
using Dapper;
using Microsoft.Extensions.Configuration;
using MySqlConnector;

static class FeedbackUpgrade
{
    public static async Task Run(MySqlConnection db,IConfiguration config,string root)
    {
        if(await db.ExecuteScalarAsync<int>("SELECT GET_LOCK('nvt_feedback_upgrade',10)")!=1)throw new Exception("Another feedback migration is running.");
        try
        {
            var columns=await db.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='DanhGia' AND COLUMN_NAME IN ('MaDatTourXacMinh','MaDatPhongXacMinh')");
            var table=await db.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='BinhLuan'");
            if(columns==2&&table==1){Console.WriteLine("Feedback schema already installed; no changes.");return;}
            if(columns is not (0 or 2))throw new Exception("Partial proof schema needs inspection before migration.");
            var folder=Path.Combine(root,"backups");Directory.CreateDirectory(folder);
            var backup=Path.Combine(folder,$"before-feedback-{DateTime.Now:yyyyMMdd-HHmmssfff}.sql");
            var cs=new MySqlConnectionStringBuilder(config.GetConnectionString("DefaultConnection")!);
            var start=new ProcessStartInfo(@"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe"){UseShellExecute=false,CreateNoWindow=true,RedirectStandardError=true};
            foreach(var arg in new[]{"--host="+cs.Server,"--port="+cs.Port,"--user="+cs.UserID,"--single-transaction","--routines","--triggers","--no-tablespaces","--databases",cs.Database,"--result-file="+backup})start.ArgumentList.Add(arg);
            start.Environment["MYSQL_PWD"]=cs.Password;
            using(var p=Process.Start(start)!){var error=await p.StandardError.ReadToEndAsync();await p.WaitForExitAsync();if(p.ExitCode!=0||new FileInfo(backup).Length<100)throw new Exception("Backup failed; migration not applied. "+error);}
            Console.WriteLine("BACKUP: "+backup);
            var sql=await File.ReadAllTextAsync(Path.Combine(root,"../database/migrations/20260930_feedback.sql"));
            // MySQL DDL commits implicitly; each step can be resumed safely.
            if(columns==2)sql=sql[sql.IndexOf("CREATE TABLE",StringComparison.Ordinal)..];
            await db.ExecuteAsync(sql);
            Console.WriteLine("Feedback migration applied. Legacy reviews retained without fabricated experience proofs.");
        }
        finally {await db.ExecuteAsync("SELECT RELEASE_LOCK('nvt_feedback_upgrade')");}
    }
}
