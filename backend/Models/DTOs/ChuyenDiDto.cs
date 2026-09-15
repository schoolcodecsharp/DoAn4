using System;

namespace backend.DTOs
{
    public class ChuyenDiDto
    {
        public int MaChuyenDi { get; set; }
        public int MaNguoiDung { get; set; }
        public string TenChuyenDi { get; set; }
        public string DiemKhoiHanh { get; set; }
        public string DiemDen { get; set; }
        public DateTime NgayBatDau { get; set; }
        public DateTime NgayKetThuc { get; set; }
        public int SoNguoi { get; set; }
        public decimal NganSach { get; set; }
        public string MoTa { get; set; }
        public string TrangThai { get; set; }
        public DateTime? NgayTao { get; set; }
        public DateTime? NgayCapNhat { get; set; }
    }

    public class CreateChuyenDiDto
    {
        public int MaNguoiDung { get; set; }
        public string TenChuyenDi { get; set; }
        public string DiemKhoiHanh { get; set; }
        public string DiemDen { get; set; }
        public DateTime NgayBatDau { get; set; }
        public DateTime NgayKetThuc { get; set; }
        public int SoNguoi { get; set; } = 1;
        public decimal NganSach { get; set; } = 0;
        public string MoTa { get; set; }
        public string TrangThai { get; set; } = "Draft";
    }

    public class UpdateChuyenDiDto
    {
        public string TenChuyenDi { get; set; }
        public string DiemKhoiHanh { get; set; }
        public string DiemDen { get; set; }
        public DateTime NgayBatDau { get; set; }
        public DateTime NgayKetThuc { get; set; }
        public int SoNguoi { get; set; }
        public decimal NganSach { get; set; }
        public string MoTa { get; set; }
        public string TrangThai { get; set; }
    }
}
