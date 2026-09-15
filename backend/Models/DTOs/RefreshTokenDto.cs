using System;

namespace backend.DTOs
{
    public class RefreshTokenResponseDto
    {
        public int MaToken { get; set; }
        public int MaNguoiDung { get; set; }
        public string Token { get; set; } = null!;
        public DateTime? NgayTao { get; set; }
        public DateTime NgayHetHan { get; set; }
        public bool DaThuHoi { get; set; }
    }

    public class CreateRefreshTokenDto
    {
        public int MaNguoiDung { get; set; }
        public string Token { get; set; } = null!;
        public DateTime NgayHetHan { get; set; }
        public bool DaThuHoi { get; set; } = false;
    }

    public class UpdateRefreshTokenDto
    {
        public int MaNguoiDung { get; set; }
        public string Token { get; set; } = null!;
        public DateTime NgayHetHan { get; set; }
        public bool DaThuHoi { get; set; }
    }
}
