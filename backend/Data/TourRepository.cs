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
        private const string SelectTours = """
            SELECT Tour.*, (
                SELECT GROUP_CONCAT(DISTINCT d.TinhThanh ORDER BY d.TinhThanh SEPARATOR ', ')
                FROM TourChiTiet ct JOIN DiaDiem d ON d.MaDiaDiem = ct.MaDiaDiem
                WHERE ct.MaTour = Tour.MaTour
            ) AS TinhThanh FROM Tour
            """;
        private readonly string _connectionString;

        public TourRepository(IConfiguration config)
        {
            _connectionString = config.GetConnectionString("DefaultConnection")!;
        }

        private MySqlConnection GetConnection() => new MySqlConnection(_connectionString);

        public async Task<IEnumerable<TourResponseDto>> GetAllAsync()
        {
            using var conn = GetConnection();
            var sql = SelectTours;
            return await conn.QueryAsync<TourResponseDto>(sql);
        }

        public async Task<TourResponseDto> GetByIdAsync(int id)
        {
            using var conn = GetConnection();
            var sql = SelectTours + " WHERE MaTour = @Id";
            return await conn.QuerySingleOrDefaultAsync<TourResponseDto>(sql, new { Id = id });
        }

        public async Task<IEnumerable<TourResponseDto>> GetFilteredToursAsync(string tinh, string keyword, string trangthai)
        {
            using var conn = GetConnection();
            var sql = SelectTours + " WHERE 1=1";
            
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
            backend.Services.TourRules.Validate(dto.TenTour, dto.DiemKhoiHanh, dto.DiemDen, dto.SoNgay, dto.SoDem,
                dto.GiaTour, dto.GiaTourMin, dto.GiaTourMax, dto.SoNguoiToiThieu, dto.SoNguoiToiDa, dto.TrangThai);
            using var conn = GetConnection();
            var sql = @"INSERT INTO Tour (MaNguoiTao, TenTour, MoTa, DiemKhoiHanh, DiemDen, SoNgay, SoDem, GiaTour, GiaTourMin, GiaTourMax, SoNguoiToiDa, SoNguoiToiThieu, TrangThai, NgayTao, NgayCapNhat) 
                        VALUES (@MaNguoiTao, @TenTour, @MoTa, @DiemKhoiHanh, @DiemDen, @SoNgay, @SoDem, @GiaTour, @GiaTourMin, @GiaTourMax, @SoNguoiToiDa, @SoNguoiToiThieu, @TrangThai, NOW(), NOW());
                        SELECT LAST_INSERT_ID();";
            return await conn.ExecuteScalarAsync<int>(sql, dto);
        }

        public async Task<bool> UpdateAsync(int id, UpdateTourDto dto)
        {
            backend.Services.TourRules.Validate(dto.TenTour, dto.DiemKhoiHanh, dto.DiemDen, dto.SoNgay, dto.SoDem,
                dto.GiaTour, dto.GiaTourMin, dto.GiaTourMax, dto.SoNguoiToiThieu, dto.SoNguoiToiDa, dto.TrangThai);
            using var conn = GetConnection();
            if(dto.SoNgay < 1 || dto.SoDem < 0 || dto.GiaTour < 0 || dto.SoNguoiToiThieu < 1 || dto.SoNguoiToiDa < dto.SoNguoiToiThieu ||
                await conn.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM TourChiTiet WHERE MaTour=@id AND NgayThu>@SoNgay",new{id,dto.SoNgay}) > 0)
                throw new backend.Security.RequestRuleException("Thời lượng, giá hoặc số khách không hợp lệ. Không thể giảm số ngày làm mất ngày đang có hoạt động.");
            var sql = @"UPDATE Tour SET MaNguoiTao = @MaNguoiTao, TenTour = @TenTour, MoTa = @MoTa, DiemKhoiHanh = @DiemKhoiHanh, DiemDen = @DiemDen, SoNgay = @SoNgay, SoDem = @SoDem, 
                        GiaTour = @GiaTour, GiaTourMin = @GiaTourMin, GiaTourMax = @GiaTourMax, SoNguoiToiDa = @SoNguoiToiDa, SoNguoiToiThieu = @SoNguoiToiThieu, TrangThai = @TrangThai, NgayCapNhat = NOW() 
                        WHERE MaTour = @Id";
            var parameters = new DynamicParameters(dto);
            parameters.Add("Id", id);
            var affected = await conn.ExecuteAsync(sql, parameters);
            return affected > 0;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            using var conn = GetConnection();
            var sql = "UPDATE Tour SET TrangThai='Inactive' WHERE MaTour = @Id";
            var affected = await conn.ExecuteAsync(sql, new { Id = id });
            return affected > 0;
        }
    }
}
