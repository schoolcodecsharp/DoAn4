using Dapper;
using MySqlConnector;
using backend.DTOs;

namespace backend.Data;

public class DatTourRepository : IDatTourRepository
{
    private readonly string _connectionString;
    public DatTourRepository(IConfiguration config) =>
        _connectionString = config.GetConnectionString("DefaultConnection")!;
    private MySqlConnection GetConnection() => new MySqlConnection(_connectionString);

    public async Task<IEnumerable<DatTourResponseDto>> GetAllAsync()
    {
        using var conn = GetConnection();
        return await conn.QueryAsync<DatTourResponseDto>("SELECT * FROM DatTour ORDER BY NgayDat DESC");
    }

    public async Task<DatTourResponseDto?> GetByIdAsync(int id)
    {
        using var conn = GetConnection();
        return await conn.QueryFirstOrDefaultAsync<DatTourResponseDto>(
            "SELECT * FROM DatTour WHERE MaDatTour=@id", new { id });
    }

    public async Task<IEnumerable<DatTourResponseDto>> GetByNguoiDungAsync(int maNguoiDung)
    {
        using var conn = GetConnection();
        return await conn.QueryAsync<DatTourResponseDto>(
            "SELECT * FROM DatTour WHERE MaNguoiDung=@maNguoiDung ORDER BY NgayDat DESC",
            new { maNguoiDung });
    }

    public async Task<int> CreateAsync(CreateDatTourDto dto)
    {
        using var conn = GetConnection();
        var sql = @"INSERT INTO DatTour (MaNguoiDung,MaTour,MaKhoiHanh,NgayKhoiHanh,SoNguoi,GiaMoiNguoi,TongTien,GhiChu)
                    VALUES (@MaNguoiDung,@MaTour,@MaKhoiHanh,@NgayKhoiHanh,@SoNguoi,@GiaMoiNguoi,@TongTien,@GhiChu);
                    SELECT LAST_INSERT_ID();";
        return await conn.ExecuteScalarAsync<int>(sql, dto);
    }

    public async Task<bool> UpdateAsync(int id, UpdateDatTourDto dto)
    {
        using var conn = GetConnection();
        var sql = "UPDATE DatTour SET TrangThai=COALESCE(@TrangThai,TrangThai), GhiChu=COALESCE(@GhiChu,GhiChu) WHERE MaDatTour=@id";
        return await conn.ExecuteAsync(sql, new { dto.TrangThai, dto.GhiChu, id }) > 0;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        using var conn = GetConnection();
        return await conn.ExecuteAsync("DELETE FROM DatTour WHERE MaDatTour=@id", new { id }) > 0;
    }
}