using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using backend.DTOs;
using backend.Services;
using System.Security.Claims;
using System.ComponentModel.DataAnnotations;

namespace backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class NguoiDungController : ControllerBase
    {
        private readonly INguoiDungService _service;

        public NguoiDungController(INguoiDungService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var data = await _service.GetAllAsync();
            return Ok(data);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var data = await _service.GetByIdAsync(id);
            if (data == null) return NotFound();
            return Ok(data);
        }

        [HttpGet("email/{email}")]
        public async Task<IActionResult> GetByEmail(string email)
        {
            var data = await _service.GetByEmailAsync(email);
            if (data == null) return NotFound();
            return Ok(data);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateNguoiDungDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.HoTen) || !new EmailAddressAttribute().IsValid(dto.Email) ||
                string.IsNullOrEmpty(dto.MatKhau) || dto.MatKhau.Length < 8 || System.Text.Encoding.UTF8.GetByteCount(dto.MatKhau) > 72 || dto.MaVaiTro is not (1 or 2))
                return BadRequest(new { message = "Nhập họ tên, email, vai trò hợp lệ và mật khẩu từ 8 ký tự (tối đa 72 byte)." });
            var id = await _service.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = id }, new { id = id });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateNguoiDungDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.HoTen) || !new EmailAddressAttribute().IsValid(dto.Email) || dto.MaVaiTro is not (1 or 2))
                return BadRequest(new { message = "Họ tên, email hoặc vai trò không hợp lệ." });
            if (User.FindFirstValue(ClaimTypes.NameIdentifier) == id.ToString() && (!dto.TrangThai || dto.MaVaiTro != 1))
                return BadRequest(new { message = "Không thể tự khóa hoặc hạ quyền tài khoản đang đăng nhập." });
            var success = await _service.UpdateAsync(id, dto);
            if (!success) return NotFound();
            return Ok(new { message = "Cập nhật thành công" });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            if (User.FindFirstValue(ClaimTypes.NameIdentifier) == id.ToString())
                return BadRequest(new { message = "Không thể xóa tài khoản đang đăng nhập." });
            var success = await _service.DeleteAsync(id);
            if (!success) return NotFound();
            return Ok(new { message = "Xóa thành công" });
        }
    }
}
