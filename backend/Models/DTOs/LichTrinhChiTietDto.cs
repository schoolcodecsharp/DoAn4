using System;

namespace backend.DTOs
{
    public class LichTrinhChiTietDto
    {
        public int MaChiTiet { get; set; }
        public int MaLichTrinh { get; set; }
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

    public class CreateLichTrinhChiTietDto
    {
        public int MaLichTrinh { get; set; }
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

    public class UpdateLichTrinhChiTietDto
    {
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
