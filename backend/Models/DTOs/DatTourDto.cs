namespace backend.DTOs;

public class CreateDatTourDto
{
    public int MaNguoiDung { get; set; }
    public int MaTour { get; set; }
    public int? MaKhoiHanh { get; set; }
    public DateTime NgayKhoiHanh { get; set; }
    public int SoNguoi { get; set; }
    public decimal GiaMoiNguoi { get; set; }
    public decimal TongTien { get; set; }
    public string? GhiChu { get; set; }
}

public class UpdateDatTourDto : backend.Services.CancellationDecision
{
    public string? TrangThai { get; set; }
    public string? GhiChu { get; set; }
}

public class DatTourResponseDto : backend.Services.CancellationRecord
{
    public int MaDatTour { get; set; }
    public int MaNguoiDung { get; set; }
    public int MaTour { get; set; }
    public int? MaKhoiHanh { get; set; }
    public DateTime NgayDat { get; set; }
    public DateTime NgayKhoiHanh { get; set; }
    public int SoNguoi { get; set; }
    public decimal GiaMoiNguoi { get; set; }
    public decimal TongTien { get; set; }
    public string TrangThai { get; set; } = "Pending";
    public string? GhiChu { get; set; }
}
