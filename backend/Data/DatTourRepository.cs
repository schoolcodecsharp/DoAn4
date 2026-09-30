using Dapper;
using MySqlConnector;
using backend.DTOs;
using backend.Security;
using System.Data;
using backend.Services;

namespace backend.Data;

public class DatTourRepository : IDatTourRepository
{
    private readonly string _connectionString;
    public DatTourRepository(IConfiguration config) =>
        _connectionString = config.GetConnectionString("DefaultConnection")!;
    private MySqlConnection GetConnection() => new MySqlConnection(_connectionString);

    public async Task<IEnumerable<DatTourResponseDto>> GetAllAsync()
    {
        using var conn = GetConnection();
        return await conn.QueryAsync<DatTourResponseDto>("SELECT * FROM DatTour ORDER BY NgayDat DESC");
    }

    public async Task<DatTourResponseDto?> GetByIdAsync(int id)
    {
        using var conn = GetConnection();
        return await conn.QueryFirstOrDefaultAsync<DatTourResponseDto>(
            "SELECT * FROM DatTour WHERE MaDatTour=@id", new { id });
    }

    public async Task<IEnumerable<DatTourResponseDto>> GetByNguoiDungAsync(int maNguoiDung)
    {
        using var conn = GetConnection();
        return await conn.QueryAsync<DatTourResponseDto>(
            "SELECT * FROM DatTour WHERE MaNguoiDung=@maNguoiDung ORDER BY NgayDat DESC",
            new { maNguoiDung });
    }

    public async Task<int> CreateAsync(CreateDatTourDto dto)
    {
        using var conn = GetConnection(); await conn.OpenAsync();
        using var tx = await conn.BeginTransactionAsync(IsolationLevel.ReadCommitted);
        BookingRules.Note(dto.GhiChu);
        if (dto.SoNguoi is < 1 or > 100 || dto.MaKhoiHanh is null) throw new RequestRuleException("Chọn lịch khởi hành và số khách từ 1 đến 100.");
        var departure = await conn.QuerySingleOrDefaultAsync<TourKhoiHanhResponseDto>("SELECT * FROM TourKhoiHanh WHERE MaKhoiHanh=@MaKhoiHanh FOR UPDATE",dto,tx);
        if (departure == null || departure.MaTour != dto.MaTour || departure.NgayKhoiHanh.Date != dto.NgayKhoiHanh.Date)
            throw new RequestRuleException("Lịch khởi hành không khớp tour hoặc ngày đặt.");
        var active = await conn.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM Tour WHERE MaTour=@MaTour AND TrangThai='Active'",dto,tx);
        var userActive = await conn.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM NguoiDung WHERE MaNguoiDung=@MaNguoiDung AND TrangThai=1",dto,tx);
        if(userActive != 1) throw new RequestRuleException("Người đặt không tồn tại hoặc đã khóa.");
        if (active != 1 || departure.NgayKhoiHanh.Date < BookingRules.Today || departure.GiaApDung < 0 || departure.TrangThai != "OpenForBooking" || departure.SoChoDaDat + dto.SoNguoi > departure.SoChoToiDa)
            throw new RequestRuleException("Không đủ chỗ hoặc lịch đã đóng.",409);
        dto.GiaMoiNguoi = departure.GiaApDung; dto.TongTien = departure.GiaApDung * dto.SoNguoi;
        StorageRules.Money(dto.TongTien,"Tổng tiền đặt tour");
        var sql = @"INSERT INTO DatTour (MaNguoiDung,MaTour,MaKhoiHanh,NgayKhoiHanh,SoNguoi,GiaMoiNguoi,TongTien,GhiChu)
                    VALUES (@MaNguoiDung,@MaTour,@MaKhoiHanh,@NgayKhoiHanh,@SoNguoi,@GiaMoiNguoi,@TongTien,@GhiChu);
                    SELECT LAST_INSERT_ID();";
        var id = await conn.ExecuteScalarAsync<int>(sql, dto,tx);
        await conn.ExecuteAsync("UPDATE TourKhoiHanh SET SoChoDaDat=SoChoDaDat+@SoNguoi WHERE MaKhoiHanh=@MaKhoiHanh",dto,tx);
        await tx.CommitAsync(); return id;
    }

