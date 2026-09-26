using Dapper;
using MySqlConnector;
using backend.DTOs;
using backend.Security;
using System.Data;

namespace backend.Data;

public class ThanhToanRepository : IThanhToanRepository
{
    private readonly string _connectionString;
    public ThanhToanRepository(IConfiguration config) =>
        _connectionString = config.GetConnectionString("DefaultConnection")!;
    private MySqlConnection GetConnection() => new MySqlConnection(_connectionString);

    public async Task<IEnumerable<ThanhToanResponseDto>> GetAllAsync()
    {
        using var conn = GetConnection();
        return await conn.QueryAsync<ThanhToanResponseDto>("SELECT * FROM ThanhToan ORDER BY NgayTao DESC");
    }

    public async Task<ThanhToanResponseDto?> GetByIdAsync(int id)
    {
        using var conn = GetConnection();
        return await conn.QueryFirstOrDefaultAsync<ThanhToanResponseDto>(
            "SELECT * FROM ThanhToan WHERE MaThanhToan=@id", new { id });
    }

    public async Task<IEnumerable<ThanhToanResponseDto>> GetByDatTourAsync(int maDatTour)
    {
        using var conn = GetConnection();
        return await conn.QueryAsync<ThanhToanResponseDto>(
            "SELECT * FROM ThanhToan WHERE MaDatTour=@maDatTour", new { maDatTour });
    }

    public async Task<IEnumerable<ThanhToanResponseDto>> GetByDatPhongAsync(int maDatPhong)
    {
        using var conn = GetConnection();
        return await conn.QueryAsync<ThanhToanResponseDto>(
            "SELECT * FROM ThanhToan WHERE MaDatPhong=@maDatPhong", new { maDatPhong });
    }

    public async Task<int> CreateAsync(CreateThanhToanDto dto)
    {
        if (dto.SoTien <= 0 || dto.SoTien > 9999999999999.99m || decimal.Round(dto.SoTien,2) != dto.SoTien ||
            dto.PhuongThuc is not ("TienMat" or "ChuyenKhoan" or "VNPay" or "Momo" or "ZaloPay") ||
            !ValidOrder(dto.LoaiDon,dto.MaDatTour,dto.MaDatPhong))
            throw new RequestRuleException("Số tiền phải dương, tối đa 2 số lẻ; chọn phương thức và đúng một đơn thanh toán.");
        ValidateReference(dto.MaGiaoDich);
        dto.MaGiaoDich = dto.MaGiaoDich?.Trim();
        if (dto.NgayThanhToan != null) throw new RequestRuleException("Ngày thanh toán được server ghi khi xác nhận thành công.");
        using var conn = GetConnection();
        await conn.OpenAsync();
        await using var tx = await conn.BeginTransactionAsync(IsolationLevel.ReadCommitted);
        var order = await LockOrder(conn,tx,dto.LoaiDon,dto.MaDatTour,dto.MaDatPhong);
        await CheckBalance(conn,tx,dto.LoaiDon,order,dto.MaDatTour,dto.MaDatPhong,dto.SoTien,0);
        await UniqueReference(conn,tx,dto.MaGiaoDich,0);
        var sql = @"INSERT INTO ThanhToan (LoaiDon,MaDatTour,MaDatPhong,SoTien,PhuongThuc,MaGiaoDich,NgayThanhToan)
                    VALUES (@LoaiDon,@MaDatTour,@MaDatPhong,@SoTien,@PhuongThuc,@MaGiaoDich,@NgayThanhToan);
                    SELECT LAST_INSERT_ID();";
        var id = await conn.ExecuteScalarAsync<int>(sql, dto,tx);
        await tx.CommitAsync();
        return id;
    }

