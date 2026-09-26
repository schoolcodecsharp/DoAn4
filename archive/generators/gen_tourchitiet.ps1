$basePath = "d:\DoAn4\backend"
$modelsPath = "$basePath\Models\DTOs"
$dataPath = "$basePath\Data"
$servicesPath = "$basePath\Services"
$controllersPath = "$basePath\Controllers"

$tourChiTietDto = @'
using System;

namespace backend.DTOs
{
    public class CreateTourChiTietDto
    {
        public int MaTour { get; set; }
        public int NgayThu { get; set; }
        public int ThuTu { get; set; }
        public string LoaiDiaDiem { get; set; }
        public int? MaDiaDiem { get; set; }
        public int? MaNhaHang { get; set; }
        public int? MaKhachSan { get; set; }
        public TimeSpan? ThoiGianBatDau { get; set; }
        public TimeSpan? ThoiGianKetThuc { get; set; }
        public decimal ChiPhi { get; set; } = 0;
        public string GhiChu { get; set; }
    }

    public class UpdateTourChiTietDto
    {
        public int MaTour { get; set; }
        public int NgayThu { get; set; }
        public int ThuTu { get; set; }
        public string LoaiDiaDiem { get; set; }
        public int? MaDiaDiem { get; set; }
        public int? MaNhaHang { get; set; }
        public int? MaKhachSan { get; set; }
        public TimeSpan? ThoiGianBatDau { get; set; }
        public TimeSpan? ThoiGianKetThuc { get; set; }
        public decimal ChiPhi { get; set; }
        public string GhiChu { get; set; }
    }

    public class TourChiTietResponseDto
    {
        public int MaTourChiTiet { get; set; }
        public int MaTour { get; set; }
        public int NgayThu { get; set; }
        public int ThuTu { get; set; }
        public string LoaiDiaDiem { get; set; }
        public int? MaDiaDiem { get; set; }
        public int? MaNhaHang { get; set; }
        public int? MaKhachSan { get; set; }
        public TimeSpan? ThoiGianBatDau { get; set; }
        public TimeSpan? ThoiGianKetThuc { get; set; }
        public decimal ChiPhi { get; set; }
        public string GhiChu { get; set; }
    }
}
'@

$iTourChiTietRepo = @'
using System.Collections.Generic;
using System.Threading.Tasks;
using backend.DTOs;

namespace backend.Data
{
    public interface ITourChiTietRepository
    {
        Task<IEnumerable<TourChiTietResponseDto>> GetAllAsync();
        Task<TourChiTietResponseDto> GetByIdAsync(int id);
        Task<IEnumerable<TourChiTietResponseDto>> GetByTourAsync(int maTour);
        Task<int> CreateAsync(CreateTourChiTietDto dto);
        Task<bool> UpdateAsync(int id, UpdateTourChiTietDto dto);
        Task<bool> DeleteAsync(int id);
    }
}
'@

$tourChiTietRepo = @'
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using backend.DTOs;
using Dapper;
using Microsoft.Extensions.Configuration;
using MySqlConnector;

namespace backend.Data
{
    public class TourChiTietRepository : ITourChiTietRepository
    {
        private readonly string _connectionString;

        public TourChiTietRepository(IConfiguration config)
        {
            _connectionString = config.GetConnectionString("DefaultConnection")!;
        }

        private MySqlConnection GetConnection() => new MySqlConnection(_connectionString);

        public async Task<IEnumerable<TourChiTietResponseDto>> GetAllAsync()
        {
            using var conn = GetConnection();
            var sql = "SELECT * FROM TourChiTiet";
            return await conn.QueryAsync<TourChiTietResponseDto>(sql);
        }

        public async Task<TourChiTietResponseDto> GetByIdAsync(int id)
        {
            using var conn = GetConnection();
            var sql = "SELECT * FROM TourChiTiet WHERE MaTourChiTiet = @Id";
            return await conn.QuerySingleOrDefaultAsync<TourChiTietResponseDto>(sql, new { Id = id });
        }

        public async Task<IEnumerable<TourChiTietResponseDto>> GetByTourAsync(int maTour)
        {
            using var conn = GetConnection();
            var sql = "SELECT * FROM TourChiTiet WHERE MaTour = @MaTour ORDER BY NgayThu, ThuTu";
            return await conn.QueryAsync<TourChiTietResponseDto>(sql, new { MaTour = maTour });
        }

