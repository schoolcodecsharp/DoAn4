using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Dapper;
using MySqlConnector;
using backend.DTOs;

namespace backend.Data
{
    public class LichTrinhChiTietRepository : ILichTrinhChiTietRepository
    {
        private readonly string _connectionString;

        public LichTrinhChiTietRepository(IConfiguration config)
        {
            _connectionString = config.GetConnectionString("DefaultConnection")!;
        }

        private MySqlConnection GetConnection() => new MySqlConnection(_connectionString);

        public async Task<IEnumerable<LichTrinhChiTietDto>> GetAllAsync()
        {
            using var conn = GetConnection();
            string query = "SELECT * FROM LichTrinhChiTiet ORDER BY ThuTu ASC";
            return await conn.QueryAsync<LichTrinhChiTietDto>(query);
        }

        public async Task<LichTrinhChiTietDto> GetByIdAsync(int id)
        {
            using var conn = GetConnection();
            string query = "SELECT * FROM LichTrinhChiTiet WHERE MaChiTiet = @Id";
            return await conn.QuerySingleOrDefaultAsync<LichTrinhChiTietDto>(query, new { Id = id });
        }

        public async Task<IEnumerable<LichTrinhChiTietDto>> GetByLichTrinhAsync(int maLichTrinh)
        {
            using var conn = GetConnection();
            string query = "SELECT * FROM LichTrinhChiTiet WHERE MaLichTrinh = @MaLichTrinh ORDER BY ThuTu ASC";
            return await conn.QueryAsync<LichTrinhChiTietDto>(query, new { MaLichTrinh = maLichTrinh });
        }

        public async Task<int> CreateAsync(CreateLichTrinhChiTietDto dto)
        {
            using var conn = GetConnection();
            string query = @"
                INSERT INTO LichTrinhChiTiet (MaLichTrinh, ThuTu, LoaiDiaDiem, MaDiaDiem, MaNhaHang, MaKhachSan, ThoiGianBatDau, ThoiGianKetThuc, ChiPhi, GhiChu) 
                VALUES (@MaLichTrinh, @ThuTu, @LoaiDiaDiem, @MaDiaDiem, @MaNhaHang, @MaKhachSan, @ThoiGianBatDau, @ThoiGianKetThuc, @ChiPhi, @GhiChu);
                SELECT LAST_INSERT_ID();";
            return await conn.QuerySingleAsync<int>(query, dto);
        }

        public async Task<bool> UpdateAsync(int id, UpdateLichTrinhChiTietDto dto)
        {
            using var conn = GetConnection();
            string query = @"
                UPDATE LichTrinhChiTiet 
                SET ThuTu = @ThuTu, 
                    LoaiDiaDiem = @LoaiDiaDiem, 
                    MaDiaDiem = @MaDiaDiem, 
                    MaNhaHang = @MaNhaHang, 
                    MaKhachSan = @MaKhachSan, 
                    ThoiGianBatDau = @ThoiGianBatDau, 
                    ThoiGianKetThuc = @ThoiGianKetThuc, 
                    ChiPhi = @ChiPhi, 
                    GhiChu = @GhiChu
                WHERE MaChiTiet = @Id";
            
            var parameters = new DynamicParameters(dto);
            parameters.Add("Id", id);
            
            int rowsAffected = await conn.ExecuteAsync(query, parameters);
            return rowsAffected > 0;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            using var conn = GetConnection();
            string query = "DELETE FROM LichTrinhChiTiet WHERE MaChiTiet = @Id";
            int rowsAffected = await conn.ExecuteAsync(query, new { Id = id });
            return rowsAffected > 0;
        }
    }
}
