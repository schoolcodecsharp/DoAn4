using System.Data;
using backend.DTOs;
using Dapper;
using Microsoft.Extensions.Configuration;
using MySqlConnector;

namespace backend.Data
{
    public class NhaHangRepository : INhaHangRepository
    {
        private readonly string _connectionString;

        public NhaHangRepository(IConfiguration config)
        {
            _connectionString = config.GetConnectionString("DefaultConnection")!;
        }

        private MySqlConnection GetConnection() => new MySqlConnection(_connectionString);

        public async Task<IEnumerable<NhaHangDto>> GetAllAsync()
        {
            using var conn = GetConnection();
            return await conn.QueryAsync<NhaHangDto>("SELECT * FROM NhaHang");
        }

        public async Task<NhaHangDto?> GetByIdAsync(int id)
        {
            using var conn = GetConnection();
            return await conn.QueryFirstOrDefaultAsync<NhaHangDto>(
                "SELECT * FROM NhaHang WHERE MaNhaHang = @Id", new { Id = id });
        }

        public async Task<int> CreateAsync(CreateNhaHangDto dto)
        {
            using var conn = GetConnection();
            var sql = @"
                INSERT INTO NhaHang (TenNhaHang, MoTa, DiaChi, PhuongXa, QuanHuyen, TinhThanh, 
                                     ViDo, KinhDo, GiaMin, GiaMax, GioMoCua, 
                                     GioDongCua, SoDienThoai, TrangThai, NgayTao, NgayCapNhat)
                VALUES (@TenNhaHang, @MoTa, @DiaChi, @PhuongXa, @QuanHuyen, @TinhThanh, 
                        @ViDo, @KinhDo, @GiaMin, @GiaMax, @GioMoCua, 
                        @GioDongCua, @SoDienThoai, @TrangThai, NOW(), NOW());
                SELECT LAST_INSERT_ID();";
            return await conn.ExecuteScalarAsync<int>(sql, dto);
        }

        public async Task<bool> UpdateAsync(int id, UpdateNhaHangDto dto)
        {
            using var conn = GetConnection();
            var sql = @"
                UPDATE NhaHang SET 
                    TenNhaHang = @TenNhaHang, MoTa = @MoTa, DiaChi = @DiaChi, 
                    PhuongXa = @PhuongXa, QuanHuyen = @QuanHuyen, TinhThanh = @TinhThanh, 
                    ViDo = @ViDo, KinhDo = @KinhDo, GiaMin = @GiaMin, 
                    GiaMax = @GiaMax, GioMoCua = @GioMoCua, GioDongCua = @GioDongCua, 
                    SoDienThoai = @SoDienThoai, TrangThai = @TrangThai, NgayCapNhat = NOW()
                WHERE MaNhaHang = @Id";
            var parameters = new DynamicParameters(dto);
            parameters.Add("Id", id);
            
            var affected = await conn.ExecuteAsync(sql, parameters);
            return affected > 0;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            using var conn = GetConnection();
            var affected = await conn.ExecuteAsync("UPDATE NhaHang SET TrangThai=0 WHERE MaNhaHang = @Id", new { Id = id });
            return affected > 0;
        }
    }
}
