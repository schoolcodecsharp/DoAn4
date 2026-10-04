using Dapper;
using Microsoft.AspNetCore.Mvc;
using MySqlConnector;

namespace backend.Controllers;

// Public inventory summary, not a reservation or an external-hotel availability promise.
[ApiController]
[Route("api/catalog-availability")]
public sealed class CatalogAvailabilityController(IConfiguration config) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        await using var db = new MySqlConnection(config.GetConnectionString("DefaultConnection"));
        var today = DateTime.UtcNow.AddHours(7).Date;
        var tours = await db.QueryAsync<int>("""
            SELECT DISTINCT t.MaTour FROM Tour t JOIN TourKhoiHanh d ON d.MaTour=t.MaTour
            WHERE t.TrangThai='Active' AND d.TrangThai='OpenForBooking' AND d.NgayKhoiHanh>=@today
              AND d.SoChoToiDa>d.SoChoDaDat
            """, new { today });
        var hotels = await db.QueryAsync<int>("""
            SELECT DISTINCT h.MaKhachSan FROM KhachSan h JOIN LoaiPhong r ON r.MaKhachSan=h.MaKhachSan
            WHERE h.TrangThai=1 AND r.TrangThai=1 AND r.SoLuongPhong>0
            """);
        return Ok(new { tours, hotels, checkedAt = DateTime.UtcNow });
    }
}
