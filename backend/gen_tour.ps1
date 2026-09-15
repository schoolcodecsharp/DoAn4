$basePath = "d:\DoAn4\backend"
$modelsPath = "$basePath\Models\DTOs"
$dataPath = "$basePath\Data"
$servicesPath = "$basePath\Services"
$controllersPath = "$basePath\Controllers"

$tourDto = @'
using System;

namespace backend.DTOs
{
    public class CreateTourDto
    {
        public int MaNguoiTao { get; set; }
        public string TenTour { get; set; }
        public string MoTa { get; set; }
        public string DiemKhoiHanh { get; set; }
        public string DiemDen { get; set; }
        public int SoNgay { get; set; }
        public int SoDem { get; set; }
        public decimal GiaTour { get; set; }
        public decimal GiaTourMin { get; set; }
        public decimal GiaTourMax { get; set; }
        public int SoNguoiToiDa { get; set; } = 20;
        public int SoNguoiToiThieu { get; set; } = 1;
        public string AnhDaiDien { get; set; }
        public string TrangThai { get; set; } = "Draft";
    }

    public class UpdateTourDto
    {
        public int MaNguoiTao { get; set; }
        public string TenTour { get; set; }
        public string MoTa { get; set; }
        public string DiemKhoiHanh { get; set; }
        public string DiemDen { get; set; }
        public int SoNgay { get; set; }
        public int SoDem { get; set; }
        public decimal GiaTour { get; set; }
        public decimal GiaTourMin { get; set; }
        public decimal GiaTourMax { get; set; }
        public int SoNguoiToiDa { get; set; }
        public int SoNguoiToiThieu { get; set; }
        public string AnhDaiDien { get; set; }
        public string TrangThai { get; set; }
    }

    public class TourResponseDto
    {
        public int MaTour { get; set; }
        public int MaNguoiTao { get; set; }
        public string TenTour { get; set; }
        public string MoTa { get; set; }
        public string DiemKhoiHanh { get; set; }
        public string DiemDen { get; set; }
        public int SoNgay { get; set; }
        public int SoDem { get; set; }
        public decimal GiaTour { get; set; }
        public decimal GiaTourMin { get; set; }
        public decimal GiaTourMax { get; set; }
        public int SoNguoiToiDa { get; set; }
        public int SoNguoiToiThieu { get; set; }
        public string AnhDaiDien { get; set; }
        public decimal DiemDanhGia { get; set; }
        public int LuotXem { get; set; }
        public string TrangThai { get; set; }
        public DateTime? NgayTao { get; set; }
        public DateTime? NgayCapNhat { get; set; }
    }
}
'@

$iTourRepo = @'
using System.Collections.Generic;
using System.Threading.Tasks;
using backend.DTOs;

namespace backend.Data
{
    public interface ITourRepository
    {
        Task<IEnumerable<TourResponseDto>> GetAllAsync();
        Task<TourResponseDto> GetByIdAsync(int id);
        Task<IEnumerable<TourResponseDto>> GetFilteredToursAsync(string tinh, string keyword, string trangthai);
        Task<int> CreateAsync(CreateTourDto dto);
        Task<bool> UpdateAsync(int id, UpdateTourDto dto);
        Task<bool> DeleteAsync(int id);
    }
}
'@

$tourRepo = @'
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using backend.DTOs;
using Dapper;
using Microsoft.Extensions.Configuration;
using MySqlConnector;

namespace backend.Data
{
    public class TourRepository : ITourRepository
    {
        private readonly string _connectionString;

        public TourRepository(IConfiguration config)
        {
            _connectionString = config.GetConnectionString("DefaultConnection")!;
        }

        private MySqlConnection GetConnection() => new MySqlConnection(_connectionString);

        public async Task<IEnumerable<TourResponseDto>> GetAllAsync()
        {
            using var conn = GetConnection();
            var sql = "SELECT * FROM Tour";
            return await conn.QueryAsync<TourResponseDto>(sql);
        }

        public async Task<TourResponseDto> GetByIdAsync(int id)
        {
            using var conn = GetConnection();
            var sql = "SELECT * FROM Tour WHERE MaTour = @Id";
            return await conn.QuerySingleOrDefaultAsync<TourResponseDto>(sql, new { Id = id });
        }

        public async Task<IEnumerable<TourResponseDto>> GetFilteredToursAsync(string tinh, string keyword, string trangthai)
        {
            using var conn = GetConnection();
            var sql = "SELECT * FROM Tour WHERE 1=1";
            
            var param = new DynamicParameters();
            
            if (!string.IsNullOrEmpty(tinh))
            {
                sql += " AND (DiemKhoiHanh LIKE @Tinh OR DiemDen LIKE @Tinh)";
                param.Add("Tinh", $"%{tinh}%");
            }
            if (!string.IsNullOrEmpty(keyword))
            {
                sql += " AND (TenTour LIKE @Keyword OR MoTa LIKE @Keyword)";
                param.Add("Keyword", $"%{keyword}%");
            }
            if (!string.IsNullOrEmpty(trangthai))
            {
                sql += " AND TrangThai = @TrangThai";
                param.Add("TrangThai", trangthai);
            }
            
            return await conn.QueryAsync<TourResponseDto>(sql, param);
        }

