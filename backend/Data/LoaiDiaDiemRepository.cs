using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using MySqlConnector;
using Dapper;
using backend.DTOs;

namespace backend.Data
{
    public class LoaiDiaDiemRepository : ILoaiDiaDiemRepository
    {
        private readonly string _connectionString;

        public LoaiDiaDiemRepository(IConfiguration config)
        {
            _connectionString = config.GetConnectionString("DefaultConnection")!;
        }

        private MySqlConnection GetConnection() => new MySqlConnection(_connectionString);

        public async Task<IEnumerable<LoaiDiaDiemResponseDto>> GetAllAsync()
        {
            using var conn = GetConnection();
            return await conn.QueryAsync<LoaiDiaDiemResponseDto>("SELECT * FROM LoaiDiaDiem");
        }

        public async Task<LoaiDiaDiemResponseDto?> GetByIdAsync(int id)
        {
            using var conn = GetConnection();
            return await conn.QuerySingleOrDefaultAsync<LoaiDiaDiemResponseDto>(
                "SELECT * FROM LoaiDiaDiem WHERE MaLoai = @Id", new { Id = id });
        }

        public async Task<int> CreateAsync(CreateLoaiDiaDiemDto dto)
        {
            using var conn = GetConnection();
            var sql = @"INSERT INTO LoaiDiaDiem (TenLoai, MoTa, TrangThai) 
                        VALUES (@TenLoai, @MoTa, @TrangThai);
                        SELECT LAST_INSERT_ID();";
            return await conn.ExecuteScalarAsync<int>(sql, dto);
        }

        public async Task<bool> UpdateAsync(int id, UpdateLoaiDiaDiemDto dto)
        {
            using var conn = GetConnection();
            var sql = @"UPDATE LoaiDiaDiem 
                        SET TenLoai = @TenLoai, MoTa = @MoTa, TrangThai = @TrangThai 
                        WHERE MaLoai = @Id";
            var affected = await conn.ExecuteAsync(sql, new { 
                dto.TenLoai, 
                dto.MoTa, 
                dto.TrangThai, 
                Id = id 
            });
            return affected > 0;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            using var conn = GetConnection();
            var sql = "DELETE FROM LoaiDiaDiem WHERE MaLoai = @Id";
            var affected = await conn.ExecuteAsync(sql, new { Id = id });
            return affected > 0;
        }
    }
}
