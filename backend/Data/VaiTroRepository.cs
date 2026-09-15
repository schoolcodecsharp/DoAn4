using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using MySqlConnector;
using Dapper;
using backend.DTOs;

namespace backend.Data
{
    public class VaiTroRepository : IVaiTroRepository
    {
        private readonly string _connectionString;

        public VaiTroRepository(IConfiguration config)
        {
            _connectionString = config.GetConnectionString("DefaultConnection")!;
        }

        private MySqlConnection GetConnection() => new MySqlConnection(_connectionString);

        public async Task<IEnumerable<VaiTroResponseDto>> GetAllAsync()
        {
            using var conn = GetConnection();
            return await conn.QueryAsync<VaiTroResponseDto>("SELECT * FROM VaiTro");
        }

        public async Task<VaiTroResponseDto?> GetByIdAsync(int id)
        {
            using var conn = GetConnection();
            return await conn.QuerySingleOrDefaultAsync<VaiTroResponseDto>(
                "SELECT * FROM VaiTro WHERE MaVaiTro = @Id", new { Id = id });
        }

        public async Task<int> CreateAsync(CreateVaiTroDto dto)
        {
            using var conn = GetConnection();
            var sql = @"INSERT INTO VaiTro (TenVaiTro, MoTa, TrangThai) 
                        VALUES (@TenVaiTro, @MoTa, @TrangThai);
                        SELECT LAST_INSERT_ID();";
            return await conn.ExecuteScalarAsync<int>(sql, dto);
        }

        public async Task<bool> UpdateAsync(int id, UpdateVaiTroDto dto)
        {
            using var conn = GetConnection();
            var sql = @"UPDATE VaiTro 
                        SET TenVaiTro = @TenVaiTro, MoTa = @MoTa, TrangThai = @TrangThai 
                        WHERE MaVaiTro = @Id";
            var affected = await conn.ExecuteAsync(sql, new { 
                dto.TenVaiTro, 
                dto.MoTa, 
                dto.TrangThai, 
                Id = id 
            });
            return affected > 0;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            using var conn = GetConnection();
            var sql = "DELETE FROM VaiTro WHERE MaVaiTro = @Id";
            var affected = await conn.ExecuteAsync(sql, new { Id = id });
            return affected > 0;
        }
    }
}
