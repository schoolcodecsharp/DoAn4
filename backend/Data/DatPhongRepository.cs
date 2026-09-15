using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using backend.DTOs;
using Dapper;
using Microsoft.Extensions.Configuration;
using MySqlConnector;

namespace backend.Data
{
    public class DatPhongRepository : IDatPhongRepository
    {
        private readonly string _connectionString;

        public DatPhongRepository(IConfiguration config)
        {
            _connectionString = config.GetConnectionString("DefaultConnection")!;
        }

        private MySqlConnection GetConnection() => new MySqlConnection(_connectionString);

        public async Task<IEnumerable<DatPhongResponseDto>> GetAllAsync()
        {
            using var conn = GetConnection();
            var sql = "SELECT * FROM DatPhong";
            return await conn.QueryAsync<DatPhongResponseDto>(sql);
        }

        public async Task<DatPhongResponseDto> GetByIdAsync(int id)
        {
            using var conn = GetConnection();
            var sql = "SELECT * FROM DatPhong WHERE MaDatPhong = @Id";
            return await conn.QuerySingleOrDefaultAsync<DatPhongResponseDto>(sql, new { Id = id });
        }

        public async Task<IEnumerable<DatPhongResponseDto>> GetByNguoiDungAsync(int maNguoiDung)
        {
            using var conn = GetConnection();
            var sql = "SELECT * FROM DatPhong WHERE MaNguoiDung = @MaNguoiDung";
            return await conn.QueryAsync<DatPhongResponseDto>(sql, new { MaNguoiDung = maNguoiDung });
        }

        public async Task<int> CreateAsync(CreateDatPhongDto dto)
        {
            using var conn = GetConnection();
            var sql = @"INSERT INTO DatPhong (MaNguoiDung, MaLoaiPhong, NgayNhanPhong, NgayTraPhong, SoLuongPhong, SoNguoi, GiaMoiDem, TongTien, TrangThai, GhiChu) 
                        VALUES (@MaNguoiDung, @MaLoaiPhong, @NgayNhanPhong, @NgayTraPhong, @SoLuongPhong, @SoNguoi, @GiaMoiDem, @TongTien, @TrangThai, @GhiChu);
                        SELECT LAST_INSERT_ID();";
            return await conn.ExecuteScalarAsync<int>(sql, dto);
        }

        public async Task<bool> UpdateAsync(int id, UpdateDatPhongDto dto)
        {
            using var conn = GetConnection();
            var sql = @"UPDATE DatPhong SET MaNguoiDung = @MaNguoiDung, MaLoaiPhong = @MaLoaiPhong, NgayNhanPhong = @NgayNhanPhong, NgayTraPhong = @NgayTraPhong, 
                        SoLuongPhong = @SoLuongPhong, SoNguoi = @SoNguoi, GiaMoiDem = @GiaMoiDem, TongTien = @TongTien, TrangThai = @TrangThai, GhiChu = @GhiChu 
                        WHERE MaDatPhong = @Id";
            var parameters = new DynamicParameters(dto);
            parameters.Add("Id", id);
            var affected = await conn.ExecuteAsync(sql, parameters);
            return affected > 0;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            using var conn = GetConnection();
            var sql = "DELETE FROM DatPhong WHERE MaDatPhong = @Id";
            var affected = await conn.ExecuteAsync(sql, new { Id = id });
            return affected > 0;
        }
    }
}
