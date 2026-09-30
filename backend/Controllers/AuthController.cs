using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using backend.Data;
using backend.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Authorization;
using System.ComponentModel.DataAnnotations;
using MySqlConnector;

namespace backend.Controllers
{
    [Route("api/auth")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly INguoiDungRepository _users;
        private readonly IConfiguration _config;

        public AuthController(INguoiDungRepository users, IConfiguration config)
        {
            _users = users;
            _config = config;
        }

        [HttpPost("login")]
        [Microsoft.AspNetCore.RateLimiting.EnableRateLimiting("auth")]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.MatKhau))
                return BadRequest(new { message = "Email và mật khẩu là bắt buộc." });

            var account = await _users.GetCredentialsByEmailAsync(request.Email.Trim());
            if (account == null || !account.TrangThai || !PasswordMatches(request.MatKhau, account.MatKhau))
                return Unauthorized(new { message = "Email hoặc mật khẩu không đúng." });

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, account.MaNguoiDung.ToString()),
                new Claim(ClaimTypes.Email, account.Email),
                new Claim(ClaimTypes.Role, account.MaVaiTro.ToString())
            };
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Secret"]!));
            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"], audience: _config["Jwt:Audience"], claims: claims,
                expires: DateTime.UtcNow.AddHours(8), signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));

            var user = new NguoiDungResponseDto
            {
                MaNguoiDung = account.MaNguoiDung, MaVaiTro = account.MaVaiTro, HoTen = account.HoTen,
                Email = account.Email, SoDienThoai = account.SoDienThoai, AnhDaiDien = account.AnhDaiDien,
                NgaySinh = account.NgaySinh, GioiTinh = account.GioiTinh, NgayTao = account.NgayTao,
                NgayCapNhat = account.NgayCapNhat, TrangThai = account.TrangThai
            };
            return Ok(new { token = new JwtSecurityTokenHandler().WriteToken(token), user });
        }

        // Old plaintext seed passwords are not accepted as credentials and must be reset.
        private static bool PasswordMatches(string password, string hash)
        {
            if (Encoding.UTF8.GetByteCount(password) > 72 || string.IsNullOrEmpty(hash) || !hash.StartsWith("$2")) return false;
            try { return BCrypt.Net.BCrypt.Verify(password, hash); }
            catch (BCrypt.Net.SaltParseException) { return false; }
            catch (ArgumentException) { return false; }
        }

        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> Me()
        {
            if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id)) return Unauthorized();
            var user = await _users.GetByIdAsync(id);
            return user is { TrangThai: true } ? Ok(user) : Unauthorized();
        }

        [HttpPost("register")]
        [Microsoft.AspNetCore.RateLimiting.EnableRateLimiting("auth")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.HoTen) || request.HoTen.Trim().Length > 100 ||
                string.IsNullOrWhiteSpace(request.Email) || request.Email.Length > 150 || !new EmailAddressAttribute().IsValid(request.Email.Trim()) ||
                string.IsNullOrEmpty(request.MatKhau) || request.MatKhau.Length < 8 || Encoding.UTF8.GetByteCount(request.MatKhau) > 72)
                return BadRequest(new { message = "Nhập họ tên, email hợp lệ và mật khẩu từ 8 ký tự (không quá 72 byte)." });
            if (!string.IsNullOrEmpty(request.SoDienThoai) && !System.Text.RegularExpressions.Regex.IsMatch(request.SoDienThoai, @"^(0|\+84)\d{9,10}$"))
                return BadRequest(new { message = "Số điện thoại chưa hợp lệ." });
            var email = request.Email.Trim().ToLowerInvariant();
            if (await _users.GetByEmailAsync(email) != null) return Conflict(new { message = "Email đã được sử dụng. Vui lòng đăng nhập hoặc chọn email khác." });
            try
            {
                var id = await _users.CreateAsync(new CreateNguoiDungDto { HoTen = request.HoTen.Trim(), Email = email,
                    MatKhau = request.MatKhau, SoDienThoai = request.SoDienThoai, MaVaiTro = 2, TrangThai = true });
                return StatusCode(201, new { id, message = "Tạo tài khoản thành công." });
            }
            catch (MySqlException ex) when (ex.Number == 1062)
            { return Conflict(new { message = "Email đã được sử dụng." }); }
        }
    }

    public sealed class RegisterRequest
    {
        public string HoTen { get; set; } = "";
        public string Email { get; set; } = "";
        public string MatKhau { get; set; } = "";
        public string? SoDienThoai { get; set; }
    }
}
