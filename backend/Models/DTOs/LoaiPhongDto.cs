namespace backend.DTOs
{
    public class LoaiPhongDto : IImageOwner
    {
        int IImageOwner.ImageOwnerId => MaLoaiPhong;
        string IImageOwner.ImageOwnerType => "LoaiPhong";
        public List<HinhAnhResponseDto> HinhAnh { get; set; } = new();
        public int MaLoaiPhong { get; set; }
        public int? MaKhachSan { get; set; }
        public string TenLoaiPhong { get; set; } = null!;
        public string? MoTa { get; set; }
        public int SucChua { get; set; }
        public int SoLuongPhong { get; set; }
        public decimal GiaMoiDem { get; set; }
        public string? AnhDaiDien { get; set; }
        public bool TrangThai { get; set; }
    }

    public class CreateLoaiPhongDto
    {
        public int? MaKhachSan { get; set; }
        public string TenLoaiPhong { get; set; } = null!;
        public string? MoTa { get; set; }
        public int SucChua { get; set; } = 2;
        public int SoLuongPhong { get; set; } = 1;
        public decimal GiaMoiDem { get; set; }
        public string? AnhDaiDien { get; set; }
        public bool TrangThai { get; set; } = true;
    }

    public class UpdateLoaiPhongDto : CreateLoaiPhongDto
    {
    }
}
