using System;

namespace backend.DTOs
{
    public class NguoiDungResponseDto
    {
        public int MaNguoiDung { get; set; }
        public int MaVaiTro { get; set; }
        public string HoTen { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string? SoDienThoai { get; set; }
        public string? AnhDaiDien { get; set; }
        public DateTime? NgaySinh { get; set; }
        public string? GioiTinh { get; set; }
        public DateTime? NgayTao { get; set; }
        public DateTime? NgayCapNhat { get; set; }
        public bool TrangThai { get; set; }
    }

    public class CreateNguoiDungDto
    {
        public int MaVaiTro { get; set; }
        public string HoTen { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string MatKhau { get; set; } = null!;
        public string? SoDienThoai { get; set; }
        public string? AnhDaiDien { get; set; }
        public DateTime? NgaySinh { get; set; }
        public string? GioiTinh { get; set; }
        public bool TrangThai { get; set; } = true;
    }

    public class LoginRequestDto
    {
        public string Email { get; set; } = null!;
        public string MatKhau { get; set; } = null!;
    }

    public class NguoiDungCredentialsDto : NguoiDungResponseDto
    {
        public string MatKhau { get; set; } = null!;
    }

    public class UpdateNguoiDungDto
    {
        public int MaVaiTro { get; set; }
        public string HoTen { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string? SoDienThoai { get; set; }
        public string? AnhDaiDien { get; set; }
        public DateTime? NgaySinh { get; set; }
        public string? GioiTinh { get; set; }
        public bool TrangThai { get; set; }
    }
}