    public async Task<bool> UpdateAsync(int id, UpdateThanhToanDto dto)
    {
        ValidateReference(dto.MaGiaoDich);
        using var conn = GetConnection();
        await conn.OpenAsync();
        await using var tx = await conn.BeginTransactionAsync(IsolationLevel.ReadCommitted);
        var initial = await conn.QuerySingleOrDefaultAsync<ThanhToanResponseDto>("SELECT * FROM ThanhToan WHERE MaThanhToan=@id",new{id},tx);
        if(initial == null) return false;
        // Lock the booking before its payments, shared with cancellation; prevents paid-but-cancelled races.
        var order = await LockOrder(conn,tx,initial.LoaiDon,initial.MaDatTour,initial.MaDatPhong,allowCancelled:true);
        var payment = await conn.QuerySingleAsync<ThanhToanResponseDto>("SELECT * FROM ThanhToan WHERE MaThanhToan=@id FOR UPDATE",new{id},tx);
        var next = dto.TrangThai ?? payment.TrangThai;
        if(next is not ("ChoThanhToan" or "ThanhCong" or "ThatBai" or "DaHoanTien")) throw new RequestRuleException("Trạng thái thanh toán không hợp lệ.");
        if(dto.NgayThanhToan != null && dto.NgayThanhToan != payment.NgayThanhToan)
            throw new RequestRuleException("Không sửa ngày thanh toán; server ghi thời điểm xác nhận.");
        if(payment.TrangThai != "ChoThanhToan") {
            if(next != payment.TrangThai || (dto.MaGiaoDich != null && dto.MaGiaoDich != payment.MaGiaoDich))
                throw new RequestRuleException("Giao dịch đã kết thúc không được sửa. Hoàn tiền cần quy trình riêng, không đổi nhãn trạng thái.",409);
            return true;
        }
        if(next == "DaHoanTien") throw new RequestRuleException("Chưa hỗ trợ hoàn tiền; không được đổi trạng thái để giả lập hoàn tiền.",409);
        if(next == "ThanhCong") {
            if(payment.SoTien <= 0) throw new RequestRuleException("Giao dịch cũ có số tiền không hợp lệ.",409);
            await CheckBalance(conn,tx,payment.LoaiDon,order,payment.MaDatTour,payment.MaDatPhong,payment.SoTien,id);
        }
        var reference = dto.MaGiaoDich?.Trim() ?? payment.MaGiaoDich;
        await UniqueReference(conn,tx,reference,id);
        await conn.ExecuteAsync("UPDATE ThanhToan SET TrangThai=@next,MaGiaoDich=@reference,NgayThanhToan=CASE WHEN @next='ThanhCong' THEN NOW() ELSE NgayThanhToan END WHERE MaThanhToan=@id",new{next,reference,id},tx);
        await tx.CommitAsync();
        return true;
    }

    public Task<bool> DeleteAsync(int id) => throw new RequestRuleException("Không xóa giao dịch thanh toán.",409);

    private static bool ValidOrder(string kind,int? tour,int? room) =>
        kind == "DatTour" && tour > 0 && room == null || kind == "DatPhong" && room > 0 && tour == null;
    private static void ValidateReference(string? reference) {
        if(reference != null && (string.IsNullOrWhiteSpace(reference) || reference.Length > 150))
            throw new RequestRuleException("Mã giao dịch phải có nội dung và tối đa 150 ký tự.");
    }
    private sealed class Order { public string TrangThai {get;set;} = ""; public decimal TongTien {get;set;} }
    private static async Task<Order> LockOrder(MySqlConnection db,MySqlTransaction tx,string kind,int? tour,int? room,bool allowCancelled=false) {
        if(!ValidOrder(kind,tour,room)) throw new RequestRuleException("Liên kết đơn không hợp lệ.");
        var key = kind == "DatTour" ? "MaDatTour" : "MaDatPhong";
        var order = await db.QuerySingleOrDefaultAsync<Order>($"SELECT TrangThai,TongTien FROM {kind} WHERE {key}=@id FOR UPDATE",new{id=tour??room},tx);
        if(order == null) throw new RequestRuleException("Không tìm thấy đơn.",404);
        if(!allowCancelled && order.TrangThai == "Cancelled") throw new RequestRuleException("Không thanh toán đơn đã hủy.",409);
        return order;
    }
    private static async Task CheckBalance(MySqlConnection db,MySqlTransaction tx,string kind,Order order,int? tour,int? room,decimal amount,int excluded) {
        if(order.TrangThai == "Cancelled") throw new RequestRuleException("Không thanh toán đơn đã hủy.",409);
        var key = kind == "DatTour" ? "MaDatTour" : "MaDatPhong";
        var reserved = await db.ExecuteScalarAsync<decimal>($"SELECT COALESCE(SUM(SoTien),0) FROM ThanhToan WHERE {key}=@id AND MaThanhToan<>@excluded AND TrangThai IN ('ChoThanhToan','ThanhCong')",new{id=tour??room,excluded},tx);
        if(amount+reserved > order.TongTien) throw new RequestRuleException("Tổng giao dịch đang chờ và đã thu vượt giá trị đơn.",409);
    }
    private static async Task UniqueReference(MySqlConnection db,MySqlTransaction tx,string? reference,int id) {
        if(reference != null && await db.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM ThanhToan WHERE MaGiaoDich=@reference AND MaThanhToan<>@id",new{reference=reference.Trim(),id},tx)>0)
            throw new RequestRuleException("Mã giao dịch đã được sử dụng.",409);
    }
}
