using System.Data;
using backend.DTOs;
using Dapper;
using Microsoft.Extensions.Configuration;
using MySqlConnector;

namespace backend.Data
{
    public class DiaDiemRepository : IDiaDiemRepository
    {
        private readonly string _connectionString;

        public DiaDiemRepository(IConfiguration config)
        {
            _connectionString = config.GetConnectionString("DefaultConnection")!;
        }

        private MySqlConnection GetConnection() => new MySqlConnection(_connectionString);

        public async Task<IEnumerable<DiaDiemDto>> GetAllAsync()
        {
            using var conn = GetConnection();
            return await conn.QueryAsync<DiaDiemDto>("SELECT * FROM DiaDiem");
        }

        public async Task<DiaDiemDto?> GetByIdAsync(int id)
        {
            using var conn = GetConnection();
            return await conn.QueryFirstOrDefaultAsync<DiaDiemDto>(
                "SELECT * FROM DiaDiem WHERE MaDiaDiem = @Id", new { Id = id });
        }

        public async Task<IEnumerable<DiaDiemDto>> GetByFilterAsync(string? tinh, int? maLoai, string? keyword)
        {
            using var conn = GetConnection();
            var sql = "SELECT * FROM DiaDiem WHERE 1=1";
            var parameters = new DynamicParameters();

            if (!string.IsNullOrEmpty(tinh))
            {
                sql += " AND TinhThanh = @Tinh";
                parameters.Add("Tinh", tinh);
            }
            if (maLoai.HasValue)
            {
                sql += " AND MaLoai = @MaLoai";
                parameters.Add("MaLoai", maLoai.Value);
            }
            if (!string.IsNullOrEmpty(keyword))
            {
                sql += " AND (TenDiaDiem LIKE @Keyword OR MoTa LIKE @Keyword)";
                parameters.Add("Keyword", $"%{keyword}%");
            }

            return await conn.QueryAsync<DiaDiemDto>(sql, parameters);
        }

        public async Task<int> CreateAsync(CreateDiaDiemDto dto)
        {
            using var conn = GetConnection();
            var sql = @"
                INSERT INTO DiaDiem (MaLoai, TenDiaDiem, MoTa, DiaChi, PhuongXa, QuanHuyen, TinhThanh, 
                                     ViDo, KinhDo, AnhDaiDien, GiaVe, GiaVeMin, GiaVeMax, GioMoCua, 
                                     GioDongCua, ThoiGianThamQuan, TrangThai, NgayTao, NgayCapNhat)
                VALUES (@MaLoai, @TenDiaDiem, @MoTa, @DiaChi, @PhuongXa, @QuanHuyen, @TinhThanh, 
                        @ViDo, @KinhDo, @AnhDaiDien, @GiaVe, @GiaVeMin, @GiaVeMax, @GioMoCua, 
                        @GioDongCua, @ThoiGianThamQuan, @TrangThai, NOW(), NOW());
                SELECT LAST_INSERT_ID();";
            return await conn.ExecuteScalarAsync<int>(sql, dto);
        }

        public async Task<bool> UpdateAsync(int id, UpdateDiaDiemDto dto)
        {
            using var conn = GetConnection();
            var sql = @"
                UPDATE DiaDiem SET 
                    MaLoai = @MaLoai, TenDiaDiem = @TenDiaDiem, MoTa = @MoTa, DiaChi = @DiaChi, 
                    PhuongXa = @PhuongXa, QuanHuyen = @QuanHuyen, TinhThanh = @TinhThanh, 
                    ViDo = @ViDo, KinhDo = @KinhDo, AnhDaiDien = @AnhDaiDien, GiaVe = @GiaVe, 
                    GiaVeMin = @GiaVeMin, GiaVeMax = @GiaVeMax, GioMoCua = @GioMoCua, 
                    GioDongCua = @GioDongCua, ThoiGianThamQuan = @ThoiGianThamQuan, 
                    TrangThai = @TrangThai, NgayCapNhat = NOW()
                WHERE MaDiaDiem = @Id";
            var parameters = new DynamicParameters(dto);
            parameters.Add("Id", id);
            
            var affected = await conn.ExecuteAsync(sql, parameters);
            return affected > 0;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            using var conn = GetConnection();
            var affected = await conn.ExecuteAsync("DELETE FROM DiaDiem WHERE MaDiaDiem = @Id", new { Id = id });
            return affected > 0;
        }
    }
}