    public async Task<bool> UpdateAsync(int id, UpdateDatTourDto dto)
    {
        if (dto.TrangThai != null && dto.TrangThai is not ("Pending" or "Confirmed" or "Cancelled" or "Completed")) throw new RequestRuleException("Trạng thái đơn không hợp lệ.");
        return await Change(id,dto);
    }

    public Task<bool> DeleteAsync(int id) =>
        throw new RequestRuleException("Không xóa đơn đặt. Hãy chuyển sang Đã hủy để giữ lịch sử.",409);

    private async Task<bool> Change(int id,UpdateDatTourDto dto) {
        using var conn = GetConnection(); await conn.OpenAsync();
        using var tx = await conn.BeginTransactionAsync(IsolationLevel.ReadCommitted);
        var initial = await conn.QuerySingleOrDefaultAsync<DatTourResponseDto>("SELECT * FROM DatTour WHERE MaDatTour=@id",new{id},tx);
        if(initial == null) return false;
        // Same lock order as customer booking: departure, then reservation.
        TourKhoiHanhResponseDto? departure = null;
        if(initial.MaKhoiHanh.HasValue) departure = await conn.QuerySingleOrDefaultAsync<TourKhoiHanhResponseDto>("SELECT * FROM TourKhoiHanh WHERE MaKhoiHanh=@MaKhoiHanh FOR UPDATE",initial,tx);
        var booking = await conn.QuerySingleOrDefaultAsync<DatTourResponseDto>("SELECT * FROM DatTour WHERE MaDatTour=@id FOR UPDATE",new{id},tx);
        if(booking == null) return false;
        BookingRules.Note(dto?.GhiChu);
        var next = dto?.TrangThai ?? booking.TrangThai;
        BookingRules.Transition(booking.TrangThai,next,false);
        if(next != booking.TrangThai && next == "Completed") {
            var days = await conn.ExecuteScalarAsync<int>("SELECT SoNgay FROM Tour WHERE MaTour=@MaTour",booking,tx);
            if(booking.NgayKhoiHanh.Date.AddDays(days) > BookingRules.Today)
                throw new RequestRuleException("Chỉ hoàn thành sau ngày cuối cùng của tour.",409);
        }
        if(next != booking.TrangThai && next == "Cancelled" &&
            await conn.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM ThanhToan WHERE MaDatTour=@id AND TrangThai='ThanhCong'",new{id},tx)>0)
            throw new RequestRuleException("Đơn đã thanh toán: cần xử lý và ghi nhận hoàn tiền trước khi hủy.",409);
        int before = booking.TrangThai == "Cancelled" ? 0 : booking.SoNguoi;
        int after = next == "Cancelled" ? 0 : booking.SoNguoi;
        int delta = after-before;
        if(departure != null && (departure.SoChoDaDat+delta > departure.SoChoToiDa || departure.SoChoDaDat+delta < 0))
            throw new RequestRuleException("Không đủ chỗ để khôi phục đơn hoặc bộ đếm chỗ cần được đối soát.",409);
        await conn.ExecuteAsync("UPDATE DatTour SET TrangThai=COALESCE(@TrangThai,TrangThai),GhiChu=COALESCE(@GhiChu,GhiChu) WHERE MaDatTour=@id",new{dto.TrangThai,dto.GhiChu,id},tx);
        if(departure != null) await conn.ExecuteAsync("UPDATE TourKhoiHanh SET SoChoDaDat=SoChoDaDat+@delta WHERE MaKhoiHanh=@MaKhoiHanh",new{delta,booking.MaKhoiHanh},tx);
        await tx.CommitAsync(); return true;
    }
}
