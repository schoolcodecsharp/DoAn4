namespace backend.DTOs
{
    public class LoaiDiaDiemResponseDto
    {
        public int MaLoai { get; set; }
        public string TenLoai { get; set; } = null!;
        public string? MoTa { get; set; }
        public bool TrangThai { get; set; }
    }

    public class CreateLoaiDiaDiemDto
    {
        public string TenLoai { get; set; } = null!;
        public string? MoTa { get; set; }
        public bool TrangThai { get; set; } = true;
    }

    public class UpdateLoaiDiaDiemDto
    {
        public string TenLoai { get; set; } = null!;
        public string? MoTa { get; set; }
        public bool TrangThai { get; set; }
    }
}
