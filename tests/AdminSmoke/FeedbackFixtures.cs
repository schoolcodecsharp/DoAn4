using System.Text.Json;
using System.Text.RegularExpressions;
using Dapper;
using MySqlConnector;

static class FeedbackFixtures
{
    public static async Task Run(MySqlConnection db,string root,string[] args)
    {
        var index=Array.IndexOf(args,"--feedback-fixtures");
        if(args.Length<=index+2)throw new Exception("Expected action and tag");
        var action=args[index+1];var tag=args[index+2];
        if(!Regex.IsMatch(tag,"^feedback-[0-9]{13}$"))throw new Exception("Invalid exact fixture tag");
        using var accounts=JsonDocument.Parse(await File.ReadAllTextAsync(Path.Combine(root,"../.local/test-accounts.json")));
        var owner=await db.ExecuteScalarAsync<int>("SELECT MaNguoiDung FROM NguoiDung WHERE Email=@email AND TrangThai=1",new{email=accounts.RootElement.GetProperty("user").GetProperty("email").GetString()});
        var admin=await db.ExecuteScalarAsync<int>("SELECT MaNguoiDung FROM NguoiDung WHERE Email=@email AND TrangThai=1 AND MaVaiTro=1",new{email=accounts.RootElement.GetProperty("admin").GetProperty("email").GetString()});
        if(owner<1||admin<1)throw new Exception("Existing accounts required");
        await using var tx=await db.BeginTransactionAsync();
        var date=DateTime.UtcNow.AddHours(7).Date.AddDays(-5);
        if(action=="create")
        {
            if(await db.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM Tour WHERE TenTour=@tag",new{tag},tx)>0)throw new Exception("Fixture exists");
            var category=await db.ExecuteScalarAsync<int>("SELECT MaLoai FROM LoaiDiaDiem LIMIT 1",transaction:tx);
            var destination=await db.ExecuteScalarAsync<int>("INSERT INTO DiaDiem(MaLoai,TenDiaDiem,TinhThanh,TrangThai) VALUES(@category,@tag,'Quảng Ninh',1); SELECT LAST_INSERT_ID();",new{category,tag},tx);
            var hotel=await db.ExecuteScalarAsync<int>("INSERT INTO KhachSan(TenKhachSan,TrangThai) VALUES(@tag,1); SELECT LAST_INSERT_ID();",new{tag},tx);
            var room=await db.ExecuteScalarAsync<int>("INSERT INTO LoaiPhong(MaKhachSan,TenLoaiPhong,SucChua,SoLuongPhong,GiaMoiDem) VALUES(@hotel,@tag,2,1,100); SELECT LAST_INSERT_ID();",new{hotel,tag},tx);
            var tour=await db.ExecuteScalarAsync<int>("INSERT INTO Tour(MaNguoiTao,TenTour,MoTa,DiemKhoiHanh,DiemDen,SoNgay,SoDem,GiaTour,SoNguoiToiDa,SoNguoiToiThieu,TrangThai) VALUES(@admin,@tag,'Disposable feedback fixture','Hà Nội','Quảng Ninh',1,0,100,2,1,'Active'); SELECT LAST_INSERT_ID();",new{admin,tag},tx);
            await db.ExecuteAsync("INSERT INTO TourChiTiet(MaTour,NgayThu,ThuTu,LoaiDiaDiem,MaDiaDiem,GhiChu) VALUES(@tour,1,1,'DiaDiem',@destination,@tag)",new{tour,destination,tag},tx);
            var departure=await db.ExecuteScalarAsync<int>("INSERT INTO TourKhoiHanh(MaTour,NgayKhoiHanh,SoChoToiDa,SoChoDaDat,GiaApDung,TrangThai) VALUES(@tour,@date,2,1,100,'FullyBooked'); SELECT LAST_INSERT_ID();",new{tour,date},tx);
            var tourOrder=await db.ExecuteScalarAsync<int>("INSERT INTO DatTour(MaNguoiDung,MaTour,MaKhoiHanh,NgayKhoiHanh,SoNguoi,GiaMoiNguoi,TongTien,TrangThai,GhiChu) VALUES(@owner,@tour,@departure,@date,1,100,100,'Pending',@tag); SELECT LAST_INSERT_ID();",new{owner,tour,departure,date,tag},tx);
            var roomOrder=await db.ExecuteScalarAsync<int>("INSERT INTO DatPhong(MaNguoiDung,MaLoaiPhong,NgayNhanPhong,NgayTraPhong,SoLuongPhong,SoNguoi,GiaMoiDem,TongTien,TrangThai,GhiChu) VALUES(@owner,@room,@date,@end,1,1,100,100,'Pending',@tag); SELECT LAST_INSERT_ID();",new{owner,room,date,end=date.AddDays(1),tag},tx);
            var legacy=await db.ExecuteScalarAsync<int>("INSERT INTO DanhGia(MaNguoiDung,MaTour,SoSao,NoiDung) VALUES(@admin,@tour,5,@tag); SELECT LAST_INSERT_ID();",new{admin,tour,tag},tx);
            await tx.CommitAsync();Console.WriteLine(JsonSerializer.Serialize(new{destination,hotel,room,tour,departure,tourOrder,roomOrder,legacy,owner,admin}));return;
        }
        if(action=="future" || action=="past")
        {
            var day=action=="future"?date.AddDays(20):date;
            await db.ExecuteAsync("UPDATE DatTour d JOIN Tour t ON t.MaTour=d.MaTour SET d.NgayKhoiHanh=@day WHERE t.TenTour=@tag AND d.GhiChu=@tag",new{day,tag},tx);
            await db.ExecuteAsync("UPDATE DatPhong d JOIN LoaiPhong r ON r.MaLoaiPhong=d.MaLoaiPhong JOIN KhachSan k ON k.MaKhachSan=r.MaKhachSan SET d.NgayNhanPhong=@day,d.NgayTraPhong=@end WHERE k.TenKhachSan=@tag AND d.GhiChu=@tag",new{day,end=day.AddDays(1),tag},tx);
            await tx.CommitAsync();return;
        }
        if(action!="cleanup")throw new Exception("Unknown action");
        // Reviews must be removed before their proof orders (foreign keys).
        await db.ExecuteAsync("DELETE p FROM ThanhToan p LEFT JOIN DatTour d ON d.MaDatTour=p.MaDatTour LEFT JOIN Tour t ON t.MaTour=d.MaTour LEFT JOIN DatPhong b ON b.MaDatPhong=p.MaDatPhong LEFT JOIN LoaiPhong r ON r.MaLoaiPhong=b.MaLoaiPhong LEFT JOIN KhachSan h ON h.MaKhachSan=r.MaKhachSan WHERE (t.TenTour=@tag AND d.GhiChu=@tag) OR (h.TenKhachSan=@tag AND b.GhiChu=@tag)",new{tag},tx);
        await db.ExecuteAsync("DELETE d FROM DanhGia d LEFT JOIN Tour t ON t.MaTour=d.MaTour LEFT JOIN DiaDiem p ON p.MaDiaDiem=d.MaDiaDiem LEFT JOIN KhachSan h ON h.MaKhachSan=d.MaKhachSan WHERE t.TenTour=@tag OR p.TenDiaDiem=@tag OR h.TenKhachSan=@tag",new{tag},tx);
        await db.ExecuteAsync("DELETE d FROM DatTour d JOIN Tour t ON t.MaTour=d.MaTour WHERE t.TenTour=@tag AND d.GhiChu=@tag",new{tag},tx);
        await db.ExecuteAsync("DELETE d FROM DatPhong d JOIN LoaiPhong r ON r.MaLoaiPhong=d.MaLoaiPhong JOIN KhachSan h ON h.MaKhachSan=r.MaKhachSan WHERE h.TenKhachSan=@tag AND d.GhiChu=@tag",new{tag},tx);
        await db.ExecuteAsync("DELETE FROM Tour WHERE TenTour=@tag",new{tag},tx);
        await db.ExecuteAsync("DELETE FROM KhachSan WHERE TenKhachSan=@tag",new{tag},tx);
        await db.ExecuteAsync("DELETE FROM DiaDiem WHERE TenDiaDiem=@tag",new{tag},tx);
        await tx.CommitAsync();Console.WriteLine("Removed only exact-tag feedback fixtures; existing accounts unchanged.");
    }
}
