using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using MySqlConnector;

namespace backend.Security;

public sealed class DatabaseErrorFilter : IExceptionFilter
{
    public void OnException(ExceptionContext context)
    {
        if (context.Exception is RequestRuleException rule) {
            context.Result = new ObjectResult(new { message = rule.Message }) { StatusCode = rule.Status };
            context.ExceptionHandled = true; return;
        }
        if (context.Exception is not MySqlException ex) return;
        string? message = ex.Number switch
        {
            1062 => "Dữ liệu đã tồn tại (email, tên hoặc ngày khởi hành bị trùng).",
            1451 => "Bản ghi đang được sử dụng bởi lịch trình hoặc đơn đặt. Hãy chuyển sang trạng thái ngừng hoạt động thay vì xóa.",
            1452 => "Dữ liệu liên kết không còn tồn tại. Vui lòng tải lại danh sách và chọn lại.",
            3819 or 1048 or 1265 or 1406 => "Dữ liệu không phù hợp ràng buộc CSDL. Kiểm tra giá trị và độ dài các trường.",
            _ => null
        };
        if (message == null) return;
        context.Result = new ConflictObjectResult(new { message });
        context.ExceptionHandled = true;
    }
}
