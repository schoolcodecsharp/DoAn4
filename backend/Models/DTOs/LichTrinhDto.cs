using System;

namespace backend.DTOs
{
    public class LichTrinhDto
    {
        public int MaLichTrinh { get; set; }
        public int MaChuyenDi { get; set; }
        public int NgayThu { get; set; }
        public DateTime Ngay { get; set; }
        public string TieuDe { get; set; }
        public string GhiChu { get; set; }
    }

    public class CreateLichTrinhDto
    {
        public int MaChuyenDi { get; set; }
        public int NgayThu { get; set; }
        public DateTime Ngay { get; set; }
        public string TieuDe { get; set; }
        public string GhiChu { get; set; }
    }

    public class UpdateLichTrinhDto
    {
        public int NgayThu { get; set; }
        public DateTime Ngay { get; set; }
        public string TieuDe { get; set; }
        public string GhiChu { get; set; }
    }
}
