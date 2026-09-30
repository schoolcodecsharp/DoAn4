using System.Data;
using System.Security.Claims;
using backend.DTOs;
using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MySqlConnector;

namespace backend.Controllers;

[ApiController]
[Authorize]
[Route("api/account")]
public sealed partial class AccountController(IConfiguration config) : ControllerBase
{
    private MySqlConnection Connection() => new(config.GetConnectionString("DefaultConnection"));
    private int Owner => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    private static DateTime VietnamToday => DateTime.UtcNow.AddHours(7).Date;

    [HttpGet]
    public async Task<IActionResult> GetAccount()
    {
        await using var conn = Connection();
        var owner = new { Owner };
        var tours = await conn.QueryAsync("""
            SELECT d.MaDatTour AS id, t.MaTour AS tourId, t.TenTour AS name, d.NgayKhoiHanh AS startDate,
                   d.SoNguoi AS people, d.TongTien AS total, d.TrangThai AS status,
                   d.YeuCauHuy AS cancellationStatus,d.LyDoHuy AS cancellationReason,d.PhanHoiHuy AS cancellationReply,
                   COALESCE((SELECT SUM(p.SoTien) FROM ThanhToan p WHERE p.MaDatTour=d.MaDatTour AND p.TrangThai='ThanhCong'),0) AS paid
            FROM DatTour d JOIN Tour t ON t.MaTour=d.MaTour
            WHERE d.MaNguoiDung=@Owner ORDER BY d.NgayDat DESC
            """, owner);
        var hotels = await conn.QueryAsync("""
            SELECT d.MaDatPhong AS id, k.MaKhachSan AS hotelId, p.MaLoaiPhong AS roomId,
                   CONCAT(k.TenKhachSan, ' / ', p.TenLoaiPhong) AS name,
                   d.NgayNhanPhong AS startDate, d.NgayTraPhong AS endDate, d.SoNguoi AS people,
                   d.SoLuongPhong AS rooms, d.TongTien AS total, d.TrangThai AS status,
                   d.YeuCauHuy AS cancellationStatus,d.LyDoHuy AS cancellationReason,d.PhanHoiHuy AS cancellationReply,
                   COALESCE((SELECT SUM(p.SoTien) FROM ThanhToan p WHERE p.MaDatPhong=d.MaDatPhong AND p.TrangThai='ThanhCong'),0) AS paid
            FROM DatPhong d JOIN LoaiPhong p ON p.MaLoaiPhong=d.MaLoaiPhong
            JOIN KhachSan k ON k.MaKhachSan=p.MaKhachSan
            WHERE d.MaNguoiDung=@Owner ORDER BY d.NgayDat DESC
            """, owner);
        var trips = await conn.QueryAsync<ChuyenDiDto>("SELECT c.* FROM ChuyenDi c WHERE c.MaNguoiDung=@Owner OR EXISTS (SELECT 1 FROM ThanhVienChuyenDi m WHERE m.MaChuyenDi=c.MaChuyenDi AND m.MaNguoiDung=@Owner AND m.TrangThai='Accepted') ORDER BY c.NgayTao DESC", owner);
        var days = await conn.QueryAsync<LichTrinhDto>("""
            SELECT l.* FROM LichTrinh l JOIN ChuyenDi c ON c.MaChuyenDi=l.MaChuyenDi
            WHERE c.MaNguoiDung=@Owner OR EXISTS (SELECT 1 FROM ThanhVienChuyenDi m WHERE m.MaChuyenDi=c.MaChuyenDi AND m.MaNguoiDung=@Owner AND m.TrangThai='Accepted') ORDER BY l.NgayThu
            """, owner);
        var invitations = await conn.QueryAsync("""
            SELECT m.MaThanhVien AS id,c.TenChuyenDi AS name,c.DiemDen AS destination,
                   c.NgayBatDau AS startDate,u.HoTen AS ownerName
            FROM ThanhVienChuyenDi m JOIN ChuyenDi c ON c.MaChuyenDi=m.MaChuyenDi
            JOIN NguoiDung u ON u.MaNguoiDung=c.MaNguoiDung
            WHERE m.MaNguoiDung=@Owner AND m.TrangThai='Pending' AND c.TrangThai NOT IN ('Completed','Cancelled')
            ORDER BY m.NgayThamGia DESC
            """, owner);
        var activities = await ReadActivities(conn, days.Select(d => d.MaLichTrinh).ToArray());
        return Ok(new { tours, hotels, invitations, trips = trips.Select(t => new {
            isOwner = t.MaNguoiDung == Owner,
            canEdit = t.MaNguoiDung == Owner && t.TrangThai == "Planning" && t.NgayBatDau.Date >= VietnamToday,
            t.Revision, t.DiemKhoiHanh, t.MaChuyenDi, t.TenChuyenDi, t.DiemDen, t.NgayBatDau, t.NgayKetThuc, t.SoNguoi, t.NganSach, t.MoTa,
            days = days.Where(d => d.MaChuyenDi == t.MaChuyenDi).Select(d => new { d.NgayThu, d.Ngay, d.TieuDe, d.GhiChu, activities = activities.Where(a => a.MaLichTrinh == d.MaLichTrinh) })
        }) });
    }

