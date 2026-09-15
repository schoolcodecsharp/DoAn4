using System.Threading.Tasks;
using backend.DTOs;
using backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DatPhongController : ControllerBase
    {
        private readonly IDatPhongService _service;

        public DatPhongController(IDatPhongService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = await _service.GetAllAsync();
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var result = await _service.GetByIdAsync(id);
            if (result == null) return NotFound();
            return Ok(result);
        }

        [HttpGet("bynguoidung/{maNguoiDung}")]
        public async Task<IActionResult> GetByNguoiDung(int maNguoiDung)
        {
            var result = await _service.GetByNguoiDungAsync(maNguoiDung);
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Create(CreateDatPhongDto dto)
        {
            var result = await _service.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = result.MaDatPhong }, result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, UpdateDatPhongDto dto)
        {
            var success = await _service.UpdateAsync(id, dto);
            if (!success) return NotFound();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var success = await _service.DeleteAsync(id);
            if (!success) return NotFound();
            return NoContent();
        }
    }
}
