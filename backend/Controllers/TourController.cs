using System.Threading.Tasks;
using backend.DTOs;
using backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TourController : ControllerBase
    {
        private readonly ITourService _service;

        public TourController(ITourService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? tinh = null, [FromQuery] string? keyword = null, [FromQuery] string? trangthai = null)
        {
            if (!string.IsNullOrEmpty(tinh) || !string.IsNullOrEmpty(keyword) || !string.IsNullOrEmpty(trangthai))
            {
                var filteredResult = await _service.GetFilteredToursAsync(tinh, keyword, trangthai);
                return Ok(filteredResult);
            }
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

        [HttpPost]
        public async Task<IActionResult> Create(CreateTourDto dto)
        {
            var result = await _service.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = result.MaTour }, result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, UpdateTourDto dto)
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