    [HttpPost("bookings/tours")]
    public async Task<IActionResult> BookTour(TourBookingRequest request, [FromServices] backend.Data.IDatTourRepository bookings)
    {
        await using var conn=Connection();
        var departure=await conn.QuerySingleOrDefaultAsync<TourKhoiHanhResponseDto>("SELECT * FROM TourKhoiHanh WHERE MaKhoiHanh=@MaKhoiHanh",request);
        if(departure==null) return NotFound(new { message="Lịch khởi hành không tồn tại." });
        var dto=new CreateDatTourDto { MaNguoiDung=Owner,MaTour=departure.MaTour,MaKhoiHanh=departure.MaKhoiHanh,
            NgayKhoiHanh=departure.NgayKhoiHanh,SoNguoi=request.SoNguoi,GhiChu=request.GhiChu };
        var id=await bookings.CreateAsync(dto);
        return StatusCode(201,new { id,total=dto.TongTien,status="Pending" });
    }

    [HttpPost("bookings/hotels")]
    public async Task<IActionResult> BookHotel(RoomBookingRequest request, [FromServices] backend.Data.IDatPhongRepository bookings)
    {
        var dto=new CreateDatPhongDto { MaNguoiDung=Owner,MaLoaiPhong=request.MaLoaiPhong,NgayNhanPhong=request.NgayNhanPhong,
            NgayTraPhong=request.NgayTraPhong,SoLuongPhong=request.SoLuongPhong,SoNguoi=request.SoNguoi,GhiChu=request.GhiChu! };
        var id=await bookings.CreateAsync(dto);
        return StatusCode(201,new { id,total=dto.TongTien,status="Pending" });
    }

