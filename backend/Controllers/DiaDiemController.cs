using backend.DTOs;
using backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DiaDiemController : ControllerBase
    {
        private readonly IDiaDiemService _service;

        public DiaDiemController(IDiaDiemService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? tinh, [FromQuery] int? loai, [FromQuery] string? keyword)
        {
            if (!string.IsNullOrEmpty(tinh) || loai.HasValue || !string.IsNullOrEmpty(keyword))
            {
                var filtered = await _service.GetByFilterAsync(tinh, loai, keyword);
                return Ok(filtered);
            }
            
            var all = await _service.GetAllAsync();
            return Ok(all);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var item = await _service.GetByIdAsync(id);
            if (item == null) return NotFound();
            return Ok(item);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateDiaDiemDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var id = await _service.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = id }, dto);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateDiaDiemDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var success = await _service.UpdateAsync(id, dto);
            if (!success) return NotFound();
            return Ok();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var success = await _service.DeleteAsync(id);
            if (!success) return NotFound();
            return Ok();
        }
    }
}
