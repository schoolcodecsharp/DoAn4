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
