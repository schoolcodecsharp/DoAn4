using Dapper; using MySqlConnector; using backend.DTOs;
namespace backend.Data;
public class HinhAnhRepository : IHinhAnhRepository
{
    private readonly string _cs;
    public HinhAnhRepository(IConfiguration c) => _cs = c.GetConnectionString("DefaultConnection")!;
    private MySqlConnection Conn() => new MySqlConnection(_cs);

    public async Task<IEnumerable<HinhAnhResponseDto>> GetAllAsync()
    { using var c = Conn(); return await c.QueryAsync<HinhAnhResponseDto>("SELECT * FROM HinhAnh ORDER BY ThuTu,MaHinhAnh"); }

    public async Task<HinhAnhResponseDto?> GetByIdAsync(int id)
    { using var c = Conn(); return await c.QueryFirstOrDefaultAsync<HinhAnhResponseDto>("SELECT * FROM HinhAnh WHERE MaHinhAnh=@id", new{id}); }

    public async Task<IEnumerable<HinhAnhResponseDto>> GetByDoiTuongAsync(string loai, int maDoiTuong)
    {
        using var c = Conn();
        return await c.QueryAsync<HinhAnhResponseDto>(
            "SELECT * FROM HinhAnh WHERE LoaiDoiTuong=@loai AND MaDoiTuong=@maDoiTuong ORDER BY ThuTu,MaHinhAnh",
            new{loai,maDoiTuong});
    }

    public async Task<int> CreateAsync(CreateHinhAnhDto dto)
    {
        using var c = Conn();
        return await c.ExecuteScalarAsync<int>(
            "INSERT INTO HinhAnh(LoaiDoiTuong,MaDoiTuong,DuongDan,MoTa,ThuTu,Nguon,TacGia,GiayPhep,UrlGiayPhep) VALUES(@LoaiDoiTuong,@MaDoiTuong,@DuongDan,@MoTa,@ThuTu,@Nguon,@TacGia,@GiayPhep,@UrlGiayPhep); SELECT LAST_INSERT_ID();", dto);
    }

    public async Task<bool> UpdateAsync(int id, UpdateHinhAnhDto dto)
    {
        using var c = Conn();
        return await c.ExecuteAsync(
            "UPDATE HinhAnh SET DuongDan=COALESCE(@DuongDan,DuongDan),MoTa=COALESCE(@MoTa,MoTa),ThuTu=COALESCE(@ThuTu,ThuTu),Nguon=COALESCE(@Nguon,Nguon),TacGia=COALESCE(@TacGia,TacGia),GiayPhep=COALESCE(@GiayPhep,GiayPhep),UrlGiayPhep=COALESCE(@UrlGiayPhep,UrlGiayPhep) WHERE MaHinhAnh=@id",
            new{dto.DuongDan,dto.MoTa,dto.ThuTu,dto.Nguon,dto.TacGia,dto.GiayPhep,dto.UrlGiayPhep,id}) > 0;
    }

    public async Task<bool> DeleteAsync(int id)
    { using var c = Conn(); return await c.ExecuteAsync("DELETE FROM HinhAnh WHERE MaHinhAnh=@id", new{id}) > 0; }
}
