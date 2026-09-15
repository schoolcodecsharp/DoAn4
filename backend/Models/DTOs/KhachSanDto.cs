namespace backend.DTOs
{
    public class KhachSanDto : IImageOwner
    {
        int IImageOwner.ImageOwnerId => MaKhachSan;
        string IImageOwner.ImageOwnerType => "KhachSan";
        public List<HinhAnhResponseDto> HinhAnh { get; set; } = new();
        public int MaKhachSan { get; set; }
        public string TenKhachSan { get; set; } = null!;
        public string LoaiLuuTru { get; set; } = "Hotel";
        public string? MoTa { get; set; }
        public string? DiaChi { get; set; }
        public string? PhuongXa { get; set; }
        public string? QuanHuyen { get; set; }
        public string? TinhThanh { get; set; }
        public decimal? ViDo { get; set; }
        public decimal? KinhDo { get; set; }
        public string? AnhDaiDien { get; set; }
        public decimal GiaPhongMin { get; set; }
        public decimal GiaPhongMax { get; set; }
        public string? SoDienThoai { get; set; }
        public decimal DiemDanhGia { get; set; }
        public int LuotXem { get; set; }
        public bool TrangThai { get; set; }
        public DateTime? NgayTao { get; set; }
        public DateTime? NgayCapNhat { get; set; }
    }

    public class CreateKhachSanDto
    {
        public string TenKhachSan { get; set; } = null!;
        public string LoaiLuuTru { get; set; } = "Hotel";
        public string? MoTa { get; set; }
        public string? DiaChi { get; set; }
        public string? PhuongXa { get; set; }
        public string? QuanHuyen { get; set; }
        public string? TinhThanh { get; set; }
        public decimal? ViDo { get; set; }
        public decimal? KinhDo { get; set; }
        public string? AnhDaiDien { get; set; }
        public decimal GiaPhongMin { get; set; }
        public decimal GiaPhongMax { get; set; }
        public string? SoDienThoai { get; set; }
        public bool TrangThai { get; set; } = true;
    }

    public class UpdateKhachSanDto : CreateKhachSanDto
    {
    }
}
