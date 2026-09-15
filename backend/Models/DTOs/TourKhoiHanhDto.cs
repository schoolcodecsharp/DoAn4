using System;

namespace backend.DTOs
{
    public class CreateTourKhoiHanhDto
    {
        public int MaTour { get; set; }
        public DateTime NgayKhoiHanh { get; set; }
        public int SoChoToiDa { get; set; }
        public int SoChoDaDat { get; set; } = 0;
        public decimal GiaApDung { get; set; }
        public string TrangThai { get; set; } = "OpenForBooking";
    }

    public class UpdateTourKhoiHanhDto
    {
        public int MaTour { get; set; }
        public DateTime NgayKhoiHanh { get; set; }
        public int SoChoToiDa { get; set; }
        public int SoChoDaDat { get; set; }
        public decimal GiaApDung { get; set; }
        public string TrangThai { get; set; }
    }

    public class TourKhoiHanhResponseDto
    {
        public int MaKhoiHanh { get; set; }
        public int MaTour { get; set; }
        public DateTime NgayKhoiHanh { get; set; }
        public int SoChoToiDa { get; set; }
        public int SoChoDaDat { get; set; }
        public decimal GiaApDung { get; set; }
        public string TrangThai { get; set; }
    }
}
