using System.Diagnostics;
using Dapper;
using MySqlConnector;

static class BrowserAudit
{
    public static async Task Run(MySqlConnection db,string root) {
        using(var health=new HttpClient {Timeout=TimeSpan.FromSeconds(5)}) {
            (await health.GetAsync("http://localhost:5000/api/health")).EnsureSuccessStatusCode();
            (await health.GetAsync("http://127.0.0.1:5173/")).EnsureSuccessStatusCode();
        }
        var tag="E2E-"+Guid.NewGuid().ToString("N");
        var password=Guid.NewGuid().ToString("N")+"Aa1!";
        var adminEmail=tag+"-admin@example.invalid"; var email=tag+"@example.invalid";
        var hash=BCrypt.Net.BCrypt.HashPassword(password);
        int admin=0,user=0,tour=0,hotel=0,room=0,departure=0;
        try {
            admin=await db.ExecuteScalarAsync<int>("INSERT INTO NguoiDung(MaVaiTro,HoTen,Email,MatKhau,TrangThai) VALUES(1,@tag,@adminEmail,@hash,1); SELECT LAST_INSERT_ID();",new{tag,adminEmail,hash});
            user=await db.ExecuteScalarAsync<int>("INSERT INTO NguoiDung(MaVaiTro,HoTen,Email,MatKhau,TrangThai) VALUES(2,@tag,@email,@hash,1); SELECT LAST_INSERT_ID();",new{tag,email,hash});
            tour=await db.ExecuteScalarAsync<int>("INSERT INTO Tour(MaNguoiTao,TenTour,MoTa,DiemKhoiHanh,DiemDen,SoNgay,SoDem,GiaTour,SoNguoiToiDa,SoNguoiToiThieu,TrangThai) VALUES(@admin,@tag,'Browser test','Hà Nội','Quảng Ninh',2,1,1000000,10,1,'Active'); SELECT LAST_INSERT_ID();",new{admin,tag});
            departure=await db.ExecuteScalarAsync<int>("INSERT INTO TourKhoiHanh(MaTour,NgayKhoiHanh,SoChoToiDa,SoChoDaDat,GiaApDung,TrangThai) VALUES(@tour,@date,10,0,1000000,'OpenForBooking'); SELECT LAST_INSERT_ID();",new{tour,date=DateTime.UtcNow.AddHours(7).Date.AddDays(40)});
            hotel=await db.ExecuteScalarAsync<int>("INSERT INTO KhachSan(TenKhachSan,LoaiLuuTru,TrangThai) VALUES(@tag,'Hotel',1); SELECT LAST_INSERT_ID();",new{tag});
            room=await db.ExecuteScalarAsync<int>("INSERT INTO LoaiPhong(MaKhachSan,TenLoaiPhong,SucChua,SoLuongPhong,GiaMoiDem,TrangThai) VALUES(@hotel,'E2E room',2,3,500000,1); SELECT LAST_INSERT_ID();",new{hotel});
            var start=new ProcessStartInfo("node") {WorkingDirectory=Path.GetFullPath(Path.Combine(root,"../frontend")),UseShellExecute=false,CreateNoWindow=true,RedirectStandardOutput=true,RedirectStandardError=true};
            start.ArgumentList.Add("node_modules/@playwright/test/cli.js");start.ArgumentList.Add("test");
            foreach(var pair in new Dictionary<string,string> {["E2E_TAG"]=tag,["E2E_EMAIL"]=email,["E2E_ADMIN_EMAIL"]=adminEmail,["E2E_PASSWORD"]=password,
                ["E2E_TOUR"]=tour.ToString(),["E2E_HOTEL"]=hotel.ToString(),["E2E_ROOM"]=room.ToString(),["E2E_DEPARTURE"]=departure.ToString(),
                ["E2E_IMAGE"]=Path.Combine(root,"wwwroot/media/vietnam/ha-long.jpg")}) start.Environment[pair.Key]=pair.Value;
            using var process=Process.Start(start)!;
            async Task Forward(StreamReader reader) { while(await reader.ReadLineAsync() is {} line) Console.WriteLine(line); }
            var output=Forward(process.StandardOutput); var errors=Forward(process.StandardError);
            await process.WaitForExitAsync();
            await Task.WhenAll(output,errors);
            if(process.ExitCode!=0) Environment.ExitCode=1;
        }
        finally {
            var ids=(await db.QueryAsync<int>("SELECT MaDiaDiem FROM DiaDiem WHERE TenDiaDiem=@name",new{name=tag+" destination"})).ToArray();
            foreach(var id in ids) {
                var paths=await db.QueryAsync<string>("SELECT DuongDan FROM HinhAnh WHERE MaDiaDiem=@id",new{id});
                await db.ExecuteAsync("DELETE FROM DiaDiem WHERE MaDiaDiem=@id",new{id});
                var allowed=Path.GetFullPath(Path.Combine(root,"wwwroot/media/uploads"))+Path.DirectorySeparatorChar;
                foreach(var path in paths) {
                    var file=Path.GetFullPath(Path.Combine(root,"wwwroot",path.TrimStart('/')));
                    if(file.StartsWith(allowed,StringComparison.OrdinalIgnoreCase) && File.Exists(file)) File.Delete(file);
                }
            }
            await db.ExecuteAsync("DELETE FROM DatTour WHERE MaNguoiDung=@user; DELETE FROM DatPhong WHERE MaNguoiDung=@user; DELETE FROM ChuyenDi WHERE MaNguoiDung=@user",new{user});
            if(departure>0) await db.ExecuteAsync("DELETE FROM TourKhoiHanh WHERE MaKhoiHanh=@departure",new{departure});
            if(tour>0) await db.ExecuteAsync("DELETE FROM Tour WHERE MaTour=@tour AND MaNguoiTao=@admin",new{tour,admin});
            if(room>0) await db.ExecuteAsync("DELETE FROM LoaiPhong WHERE MaLoaiPhong=@room",new{room});
            if(hotel>0) await db.ExecuteAsync("DELETE FROM KhachSan WHERE MaKhachSan=@hotel AND TenKhachSan=@tag",new{hotel,tag});
            await db.ExecuteAsync("DELETE FROM NguoiDung WHERE MaNguoiDung IN (@admin,@user) AND Email IN (@adminEmail,@email)",new{admin,user,adminEmail,email});
            Console.WriteLine("Browser-only fixtures and uploaded image removed. Admin audit entries preserved.");
        }
    }
}
