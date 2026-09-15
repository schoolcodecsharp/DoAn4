using System;

namespace backend.DTOs
{
    public class CreateTourChiTietDto
    {
        public int MaTour { get; set; }
        public int NgayThu { get; set; }
        public int ThuTu { get; set; }
        public string LoaiDiaDiem { get; set; }
        public int? MaDiaDiem { get; set; }
        public int? MaNhaHang { get; set; }
        public int? MaKhachSan { get; set; }
        public TimeSpan? ThoiGianBatDau { get; set; }
        public TimeSpan? ThoiGianKetThuc { get; set; }
        public decimal ChiPhi { get; set; } = 0;
        public string GhiChu { get; set; }
    }

    public class UpdateTourChiTietDto
    {
        public int MaTour { get; set; }
        public int NgayThu { get; set; }
        public int ThuTu { get; set; }
        public string LoaiDiaDiem { get; set; }
        public int? MaDiaDiem { get; set; }
        public int? MaNhaHang { get; set; }
        public int? MaKhachSan { get; set; }
        public TimeSpan? ThoiGianBatDau { get; set; }
        public TimeSpan? ThoiGianKetThuc { get; set; }
        public decimal ChiPhi { get; set; }
        public string GhiChu { get; set; }
    }

    public class TourChiTietResponseDto
    {
        public int MaTourChiTiet { get; set; }
        public int MaTour { get; set; }
        public int NgayThu { get; set; }
        public int ThuTu { get; set; }
        public string LoaiDiaDiem { get; set; }
        public int? MaDiaDiem { get; set; }
        public int? MaNhaHang { get; set; }
        public int? MaKhachSan { get; set; }
        public TimeSpan? ThoiGianBatDau { get; set; }
        public TimeSpan? ThoiGianKetThuc { get; set; }
        public decimal ChiPhi { get; set; }
        public string GhiChu { get; set; }
    }
}
