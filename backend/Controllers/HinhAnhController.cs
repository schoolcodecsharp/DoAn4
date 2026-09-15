using Microsoft.AspNetCore.Mvc;
using backend.DTOs;
using backend.Services;
using Dapper;
using MySqlConnector;
using System.Text.RegularExpressions;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HinhAnhController : ControllerBase
{
    private readonly IHinhAnhService _svc;
    private readonly IConfiguration _config;
    private readonly IWebHostEnvironment _env;
    private static readonly Dictionary<string, string> Owners = new(StringComparer.OrdinalIgnoreCase)
    { ["Tour"]="MaTour", ["DiaDiem"]="MaDiaDiem", ["KhachSan"]="MaKhachSan", ["NhaHang"]="MaNhaHang", ["LoaiPhong"]="MaLoaiPhong" };
    public HinhAnhController(IHinhAnhService svc, IConfiguration config, IWebHostEnvironment env)
    { _svc = svc; _config = config; _env = env; }

    [HttpGet] public async Task<IActionResult> GetAll() => Ok(await _svc.GetAllAsync());
    [HttpGet("{id:int}")] public async Task<IActionResult> GetById(int id)
    { var r = await _svc.GetByIdAsync(id); return r == null ? NotFound() : Ok(r); }
    [HttpGet("{loai}/{maDoiTuong:int}")] public async Task<IActionResult> GetByDoiTuong(string loai, int maDoiTuong)
        => Owners.ContainsKey(loai) && maDoiTuong > 0 ? Ok(await _svc.GetByDoiTuongAsync(loai, maDoiTuong)) : BadRequest(new { message = "Loại hoặc mã đối tượng ảnh không hợp lệ." });
    [HttpPost] public async Task<IActionResult> Create([FromBody] CreateHinhAnhDto dto)
    {
        var error = await Validate(dto.LoaiDoiTuong, dto.MaDoiTuong, dto.DuongDan);
        if (error != null || !ValidMetadata(dto.MoTa,dto.Nguon,dto.TacGia,dto.GiayPhep,dto.UrlGiayPhep) || dto.ThuTu < 0)
            return BadRequest(new { message = error ?? "Thông tin nguồn ảnh hoặc thứ tự không hợp lệ." });
        dto.LoaiDoiTuong = Owners.Keys.Single(k => k.Equals(dto.LoaiDoiTuong, StringComparison.OrdinalIgnoreCase));
        var id = await _svc.CreateAsync(dto); return CreatedAtAction(nameof(GetById), new { id }, new { id });
    }
    [HttpPut("{id}")] public async Task<IActionResult> Update(int id, [FromBody] UpdateHinhAnhDto dto)
    {
        var photo = await _svc.GetByIdAsync(id);
        if (photo == null) return NotFound();
        var error = await Validate(photo.LoaiDoiTuong, photo.MaDoiTuong, dto.DuongDan ?? photo.DuongDan);
        if (error != null || !ValidMetadata(dto.MoTa,dto.Nguon,dto.TacGia,dto.GiayPhep,dto.UrlGiayPhep) || dto.ThuTu < 0)
            return BadRequest(new { message = error ?? "Thông tin nguồn ảnh hoặc thứ tự không hợp lệ." });
        return await _svc.UpdateAsync(id, dto) ? NoContent() : NotFound();
    }
    [HttpDelete("{id}")] public async Task<IActionResult> Delete(int id)
    { return await _svc.DeleteAsync(id) ? NoContent() : NotFound(); }

    private async Task<string?> Validate(string type, int ownerId, string path)
    {
        if (!Owners.TryGetValue(type, out var key) || ownerId < 1) return "Loại hoặc mã đối tượng ảnh không hợp lệ.";
        if (path.Length > 500 || !Regex.IsMatch(path, @"^/media/[a-zA-Z0-9/_-]+\.(jpg|jpeg|png|webp)$", RegexOptions.IgnoreCase))
            return "Ảnh phải là đường dẫn nội bộ /media/... với định dạng JPG, PNG hoặc WebP.";
        var file = Path.GetFullPath(Path.Combine(_env.WebRootPath, path.TrimStart('/')));
        var mediaRoot = Path.GetFullPath(Path.Combine(_env.WebRootPath, "media")) + Path.DirectorySeparatorChar;
        if (!file.StartsWith(mediaRoot, StringComparison.OrdinalIgnoreCase) || !System.IO.File.Exists(file)) return "File ảnh chưa tồn tại trên máy chủ.";
        var table = Owners.Keys.Single(k => k.Equals(type, StringComparison.OrdinalIgnoreCase));
        await using var conn = new MySqlConnection(_config.GetConnectionString("DefaultConnection"));
        return await conn.ExecuteScalarAsync<int>($"SELECT COUNT(*) FROM {table} WHERE {key}=@ownerId", new { ownerId }) == 1 ? null : "Đối tượng cần gắn ảnh không tồn tại.";
    }
    private static bool ValidMetadata(string? caption, string? source, string? author, string? license, string? licenseUrl)
    {
        static bool Link(string? value, int max) => string.IsNullOrEmpty(value) || (value.Length <= max && Uri.TryCreate(value, UriKind.Absolute, out var uri) && uri.Scheme == "https");
        return (caption?.Length ?? 0) <= 255 && (author?.Length ?? 0) <= 10000 && (license?.Length ?? 0) <= 100 && Link(source,1000) && Link(licenseUrl,500);
    }
}
