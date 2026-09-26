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

    // Admin authorization is enforced by CustomerAccessFilter, including this upload.
    [HttpPost("upload")]
    [RequestSizeLimit(9 * 1024 * 1024)]
    public async Task<IActionResult> Upload(IFormFile file, [FromForm] string loaiDoiTuong,
        [FromForm] int maDoiTuong, [FromForm] string? moTa, [FromForm] int thuTu = 0)
    {
        if (!Owners.TryGetValue(loaiDoiTuong, out var ownerColumn) || maDoiTuong < 1 || thuTu < 0 || (moTa?.Length ?? 0) > 255)
            return BadRequest(new { message = "Đối tượng, mô tả hoặc thứ tự ảnh không hợp lệ." });
        if (file.Length == 0 || file.Length > 8 * 1024 * 1024)
            return BadRequest(new { message = "Mỗi ảnh phải nhỏ hơn hoặc bằng 8 MB." });
        var ownerType = Owners.Keys.Single(k => k.Equals(loaiDoiTuong, StringComparison.OrdinalIgnoreCase));
        await using var conn = new MySqlConnection(_config.GetConnectionString("DefaultConnection"));
        if (await conn.ExecuteScalarAsync<int>($"SELECT COUNT(*) FROM {ownerType} WHERE {ownerColumn}=@maDoiTuong", new { maDoiTuong }) != 1)
            return BadRequest(new { message = "Hãy lưu đối tượng trước khi tải ảnh." });
        await using var memory = new MemoryStream();
        await file.CopyToAsync(memory);
        var bytes = memory.ToArray();
        string? extension = bytes.Length >= 12 && bytes[0] == 0xff && bytes[1] == 0xd8 && bytes[2] == 0xff ? ".jpg" :
            bytes.Length >= 24 && bytes.Take(8).SequenceEqual(new byte[] {137,80,78,71,13,10,26,10}) ? ".png" :
            bytes.Length >= 16 && System.Text.Encoding.ASCII.GetString(bytes,0,4) == "RIFF" && System.Text.Encoding.ASCII.GetString(bytes,8,4) == "WEBP" ? ".webp" : null;
        if (extension == null) return BadRequest(new { message = "Chỉ nhận file ảnh JPG, PNG hoặc WebP; không nhận SVG." });
        var folder = Path.Combine(_env.WebRootPath, "media", "uploads");
        Directory.CreateDirectory(folder);
        var name = Guid.NewGuid().ToString("N") + extension;
        var filePath = Path.Combine(folder, name);
        try
        {
            await System.IO.File.WriteAllBytesAsync(filePath, bytes);
            var id = await _svc.CreateAsync(new CreateHinhAnhDto { LoaiDoiTuong = ownerType, MaDoiTuong = maDoiTuong,
                DuongDan = "/media/uploads/" + name, MoTa = moTa, ThuTu = thuTu });
            return CreatedAtAction(nameof(GetById), new { id }, await _svc.GetByIdAsync(id));
        }
        catch { if (System.IO.File.Exists(filePath)) System.IO.File.Delete(filePath); throw; }
    }

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
