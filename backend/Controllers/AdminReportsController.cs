using System.Data;
using Dapper;
using Microsoft.AspNetCore.Mvc;
using MySqlConnector;

namespace backend.Controllers;

[ApiController]
[Route("api/admin")]
public sealed class AdminReportsController(IConfiguration config) : ControllerBase
{
    private MySqlConnection Connection()=>new(config.GetConnectionString("DefaultConnection"));
    [HttpGet("dashboard")]
    public async Task<IActionResult> Dashboard() {
        await using var db=Connection(); await db.OpenAsync();
        await using var tx=await db.BeginTransactionAsync(IsolationLevel.RepeatableRead);
        var summary=await db.QuerySingleAsync("""
            SELECT
            (SELECT COALESCE(SUM(SoTien),0) FROM ThanhToan WHERE TrangThai='ThanhCong') AS receivedRevenue,
            (SELECT COUNT(*) FROM DatTour) AS tourOrders,
            (SELECT COUNT(*) FROM DatPhong) AS roomOrders,
            (SELECT COUNT(*) FROM DatTour WHERE TrangThai='Pending')+(SELECT COUNT(*) FROM DatPhong WHERE TrangThai='Pending') AS pendingOrders,
            (SELECT COUNT(*) FROM DatTour WHERE TrangThai='Cancelled')+(SELECT COUNT(*) FROM DatPhong WHERE TrangThai='Cancelled') AS cancelledOrders,
            (SELECT COUNT(*) FROM Tour WHERE TrangThai='Active') AS activeTours
            """,transaction:tx);
        var topTours=await db.QueryAsync("""
            SELECT t.MaTour AS id,t.TenTour AS name,COUNT(d.MaDatTour) AS orders,COALESCE(SUM(d.SoNguoi),0) AS guests
            FROM Tour t JOIN DatTour d ON d.MaTour=t.MaTour AND d.TrangThai<>'Cancelled'
            GROUP BY t.MaTour,t.TenTour ORDER BY guests DESC,orders DESC,t.MaTour LIMIT 5
            """,transaction:tx);
        var monthly=await db.QueryAsync("""
            SELECT DATE_FORMAT(NgayThanhToan,'%Y-%m') AS month,SUM(SoTien) AS revenue
            FROM ThanhToan WHERE TrangThai='ThanhCong' AND NgayThanhToan IS NOT NULL
            GROUP BY DATE_FORMAT(NgayThanhToan,'%Y-%m') ORDER BY month DESC LIMIT 12
            """,transaction:tx);
        await tx.CommitAsync();
        return Ok(new {summary,topTours,monthly,definition="Tiền đã thu = tổng giao dịch ThanhCong; không gồm đơn chờ thanh toán. Không phải lợi nhuận hoặc doanh thu thuần sau hoàn tiền."});
    }
    [HttpGet("audit")]
    public async Task<IActionResult> Audit(int page=1,int pageSize=20) {
        if(page<1 || page>100000 || pageSize<1 || pageSize>100) return BadRequest(new{message="Phân trang không hợp lệ."});
        await using var db=Connection();
        var total=await db.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM NhatKyAdmin");
        var items=await db.QueryAsync("""
            SELECT MaNhatKy AS id,MaNguoiDung AS actorId,HanhDong AS method,DoiTuong AS entity,
              MaDoiTuong AS entityId,KetQua AS outcome,HttpStatus AS status,ThoiGian AS createdAt,TraceId AS traceId
            FROM NhatKyAdmin ORDER BY MaNhatKy DESC LIMIT @pageSize OFFSET @offset
            """,new{pageSize,offset=(page-1)*pageSize});
        return Ok(new {items,total,page,pageSize});
    }
}
