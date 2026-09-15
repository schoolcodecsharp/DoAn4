using backend.DTOs;
namespace backend.Services;
public interface IMaGiamGiaService
{
    Task<IEnumerable<MaGiamGiaResponseDto>> GetAllAsync();
    Task<MaGiamGiaResponseDto?> GetByIdAsync(int id);
    Task<MaGiamGiaResponseDto?> GetByCodeAsync(string code);
    Task<int> CreateAsync(CreateMaGiamGiaDto dto);
    Task<bool> UpdateAsync(int id, UpdateMaGiamGiaDto dto);
    Task<bool> DeleteAsync(int id);
}