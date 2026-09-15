namespace backend.DTOs;

public class CreateHinhAnhDto
{
    public string? Nguon { get; set; }
    public string? TacGia { get; set; }
    public string? GiayPhep { get; set; }
    public string? UrlGiayPhep { get; set; }
    public string LoaiDoiTuong { get; set; } = "";
    public int MaDoiTuong { get; set; }
    public string DuongDan { get; set; } = "";
    public string? MoTa { get; set; }
    public int ThuTu { get; set; } = 0;
}

public class UpdateHinhAnhDto
{
    public string? Nguon { get; set; }
    public string? TacGia { get; set; }
    public string? GiayPhep { get; set; }
    public string? UrlGiayPhep { get; set; }
    public string? DuongDan { get; set; }
    public string? MoTa { get; set; }
    public int? ThuTu { get; set; }
}

public class HinhAnhResponseDto
{
    public string? Nguon { get; set; }
    public string? TacGia { get; set; }
    public string? GiayPhep { get; set; }
    public string? UrlGiayPhep { get; set; }
    public int MaHinhAnh { get; set; }
    public string LoaiDoiTuong { get; set; } = "";
    public int MaDoiTuong { get; set; }
    public string DuongDan { get; set; } = "";
    public string? MoTa { get; set; }
    public int ThuTu { get; set; }
    public DateTime NgayTao { get; set; }
}
