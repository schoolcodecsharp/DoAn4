using Dapper;
using MySqlConnector;
using backend.DTOs;

namespace backend.Data;

public class ThanhToanRepository : IThanhToanRepository
{
    private readonly string _connectionString;
    public ThanhToanRepository(IConfiguration config) =>
        _connectionString = config.GetConnectionString("DefaultConnection")!;
    private MySqlConnection GetConnection() => new MySqlConnection(_connectionString);

    public async Task<IEnumerable<ThanhToanResponseDto>> GetAllAsync()
    {
        using var conn = GetConnection();
        return await conn.QueryAsync<ThanhToanResponseDto>("SELECT * FROM ThanhToan ORDER BY NgayTao DESC");
    }

    public async Task<ThanhToanResponseDto?> GetByIdAsync(int id)
    {
        using var conn = GetConnection();
        return await conn.QueryFirstOrDefaultAsync<ThanhToanResponseDto>(
            "SELECT * FROM ThanhToan WHERE MaThanhToan=@id", new { id });
    }

    public async Task<IEnumerable<ThanhToanResponseDto>> GetByDatTourAsync(int maDatTour)
    {
        using var conn = GetConnection();
        return await conn.QueryAsync<ThanhToanResponseDto>(
            "SELECT * FROM ThanhToan WHERE MaDatTour=@maDatTour", new { maDatTour });
    }

    public async Task<IEnumerable<ThanhToanResponseDto>> GetByDatPhongAsync(int maDatPhong)
    {
        using var conn = GetConnection();
        return await conn.QueryAsync<ThanhToanResponseDto>(
            "SELECT * FROM ThanhToan WHERE MaDatPhong=@maDatPhong", new { maDatPhong });
    }

    public async Task<int> CreateAsync(CreateThanhToanDto dto)
    {
        using var conn = GetConnection();
        var sql = @"INSERT INTO ThanhToan (LoaiDon,MaDatTour,MaDatPhong,SoTien,PhuongThuc,MaGiaoDich,NgayThanhToan)
                    VALUES (@LoaiDon,@MaDatTour,@MaDatPhong,@SoTien,@PhuongThuc,@MaGiaoDich,@NgayThanhToan);
                    SELECT LAST_INSERT_ID();";
        return await conn.ExecuteScalarAsync<int>(sql, dto);
    }

    public async Task<bool> UpdateAsync(int id, UpdateThanhToanDto dto)
    {
        using var conn = GetConnection();
        var sql = @"UPDATE ThanhToan SET
            TrangThai=COALESCE(@TrangThai,TrangThai),
            MaGiaoDich=COALESCE(@MaGiaoDich,MaGiaoDich),
            NgayThanhToan=COALESCE(@NgayThanhToan,NgayThanhToan)
            WHERE MaThanhToan=@id";
        return await conn.ExecuteAsync(sql, new { dto.TrangThai, dto.MaGiaoDich, dto.NgayThanhToan, id }) > 0;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        using var conn = GetConnection();
        return await conn.ExecuteAsync("DELETE FROM ThanhToan WHERE MaThanhToan=@id", new { id }) > 0;
    }
}