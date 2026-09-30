using Dapper;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

public sealed partial class AccountController
{
    [HttpPost("bookings/{kind}/{id:int}/cancellation")]
    public async Task<IActionResult> RequestCancellation(string kind, int id, CancellationRequest request)
    {
        if (kind is not ("tours" or "hotels")) return NotFound();
        if (string.IsNullOrWhiteSpace(request.Reason) || request.Reason.Trim().Length > 1000)
            return BadRequest(new { message = "Nhập lý do hủy, tối đa 1.000 ký tự." });
        var table = kind == "tours" ? "DatTour" : "DatPhong";
        var key = kind == "tours" ? "MaDatTour" : "MaDatPhong";
        var date = kind == "tours" ? "NgayKhoiHanh" : "NgayNhanPhong";
        await using var db = Connection(); await db.OpenAsync();
        await using var tx = await db.BeginTransactionAsync(System.Data.IsolationLevel.ReadCommitted);
        var booking = await db.QuerySingleOrDefaultAsync<CancellableBooking>($"SELECT TrangThai AS Status,YeuCauHuy AS RequestStatus,{date} AS Start FROM {table} WHERE {key}=@id AND MaNguoiDung=@Owner FOR UPDATE", new { id, Owner }, tx);
        if (booking == null) return NotFound(new { message = "Không tìm thấy đơn của bạn." });
        if (booking.RequestStatus != null) return Conflict(new { message = "Đơn này đã gửi yêu cầu hủy. Bạn có thể xem phản hồi trong tài khoản." });
        if (booking.Status is not ("Pending" or "Confirmed") || booking.Start.Date <= VietnamToday)
            return Conflict(new { message = "Chỉ gửi yêu cầu hủy đơn chờ/đã xác nhận trước ngày sử dụng dịch vụ." });
        await db.ExecuteAsync($"UPDATE {table} SET YeuCauHuy='Pending',LyDoHuy=@reason,NgayYeuCauHuy=UTC_TIMESTAMP() WHERE {key}=@id", new { id, reason = request.Reason.Trim() }, tx);
        await tx.CommitAsync();
        return Ok(new { message = "Đã gửi yêu cầu hủy. Đơn vẫn giữ chỗ cho đến khi admin duyệt; hệ thống không tự hoàn tiền." });
    }
    private sealed class CancellableBooking { public string Status { get; set; } = ""; public string? RequestStatus { get; set; } public DateTime Start { get; set; } }
}
public sealed class CancellationRequest { public string Reason { get; set; } = ""; }
