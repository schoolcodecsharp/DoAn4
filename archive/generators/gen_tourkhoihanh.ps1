$basePath = "d:\DoAn4\backend"
$modelsPath = "$basePath\Models\DTOs"
$dataPath = "$basePath\Data"
$servicesPath = "$basePath\Services"
$controllersPath = "$basePath\Controllers"

$tourKhoiHanhDto = @'
using System;

namespace backend.DTOs
{
    public class CreateTourKhoiHanhDto
    {
        public int MaTour { get; set; }
        public DateTime NgayKhoiHanh { get; set; }
        public int SoChoToiDa { get; set; }
        public int SoChoDaDat { get; set; } = 0;
        public decimal GiaApDung { get; set; }
        public string TrangThai { get; set; } = "OpenForBooking";
    }

    public class UpdateTourKhoiHanhDto
    {
        public int MaTour { get; set; }
        public DateTime NgayKhoiHanh { get; set; }
        public int SoChoToiDa { get; set; }
        public int SoChoDaDat { get; set; }
        public decimal GiaApDung { get; set; }
        public string TrangThai { get; set; }
    }

    public class TourKhoiHanhResponseDto
    {
        public int MaKhoiHanh { get; set; }
        public int MaTour { get; set; }
        public DateTime NgayKhoiHanh { get; set; }
        public int SoChoToiDa { get; set; }
        public int SoChoDaDat { get; set; }
        public decimal GiaApDung { get; set; }
        public string TrangThai { get; set; }
    }
}
'@

$iTourKhoiHanhRepo = @'
using System.Collections.Generic;
using System.Threading.Tasks;
using backend.DTOs;

namespace backend.Data
{
    public interface ITourKhoiHanhRepository
    {
        Task<IEnumerable<TourKhoiHanhResponseDto>> GetAllAsync();
        Task<TourKhoiHanhResponseDto> GetByIdAsync(int id);
        Task<IEnumerable<TourKhoiHanhResponseDto>> GetByTourAsync(int maTour);
        Task<int> CreateAsync(CreateTourKhoiHanhDto dto);
        Task<bool> UpdateAsync(int id, UpdateTourKhoiHanhDto dto);
        Task<bool> DeleteAsync(int id);
    }
}
'@

$tourKhoiHanhRepo = @'
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using backend.DTOs;
using Dapper;
using Microsoft.Extensions.Configuration;
using MySqlConnector;

namespace backend.Data
{
    public class TourKhoiHanhRepository : ITourKhoiHanhRepository
    {
        private readonly string _connectionString;

        public TourKhoiHanhRepository(IConfiguration config)
        {
            _connectionString = config.GetConnectionString("DefaultConnection")!;
        }

        private MySqlConnection GetConnection() => new MySqlConnection(_connectionString);

        public async Task<IEnumerable<TourKhoiHanhResponseDto>> GetAllAsync()
        {
            using var conn = GetConnection();
            var sql = "SELECT * FROM TourKhoiHanh";
            return await conn.QueryAsync<TourKhoiHanhResponseDto>(sql);
        }

        public async Task<TourKhoiHanhResponseDto> GetByIdAsync(int id)
        {
            using var conn = GetConnection();
            var sql = "SELECT * FROM TourKhoiHanh WHERE MaKhoiHanh = @Id";
            return await conn.QuerySingleOrDefaultAsync<TourKhoiHanhResponseDto>(sql, new { Id = id });
        }

        public async Task<IEnumerable<TourKhoiHanhResponseDto>> GetByTourAsync(int maTour)
        {
            using var conn = GetConnection();
            var sql = "SELECT * FROM TourKhoiHanh WHERE MaTour = @MaTour";
            return await conn.QueryAsync<TourKhoiHanhResponseDto>(sql, new { MaTour = maTour });
        }

        public async Task<int> CreateAsync(CreateTourKhoiHanhDto dto)
        {
            using var conn = GetConnection();
            var sql = @"INSERT INTO TourKhoiHanh (MaTour, NgayKhoiHanh, SoChoToiDa, SoChoDaDat, GiaApDung, TrangThai) 
                        VALUES (@MaTour, @NgayKhoiHanh, @SoChoToiDa, @SoChoDaDat, @GiaApDung, @TrangThai);
                        SELECT LAST_INSERT_ID();";
            return await conn.ExecuteScalarAsync<int>(sql, dto);
        }

