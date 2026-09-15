namespace backend.DTOs;

public class CreateThanhToanDto
{
    public string LoaiDon { get; set; } = "";
    public int? MaDatTour { get; set; }
    public int? MaDatPhong { get; set; }
    public decimal SoTien { get; set; }
    public string PhuongThuc { get; set; } = "";
    public string? MaGiaoDich { get; set; }
    public DateTime? NgayThanhToan { get; set; }
}

public class UpdateThanhToanDto
{
    public string? TrangThai { get; set; }
    public string? MaGiaoDich { get; set; }
    public DateTime? NgayThanhToan { get; set; }
}

public class ThanhToanResponseDto
{
    public int MaThanhToan { get; set; }
    public string LoaiDon { get; set; } = "";
    public int? MaDatTour { get; set; }
    public int? MaDatPhong { get; set; }
    public decimal SoTien { get; set; }
    public string PhuongThuc { get; set; } = "";
    public string? MaGiaoDich { get; set; }
    public string TrangThai { get; set; } = "ChoThanhToan";
    public DateTime? NgayThanhToan { get; set; }
    public DateTime NgayTao { get; set; }
}