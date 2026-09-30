using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using backend.DTOs;
using Dapper;
using Microsoft.Extensions.Configuration;
using MySqlConnector;

using System.Data;
using backend.Security;
using backend.Services;

namespace backend.Data;

public class DatPhongRepository(IConfiguration config) : IDatPhongRepository
{
    private MySqlConnection Connection() => new(config.GetConnectionString("DefaultConnection"));
    public async Task<IEnumerable<DatPhongResponseDto>> GetAllAsync() { using var db=Connection(); return await db.QueryAsync<DatPhongResponseDto>("SELECT * FROM DatPhong ORDER BY NgayDat DESC"); }
    public async Task<DatPhongResponseDto> GetByIdAsync(int id) { using var db=Connection(); return (await db.QuerySingleOrDefaultAsync<DatPhongResponseDto>("SELECT * FROM DatPhong WHERE MaDatPhong=@id",new{id}))!; }
    public async Task<IEnumerable<DatPhongResponseDto>> GetByNguoiDungAsync(int maNguoiDung) { using var db=Connection(); return await db.QueryAsync<DatPhongResponseDto>("SELECT * FROM DatPhong WHERE MaNguoiDung=@maNguoiDung",new{maNguoiDung}); }
    public async Task<int> CreateAsync(CreateDatPhongDto dto) {
        BookingRules.Note(dto.GhiChu);
        dto.NgayNhanPhong=dto.NgayNhanPhong.Date; dto.NgayTraPhong=dto.NgayTraPhong.Date;
        var nights=(dto.NgayTraPhong-dto.NgayNhanPhong).Days;
        if(dto.NgayNhanPhong<BookingRules.Today || nights is <1 or >30 || dto.SoNguoi is <1 or >100 || dto.SoLuongPhong is <1 or >100)
            throw new RequestRuleException("Ngày nhận không được trong quá khứ, lưu trú 1–30 đêm; số khách và số phòng từ 1–100.");
        if(dto.TrangThai!="Pending") throw new RequestRuleException("Đơn mới phải chờ xác nhận.");
        using var db=Connection(); await db.OpenAsync();
        using var tx=await db.BeginTransactionAsync(IsolationLevel.ReadCommitted);
        var room=await db.QuerySingleOrDefaultAsync<LoaiPhongDto>("SELECT * FROM LoaiPhong WHERE MaLoaiPhong=@MaLoaiPhong FOR UPDATE",dto,tx);
        if(room==null) throw new RequestRuleException("Không có loại phòng này.",404);
        if(!room.TrangThai || room.GiaMoiDem<0 || await db.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM KhachSan WHERE MaKhachSan=@MaKhachSan AND TrangThai=1",room,tx)!=1)
            throw new RequestRuleException("Loại phòng hiện không nhận đặt.",409);
        if(dto.SoNguoi>(long)room.SucChua*dto.SoLuongPhong) throw new RequestRuleException("Số khách vượt sức chứa.");
        if(await db.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM NguoiDung WHERE MaNguoiDung=@MaNguoiDung AND TrangThai=1",dto,tx)!=1) throw new RequestRuleException("Người đặt không tồn tại hoặc đã khóa.");
        var stays=await db.QueryAsync<DatPhongResponseDto>("SELECT * FROM DatPhong WHERE MaLoaiPhong=@MaLoaiPhong AND TrangThai IN ('Pending','Confirmed','CheckedIn') AND NgayNhanPhong<@NgayTraPhong AND NgayTraPhong>@NgayNhanPhong",dto,tx);
        for(var day=dto.NgayNhanPhong;day<dto.NgayTraPhong;day=day.AddDays(1))
            if(stays.Where(s=>s.NgayNhanPhong.Date<=day && s.NgayTraPhong.Date>day).Sum(s=>s.SoLuongPhong)+dto.SoLuongPhong>room.SoLuongPhong) throw new RequestRuleException("Không đủ phòng trong khoảng ngày đã chọn.",409);
        dto.GiaMoiDem=room.GiaMoiDem; dto.TongTien=room.GiaMoiDem*nights*dto.SoLuongPhong;
        StorageRules.Money(dto.TongTien,"Tổng tiền đặt phòng");
        var id=await db.ExecuteScalarAsync<int>("INSERT INTO DatPhong(MaNguoiDung,MaLoaiPhong,NgayNhanPhong,NgayTraPhong,SoLuongPhong,SoNguoi,GiaMoiDem,TongTien,TrangThai,GhiChu) VALUES(@MaNguoiDung,@MaLoaiPhong,@NgayNhanPhong,@NgayTraPhong,@SoLuongPhong,@SoNguoi,@GiaMoiDem,@TongTien,'Pending',@GhiChu); SELECT LAST_INSERT_ID();",dto,tx);
        await tx.CommitAsync(); return id;
    }
    public async Task<bool> UpdateAsync(int id,UpdateDatPhongDto dto) {
        BookingRules.Note(dto.GhiChu);
        using var db=Connection(); await db.OpenAsync();
        using var tx=await db.BeginTransactionAsync(IsolationLevel.ReadCommitted);
        var initial=await db.QuerySingleOrDefaultAsync<DatPhongResponseDto>("SELECT * FROM DatPhong WHERE MaDatPhong=@id",new{id},tx);
        if(initial==null) return false;
        await db.QuerySingleAsync<LoaiPhongDto>("SELECT * FROM LoaiPhong WHERE MaLoaiPhong=@MaLoaiPhong FOR UPDATE",initial,tx);
        var b=await db.QuerySingleAsync<DatPhongResponseDto>("SELECT * FROM DatPhong WHERE MaDatPhong=@id FOR UPDATE",new{id},tx);
        if((dto.MaNguoiDung.HasValue && dto.MaNguoiDung!=b.MaNguoiDung) || (dto.MaLoaiPhong.HasValue && dto.MaLoaiPhong!=b.MaLoaiPhong) ||
           (dto.NgayNhanPhong.HasValue && dto.NgayNhanPhong.Value.Date!=b.NgayNhanPhong.Date) || (dto.NgayTraPhong.HasValue && dto.NgayTraPhong.Value.Date!=b.NgayTraPhong.Date) ||
           (dto.SoLuongPhong.HasValue && dto.SoLuongPhong!=b.SoLuongPhong) || (dto.SoNguoi.HasValue && dto.SoNguoi!=b.SoNguoi) ||
           (dto.GiaMoiDem.HasValue && dto.GiaMoiDem!=b.GiaMoiDem) || (dto.TongTien.HasValue && dto.TongTien!=b.TongTien))
            throw new RequestRuleException("Không sửa khách, ngày, phòng hoặc giá đơn đã tạo. Hãy hủy và đặt lại.",409);
        var next=dto.TrangThai??b.TrangThai;
        next=await CancellationRules.Decide(db,tx,true,id,b,dto,b.TrangThai,next,b.NgayNhanPhong);
        BookingRules.Transition(b.TrangThai,next,true);
        if(next!=b.TrangThai) {
            if(next=="CheckedIn" && BookingRules.Today<b.NgayNhanPhong.Date) throw new RequestRuleException("Chưa đến ngày nhận phòng.",409);
            if(next=="CheckedOut" && BookingRules.Today<b.NgayTraPhong.Date) throw new RequestRuleException("Chưa đến ngày trả phòng.",409);
            if(next=="Cancelled" && await db.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM ThanhToan WHERE MaDatPhong=@id AND TrangThai='ThanhCong'",new{id},tx)>0) throw new RequestRuleException("Đơn đã thanh toán: cần ghi nhận hoàn tiền trước khi hủy.",409);
        }
        await db.ExecuteAsync("UPDATE DatPhong SET TrangThai=@next,GhiChu=COALESCE(@GhiChu,GhiChu) WHERE MaDatPhong=@id",new{next,dto.GhiChu,id},tx);
        await tx.CommitAsync(); return true;
    }
    public Task<bool> DeleteAsync(int id) => throw new RequestRuleException("Không xóa đơn phòng. Hãy hủy để giữ lịch sử.",409);
}
