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
            Validate(dto.NgayKhoiHanh,dto.GiaApDung,dto.TrangThai);
            if (dto.NgayKhoiHanh.Date < backend.Services.BookingRules.Today || dto.TrangThai is "Completed" or "Cancelled")
                throw new backend.Security.RequestRuleException("Lịch mới phải từ hôm nay và ở trạng thái mở đặt chỗ hoặc đóng nhận đặt.");
            if(dto.SoChoToiDa < 1 || dto.GiaApDung < 0 || dto.SoChoDaDat != 0) throw new backend.Security.RequestRuleException("Lịch mới phải có số chỗ dương, giá không âm và chưa có chỗ đã đặt.");
            using var conn = GetConnection();
            await conn.OpenAsync();
            await using var tx = await conn.BeginTransactionAsync();
            var capacity = await conn.ExecuteScalarAsync<int>("SELECT SoNguoiToiDa FROM Tour WHERE MaTour=@MaTour FOR UPDATE", new { dto.MaTour }, tx);
            if (capacity < 1) throw new backend.Security.RequestRuleException("Cần xác nhận sức chứa của tour trước khi tạo lịch khởi hành.");
            var sql = @"INSERT INTO TourKhoiHanh (MaTour, NgayKhoiHanh, SoChoToiDa, SoChoDaDat, GiaApDung, TrangThai) 
                        VALUES (@MaTour, @NgayKhoiHanh, @SoChoToiDa, @SoChoDaDat, @GiaApDung, @TrangThai);
                        SELECT LAST_INSERT_ID();";
            var id = await conn.ExecuteScalarAsync<int>(sql, dto, tx);
            await tx.CommitAsync();
            return id;
        }

        public async Task<bool> UpdateAsync(int id, UpdateTourKhoiHanhDto dto)
        {
            Validate(dto.NgayKhoiHanh,dto.GiaApDung,dto.TrangThai);
            if(dto.SoChoToiDa < 1 || dto.GiaApDung < 0) throw new backend.Security.RequestRuleException("Số chỗ phải dương và giá không âm.");
            using var conn = GetConnection();
            await conn.OpenAsync();
            await using var tx = await conn.BeginTransactionAsync(System.Data.IsolationLevel.ReadCommitted);
            // Booking also locks this row first, so closing/cancelling cannot
            // race with a new reservation passing the state check.
            var current = await conn.QuerySingleOrDefaultAsync<TourKhoiHanhResponseDto>("SELECT * FROM TourKhoiHanh WHERE MaKhoiHanh=@id FOR UPDATE",new{id},tx);
            if(current == null) return false;
            if(current.MaTour != dto.MaTour || current.NgayKhoiHanh.Date != dto.NgayKhoiHanh.Date)
                throw new backend.Security.RequestRuleException("Không đổi tour/ngày của đợt đã tạo. Hãy tạo đợt mới để bảo toàn đơn đặt.");
            if (current.TrangThai != dto.TrangThai)
            {
                if (current.TrangThai is "Completed" or "Cancelled")
                    throw new backend.Security.RequestRuleException("Lịch đã kết thúc không được mở lại. Hãy tạo lịch mới.",409);
                if (dto.TrangThai == "OpenForBooking" && current.NgayKhoiHanh.Date < backend.Services.BookingRules.Today)
                    throw new backend.Security.RequestRuleException("Không mở đặt chỗ cho lịch đã qua ngày khởi hành.",409);
                if (dto.TrangThai == "Cancelled" && await conn.ExecuteScalarAsync<int>(
                    "SELECT COUNT(*) FROM DatTour WHERE MaKhoiHanh=@id AND TrangThai<>'Cancelled'",new{id},tx)>0)
                    throw new backend.Security.RequestRuleException("Cần xử lý các đơn đặt trước khi hủy lịch khởi hành. Đơn đã thanh toán cần quy trình hoàn tiền.",409);
                if (dto.TrangThai == "Completed")
                {
                    var days=await conn.ExecuteScalarAsync<int>("SELECT SoNgay FROM Tour WHERE MaTour=@MaTour",dto,tx);
                    if ((backend.Services.BookingRules.Today-current.NgayKhoiHanh.Date).Days < days ||
                        await conn.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM DatTour WHERE MaKhoiHanh=@id AND TrangThai IN ('Pending','Confirmed')",new{id},tx)>0)
                        throw new backend.Security.RequestRuleException("Chỉ hoàn thành lịch sau ngày cuối tour và khi các đơn đặt đã được xử lý xong.",409);
                }
            }
            var sql = @"UPDATE TourKhoiHanh SET SoChoToiDa = @SoChoToiDa,
                        GiaApDung = @GiaApDung, TrangThai = @TrangThai 
                        WHERE MaKhoiHanh = @Id AND SoChoDaDat <= @SoChoToiDa";
            var parameters = new DynamicParameters(dto);
            parameters.Add("Id", id);
            var affected = await conn.ExecuteAsync(sql, parameters, tx);
            if(affected == 0) throw new backend.Security.RequestRuleException("Tổng số chỗ không được thấp hơn số chỗ đã đặt.",409);
            await tx.CommitAsync();
            return true;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            using var conn = GetConnection();
            // Closing sales must not turn a terminal departure into a reopenable one.
            var sql = "UPDATE TourKhoiHanh SET TrangThai=CASE WHEN TrangThai IN ('Completed','Cancelled') THEN TrangThai ELSE 'FullyBooked' END WHERE MaKhoiHanh = @Id";
            var affected = await conn.ExecuteAsync(sql, new { Id = id });
            return affected > 0;
        }

        private static void Validate(DateTime date, decimal price, string? status)
        {
            backend.Services.StorageRules.Date(date,"Ngày khởi hành");
            backend.Services.StorageRules.Money(price,"Giá áp dụng");
            if (status is not ("OpenForBooking" or "FullyBooked" or "Cancelled" or "Completed"))
                throw new backend.Security.RequestRuleException("Trạng thái lịch khởi hành không hợp lệ.");
        }
    }
}
