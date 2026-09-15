$basePath = "d:\DoAn4\backend"
$modelsPath = "$basePath\Models\DTOs"
$dataPath = "$basePath\Data"
$servicesPath = "$basePath\Services"
$controllersPath = "$basePath\Controllers"

New-Item -ItemType Directory -Force -Path $modelsPath | Out-Null
New-Item -ItemType Directory -Force -Path $dataPath | Out-Null
New-Item -ItemType Directory -Force -Path $servicesPath | Out-Null
New-Item -ItemType Directory -Force -Path $controllersPath | Out-Null

$datPhongDto = @'
using System;

namespace backend.DTOs
{
    public class CreateDatPhongDto
    {
        public int MaNguoiDung { get; set; }
        public int MaLoaiPhong { get; set; }
        public DateTime NgayNhanPhong { get; set; }
        public DateTime NgayTraPhong { get; set; }
        public int SoLuongPhong { get; set; } = 1;
        public int SoNguoi { get; set; } = 1;
        public decimal GiaMoiDem { get; set; }
        public decimal TongTien { get; set; }
        public string TrangThai { get; set; } = "Pending";
        public string GhiChu { get; set; }
    }

    public class UpdateDatPhongDto
    {
        public int MaNguoiDung { get; set; }
        public int MaLoaiPhong { get; set; }
        public DateTime NgayNhanPhong { get; set; }
        public DateTime NgayTraPhong { get; set; }
        public int SoLuongPhong { get; set; }
        public int SoNguoi { get; set; }
        public decimal GiaMoiDem { get; set; }
        public decimal TongTien { get; set; }
        public string TrangThai { get; set; }
        public string GhiChu { get; set; }
    }

    public class DatPhongResponseDto
    {
        public int MaDatPhong { get; set; }
        public int MaNguoiDung { get; set; }
        public int MaLoaiPhong { get; set; }
        public DateTime NgayNhanPhong { get; set; }
        public DateTime NgayTraPhong { get; set; }
        public int SoLuongPhong { get; set; }
        public int SoNguoi { get; set; }
        public decimal GiaMoiDem { get; set; }
        public decimal TongTien { get; set; }
        public string TrangThai { get; set; }
        public string GhiChu { get; set; }
        public DateTime NgayDat { get; set; }
    }
}
'@

$iDatPhongRepo = @'
using System.Collections.Generic;
using System.Threading.Tasks;
using backend.DTOs;

namespace backend.Data
{
    public interface IDatPhongRepository
    {
        Task<IEnumerable<DatPhongResponseDto>> GetAllAsync();
        Task<DatPhongResponseDto> GetByIdAsync(int id);
        Task<IEnumerable<DatPhongResponseDto>> GetByNguoiDungAsync(int maNguoiDung);
        Task<int> CreateAsync(CreateDatPhongDto dto);
        Task<bool> UpdateAsync(int id, UpdateDatPhongDto dto);
        Task<bool> DeleteAsync(int id);
    }
}
'@

$datPhongRepo = @'
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using backend.DTOs;
using Dapper;
using Microsoft.Extensions.Configuration;
using MySqlConnector;

namespace backend.Data
{
    public class DatPhongRepository : IDatPhongRepository
    {
        private readonly string _connectionString;

        public DatPhongRepository(IConfiguration config)
        {
            _connectionString = config.GetConnectionString("DefaultConnection")!;
        }

        private MySqlConnection GetConnection() => new MySqlConnection(_connectionString);

        public async Task<IEnumerable<DatPhongResponseDto>> GetAllAsync()
        {
            using var conn = GetConnection();
            var sql = "SELECT * FROM DatPhong";
            return await conn.QueryAsync<DatPhongResponseDto>(sql);
        }

        public async Task<DatPhongResponseDto> GetByIdAsync(int id)
        {
            using var conn = GetConnection();
            var sql = "SELECT * FROM DatPhong WHERE MaDatPhong = @Id";
            return await conn.QuerySingleOrDefaultAsync<DatPhongResponseDto>(sql, new { Id = id });
        }

        public async Task<IEnumerable<DatPhongResponseDto>> GetByNguoiDungAsync(int maNguoiDung)
        {
            using var conn = GetConnection();
            var sql = "SELECT * FROM DatPhong WHERE MaNguoiDung = @MaNguoiDung";
            return await conn.QueryAsync<DatPhongResponseDto>(sql, new { MaNguoiDung = maNguoiDung });
        }

