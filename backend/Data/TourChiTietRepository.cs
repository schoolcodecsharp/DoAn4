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

        private static async Task LockEditable(MySqlConnection db, MySqlTransaction tx, int tour, int day = 1)
        {
            var days = await db.ExecuteScalarAsync<int>("SELECT SoNgay FROM Tour WHERE MaTour=@tour FOR UPDATE", new { tour }, tx);
            if (days == 0) throw new backend.Security.RequestRuleException("Không tìm thấy tour.", 404);
            if (await db.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM DatTour WHERE MaTour=@tour", new { tour }, tx) > 0)
                throw new backend.Security.RequestRuleException("Tour đã có đơn đặt; không sửa điểm dừng của lịch sử trải nghiệm. Hãy tạo tour mới nếu đổi lịch trình.", 409);
            if (day < 1 || day > days) throw new backend.Security.RequestRuleException("Ngày hoạt động nằm ngoài thời lượng tour.");
        }

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
            await conn.OpenAsync();
            await using var tx = await conn.BeginTransactionAsync(System.Data.IsolationLevel.ReadCommitted);
            await LockEditable(conn, tx, dto.MaTour, dto.NgayThu);
            var sql = @"INSERT INTO TourChiTiet (MaTour, NgayThu, ThuTu, LoaiDiaDiem, MaDiaDiem, MaNhaHang, MaKhachSan, ThoiGianBatDau, ThoiGianKetThuc, ChiPhi, GhiChu) 
                        VALUES (@MaTour, @NgayThu, @ThuTu, @LoaiDiaDiem, @MaDiaDiem, @MaNhaHang, @MaKhachSan, @ThoiGianBatDau, @ThoiGianKetThuc, @ChiPhi, @GhiChu);
                        SELECT LAST_INSERT_ID();";
            var id = await conn.ExecuteScalarAsync<int>(sql, dto, tx);
            await tx.CommitAsync();
            return id;
        }

        public async Task<bool> UpdateAsync(int id, UpdateTourChiTietDto dto)
        {
            using var conn = GetConnection();
            await conn.OpenAsync();
            await using var tx = await conn.BeginTransactionAsync(System.Data.IsolationLevel.ReadCommitted);
            var tour = await conn.ExecuteScalarAsync<int>("SELECT MaTour FROM TourChiTiet WHERE MaTourChiTiet=@id", new { id }, tx);
            if (tour == 0) return false;
            if (tour != dto.MaTour) throw new backend.Security.RequestRuleException("Không chuyển hoạt động sang tour khác. Hãy thêm hoạt động tại tour đích.", 409);
            await LockEditable(conn, tx, tour, dto.NgayThu);
            var sql = @"UPDATE TourChiTiet SET MaTour = @MaTour, NgayThu = @NgayThu, ThuTu = @ThuTu, LoaiDiaDiem = @LoaiDiaDiem, 
                        MaDiaDiem = @MaDiaDiem, MaNhaHang = @MaNhaHang, MaKhachSan = @MaKhachSan, ThoiGianBatDau = @ThoiGianBatDau, ThoiGianKetThuc = @ThoiGianKetThuc, 
                        ChiPhi = @ChiPhi, GhiChu = @GhiChu 
                        WHERE MaTourChiTiet = @Id";
            var parameters = new DynamicParameters(dto);
            parameters.Add("Id", id);
            var affected = await conn.ExecuteAsync(sql, parameters, tx);
            await tx.CommitAsync();
            return affected > 0;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            using var conn = GetConnection();
            await conn.OpenAsync();
            await using var tx = await conn.BeginTransactionAsync(System.Data.IsolationLevel.ReadCommitted);
            var tour = await conn.ExecuteScalarAsync<int>("SELECT MaTour FROM TourChiTiet WHERE MaTourChiTiet=@id", new { id }, tx);
            if (tour == 0) return false;
            await LockEditable(conn, tx, tour);
            var sql = "DELETE FROM TourChiTiet WHERE MaTourChiTiet = @Id";
            var affected = await conn.ExecuteAsync(sql, new { Id = id }, tx);
            await tx.CommitAsync();
            return affected > 0;
        }
    }
}
