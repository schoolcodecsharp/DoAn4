using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using backend.DTOs;
using backend.Services;

namespace backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ThanhVienChuyenDiController : ControllerBase
    {
        private readonly IThanhVienChuyenDiService _service;

        public ThanhVienChuyenDiController(IThanhVienChuyenDiService service)
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

        [HttpGet("bychuyendi/{maChuyenDi}")]
        public async Task<IActionResult> GetByChuyenDi(int maChuyenDi)
        {
            var result = await _service.GetByChuyenDiAsync(maChuyenDi);
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateThanhVienChuyenDiDto dto)
        {
            var result = await _service.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = result.MaThanhVien }, result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateThanhVienChuyenDiDto dto)
        {
            var updated = await _service.UpdateAsync(id, dto);
            if (!updated) return NotFound();
            return Ok(new { message = "Cập nhật thành công" });
        }

        [HttpPut("{id}/trangthai")]
        public async Task<IActionResult> UpdateTrangThai(int id, [FromBody] string trangThai)
        {
            var updated = await _service.UpdateTrangThaiAsync(id, trangThai);
            if (!updated) return NotFound();
            return Ok(new { message = "Cập nhật trạng thái thành công" });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var deleted = await _service.DeleteAsync(id);
            if (!deleted) return NotFound();
            return Ok(new { message = "Xóa thành công" });
        }
    }
}
