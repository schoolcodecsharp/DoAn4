namespace backend.DTOs;

public class CreateDanhGiaDto
{
    public int MaNguoiDung { get; set; }
    public int? MaTour { get; set; }
    public int? MaDiaDiem { get; set; }
    public int? MaNhaHang { get; set; }
    public int? MaKhachSan { get; set; }
    public int SoSao { get; set; }
    public string? NoiDung { get; set; }
}

public class UpdateDanhGiaDto
{
    public int? SoSao { get; set; }
    public string? NoiDung { get; set; }
    public bool? TrangThai { get; set; }
}

public class DanhGiaResponseDto
{
    public int? MaDatTourXacMinh { get; set; }
    public int? MaDatPhongXacMinh { get; set; }
    public bool DaXacMinh => MaDatTourXacMinh.HasValue || MaDatPhongXacMinh.HasValue;
    public int MaDanhGia { get; set; }
    public int MaNguoiDung { get; set; }
    public int? MaTour { get; set; }
    public int? MaDiaDiem { get; set; }
    public int? MaNhaHang { get; set; }
    public int? MaKhachSan { get; set; }
    public int SoSao { get; set; }
    public string? NoiDung { get; set; }
    public DateTime NgayDanhGia { get; set; }
    public bool TrangThai { get; set; }
}
