namespace backend.DTOs
{
    public class VaiTroResponseDto
    {
        public int MaVaiTro { get; set; }
        public string TenVaiTro { get; set; } = null!;
        public string? MoTa { get; set; }
        public bool TrangThai { get; set; }
    }

    public class CreateVaiTroDto
    {
        public string TenVaiTro { get; set; } = null!;
        public string? MoTa { get; set; }
        public bool TrangThai { get; set; } = true;
    }

    public class UpdateVaiTroDto
    {
        public string TenVaiTro { get; set; } = null!;
        public string? MoTa { get; set; }
        public bool TrangThai { get; set; }
    }
}
