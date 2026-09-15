using Dapper; using MySqlConnector; using backend.DTOs;
namespace backend.Data;
public class YeuThichRepository : IYeuThichRepository
{
    private readonly string _cs;
    public YeuThichRepository(IConfiguration c) => _cs = c.GetConnectionString("DefaultConnection")!;
    private MySqlConnection Conn() => new MySqlConnection(_cs);

    public async Task<IEnumerable<YeuThichResponseDto>> GetAllAsync()
    { using var c = Conn(); return await c.QueryAsync<YeuThichResponseDto>("SELECT * FROM YeuThich ORDER BY NgayThem DESC"); }

    public async Task<YeuThichResponseDto?> GetByIdAsync(int id)
    { using var c = Conn(); return await c.QueryFirstOrDefaultAsync<YeuThichResponseDto>("SELECT * FROM YeuThich WHERE MaYeuThich=@id", new{id}); }

    public async Task<IEnumerable<YeuThichResponseDto>> GetByNguoiDungAsync(int maNguoiDung)
    { using var c = Conn(); return await c.QueryAsync<YeuThichResponseDto>("SELECT * FROM YeuThich WHERE MaNguoiDung=@maNguoiDung ORDER BY NgayThem DESC", new{maNguoiDung}); }

    public async Task<int> CreateAsync(CreateYeuThichDto dto)
    {
        using var c = Conn();
        return await c.ExecuteScalarAsync<int>(
            @"INSERT INTO YeuThich(MaNguoiDung,MaTour,MaDiaDiem,MaNhaHang,MaKhachSan)
              VALUES(@MaNguoiDung,@MaTour,@MaDiaDiem,@MaNhaHang,@MaKhachSan);
              SELECT LAST_INSERT_ID();", dto);
    }

    public async Task<bool> DeleteAsync(int id)
    { using var c = Conn(); return await c.ExecuteAsync("DELETE FROM YeuThich WHERE MaYeuThich=@id", new{id}) > 0; }

    public async Task<bool> DeleteByNguoiDungTourAsync(int maNguoiDung, int maTour)
    { using var c = Conn(); return await c.ExecuteAsync("DELETE FROM YeuThich WHERE MaNguoiDung=@maNguoiDung AND MaTour=@maTour", new{maNguoiDung,maTour}) > 0; }
}