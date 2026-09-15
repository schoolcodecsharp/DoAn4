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
public sealed class AccountController(IConfiguration config) : ControllerBase
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
            SELECT d.MaDatTour AS id, t.TenTour AS name, d.NgayKhoiHanh AS startDate,
                   d.SoNguoi AS people, d.TongTien AS total, d.TrangThai AS status
            FROM DatTour d JOIN Tour t ON t.MaTour=d.MaTour
            WHERE d.MaNguoiDung=@Owner ORDER BY d.NgayDat DESC
            """, owner);
        var hotels = await conn.QueryAsync("""
            SELECT d.MaDatPhong AS id, CONCAT(k.TenKhachSan, ' / ', p.TenLoaiPhong) AS name,
                   d.NgayNhanPhong AS startDate, d.NgayTraPhong AS endDate, d.SoNguoi AS people,
                   d.SoLuongPhong AS rooms, d.TongTien AS total, d.TrangThai AS status
            FROM DatPhong d JOIN LoaiPhong p ON p.MaLoaiPhong=d.MaLoaiPhong
            JOIN KhachSan k ON k.MaKhachSan=p.MaKhachSan
            WHERE d.MaNguoiDung=@Owner ORDER BY d.NgayDat DESC
            """, owner);
        var trips = await conn.QueryAsync<ChuyenDiDto>("SELECT * FROM ChuyenDi WHERE MaNguoiDung=@Owner ORDER BY NgayTao DESC", owner);
        var days = await conn.QueryAsync<LichTrinhDto>("""
            SELECT l.* FROM LichTrinh l JOIN ChuyenDi c ON c.MaChuyenDi=l.MaChuyenDi
            WHERE c.MaNguoiDung=@Owner ORDER BY l.NgayThu
            """, owner);
        return Ok(new { tours, hotels, trips = trips.Select(t => new {
            t.MaChuyenDi, t.TenChuyenDi, t.DiemDen, t.NgayBatDau, t.NgayKetThuc, t.SoNguoi, t.NganSach, t.MoTa,
            days = days.Where(d => d.MaChuyenDi == t.MaChuyenDi).Select(d => new { d.NgayThu, d.TieuDe, d.GhiChu })
        }) });
    }

    [HttpPost("bookings/tours")]
    public async Task<IActionResult> BookTour(TourBookingRequest request)
    {
        if (request.MaKhoiHanh < 1 || request.SoNguoi is < 1 or > 100 || request.GhiChu?.Length > 500)
            return BadRequest(new { message = "Kiểm tra ngày khởi hành, số khách (1–100) và ghi chú (tối đa 500 ký tự)." });
        await using var conn = Connection();
        await conn.OpenAsync();
        await using var tx = await conn.BeginTransactionAsync(IsolationLevel.ReadCommitted);
        var departure = await conn.QuerySingleOrDefaultAsync<TourKhoiHanhResponseDto>(
            "SELECT * FROM TourKhoiHanh WHERE MaKhoiHanh=@MaKhoiHanh FOR UPDATE", request, tx);
        if (departure == null) return NotFound(new { message = "Lịch khởi hành không tồn tại." });
        var active = await conn.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM Tour WHERE MaTour=@MaTour AND TrangThai='Active'", departure, tx);
        if (active == 0 || departure.TrangThai != "OpenForBooking" || departure.NgayKhoiHanh.Date < VietnamToday || departure.GiaApDung < 0)
            return Conflict(new { message = "Lịch khởi hành này hiện không nhận đặt chỗ." });
        if (departure.SoChoToiDa - departure.SoChoDaDat < request.SoNguoi)
            return Conflict(new { message = "Không còn đủ chỗ cho số khách đã chọn. Vui lòng chọn lịch khác." });
        var total = departure.GiaApDung * request.SoNguoi;
        var id = await conn.ExecuteScalarAsync<int>("""
            INSERT INTO DatTour (MaNguoiDung, MaTour, MaKhoiHanh, NgayKhoiHanh, SoNguoi, GiaMoiNguoi, TongTien, TrangThai, GhiChu)
            VALUES (@Owner, @MaTour, @MaKhoiHanh, @NgayKhoiHanh, @SoNguoi, @GiaApDung, @total, 'Pending', @GhiChu);
            SELECT LAST_INSERT_ID();
            """, new { Owner, departure.MaTour, departure.MaKhoiHanh, departure.NgayKhoiHanh, request.SoNguoi, departure.GiaApDung, total, request.GhiChu }, tx);
        await conn.ExecuteAsync("UPDATE TourKhoiHanh SET SoChoDaDat=SoChoDaDat+@SoNguoi WHERE MaKhoiHanh=@MaKhoiHanh", request, tx);
        await tx.CommitAsync();
        return StatusCode(201, new { id, total, status = "Pending" });
    }

    [HttpPost("bookings/hotels")]
    public async Task<IActionResult> BookHotel(RoomBookingRequest request)
    {
        var nights = (request.NgayTraPhong.Date - request.NgayNhanPhong.Date).Days;
        if (request.MaLoaiPhong < 1 || request.NgayNhanPhong.Date < VietnamToday || nights is < 1 or > 30 ||
            request.SoNguoi is < 1 or > 100 || request.SoLuongPhong is < 1 or > 100 || request.GhiChu?.Length > 500)
            return BadRequest(new { message = "Ngày trả phải sau ngày nhận, tối đa 30 đêm. Kiểm tra số phòng, số khách và ghi chú." });
        await using var conn = Connection();
        await conn.OpenAsync();
        await using var tx = await conn.BeginTransactionAsync(IsolationLevel.ReadCommitted);
        var room = await conn.QuerySingleOrDefaultAsync<LoaiPhongDto>("SELECT * FROM LoaiPhong WHERE MaLoaiPhong=@MaLoaiPhong FOR UPDATE", request, tx);
        if (room == null) return NotFound(new { message = "Loại phòng không tồn tại." });
        var active = await conn.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM KhachSan WHERE MaKhachSan=@MaKhachSan AND TrangThai=1", room, tx);
        if (!room.TrangThai || active == 0 || room.GiaMoiDem < 0) return Conflict(new { message = "Loại phòng này hiện không nhận đặt chỗ." });
        if (request.SoNguoi > room.SucChua * request.SoLuongPhong) return BadRequest(new { message = "Số khách vượt quá sức chứa của số phòng đã chọn." });
        // Same room-type lock serializes customer reservations. Count occupancy per night,
        // rather than summing non-overlapping stays across the entire date interval.
        var stays = await conn.QueryAsync<Stay>("""
            SELECT NgayNhanPhong, NgayTraPhong, SoLuongPhong FROM DatPhong
            WHERE MaLoaiPhong=@MaLoaiPhong AND TrangThai IN ('Pending','Confirmed','CheckedIn')
              AND NgayNhanPhong < @NgayTraPhong AND NgayTraPhong > @NgayNhanPhong
            """, request, tx);
        for (var day = request.NgayNhanPhong.Date; day < request.NgayTraPhong.Date; day = day.AddDays(1))
            if (stays.Where(s => s.NgayNhanPhong.Date <= day && s.NgayTraPhong.Date > day).Sum(s => s.SoLuongPhong) + request.SoLuongPhong > room.SoLuongPhong)
                return Conflict(new { message = "Không đủ phòng trong khoảng ngày đã chọn. Vui lòng đổi ngày hoặc giảm số phòng." });
        var total = room.GiaMoiDem * request.SoLuongPhong * nights;
        var id = await conn.ExecuteScalarAsync<int>("""
            INSERT INTO DatPhong (MaNguoiDung, MaLoaiPhong, NgayNhanPhong, NgayTraPhong, SoLuongPhong, SoNguoi, GiaMoiDem, TongTien, TrangThai, GhiChu)
            VALUES (@Owner, @MaLoaiPhong, @NgayNhanPhong, @NgayTraPhong, @SoLuongPhong, @SoNguoi, @GiaMoiDem, @total, 'Pending', @GhiChu);
            SELECT LAST_INSERT_ID();
            """, new { Owner, request.MaLoaiPhong, NgayNhanPhong = request.NgayNhanPhong.Date, NgayTraPhong = request.NgayTraPhong.Date,
                request.SoLuongPhong, request.SoNguoi, room.GiaMoiDem, total, request.GhiChu }, tx);
        await tx.CommitAsync();
        return StatusCode(201, new { id, total, status = "Pending" });
    }

    [HttpPost("itineraries")]
    public async Task<IActionResult> SaveItinerary(ItineraryRequest request)
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
        var start = request.NgayBatDau.Date;
        var id = await conn.ExecuteScalarAsync<int>("""
            INSERT INTO ChuyenDi (MaNguoiDung, TenChuyenDi, DiemKhoiHanh, DiemDen, NgayBatDau, NgayKetThuc, SoNguoi, NganSach, MoTa, TrangThai)
            VALUES (@Owner, @TenChuyenDi, @DiemKhoiHanh, @DiemDen, @start, @end, @SoNguoi, @NganSach, @MoTa, 'Planning');
            SELECT LAST_INSERT_ID();
            """, new { Owner, TenChuyenDi = request.TenChuyenDi.Trim(), DiemKhoiHanh = request.DiemKhoiHanh.Trim(),
                DiemDen = request.DiemDen.Trim(), start, end = start.AddDays(request.Days.Count - 1), request.SoNguoi, request.NganSach, request.MoTa }, tx);
        for (var i = 0; i < request.Days.Count; i++)
            await conn.ExecuteAsync("INSERT INTO LichTrinh (MaChuyenDi, NgayThu, Ngay, TieuDe, GhiChu) VALUES (@id,@number,@date,@title,@note)",
                new { id, number = i + 1, date = start.AddDays(i), title = request.Days[i].TieuDe.Trim(), note = request.Days[i].GhiChu }, tx);
        await tx.CommitAsync();
        return StatusCode(201, new { id });
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
}
