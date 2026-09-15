using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using MySqlConnector;
using Dapper;
using backend.DTOs;
using System;

namespace backend.Data
{
    public class NguoiDungRepository : INguoiDungRepository
    {
        private readonly string _connectionString;

        public NguoiDungRepository(IConfiguration config)
        {
            _connectionString = config.GetConnectionString("DefaultConnection")!;
        }

        private MySqlConnection GetConnection() => new MySqlConnection(_connectionString);

        public async Task<IEnumerable<NguoiDungResponseDto>> GetAllAsync()
        {
            using var conn = GetConnection();
            return await conn.QueryAsync<NguoiDungResponseDto>("SELECT * FROM NguoiDung");
        }

        public async Task<NguoiDungResponseDto?> GetByIdAsync(int id)
        {
            using var conn = GetConnection();
            return await conn.QuerySingleOrDefaultAsync<NguoiDungResponseDto>(
                "SELECT * FROM NguoiDung WHERE MaNguoiDung = @Id", new { Id = id });
        }

        public async Task<NguoiDungResponseDto?> GetByEmailAsync(string email)
        {
            using var conn = GetConnection();
            return await conn.QuerySingleOrDefaultAsync<NguoiDungResponseDto>(
                "SELECT * FROM NguoiDung WHERE Email = @Email", new { Email = email });
        }

        public async Task<NguoiDungCredentialsDto?> GetCredentialsByEmailAsync(string email)
        {
            using var conn = GetConnection();
            return await conn.QuerySingleOrDefaultAsync<NguoiDungCredentialsDto>(
                "SELECT * FROM NguoiDung WHERE Email = @Email", new { Email = email });
        }

        public async Task<int> CreateAsync(CreateNguoiDungDto dto)
        {
            using var conn = GetConnection();
            var sql = @"INSERT INTO NguoiDung (MaVaiTro, HoTen, Email, MatKhau, SoDienThoai, AnhDaiDien, NgaySinh, GioiTinh, NgayTao, NgayCapNhat, TrangThai) 
                        VALUES (@MaVaiTro, @HoTen, @Email, @MatKhau, @SoDienThoai, @AnhDaiDien, @NgaySinh, @GioiTinh, @NgayTao, @NgayCapNhat, @TrangThai);
                        SELECT LAST_INSERT_ID();";
            
            var hashedPassword = BCrypt.Net.BCrypt.HashPassword(dto.MatKhau);
            
            return await conn.ExecuteScalarAsync<int>(sql, new {
                dto.MaVaiTro,
                dto.HoTen,
                dto.Email,
                MatKhau = hashedPassword,
                dto.SoDienThoai,
                dto.AnhDaiDien,
                dto.NgaySinh,
                dto.GioiTinh,
                NgayTao = DateTime.Now,
                NgayCapNhat = DateTime.Now,
                dto.TrangThai
            });
        }

        public async Task<bool> UpdateAsync(int id, UpdateNguoiDungDto dto)
        {
            using var conn = GetConnection();
            var sql = @"UPDATE NguoiDung 
                        SET MaVaiTro = @MaVaiTro, HoTen = @HoTen, Email = @Email, 
                            SoDienThoai = @SoDienThoai, AnhDaiDien = @AnhDaiDien, 
                            NgaySinh = @NgaySinh, GioiTinh = @GioiTinh, NgayCapNhat = @NgayCapNhat, TrangThai = @TrangThai 
                        WHERE MaNguoiDung = @Id";
            var affected = await conn.ExecuteAsync(sql, new { 
                dto.MaVaiTro,
                dto.HoTen,
                dto.Email,
                dto.SoDienThoai,
                dto.AnhDaiDien,
                dto.NgaySinh,
                dto.GioiTinh,
                NgayCapNhat = DateTime.Now,
                dto.TrangThai, 
                Id = id 
            });
            return affected > 0;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            using var conn = GetConnection();
            var sql = "DELETE FROM NguoiDung WHERE MaNguoiDung = @Id";
            var affected = await conn.ExecuteAsync(sql, new { Id = id });
            return affected > 0;
        }
    }
}
