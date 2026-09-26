using Dapper; using MySqlConnector; using backend.DTOs;
namespace backend.Data;
public class HinhAnhRepository : IHinhAnhRepository
{
    private const string SelectImages = """
        SELECT HinhAnh.*,
               CASE
                   WHEN MaTour IS NOT NULL THEN 'Tour'
                   WHEN MaDiaDiem IS NOT NULL THEN 'DiaDiem'
                   WHEN MaNhaHang IS NOT NULL THEN 'NhaHang'
                   WHEN MaKhachSan IS NOT NULL THEN 'KhachSan'
                   WHEN MaLoaiPhong IS NOT NULL THEN 'LoaiPhong'
               END AS LoaiDoiTuong,
               COALESCE(MaTour, MaDiaDiem, MaNhaHang, MaKhachSan, MaLoaiPhong) AS MaDoiTuong
        FROM HinhAnh
        """;

    private static readonly IReadOnlyDictionary<string, string> OwnerColumns =
        new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["Tour"] = "MaTour",
            ["DiaDiem"] = "MaDiaDiem",
            ["NhaHang"] = "MaNhaHang",
            ["KhachSan"] = "MaKhachSan",
            ["LoaiPhong"] = "MaLoaiPhong"
        };

    private readonly string _cs;
    public HinhAnhRepository(IConfiguration c) => _cs = c.GetConnectionString("DefaultConnection")!;
    private MySqlConnection Conn() => new MySqlConnection(_cs);

    public async Task<IEnumerable<HinhAnhResponseDto>> GetAllAsync()
    { using var c = Conn(); return await c.QueryAsync<HinhAnhResponseDto>(SelectImages + " ORDER BY ThuTu,MaHinhAnh"); }

    public async Task<HinhAnhResponseDto?> GetByIdAsync(int id)
    { using var c = Conn(); return await c.QueryFirstOrDefaultAsync<HinhAnhResponseDto>(SelectImages + " WHERE MaHinhAnh=@id", new{id}); }

    public async Task<IEnumerable<HinhAnhResponseDto>> GetByDoiTuongAsync(string loai, int maDoiTuong)
    {
        using var c = Conn();
        if (!OwnerColumns.TryGetValue(loai, out var ownerColumn)) return [];
        return await c.QueryAsync<HinhAnhResponseDto>(
            SelectImages + $" WHERE {ownerColumn}=@maDoiTuong ORDER BY ThuTu,MaHinhAnh",
            new{maDoiTuong});
    }

    public async Task<int> CreateAsync(CreateHinhAnhDto dto)
    {
        if (!OwnerColumns.TryGetValue(dto.LoaiDoiTuong, out var ownerColumn))
            throw new ArgumentException("Loại đối tượng ảnh không hợp lệ.", nameof(dto));

        using var c = Conn();
        return await c.ExecuteScalarAsync<int>(
            $"INSERT INTO HinhAnh({ownerColumn},DuongDan,MoTa,ThuTu,Nguon,TacGia,GiayPhep,UrlGiayPhep) VALUES(@MaDoiTuong,@DuongDan,@MoTa,@ThuTu,@Nguon,@TacGia,@GiayPhep,@UrlGiayPhep); SELECT LAST_INSERT_ID();", dto);
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
