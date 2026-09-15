using System;

namespace backend.DTOs
{
    public class CreateTourDto
    {
        public int MaNguoiTao { get; set; }
        public string TenTour { get; set; }
        public string MoTa { get; set; }
        public string DiemKhoiHanh { get; set; }
        public string DiemDen { get; set; }
        public int SoNgay { get; set; }
        public int SoDem { get; set; }
        public decimal GiaTour { get; set; }
        public decimal GiaTourMin { get; set; }
        public decimal GiaTourMax { get; set; }
        public int SoNguoiToiDa { get; set; } = 20;
        public int SoNguoiToiThieu { get; set; } = 1;
        public string AnhDaiDien { get; set; }
        public string TrangThai { get; set; } = "Draft";
    }

    public class UpdateTourDto
    {
        public int MaNguoiTao { get; set; }
        public string TenTour { get; set; }
        public string MoTa { get; set; }
        public string DiemKhoiHanh { get; set; }
        public string DiemDen { get; set; }
        public int SoNgay { get; set; }
        public int SoDem { get; set; }
        public decimal GiaTour { get; set; }
        public decimal GiaTourMin { get; set; }
        public decimal GiaTourMax { get; set; }
        public int SoNguoiToiDa { get; set; }
        public int SoNguoiToiThieu { get; set; }
        public string AnhDaiDien { get; set; }
        public string TrangThai { get; set; }
    }

    public class TourResponseDto : IImageOwner
    {
        int IImageOwner.ImageOwnerId => MaTour;
        string IImageOwner.ImageOwnerType => "Tour";
        public List<HinhAnhResponseDto> HinhAnh { get; set; } = new();
        public int MaTour { get; set; }
        public int MaNguoiTao { get; set; }
        public string TenTour { get; set; }
        public string MoTa { get; set; }
        public string DiemKhoiHanh { get; set; }
        public string DiemDen { get; set; }
        public int SoNgay { get; set; }
        public int SoDem { get; set; }
        public decimal GiaTour { get; set; }
        public decimal GiaTourMin { get; set; }
        public decimal GiaTourMax { get; set; }
        public int SoNguoiToiDa { get; set; }
        public int SoNguoiToiThieu { get; set; }
        public string? AnhDaiDien { get; set; }
        public decimal DiemDanhGia { get; set; }
        public int LuotXem { get; set; }
        public string TrangThai { get; set; }
        public DateTime? NgayTao { get; set; }
        public DateTime? NgayCapNhat { get; set; }
    }
}
