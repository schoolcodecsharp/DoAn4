using System.Data;
using backend.DTOs;
using Dapper;
using Microsoft.Extensions.Configuration;
using MySqlConnector;

namespace backend.Data
{
    public class KhachSanRepository : IKhachSanRepository
    {
        private readonly string _connectionString;

        public KhachSanRepository(IConfiguration config)
        {
            _connectionString = config.GetConnectionString("DefaultConnection")!;
        }

        private MySqlConnection GetConnection() => new MySqlConnection(_connectionString);

        public async Task<IEnumerable<KhachSanDto>> GetAllAsync()
        {
            using var conn = GetConnection();
            return await conn.QueryAsync<KhachSanDto>("SELECT * FROM KhachSan");
        }

        public async Task<KhachSanDto?> GetByIdAsync(int id)
        {
            using var conn = GetConnection();
            return await conn.QueryFirstOrDefaultAsync<KhachSanDto>(
                "SELECT * FROM KhachSan WHERE MaKhachSan = @Id", new { Id = id });
        }

        public async Task<IEnumerable<KhachSanDto>> GetByFilterAsync(string? tinh, string? loai, string? keyword)
        {
            using var conn = GetConnection();
            var sql = "SELECT * FROM KhachSan WHERE 1=1";
            var parameters = new DynamicParameters();

            if (!string.IsNullOrEmpty(tinh))
            {
                sql += " AND TinhThanh = @Tinh";
                parameters.Add("Tinh", tinh);
            }
            if (!string.IsNullOrEmpty(loai))
            {
                sql += " AND LoaiLuuTru = @Loai";
                parameters.Add("Loai", loai);
            }
            if (!string.IsNullOrEmpty(keyword))
            {
                sql += " AND (TenKhachSan LIKE @Keyword OR MoTa LIKE @Keyword)";
                parameters.Add("Keyword", $"%{keyword}%");
            }

            return await conn.QueryAsync<KhachSanDto>(sql, parameters);
        }

        public async Task<int> CreateAsync(CreateKhachSanDto dto)
        {
            using var conn = GetConnection();
            var sql = @"
                INSERT INTO KhachSan (TenKhachSan, LoaiLuuTru, MoTa, DiaChi, PhuongXa, QuanHuyen, 
                                      TinhThanh, ViDo, KinhDo, GiaPhongMin, GiaPhongMax, 
                                      SoDienThoai, TrangThai, NgayTao, NgayCapNhat)
                VALUES (@TenKhachSan, @LoaiLuuTru, @MoTa, @DiaChi, @PhuongXa, @QuanHuyen, 
                        @TinhThanh, @ViDo, @KinhDo, @GiaPhongMin, @GiaPhongMax, 
                        @SoDienThoai, @TrangThai, NOW(), NOW());
                SELECT LAST_INSERT_ID();";
            return await conn.ExecuteScalarAsync<int>(sql, dto);
        }

        public async Task<bool> UpdateAsync(int id, UpdateKhachSanDto dto)
        {
            using var conn = GetConnection();
            var sql = @"
                UPDATE KhachSan SET 
                    TenKhachSan = @TenKhachSan, LoaiLuuTru = @LoaiLuuTru, MoTa = @MoTa, DiaChi = @DiaChi, 
                    PhuongXa = @PhuongXa, QuanHuyen = @QuanHuyen, TinhThanh = @TinhThanh, 
                    ViDo = @ViDo, KinhDo = @KinhDo, GiaPhongMin = @GiaPhongMin, 
                    GiaPhongMax = @GiaPhongMax, SoDienThoai = @SoDienThoai, TrangThai = @TrangThai, 
                    NgayCapNhat = NOW()
                WHERE MaKhachSan = @Id";
            var parameters = new DynamicParameters(dto);
            parameters.Add("Id", id);
            
            var affected = await conn.ExecuteAsync(sql, parameters);
            return affected > 0;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            using var conn = GetConnection();
            var affected = await conn.ExecuteAsync("UPDATE KhachSan SET TrangThai=0 WHERE MaKhachSan = @Id", new { Id = id });
            return affected > 0;
        }
    }
}