        public async Task<bool> UpdateAsync(int id, UpdateTourKhoiHanhDto dto)
        {
            using var conn = GetConnection();
            var sql = @"UPDATE TourKhoiHanh SET MaTour = @MaTour, NgayKhoiHanh = @NgayKhoiHanh, SoChoToiDa = @SoChoToiDa, SoChoDaDat = @SoChoDaDat, 
                        GiaApDung = @GiaApDung, TrangThai = @TrangThai 
                        WHERE MaKhoiHanh = @Id";
            var parameters = new DynamicParameters(dto);
            parameters.Add("Id", id);
            var affected = await conn.ExecuteAsync(sql, parameters);
            return affected > 0;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            using var conn = GetConnection();
            var sql = "DELETE FROM TourKhoiHanh WHERE MaKhoiHanh = @Id";
            var affected = await conn.ExecuteAsync(sql, new { Id = id });
            return affected > 0;
        }
    }
}
'@

$iTourKhoiHanhService = @'
using System.Collections.Generic;
using System.Threading.Tasks;
using backend.DTOs;

namespace backend.Services
{
    public interface ITourKhoiHanhService
    {
        Task<IEnumerable<TourKhoiHanhResponseDto>> GetAllAsync();
        Task<TourKhoiHanhResponseDto> GetByIdAsync(int id);
        Task<IEnumerable<TourKhoiHanhResponseDto>> GetByTourAsync(int maTour);
        Task<TourKhoiHanhResponseDto> CreateAsync(CreateTourKhoiHanhDto dto);
        Task<bool> UpdateAsync(int id, UpdateTourKhoiHanhDto dto);
        Task<bool> DeleteAsync(int id);
    }
}
'@

$tourKhoiHanhService = @'
using System.Collections.Generic;
using System.Threading.Tasks;
using backend.Data;
using backend.DTOs;

namespace backend.Services
{
    public class TourKhoiHanhService : ITourKhoiHanhService
    {
        private readonly ITourKhoiHanhRepository _repo;

        public TourKhoiHanhService(ITourKhoiHanhRepository repo)
        {
            _repo = repo;
        }

        public Task<IEnumerable<TourKhoiHanhResponseDto>> GetAllAsync() => _repo.GetAllAsync();

        public Task<TourKhoiHanhResponseDto> GetByIdAsync(int id) => _repo.GetByIdAsync(id);

        public Task<IEnumerable<TourKhoiHanhResponseDto>> GetByTourAsync(int maTour) => _repo.GetByTourAsync(maTour);

        public async Task<TourKhoiHanhResponseDto> CreateAsync(CreateTourKhoiHanhDto dto)
        {
            var id = await _repo.CreateAsync(dto);
            return await _repo.GetByIdAsync(id);
        }

        public Task<bool> UpdateAsync(int id, UpdateTourKhoiHanhDto dto) => _repo.UpdateAsync(id, dto);

        public Task<bool> DeleteAsync(int id) => _repo.DeleteAsync(id);
    }
}
'@

$tourKhoiHanhController = @'
using System.Threading.Tasks;
using backend.DTOs;
using backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TourKhoiHanhController : ControllerBase
    {
        private readonly ITourKhoiHanhService _service;

        public TourKhoiHanhController(ITourKhoiHanhService service)
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
        public async Task<IActionResult> Create(CreateTourKhoiHanhDto dto)
        {
            var result = await _service.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = result.MaKhoiHanh }, result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, UpdateTourKhoiHanhDto dto)
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

$tourKhoiHanhDto | Out-File -FilePath "$modelsPath\TourKhoiHanhDto.cs" -Encoding UTF8
$iTourKhoiHanhRepo | Out-File -FilePath "$dataPath\ITourKhoiHanhRepository.cs" -Encoding UTF8
$tourKhoiHanhRepo | Out-File -FilePath "$dataPath\TourKhoiHanhRepository.cs" -Encoding UTF8
$iTourKhoiHanhService | Out-File -FilePath "$servicesPath\ITourKhoiHanhService.cs" -Encoding UTF8
$tourKhoiHanhService | Out-File -FilePath "$servicesPath\TourKhoiHanhService.cs" -Encoding UTF8
$tourKhoiHanhController | Out-File -FilePath "$controllersPath\TourKhoiHanhController.cs" -Encoding UTF8
