using backend.Security;

namespace backend.Services;

public static class BookingRules
{
    public static DateTime Today => DateTime.UtcNow.AddHours(7).Date;
    public static void Transition(string current, string next, bool room)
    {
        var states = room
            ? new[] { "Pending", "Confirmed", "CheckedIn", "CheckedOut", "Cancelled" }
            : new[] { "Pending", "Confirmed", "Completed", "Cancelled" };
        if (!states.Contains(next)) throw new RequestRuleException("Trạng thái đơn không hợp lệ.");
        if (current == next) return;
        var allowed = current switch {
            "Pending" => next is "Confirmed" or "Cancelled",
            "Confirmed" => next == "Cancelled" || next == (room ? "CheckedIn" : "Completed"),
            "CheckedIn" when room => next == "CheckedOut",
            _ => false
        };
        if (!allowed) throw new RequestRuleException("Không thể chuyển trạng thái này. Đơn đã kết thúc không được mở lại; vui lòng tạo đơn mới.",409);
    }
    public static void Note(string? note)
    {
        if (note?.Length > 500) throw new RequestRuleException("Ghi chú tối đa 500 ký tự.");
    }
}