        public async Task<int> CreateAsync(CreateTourDto dto)
        {
            using var conn = GetConnection();
            var sql = @"INSERT INTO Tour (MaNguoiTao, TenTour, MoTa, DiemKhoiHanh, DiemDen, SoNgay, SoDem, GiaTour, GiaTourMin, GiaTourMax, SoNguoiToiDa, SoNguoiToiThieu, AnhDaiDien, TrangThai, NgayTao, NgayCapNhat) 
                        VALUES (@MaNguoiTao, @TenTour, @MoTa, @DiemKhoiHanh, @DiemDen, @SoNgay, @SoDem, @GiaTour, @GiaTourMin, @GiaTourMax, @SoNguoiToiDa, @SoNguoiToiThieu, @AnhDaiDien, @TrangThai, NOW(), NOW());
                        SELECT LAST_INSERT_ID();";
            return await conn.ExecuteScalarAsync<int>(sql, dto);
        }

        public async Task<bool> UpdateAsync(int id, UpdateTourDto dto)
        {
            using var conn = GetConnection();
            var sql = @"UPDATE Tour SET MaNguoiTao = @MaNguoiTao, TenTour = @TenTour, MoTa = @MoTa, DiemKhoiHanh = @DiemKhoiHanh, DiemDen = @DiemDen, SoNgay = @SoNgay, SoDem = @SoDem, 
                        GiaTour = @GiaTour, GiaTourMin = @GiaTourMin, GiaTourMax = @GiaTourMax, SoNguoiToiDa = @SoNguoiToiDa, SoNguoiToiThieu = @SoNguoiToiThieu, AnhDaiDien = @AnhDaiDien, TrangThai = @TrangThai, NgayCapNhat = NOW() 
                        WHERE MaTour = @Id";
            var parameters = new DynamicParameters(dto);
            parameters.Add("Id", id);
            var affected = await conn.ExecuteAsync(sql, parameters);
            return affected > 0;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            using var conn = GetConnection();
            var sql = "DELETE FROM Tour WHERE MaTour = @Id";
            var affected = await conn.ExecuteAsync(sql, new { Id = id });
            return affected > 0;
        }
    }
}
'@

$iTourService = @'
using System.Collections.Generic;
using System.Threading.Tasks;
using backend.DTOs;

namespace backend.Services
{
    public interface ITourService
    {
        Task<IEnumerable<TourResponseDto>> GetAllAsync();
        Task<TourResponseDto> GetByIdAsync(int id);
        Task<IEnumerable<TourResponseDto>> GetFilteredToursAsync(string tinh, string keyword, string trangthai);
        Task<TourResponseDto> CreateAsync(CreateTourDto dto);
        Task<bool> UpdateAsync(int id, UpdateTourDto dto);
        Task<bool> DeleteAsync(int id);
    }
}
'@

$tourService = @'
using System.Collections.Generic;
using System.Threading.Tasks;
using backend.Data;
using backend.DTOs;

namespace backend.Services
{
    public class TourService : ITourService
    {
        private readonly ITourRepository _repo;

        public TourService(ITourRepository repo)
        {
            _repo = repo;
        }

        public Task<IEnumerable<TourResponseDto>> GetAllAsync() => _repo.GetAllAsync();

        public Task<TourResponseDto> GetByIdAsync(int id) => _repo.GetByIdAsync(id);

        public Task<IEnumerable<TourResponseDto>> GetFilteredToursAsync(string tinh, string keyword, string trangthai) => _repo.GetFilteredToursAsync(tinh, keyword, trangthai);

        public async Task<TourResponseDto> CreateAsync(CreateTourDto dto)
        {
            var id = await _repo.CreateAsync(dto);
            return await _repo.GetByIdAsync(id);
        }

        public Task<bool> UpdateAsync(int id, UpdateTourDto dto) => _repo.UpdateAsync(id, dto);

        public Task<bool> DeleteAsync(int id) => _repo.DeleteAsync(id);
    }
}
'@

$tourController = @'
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
        public async Task<IActionResult> GetAll([FromQuery] string tinh, [FromQuery] string keyword, [FromQuery] string trangthai)
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
'@

$tourDto | Out-File -FilePath "$modelsPath\TourDto.cs" -Encoding UTF8
$iTourRepo | Out-File -FilePath "$dataPath\ITourRepository.cs" -Encoding UTF8
$tourRepo | Out-File -FilePath "$dataPath\TourRepository.cs" -Encoding UTF8
$iTourService | Out-File -FilePath "$servicesPath\ITourService.cs" -Encoding UTF8
$tourService | Out-File -FilePath "$servicesPath\TourService.cs" -Encoding UTF8
$tourController | Out-File -FilePath "$controllersPath\TourController.cs" -Encoding UTF8
