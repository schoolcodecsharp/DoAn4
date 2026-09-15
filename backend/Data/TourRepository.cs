using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using backend.DTOs;
using Dapper;
using Microsoft.Extensions.Configuration;
using MySqlConnector;

namespace backend.Data
{
    public class TourRepository : ITourRepository
    {
        private readonly string _connectionString;

        public TourRepository(IConfiguration config)
        {
            _connectionString = config.GetConnectionString("DefaultConnection")!;
        }

        private MySqlConnection GetConnection() => new MySqlConnection(_connectionString);

        public async Task<IEnumerable<TourResponseDto>> GetAllAsync()
        {
            using var conn = GetConnection();
            var sql = "SELECT * FROM Tour";
            return await conn.QueryAsync<TourResponseDto>(sql);
        }

        public async Task<TourResponseDto> GetByIdAsync(int id)
        {
            using var conn = GetConnection();
            var sql = "SELECT * FROM Tour WHERE MaTour = @Id";
            return await conn.QuerySingleOrDefaultAsync<TourResponseDto>(sql, new { Id = id });
        }

        public async Task<IEnumerable<TourResponseDto>> GetFilteredToursAsync(string tinh, string keyword, string trangthai)
        {
            using var conn = GetConnection();
            var sql = "SELECT * FROM Tour WHERE 1=1";
            
            var param = new DynamicParameters();
            
            if (!string.IsNullOrEmpty(tinh))
            {
                sql += " AND (DiemKhoiHanh LIKE @Tinh OR DiemDen LIKE @Tinh)";
                param.Add("Tinh", $"%{tinh}%");
            }
            if (!string.IsNullOrEmpty(keyword))
            {
                sql += " AND (TenTour LIKE @Keyword OR MoTa LIKE @Keyword)";
                param.Add("Keyword", $"%{keyword}%");
            }
            if (!string.IsNullOrEmpty(trangthai))
            {
                sql += " AND TrangThai = @TrangThai";
                param.Add("TrangThai", trangthai);
            }
            
            return await conn.QueryAsync<TourResponseDto>(sql, param);
        }

        public async Task<int> CreateAsync(CreateTourDto dto)
        {
            using var conn = GetConnection();
            var sql = @"INSERT INTO Tour (MaNguoiTao, TenTour, MoTa, DiemKhoiHanh, DiemDen, SoNgay, SoDem, GiaTour, GiaTourMin, GiaTourMax, SoNguoiToiDa, SoNguoiToiThieu, AnhDaiDien, TrangThai, NgayTao, NgayCapNhat) 
                        VALUES (@MaNguoiTao, @TenTour, @MoTa, @DiemKhoiHanh, @DiemDen, @SoNgay, @SoDem, @GiaTour, @GiaTourMin, @GiaTourMax, @SoNguoiToiDa, @SoNguoiToiThieu, @AnhDaiDien, @TrangThai, NOW(), NOW());
                        SELECT LAST_INSERT_ID();";
            return await conn.ExecuteScalarAsync<int>(sql, dto);
        }

        public async Task<bool> UpdateAsync(int id, UpdateTourDto dto)
        {
            using var conn = GetConnection();
            var sql = @"UPDATE Tour SET MaNguoiTao = @MaNguoiTao, TenTour = @TenTour, MoTa = @MoTa, DiemKhoiHanh = @DiemKhoiHanh, DiemDen = @DiemDen, SoNgay = @SoNgay, SoDem = @SoDem, 
                        GiaTour = @GiaTour, GiaTourMin = @GiaTourMin, GiaTourMax = @GiaTourMax, SoNguoiToiDa = @SoNguoiToiDa, SoNguoiToiThieu = @SoNguoiToiThieu, AnhDaiDien = @AnhDaiDien, TrangThai = @TrangThai, NgayCapNhat = NOW() 
                        WHERE MaTour = @Id";
            var parameters = new DynamicParameters(dto);
            parameters.Add("Id", id);
            var affected = await conn.ExecuteAsync(sql, parameters);
            return affected > 0;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            using var conn = GetConnection();
            var sql = "DELETE FROM Tour WHERE MaTour = @Id";
            var affected = await conn.ExecuteAsync(sql, new { Id = id });
            return affected > 0;
        }
    }
}
