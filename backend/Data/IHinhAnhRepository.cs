using backend.DTOs;
namespace backend.Data;
public interface IHinhAnhRepository
{
    Task<IEnumerable<HinhAnhResponseDto>> GetAllAsync();
    Task<HinhAnhResponseDto?> GetByIdAsync(int id);
    Task<IEnumerable<HinhAnhResponseDto>> GetByDoiTuongAsync(string loai, int maDoiTuong);
    Task<int> CreateAsync(CreateHinhAnhDto dto);
    Task<bool> UpdateAsync(int id, UpdateHinhAnhDto dto);
    Task<bool> DeleteAsync(int id);
}