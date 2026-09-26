using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using backend.DTOs;
using Dapper;
using Microsoft.Extensions.Configuration;
using MySqlConnector;

namespace backend.Data
{
    public class TourKhoiHanhRepository : ITourKhoiHanhRepository
    {
        private readonly string _connectionString;

        public TourKhoiHanhRepository(IConfiguration config)
        {
            _connectionString = config.GetConnectionString("DefaultConnection")!;
        }

        private MySqlConnection GetConnection() => new MySqlConnection(_connectionString);

        public async Task<IEnumerable<TourKhoiHanhResponseDto>> GetAllAsync()
        {
            using var conn = GetConnection();
            var sql = "SELECT * FROM TourKhoiHanh";
            return await conn.QueryAsync<TourKhoiHanhResponseDto>(sql);
        }

        public async Task<TourKhoiHanhResponseDto> GetByIdAsync(int id)
        {
            using var conn = GetConnection();
            var sql = "SELECT * FROM TourKhoiHanh WHERE MaKhoiHanh = @Id";
            return await conn.QuerySingleOrDefaultAsync<TourKhoiHanhResponseDto>(sql, new { Id = id });
        }

        public async Task<IEnumerable<TourKhoiHanhResponseDto>> GetByTourAsync(int maTour)
        {
            using var conn = GetConnection();
            var sql = "SELECT * FROM TourKhoiHanh WHERE MaTour = @MaTour";
            return await conn.QueryAsync<TourKhoiHanhResponseDto>(sql, new { MaTour = maTour });
        }

        public async Task<int> CreateAsync(CreateTourKhoiHanhDto dto)
        {
            if(dto.SoChoToiDa < 1 || dto.GiaApDung < 0 || dto.SoChoDaDat != 0) throw new backend.Security.RequestRuleException("Lịch mới phải có số chỗ dương, giá không âm và chưa có chỗ đã đặt.");
            using var conn = GetConnection();
            var sql = @"INSERT INTO TourKhoiHanh (MaTour, NgayKhoiHanh, SoChoToiDa, SoChoDaDat, GiaApDung, TrangThai) 
                        VALUES (@MaTour, @NgayKhoiHanh, @SoChoToiDa, @SoChoDaDat, @GiaApDung, @TrangThai);
                        SELECT LAST_INSERT_ID();";
            return await conn.ExecuteScalarAsync<int>(sql, dto);
        }

        public async Task<bool> UpdateAsync(int id, UpdateTourKhoiHanhDto dto)
        {
            if(dto.SoChoToiDa < 1 || dto.GiaApDung < 0) throw new backend.Security.RequestRuleException("Số chỗ phải dương và giá không âm.");
            using var conn = GetConnection();
            var current = await conn.QuerySingleOrDefaultAsync<TourKhoiHanhResponseDto>("SELECT * FROM TourKhoiHanh WHERE MaKhoiHanh=@id",new{id});
            if(current == null) return false;
            if(current.MaTour != dto.MaTour || current.NgayKhoiHanh.Date != dto.NgayKhoiHanh.Date)
                throw new backend.Security.RequestRuleException("Không đổi tour/ngày của đợt đã tạo. Hãy tạo đợt mới để bảo toàn đơn đặt.");
            var sql = @"UPDATE TourKhoiHanh SET SoChoToiDa = @SoChoToiDa,
                        GiaApDung = @GiaApDung, TrangThai = @TrangThai 
                        WHERE MaKhoiHanh = @Id AND SoChoDaDat <= @SoChoToiDa";
            var parameters = new DynamicParameters(dto);
            parameters.Add("Id", id);
            var affected = await conn.ExecuteAsync(sql, parameters);
            if(affected == 0) throw new backend.Security.RequestRuleException("Tổng số chỗ không được thấp hơn số chỗ đã đặt.",409);
            return true;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            using var conn = GetConnection();
            var sql = "UPDATE TourKhoiHanh SET TrangThai='FullyBooked' WHERE MaKhoiHanh = @Id";
            var affected = await conn.ExecuteAsync(sql, new { Id = id });
            return affected > 0;
        }
    }
}
