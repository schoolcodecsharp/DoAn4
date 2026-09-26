using System.Security.Claims;
using Dapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using MySqlConnector;

namespace backend.Security;

// Record attempts before execution. No request bodies, passwords, tokens or email.
// A Started row means interrupted/unconfirmed, not a successful business change.
public sealed class AdminAuditFilter(IConfiguration config, ILogger<AdminAuditFilter> logger) : IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var http=context.HttpContext;
        var controller=context.RouteData.Values["controller"]?.ToString()??"";
        if(!http.User.IsInRole("1") || HttpMethods.IsGet(http.Request.Method) || controller is "Auth" or "Account") { await next(); return; }
        await using var db=new MySqlConnection(config.GetConnectionString("DefaultConnection"));
        var id=await db.ExecuteScalarAsync<long>("""
            INSERT INTO NhatKyAdmin(MaNguoiDung,HanhDong,DoiTuong,MaDoiTuong,TraceId)
            VALUES(@actor,@method,@controller,@target,@trace); SELECT LAST_INSERT_ID();
            """,new {actor=int.Parse(http.User.FindFirstValue(ClaimTypes.NameIdentifier)!),method=http.Request.Method,controller,
                target=context.RouteData.Values["id"]?.ToString(),trace=http.TraceIdentifier});
        var status=500;
        try {
            if(HttpMethods.IsDelete(http.Request.Method) && controller is "NguoiDung" or "ThanhToan") {
                context.Result=new ConflictObjectResult(new {message="Không xóa tài khoản hoặc giao dịch thanh toán. Giữ lại lịch sử và cập nhật trạng thái phù hợp."});
                status=409;
            } else {
                var result=await next();
                status=result.Exception is RequestRuleException rule ? rule.Status :
                    result.Exception is MySqlException mysql && mysql.Number is 1062 or 1451 or 1452 ? 409 :
                    result.Exception!=null && !result.ExceptionHandled ? 500 :
                    (result.Result as Microsoft.AspNetCore.Mvc.Infrastructure.IStatusCodeActionResult)?.StatusCode??200;
            }
        }
        finally {
            // Never report a committed mutation as failed merely because outcome logging failed.
            try { await db.ExecuteAsync("UPDATE NhatKyAdmin SET HttpStatus=@status,KetQua=@outcome WHERE MaNhatKy=@id",
                new{status,outcome=status<400?"Succeeded":"Rejected",id}); }
            catch(Exception ex) { logger.LogError(ex,"Audit outcome could not be saved for {AuditId}; attempt remains Started",id); }
        }
    }
}