    [HttpPost("itineraries")]
    [HttpPut("itineraries/{tripId:int}")]
    public async Task<IActionResult> SaveItinerary(ItineraryRequest request, [FromRoute] int? tripId = null)
    {
        static bool ValidName(string? name) => !string.IsNullOrWhiteSpace(name) && name.Trim().Length <= 200;
        if (!ValidName(request.TenChuyenDi) || !ValidName(request.DiemKhoiHanh) || !ValidName(request.DiemDen) ||
            request.NgayBatDau.Date < VietnamToday || request.NgayBatDau.Year > 9998 || request.SoNguoi is < 1 or > 100 ||
            request.NganSach is < 0 or > 1000000000 || request.MoTa?.Length > 2000 || request.Days == null || request.Days.Count is < 1 or > 30 ||
            request.Days.Any(d => d == null || !ValidName(d.TieuDe) || d.GhiChu?.Length > 4000))
            return BadRequest(new { message = "Kiểm tra tên, điểm đến, ngày bắt đầu, số người và kế hoạch (1–30 ngày)." });
        await using var conn = Connection();
        await conn.OpenAsync();
        await using var tx = await conn.BeginTransactionAsync();
        if (tripId.HasValue)
        {
            var current = await conn.QuerySingleOrDefaultAsync<ChuyenDiDto>("SELECT * FROM ChuyenDi WHERE MaChuyenDi=@tripId AND MaNguoiDung=@Owner FOR UPDATE", new { tripId, Owner }, tx);
            if (current == null) return NotFound(new { message = "Không tìm thấy lịch trình của bạn." });
            if (current.TrangThai != "Planning" || current.NgayBatDau.Date < VietnamToday)
                return Conflict(new { message = "Chỉ sửa lịch trình đang lên kế hoạch và chưa qua ngày bắt đầu." });
            if (request.Revision != current.Revision) return Conflict(new { message = "Lịch trình đã được sửa ở cửa sổ khác. Hãy tải lại trang trước khi lưu." });
            var members = await conn.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM ThanhVienChuyenDi WHERE MaChuyenDi=@tripId AND MaNguoiDung<>@Owner AND TrangThai IN ('Pending','Accepted')", new { tripId, Owner }, tx);
            if (request.SoNguoi < members + 1) return Conflict(new { message = "Số người phải bao gồm chủ chuyến đi và các thành viên/lời mời đang có." });
        }
        var activityError = await ValidateActivities(conn, tx, request.Days);
        if (activityError != null) return BadRequest(new { message = activityError });
        var start = request.NgayBatDau.Date;
        var id = tripId ?? await conn.ExecuteScalarAsync<int>("""
            INSERT INTO ChuyenDi (MaNguoiDung, TenChuyenDi, DiemKhoiHanh, DiemDen, NgayBatDau, NgayKetThuc, SoNguoi, NganSach, MoTa, TrangThai)
            VALUES (@Owner, @TenChuyenDi, @DiemKhoiHanh, @DiemDen, @start, @end, @SoNguoi, @NganSach, @MoTa, 'Planning');
            SELECT LAST_INSERT_ID();
            """, new { Owner, TenChuyenDi = request.TenChuyenDi.Trim(), DiemKhoiHanh = request.DiemKhoiHanh.Trim(),
                DiemDen = request.DiemDen.Trim(), start, end = start.AddDays(request.Days.Count - 1), request.SoNguoi, request.NganSach, request.MoTa }, tx);
        if (tripId.HasValue)
        {
            await conn.ExecuteAsync("""
                UPDATE ChuyenDi SET TenChuyenDi=@name,DiemKhoiHanh=@origin,DiemDen=@destination,
                    NgayBatDau=@start,NgayKetThuc=@end,SoNguoi=@SoNguoi,NganSach=@NganSach,MoTa=@MoTa,
                    Revision=Revision+1,NgayCapNhat=NOW() WHERE MaChuyenDi=@id;
                DELETE FROM LichTrinh WHERE MaChuyenDi=@id;
                """, new { id, name = request.TenChuyenDi.Trim(), origin = request.DiemKhoiHanh.Trim(), destination = request.DiemDen.Trim(),
                    start, end = start.AddDays(request.Days.Count - 1), request.SoNguoi, request.NganSach, request.MoTa }, tx);
        }
        for (var i = 0; i < request.Days.Count; i++)
        {
            var dayId = await conn.ExecuteScalarAsync<int>("INSERT INTO LichTrinh (MaChuyenDi, NgayThu, Ngay, TieuDe, GhiChu) VALUES (@id,@number,@date,@title,@note); SELECT LAST_INSERT_ID();",
                new { id, number = i + 1, date = start.AddDays(i), title = request.Days[i].TieuDe.Trim(), note = request.Days[i].GhiChu }, tx);
            var order = 0;
            foreach (var activity in (request.Days[i].Activities ?? []).OrderBy(a => a.ThoiGianBatDau))
                await conn.ExecuteAsync("""
                    INSERT INTO LichTrinhChiTiet (MaLichTrinh,ThuTu,LoaiDiaDiem,MaDiaDiem,MaNhaHang,MaKhachSan,ThoiGianBatDau,ThoiGianKetThuc,GhiChu)
                    VALUES (@dayId,@order,@LoaiDiaDiem,@place,@restaurant,@hotel,@ThoiGianBatDau,@ThoiGianKetThuc,@GhiChu)
                    """, new { dayId, order = ++order, activity.LoaiDiaDiem,
                        place = activity.LoaiDiaDiem == "DiaDiem" ? (int?)activity.MaDoiTuong : null,
                        restaurant = activity.LoaiDiaDiem == "NhaHang" ? (int?)activity.MaDoiTuong : null,
                        hotel = activity.LoaiDiaDiem == "KhachSan" ? (int?)activity.MaDoiTuong : null,
                        activity.ThoiGianBatDau, activity.ThoiGianKetThuc, activity.GhiChu }, tx);
        }
        await tx.CommitAsync();
        return StatusCode(tripId.HasValue ? 200 : 201, new { id });
    }

