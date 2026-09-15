using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Dapper;
using MySqlConnector;
using backend.DTOs;

namespace backend.Data
{
    public class ChuyenDiRepository : IChuyenDiRepository
    {
        private readonly string _connectionString;

        public ChuyenDiRepository(IConfiguration config)
        {
            _connectionString = config.GetConnectionString("DefaultConnection")!;
        }

        private MySqlConnection GetConnection() => new MySqlConnection(_connectionString);

        public async Task<IEnumerable<ChuyenDiDto>> GetAllAsync()
        {
            using var conn = GetConnection();
            string query = "SELECT * FROM ChuyenDi ORDER BY NgayTao DESC";
            return await conn.QueryAsync<ChuyenDiDto>(query);
        }

        public async Task<ChuyenDiDto> GetByIdAsync(int id)
        {
            using var conn = GetConnection();
            string query = "SELECT * FROM ChuyenDi WHERE MaChuyenDi = @Id";
            return await conn.QuerySingleOrDefaultAsync<ChuyenDiDto>(query, new { Id = id });
        }

        public async Task<IEnumerable<ChuyenDiDto>> GetByNguoiDungAsync(int maNguoiDung)
        {
            using var conn = GetConnection();
            string query = "SELECT * FROM ChuyenDi WHERE MaNguoiDung = @MaNguoiDung ORDER BY NgayTao DESC";
            return await conn.QueryAsync<ChuyenDiDto>(query, new { MaNguoiDung = maNguoiDung });
        }

        public async Task<int> CreateAsync(CreateChuyenDiDto dto)
        {
            using var conn = GetConnection();
            string query = @"
                INSERT INTO ChuyenDi (MaNguoiDung, TenChuyenDi, DiemKhoiHanh, DiemDen, NgayBatDau, NgayKetThuc, SoNguoi, NganSach, MoTa, TrangThai, NgayTao, NgayCapNhat) 
                VALUES (@MaNguoiDung, @TenChuyenDi, @DiemKhoiHanh, @DiemDen, @NgayBatDau, @NgayKetThuc, @SoNguoi, @NganSach, @MoTa, @TrangThai, NOW(), NOW());
                SELECT LAST_INSERT_ID();";
            return await conn.QuerySingleAsync<int>(query, dto);
        }

        public async Task<bool> UpdateAsync(int id, UpdateChuyenDiDto dto)
        {
            using var conn = GetConnection();
            string query = @"
                UPDATE ChuyenDi 
                SET TenChuyenDi = @TenChuyenDi, 
                    DiemKhoiHanh = @DiemKhoiHanh, 
                    DiemDen = @DiemDen, 
                    NgayBatDau = @NgayBatDau, 
                    NgayKetThuc = @NgayKetThuc, 
                    SoNguoi = @SoNguoi, 
                    NganSach = @NganSach, 
                    MoTa = @MoTa, 
                    TrangThai = @TrangThai,
                    NgayCapNhat = NOW()
                WHERE MaChuyenDi = @Id";
            
            var parameters = new DynamicParameters(dto);
            parameters.Add("Id", id);
            
            int rowsAffected = await conn.ExecuteAsync(query, parameters);
            return rowsAffected > 0;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            using var conn = GetConnection();
            string query = "DELETE FROM ChuyenDi WHERE MaChuyenDi = @Id";
            int rowsAffected = await conn.ExecuteAsync(query, new { Id = id });
            return rowsAffected > 0;
        }
    }
}
