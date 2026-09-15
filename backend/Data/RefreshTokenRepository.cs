using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using MySqlConnector;
using Dapper;
using backend.DTOs;
using System;

namespace backend.Data
{
    public class RefreshTokenRepository : IRefreshTokenRepository
    {
        private readonly string _connectionString;

        public RefreshTokenRepository(IConfiguration config)
        {
            _connectionString = config.GetConnectionString("DefaultConnection")!;
        }

        private MySqlConnection GetConnection() => new MySqlConnection(_connectionString);

        public async Task<IEnumerable<RefreshTokenResponseDto>> GetAllAsync()
        {
            using var conn = GetConnection();
            return await conn.QueryAsync<RefreshTokenResponseDto>("SELECT * FROM RefreshToken");
        }

        public async Task<RefreshTokenResponseDto?> GetByIdAsync(int id)
        {
            using var conn = GetConnection();
            return await conn.QuerySingleOrDefaultAsync<RefreshTokenResponseDto>(
                "SELECT * FROM RefreshToken WHERE MaToken = @Id", new { Id = id });
        }

        public async Task<int> CreateAsync(CreateRefreshTokenDto dto)
        {
            using var conn = GetConnection();
            var sql = @"INSERT INTO RefreshToken (MaNguoiDung, Token, NgayTao, NgayHetHan, DaThuHoi) 
                        VALUES (@MaNguoiDung, @Token, @NgayTao, @NgayHetHan, @DaThuHoi);
                        SELECT LAST_INSERT_ID();";
            return await conn.ExecuteScalarAsync<int>(sql, new {
                dto.MaNguoiDung,
                dto.Token,
                NgayTao = DateTime.Now,
                dto.NgayHetHan,
                dto.DaThuHoi
            });
        }

        public async Task<bool> UpdateAsync(int id, UpdateRefreshTokenDto dto)
        {
            using var conn = GetConnection();
            var sql = @"UPDATE RefreshToken 
                        SET MaNguoiDung = @MaNguoiDung, Token = @Token, NgayHetHan = @NgayHetHan, DaThuHoi = @DaThuHoi 
                        WHERE MaToken = @Id";
            var affected = await conn.ExecuteAsync(sql, new { 
                dto.MaNguoiDung,
                dto.Token,
                dto.NgayHetHan,
                dto.DaThuHoi,
                Id = id 
            });
            return affected > 0;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            using var conn = GetConnection();
            var sql = "DELETE FROM RefreshToken WHERE MaToken = @Id";
            var affected = await conn.ExecuteAsync(sql, new { Id = id });
            return affected > 0;
        }
    }
}
