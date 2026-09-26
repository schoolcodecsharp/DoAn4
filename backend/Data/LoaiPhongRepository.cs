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
            if(dto.SucChua<1 || dto.SoLuongPhong<1 || dto.GiaMoiDem<0)
                throw new backend.Security.RequestRuleException("Sức chứa/số phòng phải dương, giá không âm.");
            using var conn = GetConnection();
            var sql = @"
                INSERT INTO LoaiPhong (MaKhachSan, TenLoaiPhong, MoTa, SucChua, SoLuongPhong, 
                                       GiaMoiDem, TrangThai)
                VALUES (@MaKhachSan, @TenLoaiPhong, @MoTa, @SucChua, @SoLuongPhong, 
                        @GiaMoiDem, @TrangThai);
                SELECT LAST_INSERT_ID();";
            return await conn.ExecuteScalarAsync<int>(sql, dto);
        }

        public async Task<bool> UpdateAsync(int id, UpdateLoaiPhongDto dto)
        {
            using var conn = GetConnection();
            if(dto.SucChua<1 || dto.SoLuongPhong<1 || dto.GiaMoiDem<0)
                throw new backend.Security.RequestRuleException("Sức chứa/số phòng phải dương, giá không âm.");
            await conn.OpenAsync();
            using var tx=await conn.BeginTransactionAsync(IsolationLevel.ReadCommitted);
            var room=await conn.QuerySingleOrDefaultAsync<LoaiPhongDto>("SELECT * FROM LoaiPhong WHERE MaLoaiPhong=@id FOR UPDATE",new{id},tx);
            if(room==null) return false;
            var bookings=(await conn.QueryAsync<DatPhongResponseDto>("SELECT * FROM DatPhong WHERE MaLoaiPhong=@id AND TrangThai IN ('Pending','Confirmed','CheckedIn') AND NgayTraPhong>=@today",new{id,today=backend.Services.BookingRules.Today},tx)).ToList();
            if(bookings.Count>0 && (dto.MaKhachSan!=room.MaKhachSan || bookings.Any(b=>b.SoNguoi>dto.SucChua*b.SoLuongPhong)))
                throw new backend.Security.RequestRuleException("Thay đổi này ảnh hưởng đơn phòng hiện có.",409);
            foreach(var day in bookings.Select(b=>b.NgayNhanPhong.Date).Distinct())
                if(bookings.Where(b=>b.NgayNhanPhong.Date<=day && b.NgayTraPhong.Date>day).Sum(b=>b.SoLuongPhong)>dto.SoLuongPhong)
                    throw new backend.Security.RequestRuleException("Số phòng mới thấp hơn số đã đặt trong cùng ngày.",409);
            var sql = @"
                UPDATE LoaiPhong SET 
                    MaKhachSan = @MaKhachSan, TenLoaiPhong = @TenLoaiPhong, MoTa = @MoTa, 
                    SucChua = @SucChua, SoLuongPhong = @SoLuongPhong, GiaMoiDem = @GiaMoiDem, 
                    TrangThai = @TrangThai
                WHERE MaLoaiPhong = @Id";
            var parameters = new DynamicParameters(dto);
            parameters.Add("Id", id);
            
            var affected = await conn.ExecuteAsync(sql, parameters,tx);
            await tx.CommitAsync();
            return affected > 0;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            using var conn = GetConnection();
            var affected = await conn.ExecuteAsync("UPDATE LoaiPhong SET TrangThai=0 WHERE MaLoaiPhong = @Id", new { Id = id });
            return affected > 0;
        }
    }
}
