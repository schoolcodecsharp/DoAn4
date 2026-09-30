using Dapper;
using MySqlConnector;
using System.Text.Json;

static class CoverageFixtures
{
    public static async Task Run(MySqlConnection db,string[] args)
    {
        var index=Array.IndexOf(args,"--coverage-fixtures");
        if(args.Length<=index+2)throw new Exception("Expected action and unique coverage tag.");
        var action=args[index+1];var tag=args[index+2];
        if(!System.Text.RegularExpressions.Regex.IsMatch(tag,"^coverage-[0-9]{13}$"))throw new Exception("Invalid fixture tag.");
        await using var tx=await db.BeginTransactionAsync();
        if(action=="create") {
            if(await db.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM Tour WHERE TenTour=@tag",new{tag},tx)>0)throw new Exception("Fixture already exists.");
            var admin=await db.ExecuteScalarAsync<int>("SELECT MaNguoiDung FROM NguoiDung WHERE MaVaiTro=1 AND TrangThai=1 ORDER BY MaNguoiDung LIMIT 1",transaction:tx);
            var user=await db.ExecuteScalarAsync<int>("SELECT MaNguoiDung FROM NguoiDung WHERE MaVaiTro=2 AND TrangThai=1 ORDER BY MaNguoiDung LIMIT 1",transaction:tx);
            if(admin<1||user<1)throw new Exception("Existing admin/customer required.");
            var date=DateTime.UtcNow.AddHours(7).Date.AddDays(45);
            var tour=await db.ExecuteScalarAsync<int>("INSERT INTO Tour(MaNguoiTao,TenTour,MoTa,DiemKhoiHanh,DiemDen,SoNgay,SoDem,GiaTour,SoNguoiToiDa,SoNguoiToiThieu,TrangThai) VALUES(@admin,@tag,'Disposable verification fixture','Hà Nội','Quảng Ninh',1,0,100000,10,1,'Draft'); SELECT LAST_INSERT_ID();",new{admin,tag},tx);
            var departure=await db.ExecuteScalarAsync<int>("INSERT INTO TourKhoiHanh(MaTour,NgayKhoiHanh,SoChoToiDa,SoChoDaDat,GiaApDung,TrangThai) VALUES(@tour,@date,10,1,100000,'OpenForBooking'); SELECT LAST_INSERT_ID();",new{tour,date},tx);
            var order=await db.ExecuteScalarAsync<int>("INSERT INTO DatTour(MaNguoiDung,MaTour,MaKhoiHanh,NgayKhoiHanh,SoNguoi,GiaMoiNguoi,TongTien,GhiChu) VALUES(@user,@tour,@departure,@date,1,100000,100000,@tag); SELECT LAST_INSERT_ID();",new{user,tour,departure,date,tag},tx);
            var hotel=await db.ExecuteScalarAsync<int>("INSERT INTO KhachSan(TenKhachSan,LoaiLuuTru,TrangThai) VALUES(@tag,'Hotel',1); SELECT LAST_INSERT_ID();",new{tag},tx);
            var trip=await db.ExecuteScalarAsync<int>("INSERT INTO ChuyenDi(MaNguoiDung,TenChuyenDi,DiemKhoiHanh,DiemDen,NgayBatDau,NgayKetThuc,SoNguoi,NganSach,TrangThai) VALUES(@user,@tag,'Hà Nội','Quảng Ninh',@date,@date,1,1000000,'Planning'); SELECT LAST_INSERT_ID();",new{user,tag,date},tx);
            var review=await db.ExecuteScalarAsync<int>("INSERT INTO DanhGia(MaNguoiDung,MaTour,SoSao,NoiDung) VALUES(@user,@tour,4,@tag); SELECT LAST_INSERT_ID();",new{user,tour,tag},tx);
            await tx.CommitAsync();Console.WriteLine(JsonSerializer.Serialize(new{tour,departure,order,hotel,trip,review}));return;
        }
        if(action!="cleanup")throw new Exception("Unknown action.");
        // Exact unique fixture ownership, never broad cleanup by test prefix.
        await db.ExecuteAsync("DELETE p FROM ThanhToan p JOIN DatTour d ON d.MaDatTour=p.MaDatTour JOIN Tour t ON t.MaTour=d.MaTour WHERE t.TenTour=@tag AND d.GhiChu=@tag",new{tag},tx);
        await db.ExecuteAsync("DELETE d FROM DanhGia d JOIN Tour t ON t.MaTour=d.MaTour WHERE t.TenTour=@tag AND d.NoiDung=@tag",new{tag},tx);
        await db.ExecuteAsync("DELETE d FROM DatTour d JOIN Tour t ON t.MaTour=d.MaTour WHERE t.TenTour=@tag AND d.GhiChu=@tag",new{tag},tx);
        await db.ExecuteAsync("DELETE FROM Tour WHERE TenTour=@tag",new{tag},tx);
        await db.ExecuteAsync("DELETE p FROM ThanhToan p JOIN DatPhong d ON d.MaDatPhong=p.MaDatPhong JOIN LoaiPhong r ON r.MaLoaiPhong=d.MaLoaiPhong JOIN KhachSan h ON h.MaKhachSan=r.MaKhachSan WHERE h.TenKhachSan=@tag",new{tag},tx);
        await db.ExecuteAsync("DELETE d FROM DatPhong d JOIN LoaiPhong r ON r.MaLoaiPhong=d.MaLoaiPhong JOIN KhachSan h ON h.MaKhachSan=r.MaKhachSan WHERE h.TenKhachSan=@tag",new{tag},tx);
        await db.ExecuteAsync("DELETE FROM KhachSan WHERE TenKhachSan=@tag",new{tag},tx);
        await db.ExecuteAsync("DELETE FROM ChuyenDi WHERE TenChuyenDi=@tag",new{tag},tx);
        await db.ExecuteAsync("DELETE FROM MaGiamGia WHERE Code=@code",new{code=tag.ToUpperInvariant()},tx);
        await tx.CommitAsync();Console.WriteLine("Cleaned only fixtures for "+tag);
    }
}
