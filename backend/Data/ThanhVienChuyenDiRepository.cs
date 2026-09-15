using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Dapper;
using MySqlConnector;
using backend.DTOs;

namespace backend.Data
{
    public class ThanhVienChuyenDiRepository : IThanhVienChuyenDiRepository
    {
        private readonly string _connectionString;

        public ThanhVienChuyenDiRepository(IConfiguration config)
        {
            _connectionString = config.GetConnectionString("DefaultConnection")!;
        }

        private MySqlConnection GetConnection() => new MySqlConnection(_connectionString);

        public async Task<IEnumerable<ThanhVienChuyenDiDto>> GetAllAsync()
        {
            using var conn = GetConnection();
            string query = "SELECT * FROM ThanhVienChuyenDi ORDER BY NgayThamGia DESC";
            return await conn.QueryAsync<ThanhVienChuyenDiDto>(query);
        }

        public async Task<ThanhVienChuyenDiDto> GetByIdAsync(int id)
        {
            using var conn = GetConnection();
            string query = "SELECT * FROM ThanhVienChuyenDi WHERE MaThanhVien = @Id";
            return await conn.QuerySingleOrDefaultAsync<ThanhVienChuyenDiDto>(query, new { Id = id });
        }

        public async Task<IEnumerable<ThanhVienChuyenDiDto>> GetByChuyenDiAsync(int maChuyenDi)
        {
            using var conn = GetConnection();
            string query = "SELECT * FROM ThanhVienChuyenDi WHERE MaChuyenDi = @MaChuyenDi ORDER BY NgayThamGia ASC";
            return await conn.QueryAsync<ThanhVienChuyenDiDto>(query, new { MaChuyenDi = maChuyenDi });
        }

        public async Task<int> CreateAsync(CreateThanhVienChuyenDiDto dto)
        {
            using var conn = GetConnection();
            string query = @"
                INSERT INTO ThanhVienChuyenDi (MaChuyenDi, MaNguoiDung, VaiTro, TrangThai, NgayThamGia) 
                VALUES (@MaChuyenDi, @MaNguoiDung, @VaiTro, @TrangThai, NOW());
                SELECT LAST_INSERT_ID();";
            return await conn.QuerySingleAsync<int>(query, dto);
        }

        public async Task<bool> UpdateAsync(int id, UpdateThanhVienChuyenDiDto dto)
        {
            using var conn = GetConnection();
            string query = @"
                UPDATE ThanhVienChuyenDi 
                SET VaiTro = @VaiTro, TrangThai = @TrangThai
                WHERE MaThanhVien = @Id";
            
            var parameters = new DynamicParameters(dto);
            parameters.Add("Id", id);
            
            int rowsAffected = await conn.ExecuteAsync(query, parameters);
            return rowsAffected > 0;
        }

        public async Task<bool> UpdateTrangThaiAsync(int id, string trangThai)
        {
            using var conn = GetConnection();
            string query = "UPDATE ThanhVienChuyenDi SET TrangThai = @TrangThai WHERE MaThanhVien = @Id";
            int rowsAffected = await conn.ExecuteAsync(query, new { Id = id, TrangThai = trangThai });
            return rowsAffected > 0;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            using var conn = GetConnection();
            string query = "DELETE FROM ThanhVienChuyenDi WHERE MaThanhVien = @Id";
            int rowsAffected = await conn.ExecuteAsync(query, new { Id = id });
            return rowsAffected > 0;
        }
    }
}
