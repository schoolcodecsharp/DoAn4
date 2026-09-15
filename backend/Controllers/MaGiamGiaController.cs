using Microsoft.AspNetCore.Mvc;
using backend.DTOs;
using backend.Services;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MaGiamGiaController : ControllerBase
{
    private readonly IMaGiamGiaService _svc;
    public MaGiamGiaController(IMaGiamGiaService svc) => _svc = svc;

    [HttpGet] public async Task<IActionResult> GetAll() => Ok(await _svc.GetAllAsync());
    [HttpGet("{id}")] public async Task<IActionResult> GetById(int id)
    { var r = await _svc.GetByIdAsync(id); return r == null ? NotFound() : Ok(r); }
    [HttpGet("bycode/{code}")] public async Task<IActionResult> GetByCode(string code)
    { var r = await _svc.GetByCodeAsync(code); return r == null ? NotFound() : Ok(r); }

    [HttpPost("validate")]
    public async Task<IActionResult> Validate([FromBody] ValidateMaGiamGiaDto dto)
    {
        var ma = await _svc.GetByCodeAsync(dto.Code);
        if (ma == null || !ma.TrangThai) return NotFound(new { message = "Ma giam gia khong ton tai hoac da vo hieu hoa" });
        if (ma.NgayKetThuc < DateTime.Now) return BadRequest(new { message = "Ma giam gia da het han" });
        if (ma.SoLuong > 0 && ma.SoLuongDaDung >= ma.SoLuong) return BadRequest(new { message = "Ma giam gia da het luot su dung" });
        if (dto.TongTien < ma.DonHangToiThieu) return BadRequest(new { message = $"Don hang toi thieu la {ma.DonHangToiThieu}" });

        decimal tienGiam = ma.LoaiGiam == "PhanTram"
            ? Math.Min(dto.TongTien * ma.GiaTriGiam / 100, ma.GiamToiDa ?? decimal.MaxValue)
            : ma.GiaTriGiam;

        return Ok(new { maGiamGia = ma, tienGiam, tongTienSauGiam = dto.TongTien - tienGiam });
    }

    [HttpPost] public async Task<IActionResult> Create([FromBody] CreateMaGiamGiaDto dto)
    { var id = await _svc.CreateAsync(dto); return CreatedAtAction(nameof(GetById), new { id }, new { id }); }
    [HttpPut("{id}")] public async Task<IActionResult> Update(int id, [FromBody] UpdateMaGiamGiaDto dto)
    { return await _svc.UpdateAsync(id, dto) ? NoContent() : NotFound(); }
    [HttpDelete("{id}")] public async Task<IActionResult> Delete(int id)
    { return await _svc.DeleteAsync(id) ? NoContent() : NotFound(); }
}