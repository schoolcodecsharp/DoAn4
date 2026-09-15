using backend.DTOs;
namespace backend.Services;
public interface IHinhAnhService
{
    Task<IEnumerable<HinhAnhResponseDto>> GetAllAsync();
    Task<HinhAnhResponseDto?> GetByIdAsync(int id);
    Task<IEnumerable<HinhAnhResponseDto>> GetByDoiTuongAsync(string loai, int maDoiTuong);
    Task<int> CreateAsync(CreateHinhAnhDto dto);
    Task<bool> UpdateAsync(int id, UpdateHinhAnhDto dto);
    Task<bool> DeleteAsync(int id);
}