        public async Task<int> CreateAsync(CreateTourChiTietDto dto)
        {
            using var conn = GetConnection();
            var sql = @"INSERT INTO TourChiTiet (MaTour, NgayThu, ThuTu, LoaiDiaDiem, MaDiaDiem, MaNhaHang, MaKhachSan, ThoiGianBatDau, ThoiGianKetThuc, ChiPhi, GhiChu) 
                        VALUES (@MaTour, @NgayThu, @ThuTu, @LoaiDiaDiem, @MaDiaDiem, @MaNhaHang, @MaKhachSan, @ThoiGianBatDau, @ThoiGianKetThuc, @ChiPhi, @GhiChu);
                        SELECT LAST_INSERT_ID();";
            return await conn.ExecuteScalarAsync<int>(sql, dto);
        }

        public async Task<bool> UpdateAsync(int id, UpdateTourChiTietDto dto)
        {
            using var conn = GetConnection();
            var sql = @"UPDATE TourChiTiet SET MaTour = @MaTour, NgayThu = @NgayThu, ThuTu = @ThuTu, LoaiDiaDiem = @LoaiDiaDiem, 
                        MaDiaDiem = @MaDiaDiem, MaNhaHang = @MaNhaHang, MaKhachSan = @MaKhachSan, ThoiGianBatDau = @ThoiGianBatDau, ThoiGianKetThuc = @ThoiGianKetThuc, 
                        ChiPhi = @ChiPhi, GhiChu = @GhiChu 
                        WHERE MaTourChiTiet = @Id";
            var parameters = new DynamicParameters(dto);
            parameters.Add("Id", id);
            var affected = await conn.ExecuteAsync(sql, parameters);
            return affected > 0;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            using var conn = GetConnection();
            var sql = "DELETE FROM TourChiTiet WHERE MaTourChiTiet = @Id";
            var affected = await conn.ExecuteAsync(sql, new { Id = id });
            return affected > 0;
        }
    }
}
'@

$iTourChiTietService = @'
using System.Collections.Generic;
using System.Threading.Tasks;
using backend.DTOs;

namespace backend.Services
{
    public interface ITourChiTietService
    {
        Task<IEnumerable<TourChiTietResponseDto>> GetAllAsync();
        Task<TourChiTietResponseDto> GetByIdAsync(int id);
        Task<IEnumerable<TourChiTietResponseDto>> GetByTourAsync(int maTour);
        Task<TourChiTietResponseDto> CreateAsync(CreateTourChiTietDto dto);
        Task<bool> UpdateAsync(int id, UpdateTourChiTietDto dto);
        Task<bool> DeleteAsync(int id);
    }
}
'@

$tourChiTietService = @'
using System.Collections.Generic;
using System.Threading.Tasks;
using backend.Data;
using backend.DTOs;

namespace backend.Services
{
    public class TourChiTietService : ITourChiTietService
    {
        private readonly ITourChiTietRepository _repo;

        public TourChiTietService(ITourChiTietRepository repo)
        {
            _repo = repo;
        }

        public Task<IEnumerable<TourChiTietResponseDto>> GetAllAsync() => _repo.GetAllAsync();

        public Task<TourChiTietResponseDto> GetByIdAsync(int id) => _repo.GetByIdAsync(id);

        public Task<IEnumerable<TourChiTietResponseDto>> GetByTourAsync(int maTour) => _repo.GetByTourAsync(maTour);

        public async Task<TourChiTietResponseDto> CreateAsync(CreateTourChiTietDto dto)
        {
            var id = await _repo.CreateAsync(dto);
            return await _repo.GetByIdAsync(id);
        }

        public Task<bool> UpdateAsync(int id, UpdateTourChiTietDto dto) => _repo.UpdateAsync(id, dto);

        public Task<bool> DeleteAsync(int id) => _repo.DeleteAsync(id);
    }
}
'@

$tourChiTietController = @'
using System.Threading.Tasks;
using backend.DTOs;
using backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TourChiTietController : ControllerBase
    {
        private readonly ITourChiTietService _service;

        public TourChiTietController(ITourChiTietService service)
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

        [HttpGet("bytour/{maTour}")]
        public async Task<IActionResult> GetByTour(int maTour)
        {
            var result = await _service.GetByTourAsync(maTour);
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Create(CreateTourChiTietDto dto)
        {
            var result = await _service.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = result.MaTourChiTiet }, result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, UpdateTourChiTietDto dto)
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

$tourChiTietDto | Out-File -FilePath "$modelsPath\TourChiTietDto.cs" -Encoding UTF8
$iTourChiTietRepo | Out-File -FilePath "$dataPath\ITourChiTietRepository.cs" -Encoding UTF8
$tourChiTietRepo | Out-File -FilePath "$dataPath\TourChiTietRepository.cs" -Encoding UTF8
$iTourChiTietService | Out-File -FilePath "$servicesPath\ITourChiTietService.cs" -Encoding UTF8
$tourChiTietService | Out-File -FilePath "$servicesPath\TourChiTietService.cs" -Encoding UTF8
$tourChiTietController | Out-File -FilePath "$controllersPath\TourChiTietController.cs" -Encoding UTF8
