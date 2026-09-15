namespace backend.DTOs;

public class CreateChiPhiDto
{
    public int MaChuyenDi { get; set; }
    public int? MaNguoiDung { get; set; }
    public string TenChiPhi { get; set; } = "";
    public string LoaiChiPhi { get; set; } = "Khac";
    public decimal SoTien { get; set; }
    public DateTime? NgayChi { get; set; }
    public string? GhiChu { get; set; }
}

public class UpdateChiPhiDto
{
    public string? TenChiPhi { get; set; }
    public string? LoaiChiPhi { get; set; }
    public decimal? SoTien { get; set; }
    public DateTime? NgayChi { get; set; }
    public string? GhiChu { get; set; }
}

public class ChiPhiResponseDto
{
    public int MaChiPhi { get; set; }
    public int MaChuyenDi { get; set; }
    public int? MaNguoiDung { get; set; }
    public string TenChiPhi { get; set; } = "";
    public string LoaiChiPhi { get; set; } = "";
    public decimal SoTien { get; set; }
    public DateTime? NgayChi { get; set; }
    public string? GhiChu { get; set; }
    public DateTime NgayTao { get; set; }
}