namespace backend.DTOs
{
    public class NhaHangDto : IImageOwner
    {
        int IImageOwner.ImageOwnerId => MaNhaHang;
        string IImageOwner.ImageOwnerType => "NhaHang";
        public List<HinhAnhResponseDto> HinhAnh { get; set; } = new();
        public int MaNhaHang { get; set; }
        public string TenNhaHang { get; set; } = null!;
        public string? MoTa { get; set; }
        public string? DiaChi { get; set; }
        public string? PhuongXa { get; set; }
        public string? QuanHuyen { get; set; }
        public string? TinhThanh { get; set; }
        public decimal? ViDo { get; set; }
        public decimal? KinhDo { get; set; }
        public string? AnhDaiDien { get; set; }
        public decimal GiaMin { get; set; }
        public decimal GiaMax { get; set; }
        public TimeSpan? GioMoCua { get; set; }
        public TimeSpan? GioDongCua { get; set; }
        public string? SoDienThoai { get; set; }
        public decimal DiemDanhGia { get; set; }
        public int LuotXem { get; set; }
        public bool TrangThai { get; set; }
        public DateTime? NgayTao { get; set; }
        public DateTime? NgayCapNhat { get; set; }
    }

    public class CreateNhaHangDto
    {
        public string TenNhaHang { get; set; } = null!;
        public string? MoTa { get; set; }
        public string? DiaChi { get; set; }
        public string? PhuongXa { get; set; }
        public string? QuanHuyen { get; set; }
        public string? TinhThanh { get; set; }
        public decimal? ViDo { get; set; }
        public decimal? KinhDo { get; set; }
        public string? AnhDaiDien { get; set; }
        public decimal GiaMin { get; set; }
        public decimal GiaMax { get; set; }
        public TimeSpan? GioMoCua { get; set; }
        public TimeSpan? GioDongCua { get; set; }
        public string? SoDienThoai { get; set; }
        public bool TrangThai { get; set; } = true;
    }

    public class UpdateNhaHangDto : CreateNhaHangDto
    {
    }
}
