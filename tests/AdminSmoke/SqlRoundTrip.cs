using System.Diagnostics;
using System.Text.RegularExpressions;
using Dapper;
using Microsoft.Extensions.Configuration;
using MySqlConnector;

static class SqlRoundTrip
{
    public static async Task Run(MySqlConnection db, IConfiguration config, string root)
    {
        var cs = new MySqlConnectionStringBuilder(config.GetConnectionString("DefaultConnection")!);
        var scratch = "WebDuLichAudit_" + Guid.NewGuid().ToString("N");
        var scratchBackup = scratch + "_restore";
        async Task Execute(string sql) {
            var start = new ProcessStartInfo(@"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe") { UseShellExecute=false,CreateNoWindow=true,RedirectStandardInput=true,RedirectStandardError=true,RedirectStandardOutput=true,StandardInputEncoding=new System.Text.UTF8Encoding(false),StandardOutputEncoding=System.Text.Encoding.UTF8,StandardErrorEncoding=System.Text.Encoding.UTF8 };
            foreach(var arg in new[]{"--host="+cs.Server,"--port="+cs.Port,"--user="+cs.UserID,"--default-character-set=utf8mb4"}) start.ArgumentList.Add(arg);
            start.Environment["MYSQL_PWD"] = cs.Password;
            using var process = Process.Start(start)!;
            var stdout = process.StandardOutput.ReadToEndAsync(); var stderr = process.StandardError.ReadToEndAsync();
            try { await process.StandardInput.WriteAsync(sql); process.StandardInput.Close(); }
            catch (IOException) { /* mysql can stop reading after its first SQL error; report stderr below. */ }
            await process.WaitForExitAsync(); await stdout;
            var error = await stderr;
            if(process.ExitCode!=0) throw new Exception("SQL round-trip failed: " + error);
        }
        string Target(string sql, string database) {
            if(!database.StartsWith("WebDuLichAudit_") || database.Equals(cs.Database,StringComparison.OrdinalIgnoreCase)) throw new Exception("Unsafe scratch target");
            return Regex.Replace(sql,@"\bWebDuLich\b",database,RegexOptions.IgnoreCase);
        }
        try {
            var schema = await File.ReadAllTextAsync(Path.Combine(root,"../database/CSDL.sql"));
            var seed = await File.ReadAllTextAsync(Path.Combine(root,"../database/data_mau.sql"));
            await Execute(Target(schema,scratch)); await Execute(Target(seed,scratch));
            var count = await db.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=@scratch",new{scratch});
            Console.WriteLine($"PASS: clean CSDL.sql + data_mau.sql => {count} tables in isolated database");
            await Execute(Target(seed,scratch));
            Console.WriteLine("PASS: seed can run twice in isolated database");
            var scratchConnection = new MySqlConnectionStringBuilder(cs.ConnectionString) { Database = scratch };
            await using(var seeded = new MySqlConnection(scratchConnection.ConnectionString)) {
                await seeded.OpenAsync();
                await SampleCompletion.Check(seeded,root,false);
            }
            var backup = Directory.GetFiles(Path.Combine(root,"backups"),"before-remove-refresh-token-*.sql").OrderByDescending(p=>p).First();
            await Execute(Target(await File.ReadAllTextAsync(backup),scratchBackup));
            var restored = await db.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=@scratchBackup",new{scratchBackup});
            Console.WriteLine($"PASS: full backup restored into isolated database => {restored} tables");
        }
        finally {
            // Names are generated above, not supplied by a user or environment variable.
            foreach(var name in new[]{scratch,scratchBackup}) {
                if(!Regex.IsMatch(name,@"^WebDuLichAudit_[a-f0-9]{32}(_restore)?$") || name.Equals(cs.Database,StringComparison.OrdinalIgnoreCase)) throw new Exception("Unsafe cleanup target");
                await db.ExecuteAsync($"DROP DATABASE IF EXISTS `{name}`");
            }
            Console.WriteLine("Temporary audit databases removed; live WebDuLich unchanged.");
        }
    }
}
