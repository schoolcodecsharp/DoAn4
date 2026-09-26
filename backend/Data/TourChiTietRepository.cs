using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using backend.DTOs;
using Dapper;
using Microsoft.Extensions.Configuration;
using MySqlConnector;

namespace backend.Data
{
    public class TourChiTietRepository : ITourChiTietRepository
    {
        private const string SelectActivities = """
            SELECT ct.*, COALESCE(d.TenDiaDiem, n.TenNhaHang, k.TenKhachSan) AS TenDiaDiem,
                COALESCE(d.MoTa, n.MoTa, k.MoTa) AS MoTa,
                COALESCE(d.DiaChi, n.DiaChi, k.DiaChi) AS DiaChi
            FROM TourChiTiet ct
            LEFT JOIN DiaDiem d ON ct.MaDiaDiem = d.MaDiaDiem AND ct.LoaiDiaDiem = 'DiaDiem'
            LEFT JOIN NhaHang n ON ct.MaNhaHang = n.MaNhaHang AND ct.LoaiDiaDiem = 'NhaHang'
            LEFT JOIN KhachSan k ON ct.MaKhachSan = k.MaKhachSan AND ct.LoaiDiaDiem = 'KhachSan'
            """;
        private readonly string _connectionString;

        public TourChiTietRepository(IConfiguration config)
        {
            _connectionString = config.GetConnectionString("DefaultConnection")!;
        }

        private MySqlConnection GetConnection() => new MySqlConnection(_connectionString);

        public async Task<IEnumerable<TourChiTietResponseDto>> GetAllAsync()
        {
            using var conn = GetConnection();
            var sql = SelectActivities + " ORDER BY ct.MaTour, ct.NgayThu, ct.ThuTu, ct.MaTourChiTiet";
            return await conn.QueryAsync<TourChiTietResponseDto>(sql);
        }

        public async Task<TourChiTietResponseDto> GetByIdAsync(int id)
        {
            using var conn = GetConnection();
            var sql = SelectActivities + " WHERE ct.MaTourChiTiet = @Id";
            return await conn.QuerySingleOrDefaultAsync<TourChiTietResponseDto>(sql, new { Id = id });
        }

        public async Task<IEnumerable<TourChiTietResponseDto>> GetByTourAsync(int maTour)
        {
            using var conn = GetConnection();
            var sql = SelectActivities + " WHERE ct.MaTour = @MaTour ORDER BY ct.NgayThu, ct.ThuTu, ct.MaTourChiTiet";
            return await conn.QueryAsync<TourChiTietResponseDto>(sql, new { MaTour = maTour });
        }

        public async Task<int> CreateAsync(CreateTourChiTietDto dto)
        {
            using var conn = GetConnection();
            var sql = @"INSERT INTO TourChiTiet (MaTour, NgayThu, ThuTu, LoaiDiaDiem, MaDiaDiem, MaNhaHang, MaKhachSan, ThoiGianBatDau, ThoiGianKetThuc, ChiPhi, GhiChu) 
                        VALUES (@MaTour, @NgayThu, @ThuTu, @LoaiDiaDiem, @MaDiaDiem, @MaNhaHang, @MaKhachSan, @ThoiGianBatDau, @ThoiGianKetThuc, @ChiPhi, @GhiChu);
                        SELECT LAST_INSERT_ID();";
            return await conn.ExecuteScalarAsync<int>(sql, dto);
        }

        public async Task<bool> UpdateAsync(int id, UpdateTourChiTietDto dto)
        {
            using var conn = GetConnection();
            var sql = @"UPDATE TourChiTiet SET MaTour = @MaTour, NgayThu = @NgayThu, ThuTu = @ThuTu, LoaiDiaDiem = @LoaiDiaDiem, 
                        MaDiaDiem = @MaDiaDiem, MaNhaHang = @MaNhaHang, MaKhachSan = @MaKhachSan, ThoiGianBatDau = @ThoiGianBatDau, ThoiGianKetThuc = @ThoiGianKetThuc, 
                        ChiPhi = @ChiPhi, GhiChu = @GhiChu 
                        WHERE MaTourChiTiet = @Id";
            var parameters = new DynamicParameters(dto);
            parameters.Add("Id", id);
            var affected = await conn.ExecuteAsync(sql, parameters);
            return affected > 0;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            using var conn = GetConnection();
            var sql = "DELETE FROM TourChiTiet WHERE MaTourChiTiet = @Id";
            var affected = await conn.ExecuteAsync(sql, new { Id = id });
            return affected > 0;
        }
    }
}
