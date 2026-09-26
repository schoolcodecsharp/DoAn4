using Dapper;
using MySqlConnector;
using System.ComponentModel.DataAnnotations;
using System.Security.Cryptography;

namespace backend.Tools;

// Local operator-only bootstrap. Never expose this operation as a public API.
public static class AdminBootstrap
{
    public static async Task RunAsync(IConfiguration config, string email)
    {
        email = email.Trim().ToLowerInvariant();
        if (email.Length > 150 || !new EmailAddressAttribute().IsValid(email))
            throw new ArgumentException("Email quản trị không hợp lệ.");
        await using var db = new MySqlConnection(config.GetConnectionString("DefaultConnection"));
        if (await db.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM NguoiDung WHERE Email=@email", new { email }) != 0)
            throw new InvalidOperationException("Email đã tồn tại. Không thay đổi tài khoản hoặc mật khẩu cũ.");
        if (await db.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM VaiTro WHERE MaVaiTro=1") != 1)
            throw new InvalidOperationException("Chưa có vai trò quản trị trong CSDL.");
        var password = Convert.ToBase64String(RandomNumberGenerator.GetBytes(18)) + "aA1!";
        var id = await db.ExecuteScalarAsync<int>("""
            INSERT INTO NguoiDung(MaVaiTro,HoTen,Email,MatKhau,TrangThai)
            VALUES(1,'Quản trị NVT',@email,@hash,1); SELECT LAST_INSERT_ID();
            """, new { email, hash = BCrypt.Net.BCrypt.HashPassword(password) });
        Console.WriteLine($"Đã tạo Admin mới #{id}. Không thay đổi tài khoản cũ.");
        Console.WriteLine($"Email: {email}");
        Console.WriteLine($"Mật khẩu (lưu vào nơi an toàn): {password}");
    }
}