    [HttpGet("itineraries/{tripId:int}/members")]
    public async Task<IActionResult> Members(int tripId)
    {
        await using var db=Connection();
        if(await db.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM ChuyenDi WHERE MaChuyenDi=@tripId AND MaNguoiDung=@Owner",new{tripId,Owner})!=1) return NotFound();
        return Ok(await db.QueryAsync("""
            SELECT m.MaThanhVien AS id,u.HoTen AS name,u.Email AS email,m.TrangThai AS status
            FROM ThanhVienChuyenDi m JOIN NguoiDung u ON u.MaNguoiDung=m.MaNguoiDung
            WHERE m.MaChuyenDi=@tripId AND m.MaNguoiDung<>@Owner ORDER BY m.NgayThamGia,m.MaThanhVien
            """,new{tripId,Owner}));
    }

    [HttpPost("itineraries/{tripId:int}/members")]
    public async Task<IActionResult> InviteMember(int tripId, InviteMemberRequest request)
    {
        var email=request.Email?.Trim().ToLowerInvariant();
        if(string.IsNullOrEmpty(email) || email.Length>150 || !new System.ComponentModel.DataAnnotations.EmailAddressAttribute().IsValid(email))
            return BadRequest(new{message="Nhập email hợp lệ của người muốn mời."});
        await using var db=Connection(); await db.OpenAsync();
        await using var tx=await db.BeginTransactionAsync(IsolationLevel.ReadCommitted);
        var trip=await db.QuerySingleOrDefaultAsync<ChuyenDiDto>("SELECT * FROM ChuyenDi WHERE MaChuyenDi=@tripId AND MaNguoiDung=@Owner FOR UPDATE",new{tripId,Owner},tx);
        if(trip==null) return NotFound();
        if(trip.TrangThai is "Completed" or "Cancelled") return Conflict(new{message="Chuyến đi đã kết thúc, không thể mời thêm thành viên."});
        var target=await db.ExecuteScalarAsync<int?>("SELECT MaNguoiDung FROM NguoiDung WHERE Email=@email AND TrangThai=1",new{email},tx);
        if(target==null) return BadRequest(new{message="Không thể mời email này. Người được mời cần có tài khoản đang hoạt động."});
        if(target==Owner) return BadRequest(new{message="Bạn đã là chủ chuyến đi."});
        var existing=await db.QuerySingleOrDefaultAsync<ThanhVienChuyenDiDto>("SELECT * FROM ThanhVienChuyenDi WHERE MaChuyenDi=@tripId AND MaNguoiDung=@target",new{tripId,target},tx);
        if(existing!=null && existing.TrangThai!="Rejected") return Conflict(new{message="Người này đã có lời mời hoặc đã tham gia chuyến đi."});
        var count=await db.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM ThanhVienChuyenDi WHERE MaChuyenDi=@tripId AND MaNguoiDung<>@Owner AND TrangThai IN ('Pending','Accepted')",new{tripId,Owner},tx);
        if(count>=99) return Conflict(new{message="Mỗi chuyến đi tối đa 100 người, bao gồm chủ chuyến đi và lời mời đang chờ."});
        var id=existing?.MaThanhVien ?? await db.ExecuteScalarAsync<int>("INSERT INTO ThanhVienChuyenDi(MaChuyenDi,MaNguoiDung,VaiTro,TrangThai) VALUES(@tripId,@target,'Member','Pending'); SELECT LAST_INSERT_ID();",new{tripId,target},tx);
        if(existing!=null) await db.ExecuteAsync("UPDATE ThanhVienChuyenDi SET TrangThai='Pending',VaiTro='Member',NgayThamGia=NOW() WHERE MaThanhVien=@id",new{id},tx);
        await db.ExecuteAsync("UPDATE ChuyenDi SET SoNguoi=GREATEST(SoNguoi,@size) WHERE MaChuyenDi=@tripId",new{size=count+2,tripId},tx);
        await tx.CommitAsync();
        return StatusCode(201,new{id,message="Đã gửi lời mời trong ứng dụng. Người được mời có thể phản hồi tại trang tài khoản."});
    }

    [HttpPut("invitations/{id:int}")]
    public async Task<IActionResult> RespondToInvitation(int id, InvitationResponse request)
    {
        if(request.Status is not ("Accepted" or "Rejected")) return BadRequest(new{message="Chọn chấp nhận hoặc từ chối lời mời."});
        await using var db=Connection(); await db.OpenAsync();
        await using var tx=await db.BeginTransactionAsync(IsolationLevel.ReadCommitted);
        var tripId=await db.ExecuteScalarAsync<int?>("SELECT MaChuyenDi FROM ThanhVienChuyenDi WHERE MaThanhVien=@id AND MaNguoiDung=@Owner",new{id,Owner},tx);
        if(tripId==null) return NotFound();
        // Lock trip before membership, matching invitation/removal lock order.
        var trip=await db.QuerySingleOrDefaultAsync<ChuyenDiDto>("SELECT * FROM ChuyenDi WHERE MaChuyenDi=@tripId FOR UPDATE",new{tripId},tx);
        var member=await db.QuerySingleOrDefaultAsync<ThanhVienChuyenDiDto>("SELECT * FROM ThanhVienChuyenDi WHERE MaThanhVien=@id AND MaNguoiDung=@Owner FOR UPDATE",new{id,Owner},tx);
        if(trip==null || member==null || trip.MaNguoiDung==Owner) return NotFound();
        if(member.TrangThai==request.Status) return NoContent();
        if(member.TrangThai!="Pending" || trip.TrangThai is "Completed" or "Cancelled") return Conflict(new{message="Lời mời không còn chờ phản hồi hoặc chuyến đi đã kết thúc."});
        await db.ExecuteAsync("UPDATE ThanhVienChuyenDi SET TrangThai=@Status WHERE MaThanhVien=@id",new{request.Status,id},tx);
        await tx.CommitAsync();
        return NoContent();
    }

    [HttpDelete("itineraries/{tripId:int}/members/{id:int}")]
    public async Task<IActionResult> RemoveMember(int tripId,int id)
    {
        await using var db=Connection(); await db.OpenAsync();
        await using var tx=await db.BeginTransactionAsync(IsolationLevel.ReadCommitted);
        var trip=await db.QuerySingleOrDefaultAsync<ChuyenDiDto>("SELECT * FROM ChuyenDi WHERE MaChuyenDi=@tripId AND MaNguoiDung=@Owner FOR UPDATE",new{tripId,Owner},tx);
        if(trip==null) return NotFound();
        if(trip.TrangThai is "Completed" or "Cancelled") return Conflict(new{message="Không sửa thành viên của chuyến đi đã kết thúc."});
        var changed=await db.ExecuteAsync("DELETE FROM ThanhVienChuyenDi WHERE MaThanhVien=@id AND MaChuyenDi=@tripId AND MaNguoiDung<>@Owner",new{id,tripId,Owner},tx);
        await tx.CommitAsync();
        return changed>0 ? NoContent() : NotFound();
    }

    private sealed class Stay
    {
        public DateTime NgayNhanPhong { get; set; }
        public DateTime NgayTraPhong { get; set; }
        public int SoLuongPhong { get; set; }
    }
}

public sealed class TourBookingRequest
{
    public int MaKhoiHanh { get; set; }
    public int SoNguoi { get; set; }
    public string? GhiChu { get; set; }
}
public sealed class RoomBookingRequest
{
    public int MaLoaiPhong { get; set; }
    public DateTime NgayNhanPhong { get; set; }
    public DateTime NgayTraPhong { get; set; }
    public int SoLuongPhong { get; set; }
    public int SoNguoi { get; set; }
    public string? GhiChu { get; set; }
}
public sealed class ItineraryRequest
{
    public int? Revision { get; set; }
    public string TenChuyenDi { get; set; } = "";
    public string DiemKhoiHanh { get; set; } = "";
    public string DiemDen { get; set; } = "";
    public DateTime NgayBatDau { get; set; }
    public int SoNguoi { get; set; }
    public decimal NganSach { get; set; }
    public string? MoTa { get; set; }
    public List<ItineraryDay>? Days { get; set; }
}
public sealed class ItineraryDay
{
    public string TieuDe { get; set; } = "";
    public string? GhiChu { get; set; }
    public List<ItineraryActivityRequest>? Activities { get; set; }
}

public sealed class InviteMemberRequest { public string Email { get; set; } = ""; }
public sealed class InvitationResponse { public string Status { get; set; } = ""; }
