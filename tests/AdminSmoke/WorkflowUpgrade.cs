using System.Diagnostics;
using Dapper;
using Microsoft.Extensions.Configuration;
using MySqlConnector;

static class WorkflowUpgrade {
    public static async Task Run(MySqlConnection db,IConfiguration config,string root) {
        var cs = new MySqlConnectionStringBuilder(config.GetConnectionString("DefaultConnection")!);
        var backup = Path.Combine(root,"backups",$"before-workflow-upgrade-{DateTime.Now:yyyyMMdd-HHmmss}.sql");
        Directory.CreateDirectory(Path.GetDirectoryName(backup)!);
        var start = new ProcessStartInfo(@"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe") { UseShellExecute=false,CreateNoWindow=true,RedirectStandardError=true };
        foreach(var arg in new[]{"--host="+cs.Server,"--port="+cs.Port,"--user="+cs.UserID,"--single-transaction","--routines","--triggers","--no-tablespaces","--databases",cs.Database,"--result-file="+backup}) start.ArgumentList.Add(arg);
        start.Environment["MYSQL_PWD"]=cs.Password;
        using var process=Process.Start(start)!;
        var err=await process.StandardError.ReadToEndAsync(); await process.WaitForExitAsync();
        if(process.ExitCode!=0 || !File.Exists(backup) || new FileInfo(backup).Length<100) throw new Exception("Backup failed; nothing changed. "+err);
        Console.WriteLine("BACKUP: "+backup);
        await db.ExecuteAsync(await File.ReadAllTextAsync(Path.Combine(root,"../database/migrations/20260916_admin_workflow.sql")));
        Console.WriteLine("PASS additive admin workflow migration applied.");
    }
}
