using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Dapper;
using MySqlConnector;
using backend.DTOs;

namespace backend.Data
{
    public class LichTrinhRepository : ILichTrinhRepository
    {
        private readonly string _connectionString;

        public LichTrinhRepository(IConfiguration config)
        {
            _connectionString = config.GetConnectionString("DefaultConnection")!;
        }

        private MySqlConnection GetConnection() => new MySqlConnection(_connectionString);

        public async Task<IEnumerable<LichTrinhDto>> GetAllAsync()
        {
            using var conn = GetConnection();
            string query = "SELECT * FROM LichTrinh ORDER BY NgayThu ASC";
            return await conn.QueryAsync<LichTrinhDto>(query);
        }

        public async Task<LichTrinhDto> GetByIdAsync(int id)
        {
            using var conn = GetConnection();
            string query = "SELECT * FROM LichTrinh WHERE MaLichTrinh = @Id";
            return await conn.QuerySingleOrDefaultAsync<LichTrinhDto>(query, new { Id = id });
        }

        public async Task<IEnumerable<LichTrinhDto>> GetByChuyenDiAsync(int maChuyenDi)
        {
            using var conn = GetConnection();
            string query = "SELECT * FROM LichTrinh WHERE MaChuyenDi = @MaChuyenDi ORDER BY NgayThu ASC";
            return await conn.QueryAsync<LichTrinhDto>(query, new { MaChuyenDi = maChuyenDi });
        }

        public async Task<int> CreateAsync(CreateLichTrinhDto dto)
        {
            using var conn = GetConnection();
            string query = @"
                INSERT INTO LichTrinh (MaChuyenDi, NgayThu, Ngay, TieuDe, GhiChu) 
                VALUES (@MaChuyenDi, @NgayThu, @Ngay, @TieuDe, @GhiChu);
                SELECT LAST_INSERT_ID();";
            return await conn.QuerySingleAsync<int>(query, dto);
        }

        public async Task<bool> UpdateAsync(int id, UpdateLichTrinhDto dto)
        {
            using var conn = GetConnection();
            string query = @"
                UPDATE LichTrinh 
                SET NgayThu = @NgayThu, Ngay = @Ngay, TieuDe = @TieuDe, GhiChu = @GhiChu
                WHERE MaLichTrinh = @Id";
            
            var parameters = new DynamicParameters(dto);
            parameters.Add("Id", id);
            
            int rowsAffected = await conn.ExecuteAsync(query, parameters);
            return rowsAffected > 0;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            using var conn = GetConnection();
            string query = "DELETE FROM LichTrinh WHERE MaLichTrinh = @Id";
            int rowsAffected = await conn.ExecuteAsync(query, new { Id = id });
            return rowsAffected > 0;
        }
    }
}
