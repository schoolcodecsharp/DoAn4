using System.Diagnostics;
using System.Net.Http.Json;
using System.Text.Json;
using Dapper;
using Microsoft.Extensions.Configuration;
using MySqlConnector;

static class SampleCompletion
{
    public static async Task Run(MySqlConnection db, IConfiguration config, string root)
    {
        var cs = new MySqlConnectionStringBuilder(config.GetConnectionString("DefaultConnection")!);
        var backup = Path.Combine(root,"backups",$"before-sample-completion-{DateTime.Now:yyyyMMdd-HHmmss}.sql");
        Directory.CreateDirectory(Path.GetDirectoryName(backup)!);
        var start = new ProcessStartInfo(@"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe") { UseShellExecute=false,CreateNoWindow=true,RedirectStandardError=true };
        foreach(var arg in new[]{"--host="+cs.Server,"--port="+cs.Port,"--user="+cs.UserID,"--single-transaction","--routines","--triggers","--no-tablespaces","--databases",cs.Database,"--result-file="+backup}) start.ArgumentList.Add(arg);
        start.Environment["MYSQL_PWD"]=cs.Password;
        using var process=Process.Start(start)!;
        var err=await process.StandardError.ReadToEndAsync(); await process.WaitForExitAsync();
        if(process.ExitCode!=0 || !File.Exists(backup) || new FileInfo(backup).Length<100) throw new Exception("Backup failed; nothing changed. "+err);
        Console.WriteLine("BACKUP: "+backup);
        var seed=await File.ReadAllTextAsync(Path.Combine(root,"../database/data_mau.sql"));
        var sql=seed.Split("-- BEGIN COMPLETION 20260916")[1].Split("-- END COMPLETION 20260916")[0];
        using var tx=await db.BeginTransactionAsync();
        await db.ExecuteAsync(sql,transaction:tx);
        // Prove repeated execution does not insert another set of sample rows.
        var before=await db.QuerySingleAsync<(long,long,long)>("SELECT (SELECT COUNT(*) FROM DiaDiem),(SELECT COUNT(*) FROM TourChiTiet),(SELECT COUNT(*) FROM HinhAnh)",transaction:tx);
        await db.ExecuteAsync(sql,transaction:tx);
        var after=await db.QuerySingleAsync<(long,long,long)>("SELECT (SELECT COUNT(*) FROM DiaDiem),(SELECT COUNT(*) FROM TourChiTiet),(SELECT COUNT(*) FROM HinhAnh)",transaction:tx);
        if(before!=after) throw new Exception("Supplement is not idempotent; rolling back.");
        await tx.CommitAsync();
        Console.WriteLine($"PASS supplement idempotent: destinations={after.Item1}, activities={after.Item2}, images={after.Item3}");
        await Check(db,root,true);
    }

    public static async Task Check(MySqlConnection db,string root,bool apiCheck)
    {
        async Task Zero(string name,string sql) {
            var count=await db.ExecuteScalarAsync<int>(sql);
            if(count!=0) throw new Exception($"FAIL {name}: {count}");
            Console.WriteLine("PASS "+name);
        }
        await Zero("all tour days populated","SELECT COUNT(*) FROM (SELECT t.MaTour,t.SoNgay,COUNT(DISTINCT c.NgayThu) n FROM Tour t LEFT JOIN TourChiTiet c ON c.MaTour=t.MaTour AND c.NgayThu BETWEEN 1 AND t.SoNgay GROUP BY t.MaTour,t.SoNgay HAVING n<>t.SoNgay) x");
        foreach(var owner in new[]{"Tour","DiaDiem","NhaHang","KhachSan"})
            await Zero(owner+" has at least two distinct photos",$"SELECT COUNT(*) FROM {owner} o WHERE (SELECT COUNT(DISTINCT DuongDan) FROM HinhAnh h WHERE h.Ma{owner}=o.Ma{owner})<2");
        await Zero("activities have description and valid times","SELECT COUNT(*) FROM TourChiTiet c JOIN Tour t ON t.MaTour=c.MaTour WHERE NULLIF(TRIM(c.GhiChu),'') IS NULL OR c.ThoiGianBatDau IS NULL OR c.ThoiGianKetThuc IS NULL OR c.ThoiGianBatDau>=c.ThoiGianKetThuc OR c.NgayThu<1 OR c.NgayThu>t.SoNgay");
        await Zero("activity order unique per day","SELECT COUNT(*) FROM (SELECT MaTour,NgayThu,ThuTu FROM TourChiTiet GROUP BY MaTour,NgayThu,ThuTu HAVING COUNT(*)>1) x");
        await Zero("daily activities do not overlap","SELECT COUNT(*) FROM TourChiTiet a JOIN TourChiTiet b ON a.MaTour=b.MaTour AND a.NgayThu=b.NgayThu AND a.MaTourChiTiet<b.MaTourChiTiet WHERE a.ThoiGianBatDau<b.ThoiGianKetThuc AND b.ThoiGianBatDau<a.ThoiGianKetThuc");
        foreach(var path in await db.QueryAsync<string>("SELECT DISTINCT DuongDan FROM HinhAnh")) {
            if(!path.StartsWith("/media/") || path.Contains("..") || !File.Exists(Path.Combine(root,"wwwroot",path.TrimStart('/'))))
                throw new Exception("Missing or invalid image: "+path);
        }
        Console.WriteLine("PASS all local image files exist");
        if(!apiCheck) return;
        using var http=new HttpClient {BaseAddress=new Uri("http://localhost:5000/api/")};
        var imageUrls=new HashSet<string>();
        foreach(var tour in await db.QueryAsync<(int Id,int Days)>("SELECT MaTour,SoNgay FROM Tour")) {
            var activities=await http.GetFromJsonAsync<JsonElement>($"tourchitiet/bytour/{tour.Id}");
            var days=new HashSet<int>();
            foreach(var activity in activities.EnumerateArray()) {
                days.Add(activity.GetProperty("ngayThu").GetInt32());
                if(activity.GetProperty("hinhAnh").GetArrayLength()<2) throw new Exception($"Tour {tour.Id}: activity missing gallery");
                foreach(var img in activity.GetProperty("hinhAnh").EnumerateArray()) imageUrls.Add(img.GetProperty("duongDan").GetString()!);
            }
            if(days.Count!=tour.Days) throw new Exception($"Tour {tour.Id}: API days incomplete");
            Console.WriteLine($"PASS tour {tour.Id}: API returns {days.Count}/{tour.Days} days; every activity has multiple photos");
        }
        foreach(var url in imageUrls) {
            using var response=await http.GetAsync(new Uri(new Uri("http://localhost:5000"),url));
            if(!response.IsSuccessStatusCode || response.Content.Headers.ContentType?.MediaType?.StartsWith("image/")!=true)
                throw new Exception("Image HTTP failure: "+url);
        }
        Console.WriteLine($"PASS {imageUrls.Count} distinct itinerary images served over HTTP");
    }
}
