namespace backend.DTOs;

public interface IImageOwner
{
    int ImageOwnerId { get; }
    string ImageOwnerType { get; }
    string? AnhDaiDien { get; set; }
    List<HinhAnhResponseDto> HinhAnh { get; set; }
}
