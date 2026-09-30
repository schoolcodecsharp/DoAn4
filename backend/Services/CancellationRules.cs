using backend.Security;
using Dapper;
using MySqlConnector;

namespace backend.Services;

public class CancellationRecord
{
    public string? YeuCauHuy { get; set; }
    public string? LyDoHuy { get; set; }
    public string? PhanHoiHuy { get; set; }
    public DateTime? NgayYeuCauHuy { get; set; }
}

public class CancellationDecision
{
    public string? CancellationDecisionStatus { get; set; }
    public string? CancellationReply { get; set; }
}

public static class CancellationRules
{
    // Called while holding the reservation lock. Approval and inventory release share one transaction.
    public static async Task<string> Decide(MySqlConnection db, MySqlTransaction tx, bool room, int id,
        CancellationRecord record, CancellationDecision decision, string current, string next, DateTime start)
    {
        var action = decision.CancellationDecisionStatus;
        if (action != null && action is not ("Approved" or "Rejected")) throw new RequestRuleException("Quyết định hủy không hợp lệ.");
        if (action != null && record.YeuCauHuy != "Pending") throw new RequestRuleException("Yêu cầu hủy không còn chờ xử lý. Hãy tải lại danh sách.", 409);
        if (decision.CancellationReply?.Length > 1000) throw new RequestRuleException("Phản hồi tối đa 1.000 ký tự.");
        if (action == "Rejected" && string.IsNullOrWhiteSpace(decision.CancellationReply)) throw new RequestRuleException("Nhập lý do từ chối yêu cầu hủy.");
        if (action == "Rejected" && next != current) throw new RequestRuleException("Không đổi trạng thái đơn cùng lúc với từ chối yêu cầu hủy.");
        if (action == "Approved") next = "Cancelled";
        if (record.YeuCauHuy == "Pending" && next != current && next != "Cancelled")
            throw new RequestRuleException("Hãy xử lý yêu cầu hủy trước khi chuyển trạng thái đơn.", 409);
        if (record.YeuCauHuy == "Pending" && next == "Cancelled")
        {
            if (current is not ("Pending" or "Confirmed") || start.Date <= BookingRules.Today)
                throw new RequestRuleException("Đã đến ngày sử dụng dịch vụ hoặc đơn không còn được hủy. Hãy từ chối yêu cầu và phản hồi khách.", 409);
            action = "Approved";
        }
        if (action != null)
        {
            var table = room ? "DatPhong" : "DatTour";
            var key = room ? "MaDatPhong" : "MaDatTour";
            await db.ExecuteAsync($"UPDATE {table} SET YeuCauHuy=@action,PhanHoiHuy=@reply WHERE {key}=@id",
                new { id, action, reply = decision.CancellationReply?.Trim() }, tx);
        }
        return next;
    }
}
