using backend.DTOs;

namespace backend.Services
{
    public interface INhaHangService
    {
        Task<IEnumerable<NhaHangDto>> GetAllAsync();
        Task<NhaHangDto?> GetByIdAsync(int id);
        Task<int> CreateAsync(CreateNhaHangDto dto);
        Task<bool> UpdateAsync(int id, UpdateNhaHangDto dto);
        Task<bool> DeleteAsync(int id);
    }
}
