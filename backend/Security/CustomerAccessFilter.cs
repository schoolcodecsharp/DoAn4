using System.Security.Claims;
using backend.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace backend.Security;

// Catalog reads remain public. Legacy CRUD endpoints are administration-only;
// customers use /account endpoints, whose queries are scoped to the JWT owner.
public sealed class CustomerAccessFilter(INguoiDungRepository users) : IAsyncAuthorizationFilter
{
    private static readonly HashSet<string> PublicCatalogs = new(StringComparer.OrdinalIgnoreCase)
    {
        "Tour", "TourKhoiHanh", "TourChiTiet", "KhachSan", "LoaiPhong", "DiaDiem", "LoaiDiaDiem", "NhaHang", "HinhAnh"
    };

    public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
    {
        var controller = context.RouteData.Values["controller"]?.ToString() ?? "";
        var action = context.RouteData.Values["action"]?.ToString() ?? "";
        if (controller.Equals("Auth", StringComparison.OrdinalIgnoreCase) && (action is "Login" or "Register")) return;
        if (HttpMethods.IsGet(context.HttpContext.Request.Method) && PublicCatalogs.Contains(controller))
        {
            var reader = context.HttpContext.User;
            if (reader.IsInRole("1") && int.TryParse(reader.FindFirstValue(ClaimTypes.NameIdentifier), out var readerId))
            {
                var account = await users.GetByIdAsync(readerId);
                context.HttpContext.Items["CatalogAdmin"] = account is { TrangThai: true, MaVaiTro: 1 };
            }
            return;
        }
        var principal = context.HttpContext.User;
        if (principal.Identity?.IsAuthenticated != true || !int.TryParse(principal.FindFirstValue(ClaimTypes.NameIdentifier), out var id))
        { context.Result = new UnauthorizedObjectResult(new { message = "Vui lòng đăng nhập để tiếp tục." }); return; }
        var user = await users.GetByIdAsync(id);
        if (user == null || !user.TrangThai)
        { context.Result = new UnauthorizedObjectResult(new { message = "Tài khoản không còn hoạt động. Vui lòng đăng nhập lại." }); return; }
        if (controller.Equals("Account", StringComparison.OrdinalIgnoreCase) || (controller.Equals("Auth", StringComparison.OrdinalIgnoreCase) && action == "Me")) return;
        if (!principal.IsInRole("1") || user.MaVaiTro != 1) context.Result = new ForbidResult();
    }
}
