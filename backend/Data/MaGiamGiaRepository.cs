using Dapper; using MySqlConnector; using backend.DTOs;
namespace backend.Data;
public class MaGiamGiaRepository : IMaGiamGiaRepository
{
    private readonly string _cs;
    public MaGiamGiaRepository(IConfiguration c) => _cs = c.GetConnectionString("DefaultConnection")!;
    private MySqlConnection Conn() => new MySqlConnection(_cs);

    public async Task<IEnumerable<MaGiamGiaResponseDto>> GetAllAsync()
    { using var c = Conn(); return await c.QueryAsync<MaGiamGiaResponseDto>("SELECT * FROM MaGiamGia"); }

    public async Task<MaGiamGiaResponseDto?> GetByIdAsync(int id)
    { using var c = Conn(); return await c.QueryFirstOrDefaultAsync<MaGiamGiaResponseDto>("SELECT * FROM MaGiamGia WHERE MaCode=@id", new{id}); }

    public async Task<MaGiamGiaResponseDto?> GetByCodeAsync(string code)
    { using var c = Conn(); return await c.QueryFirstOrDefaultAsync<MaGiamGiaResponseDto>("SELECT * FROM MaGiamGia WHERE Code=@code", new{code}); }

    public async Task<int> CreateAsync(CreateMaGiamGiaDto dto)
    {
        using var c = Conn();
        return await c.ExecuteScalarAsync<int>(
            @"INSERT INTO MaGiamGia(Code,MoTa,LoaiGiam,GiaTriGiam,GiamToiDa,DonHangToiThieu,SoLuong,NgayBatDau,NgayKetThuc,TrangThai)
              VALUES(@Code,@MoTa,@LoaiGiam,@GiaTriGiam,@GiamToiDa,@DonHangToiThieu,@SoLuong,@NgayBatDau,@NgayKetThuc,@TrangThai);
              SELECT LAST_INSERT_ID();", dto);
    }

    public async Task<bool> UpdateAsync(int id, UpdateMaGiamGiaDto dto)
    {
        using var c = Conn();
        return await c.ExecuteAsync(
            @"UPDATE MaGiamGia SET MoTa=COALESCE(@MoTa,MoTa),GiaTriGiam=COALESCE(@GiaTriGiam,GiaTriGiam),
              GiamToiDa=COALESCE(@GiamToiDa,GiamToiDa),DonHangToiThieu=COALESCE(@DonHangToiThieu,DonHangToiThieu),
              SoLuong=COALESCE(@SoLuong,SoLuong),NgayBatDau=COALESCE(@NgayBatDau,NgayBatDau),
              NgayKetThuc=COALESCE(@NgayKetThuc,NgayKetThuc),TrangThai=COALESCE(@TrangThai,TrangThai)
              WHERE MaCode=@id",
            new{dto.MoTa,dto.GiaTriGiam,dto.GiamToiDa,dto.DonHangToiThieu,dto.SoLuong,dto.NgayBatDau,dto.NgayKetThuc,dto.TrangThai,id}) > 0;
    }

    public async Task<bool> DeleteAsync(int id)
    { using var c = Conn(); return await c.ExecuteAsync("DELETE FROM MaGiamGia WHERE MaCode=@id", new{id}) > 0; }
}