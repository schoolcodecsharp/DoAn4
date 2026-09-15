using System;

namespace backend.DTOs
{
    public class ThanhVienChuyenDiDto
    {
        public int MaThanhVien { get; set; }
        public int MaChuyenDi { get; set; }
        public int MaNguoiDung { get; set; }
        public string VaiTro { get; set; }
        public string TrangThai { get; set; }
        public DateTime NgayThamGia { get; set; }
    }

    public class CreateThanhVienChuyenDiDto
    {
        public int MaChuyenDi { get; set; }
        public int MaNguoiDung { get; set; }
        public string VaiTro { get; set; } = "Member";
        public string TrangThai { get; set; } = "Pending";
    }

    public class UpdateThanhVienChuyenDiDto
    {
        public string VaiTro { get; set; }
        public string TrangThai { get; set; }
    }
}
