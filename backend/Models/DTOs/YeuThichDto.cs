namespace backend.DTOs;

public class CreateYeuThichDto
{
    public int MaNguoiDung { get; set; }
    public int? MaTour { get; set; }
    public int? MaDiaDiem { get; set; }
    public int? MaNhaHang { get; set; }
    public int? MaKhachSan { get; set; }
}

public class YeuThichResponseDto
{
    public int MaYeuThich { get; set; }
    public int MaNguoiDung { get; set; }
    public int? MaTour { get; set; }
    public int? MaDiaDiem { get; set; }
    public int? MaNhaHang { get; set; }
    public int? MaKhachSan { get; set; }
    public DateTime NgayThem { get; set; }
}