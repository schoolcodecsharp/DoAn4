using Microsoft.AspNetCore.Mvc;
using backend.DTOs;
using backend.Services;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DatTourController : ControllerBase
{
    private readonly IDatTourService _svc;
    public DatTourController(IDatTourService svc) => _svc = svc;

    [HttpGet] public async Task<IActionResult> GetAll() => Ok(await _svc.GetAllAsync());
    [HttpGet("{id}")] public async Task<IActionResult> GetById(int id)
    { var r = await _svc.GetByIdAsync(id); return r == null ? NotFound() : Ok(r); }
    [HttpGet("bynguoidung/{maNguoiDung}")] public async Task<IActionResult> GetByNguoiDung(int maNguoiDung) => Ok(await _svc.GetByNguoiDungAsync(maNguoiDung));
    [HttpPost] public async Task<IActionResult> Create([FromBody] CreateDatTourDto dto)
    { var id = await _svc.CreateAsync(dto); return CreatedAtAction(nameof(GetById), new { id }, new { id }); }
    [HttpPut("{id}")] public async Task<IActionResult> Update(int id, [FromBody] UpdateDatTourDto dto)
    { return await _svc.UpdateAsync(id, dto) ? NoContent() : NotFound(); }
    [HttpDelete("{id}")] public async Task<IActionResult> Delete(int id)
    { return await _svc.DeleteAsync(id) ? NoContent() : NotFound(); }
}