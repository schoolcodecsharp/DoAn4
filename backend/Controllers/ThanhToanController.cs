using Microsoft.AspNetCore.Mvc;
using backend.DTOs;
using backend.Services;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ThanhToanController : ControllerBase
{
    private readonly IThanhToanService _svc;
    public ThanhToanController(IThanhToanService svc) => _svc = svc;

    [HttpGet] public async Task<IActionResult> GetAll() => Ok(await _svc.GetAllAsync());
    [HttpGet("{id}")] public async Task<IActionResult> GetById(int id)
    { var r = await _svc.GetByIdAsync(id); return r == null ? NotFound() : Ok(r); }
    [HttpGet("bydattour/{maDatTour}")] public async Task<IActionResult> GetByDatTour(int maDatTour) => Ok(await _svc.GetByDatTourAsync(maDatTour));
    [HttpGet("bydatphong/{maDatPhong}")] public async Task<IActionResult> GetByDatPhong(int maDatPhong) => Ok(await _svc.GetByDatPhongAsync(maDatPhong));
    [HttpPost] public async Task<IActionResult> Create([FromBody] CreateThanhToanDto dto)
    { var id = await _svc.CreateAsync(dto); return CreatedAtAction(nameof(GetById), new { id }, new { id }); }
    [HttpPut("{id}")] public async Task<IActionResult> Update(int id, [FromBody] UpdateThanhToanDto dto)
    { return await _svc.UpdateAsync(id, dto) ? NoContent() : NotFound(); }
    [HttpDelete("{id}")] public async Task<IActionResult> Delete(int id)
    { return await _svc.DeleteAsync(id) ? NoContent() : NotFound(); }
}