        public async Task<int> CreateAsync(CreateDatPhongDto dto)
        {
            using var conn = GetConnection();
            var sql = @"INSERT INTO DatPhong (MaNguoiDung, MaLoaiPhong, NgayNhanPhong, NgayTraPhong, SoLuongPhong, SoNguoi, GiaMoiDem, TongTien, TrangThai, GhiChu) 
                        VALUES (@MaNguoiDung, @MaLoaiPhong, @NgayNhanPhong, @NgayTraPhong, @SoLuongPhong, @SoNguoi, @GiaMoiDem, @TongTien, @TrangThai, @GhiChu);
                        SELECT LAST_INSERT_ID();";
            return await conn.ExecuteScalarAsync<int>(sql, dto);
        }

        public async Task<bool> UpdateAsync(int id, UpdateDatPhongDto dto)
        {
            using var conn = GetConnection();
            var sql = @"UPDATE DatPhong SET MaNguoiDung = @MaNguoiDung, MaLoaiPhong = @MaLoaiPhong, NgayNhanPhong = @NgayNhanPhong, NgayTraPhong = @NgayTraPhong, 
                        SoLuongPhong = @SoLuongPhong, SoNguoi = @SoNguoi, GiaMoiDem = @GiaMoiDem, TongTien = @TongTien, TrangThai = @TrangThai, GhiChu = @GhiChu 
                        WHERE MaDatPhong = @Id";
            var parameters = new DynamicParameters(dto);
            parameters.Add("Id", id);
            var affected = await conn.ExecuteAsync(sql, parameters);
            return affected > 0;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            using var conn = GetConnection();
            var sql = "DELETE FROM DatPhong WHERE MaDatPhong = @Id";
            var affected = await conn.ExecuteAsync(sql, new { Id = id });
            return affected > 0;
        }
    }
}
'@

$iDatPhongService = @'
using System.Collections.Generic;
using System.Threading.Tasks;
using backend.DTOs;

namespace backend.Services
{
    public interface IDatPhongService
    {
        Task<IEnumerable<DatPhongResponseDto>> GetAllAsync();
        Task<DatPhongResponseDto> GetByIdAsync(int id);
        Task<IEnumerable<DatPhongResponseDto>> GetByNguoiDungAsync(int maNguoiDung);
        Task<DatPhongResponseDto> CreateAsync(CreateDatPhongDto dto);
        Task<bool> UpdateAsync(int id, UpdateDatPhongDto dto);
        Task<bool> DeleteAsync(int id);
    }
}
'@

$datPhongService = @'
using System.Collections.Generic;
using System.Threading.Tasks;
using backend.Data;
using backend.DTOs;

namespace backend.Services
{
    public class DatPhongService : IDatPhongService
    {
        private readonly IDatPhongRepository _repo;

        public DatPhongService(IDatPhongRepository repo)
        {
            _repo = repo;
        }

        public Task<IEnumerable<DatPhongResponseDto>> GetAllAsync() => _repo.GetAllAsync();

        public Task<DatPhongResponseDto> GetByIdAsync(int id) => _repo.GetByIdAsync(id);

        public Task<IEnumerable<DatPhongResponseDto>> GetByNguoiDungAsync(int maNguoiDung) => _repo.GetByNguoiDungAsync(maNguoiDung);

        public async Task<DatPhongResponseDto> CreateAsync(CreateDatPhongDto dto)
        {
            var id = await _repo.CreateAsync(dto);
            return await _repo.GetByIdAsync(id);
        }

        public Task<bool> UpdateAsync(int id, UpdateDatPhongDto dto) => _repo.UpdateAsync(id, dto);

        public Task<bool> DeleteAsync(int id) => _repo.DeleteAsync(id);
    }
}
'@

$datPhongController = @'
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
'@

$datPhongDto | Out-File -FilePath "$modelsPath\DatPhongDto.cs" -Encoding UTF8
$iDatPhongRepo | Out-File -FilePath "$dataPath\IDatPhongRepository.cs" -Encoding UTF8
$datPhongRepo | Out-File -FilePath "$dataPath\DatPhongRepository.cs" -Encoding UTF8
$iDatPhongService | Out-File -FilePath "$servicesPath\IDatPhongService.cs" -Encoding UTF8
$datPhongService | Out-File -FilePath "$servicesPath\DatPhongService.cs" -Encoding UTF8
$datPhongController | Out-File -FilePath "$controllersPath\DatPhongController.cs" -Encoding UTF8
