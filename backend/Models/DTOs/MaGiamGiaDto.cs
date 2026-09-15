namespace backend.DTOs;

public class CreateMaGiamGiaDto
{
    public string Code { get; set; } = "";
    public string? MoTa { get; set; }
    public string LoaiGiam { get; set; } = "";
    public decimal GiaTriGiam { get; set; }
    public decimal? GiamToiDa { get; set; }
    public decimal DonHangToiThieu { get; set; } = 0;
    public int SoLuong { get; set; } = 0;
    public DateTime NgayBatDau { get; set; }
    public DateTime NgayKetThuc { get; set; }
    public bool TrangThai { get; set; } = true;
}

public class UpdateMaGiamGiaDto
{
    public string? MoTa { get; set; }
    public decimal? GiaTriGiam { get; set; }
    public decimal? GiamToiDa { get; set; }
    public decimal? DonHangToiThieu { get; set; }
    public int? SoLuong { get; set; }
    public DateTime? NgayBatDau { get; set; }
    public DateTime? NgayKetThuc { get; set; }
    public bool? TrangThai { get; set; }
}

public class MaGiamGiaResponseDto
{
    public int MaCode { get; set; }
    public string Code { get; set; } = "";
    public string? MoTa { get; set; }
    public string LoaiGiam { get; set; } = "";
    public decimal GiaTriGiam { get; set; }
    public decimal? GiamToiDa { get; set; }
    public decimal DonHangToiThieu { get; set; }
    public int SoLuong { get; set; }
    public int SoLuongDaDung { get; set; }
    public DateTime NgayBatDau { get; set; }
    public DateTime NgayKetThuc { get; set; }
    public bool TrangThai { get; set; }
}

public class ValidateMaGiamGiaDto
{
    public string Code { get; set; } = "";
    public decimal TongTien { get; set; }
}