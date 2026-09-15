using System.Data;
using backend.DTOs;
using Dapper;
using Microsoft.Extensions.Configuration;
using MySqlConnector;

namespace backend.Data
{
    public class LoaiPhongRepository : ILoaiPhongRepository
    {
        private readonly string _connectionString;

        public LoaiPhongRepository(IConfiguration config)
        {
            _connectionString = config.GetConnectionString("DefaultConnection")!;
        }

        private MySqlConnection GetConnection() => new MySqlConnection(_connectionString);

        public async Task<IEnumerable<LoaiPhongDto>> GetAllAsync()
        {
            using var conn = GetConnection();
            return await conn.QueryAsync<LoaiPhongDto>("SELECT * FROM LoaiPhong");
        }

        public async Task<LoaiPhongDto?> GetByIdAsync(int id)
        {
            using var conn = GetConnection();
            return await conn.QueryFirstOrDefaultAsync<LoaiPhongDto>(
                "SELECT * FROM LoaiPhong WHERE MaLoaiPhong = @Id", new { Id = id });
        }

        public async Task<IEnumerable<LoaiPhongDto>> GetByKhachSanAsync(int maKhachSan)
        {
            using var conn = GetConnection();
            return await conn.QueryAsync<LoaiPhongDto>(
                "SELECT * FROM LoaiPhong WHERE MaKhachSan = @MaKhachSan", new { MaKhachSan = maKhachSan });
        }

        public async Task<int> CreateAsync(CreateLoaiPhongDto dto)
        {
            using var conn = GetConnection();
            var sql = @"
                INSERT INTO LoaiPhong (MaKhachSan, TenLoaiPhong, MoTa, SucChua, SoLuongPhong, 
                                       GiaMoiDem, AnhDaiDien, TrangThai)
                VALUES (@MaKhachSan, @TenLoaiPhong, @MoTa, @SucChua, @SoLuongPhong, 
                        @GiaMoiDem, @AnhDaiDien, @TrangThai);
                SELECT LAST_INSERT_ID();";
            return await conn.ExecuteScalarAsync<int>(sql, dto);
        }

        public async Task<bool> UpdateAsync(int id, UpdateLoaiPhongDto dto)
        {
            using var conn = GetConnection();
            var sql = @"
                UPDATE LoaiPhong SET 
                    MaKhachSan = @MaKhachSan, TenLoaiPhong = @TenLoaiPhong, MoTa = @MoTa, 
                    SucChua = @SucChua, SoLuongPhong = @SoLuongPhong, GiaMoiDem = @GiaMoiDem, 
                    AnhDaiDien = @AnhDaiDien, TrangThai = @TrangThai
                WHERE MaLoaiPhong = @Id";
            var parameters = new DynamicParameters(dto);
            parameters.Add("Id", id);
            
            var affected = await conn.ExecuteAsync(sql, parameters);
            return affected > 0;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            using var conn = GetConnection();
            var affected = await conn.ExecuteAsync("DELETE FROM LoaiPhong WHERE MaLoaiPhong = @Id", new { Id = id });
            return affected > 0;
        }
    }
}
