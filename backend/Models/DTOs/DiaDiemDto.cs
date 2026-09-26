namespace backend.DTOs
{
    public class DiaDiemDto : IImageOwner
    {
        int IImageOwner.ImageOwnerId => MaDiaDiem;
        string IImageOwner.ImageOwnerType => "DiaDiem";
        public List<HinhAnhResponseDto> HinhAnh { get; set; } = new();
        public string? AnhDaiDien { get; set; }
        public int MaDiaDiem { get; set; }
        public int? MaLoai { get; set; }
        public string TenDiaDiem { get; set; } = null!;
        public string? MoTa { get; set; }
        public string? DiaChi { get; set; }
        public string? PhuongXa { get; set; }
        public string? QuanHuyen { get; set; }
        public string? TinhThanh { get; set; }
        public decimal? ViDo { get; set; }
        public decimal? KinhDo { get; set; }
        public decimal GiaVe { get; set; }
        public decimal GiaVeMin { get; set; }
        public decimal GiaVeMax { get; set; }
        public TimeSpan? GioMoCua { get; set; }
        public TimeSpan? GioDongCua { get; set; }
        public int ThoiGianThamQuan { get; set; }
        public decimal DiemDanhGia { get; set; }
        public int LuotXem { get; set; }
        public bool TrangThai { get; set; }
        public DateTime? NgayTao { get; set; }
        public DateTime? NgayCapNhat { get; set; }
    }

    public class CreateDiaDiemDto
    {
        public int? MaLoai { get; set; }
        public string TenDiaDiem { get; set; } = null!;
        public string? MoTa { get; set; }
        public string? DiaChi { get; set; }
        public string? PhuongXa { get; set; }
        public string? QuanHuyen { get; set; }
        public string? TinhThanh { get; set; }
        public decimal? ViDo { get; set; }
        public decimal? KinhDo { get; set; }
        public decimal GiaVe { get; set; }
        public decimal GiaVeMin { get; set; }
        public decimal GiaVeMax { get; set; }
        public TimeSpan? GioMoCua { get; set; }
        public TimeSpan? GioDongCua { get; set; }
        public int ThoiGianThamQuan { get; set; } = 60;
        public bool TrangThai { get; set; } = true;
    }

    public class UpdateDiaDiemDto : CreateDiaDiemDto
    {
    }
}
