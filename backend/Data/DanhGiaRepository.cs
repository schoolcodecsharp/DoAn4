using Dapper; using MySqlConnector; using backend.DTOs;
namespace backend.Data;
public class DanhGiaRepository : IDanhGiaRepository
{
    private readonly string _cs;
    public DanhGiaRepository(IConfiguration c) => _cs = c.GetConnectionString("DefaultConnection")!;
    private MySqlConnection Conn() => new MySqlConnection(_cs);

    public async Task<IEnumerable<DanhGiaResponseDto>> GetAllAsync()
    { using var c = Conn(); return await c.QueryAsync<DanhGiaResponseDto>("SELECT * FROM DanhGia ORDER BY NgayDanhGia DESC"); }

    public async Task<DanhGiaResponseDto?> GetByIdAsync(int id)
    { using var c = Conn(); return await c.QueryFirstOrDefaultAsync<DanhGiaResponseDto>("SELECT * FROM DanhGia WHERE MaDanhGia=@id", new{id}); }

    public async Task<IEnumerable<DanhGiaResponseDto>> GetByTourAsync(int maTour)
    { using var c = Conn(); return await c.QueryAsync<DanhGiaResponseDto>("SELECT * FROM DanhGia WHERE MaTour=@maTour AND TrangThai=1 ORDER BY NgayDanhGia DESC", new{maTour}); }

    public async Task<IEnumerable<DanhGiaResponseDto>> GetByDiaDiemAsync(int maDiaDiem)
    { using var c = Conn(); return await c.QueryAsync<DanhGiaResponseDto>("SELECT * FROM DanhGia WHERE MaDiaDiem=@maDiaDiem AND TrangThai=1 ORDER BY NgayDanhGia DESC", new{maDiaDiem}); }

    public async Task<IEnumerable<DanhGiaResponseDto>> GetByNguoiDungAsync(int maNguoiDung)
    { using var c = Conn(); return await c.QueryAsync<DanhGiaResponseDto>("SELECT * FROM DanhGia WHERE MaNguoiDung=@maNguoiDung ORDER BY NgayDanhGia DESC", new{maNguoiDung}); }

    public async Task<int> CreateAsync(CreateDanhGiaDto dto)
    {
        using var c = Conn();
        return await c.ExecuteScalarAsync<int>(
            @"INSERT INTO DanhGia(MaNguoiDung,MaTour,MaDiaDiem,MaNhaHang,MaKhachSan,SoSao,NoiDung)
              VALUES(@MaNguoiDung,@MaTour,@MaDiaDiem,@MaNhaHang,@MaKhachSan,@SoSao,@NoiDung);
              SELECT LAST_INSERT_ID();", dto);
    }

    public async Task<bool> UpdateAsync(int id, UpdateDanhGiaDto dto)
    {
        using var c = Conn();
        return await c.ExecuteAsync(
            "UPDATE DanhGia SET SoSao=COALESCE(@SoSao,SoSao),NoiDung=COALESCE(@NoiDung,NoiDung),TrangThai=COALESCE(@TrangThai,TrangThai) WHERE MaDanhGia=@id",
            new{dto.SoSao,dto.NoiDung,dto.TrangThai,id}) > 0;
    }

    public async Task<bool> DeleteAsync(int id)
    { using var c = Conn(); return await c.ExecuteAsync("DELETE FROM DanhGia WHERE MaDanhGia=@id", new{id}) > 0; }
}