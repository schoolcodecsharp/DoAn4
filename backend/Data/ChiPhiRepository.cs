using Dapper; using MySqlConnector; using backend.DTOs;
namespace backend.Data;
public class ChiPhiRepository : IChiPhiRepository
{
    private readonly string _cs;
    public ChiPhiRepository(IConfiguration c) => _cs = c.GetConnectionString("DefaultConnection")!;
    private MySqlConnection Conn() => new MySqlConnection(_cs);

    public async Task<IEnumerable<ChiPhiResponseDto>> GetAllAsync()
    { using var c = Conn(); return await c.QueryAsync<ChiPhiResponseDto>("SELECT * FROM ChiPhi ORDER BY NgayTao DESC"); }

    public async Task<ChiPhiResponseDto?> GetByIdAsync(int id)
    { using var c = Conn(); return await c.QueryFirstOrDefaultAsync<ChiPhiResponseDto>("SELECT * FROM ChiPhi WHERE MaChiPhi=@id", new{id}); }

    public async Task<IEnumerable<ChiPhiResponseDto>> GetByChuyenDiAsync(int maChuyenDi)
    { using var c = Conn(); return await c.QueryAsync<ChiPhiResponseDto>("SELECT * FROM ChiPhi WHERE MaChuyenDi=@maChuyenDi ORDER BY NgayChi", new{maChuyenDi}); }

    public async Task<int> CreateAsync(CreateChiPhiDto dto)
    {
        using var c = Conn();
        return await c.ExecuteScalarAsync<int>(
            @"INSERT INTO ChiPhi(MaChuyenDi,MaNguoiDung,TenChiPhi,LoaiChiPhi,SoTien,NgayChi,GhiChu)
              VALUES(@MaChuyenDi,@MaNguoiDung,@TenChiPhi,@LoaiChiPhi,@SoTien,@NgayChi,@GhiChu);
              SELECT LAST_INSERT_ID();", dto);
    }

    public async Task<bool> UpdateAsync(int id, UpdateChiPhiDto dto)
    {
        using var c = Conn();
        return await c.ExecuteAsync(
            @"UPDATE ChiPhi SET TenChiPhi=COALESCE(@TenChiPhi,TenChiPhi),
              LoaiChiPhi=COALESCE(@LoaiChiPhi,LoaiChiPhi),SoTien=COALESCE(@SoTien,SoTien),
              NgayChi=COALESCE(@NgayChi,NgayChi),GhiChu=COALESCE(@GhiChu,GhiChu)
              WHERE MaChiPhi=@id",
            new{dto.TenChiPhi,dto.LoaiChiPhi,dto.SoTien,dto.NgayChi,dto.GhiChu,id}) > 0;
    }

    public async Task<bool> DeleteAsync(int id)
    { using var c = Conn(); return await c.ExecuteAsync("DELETE FROM ChiPhi WHERE MaChiPhi=@id", new{id}) > 0; }
}