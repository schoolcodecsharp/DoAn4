using System.Diagnostics;
using Dapper;
using Microsoft.Extensions.Configuration;
using MySqlConnector;

static class AccountUpgrade
{
    public static async Task Run(MySqlConnection db, IConfiguration config, string root, bool planner = false)
    {
        if (await db.ExecuteScalarAsync<int>("SELECT GET_LOCK('nvt_account_upgrade',10)") != 1) throw new Exception("Migration already running.");
        try
        {
            var sql = await File.ReadAllTextAsync(Path.Combine(root, planner ? "../database/migrations/20261001_planner_costs.sql" : "../database/migrations/20260930_account_workflows.sql"));
            var statements = sql.Split('\n').Where(line => line.StartsWith("ALTER TABLE ")).ToArray();
            var pending = new List<string>();
            foreach (var statement in statements)
            {
                var words = statement.Split(' ');
                if (await db.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=@table AND COLUMN_NAME=@column", new { table = words[2], column = words[5] }) == 0) pending.Add(statement);
            }
            if (pending.Count == 0) { Console.WriteLine("Requested workflow schema already installed."); return; }
            var folder = Path.Combine(root, "backups"); Directory.CreateDirectory(folder);
            var backup = Path.Combine(folder, $"before-{(planner ? "planner" : "account")}-{DateTime.Now:yyyyMMdd-HHmmssfff}.sql");
            var cs = new MySqlConnectionStringBuilder(config.GetConnectionString("DefaultConnection")!);
            var start = new ProcessStartInfo(@"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe") { UseShellExecute = false, CreateNoWindow = true, RedirectStandardError = true };
            foreach (var arg in new[] { "--host=" + cs.Server, "--port=" + cs.Port, "--user=" + cs.UserID, "--single-transaction", "--routines", "--triggers", "--no-tablespaces", "--databases", cs.Database, "--result-file=" + backup }) start.ArgumentList.Add(arg);
            start.Environment["MYSQL_PWD"] = cs.Password;
            using (var process = Process.Start(start)!) { var error = await process.StandardError.ReadToEndAsync(); await process.WaitForExitAsync(); if (process.ExitCode != 0 || new FileInfo(backup).Length < 100) throw new Exception("Backup failed; not migrated. " + error); }
            Console.WriteLine("BACKUP: " + backup);
            foreach (var statement in pending) await db.ExecuteAsync(statement);
            Console.WriteLine("Account workflow schema installed; existing rows preserved.");
        }
        finally { await db.ExecuteAsync("SELECT RELEASE_LOCK('nvt_account_upgrade')"); }
    }
}
