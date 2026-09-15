using System;

namespace backend.DTOs
{
    public class CreateDatPhongDto
    {
        public int MaNguoiDung { get; set; }
        public int MaLoaiPhong { get; set; }
        public DateTime NgayNhanPhong { get; set; }
        public DateTime NgayTraPhong { get; set; }
        public int SoLuongPhong { get; set; } = 1;
        public int SoNguoi { get; set; } = 1;
        public decimal GiaMoiDem { get; set; }
        public decimal TongTien { get; set; }
        public string TrangThai { get; set; } = "Pending";
        public string GhiChu { get; set; }
    }

    public class UpdateDatPhongDto
    {
        public int MaNguoiDung { get; set; }
        public int MaLoaiPhong { get; set; }
        public DateTime NgayNhanPhong { get; set; }
        public DateTime NgayTraPhong { get; set; }
        public int SoLuongPhong { get; set; }
        public int SoNguoi { get; set; }
        public decimal GiaMoiDem { get; set; }
        public decimal TongTien { get; set; }
        public string TrangThai { get; set; }
        public string GhiChu { get; set; }
    }

    public class DatPhongResponseDto
    {
        public int MaDatPhong { get; set; }
        public int MaNguoiDung { get; set; }
        public int MaLoaiPhong { get; set; }
        public DateTime NgayNhanPhong { get; set; }
        public DateTime NgayTraPhong { get; set; }
        public int SoLuongPhong { get; set; }
        public int SoNguoi { get; set; }
        public decimal GiaMoiDem { get; set; }
        public decimal TongTien { get; set; }
        public string TrangThai { get; set; }
        public string GhiChu { get; set; }
        public DateTime NgayDat { get; set; }
    }
}
