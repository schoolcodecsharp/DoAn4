using backend.DTOs;

namespace backend.Data
{
    public interface INhaHangRepository
    {
        Task<IEnumerable<NhaHangDto>> GetAllAsync();
        Task<NhaHangDto?> GetByIdAsync(int id);
        Task<int> CreateAsync(CreateNhaHangDto dto);
        Task<bool> UpdateAsync(int id, UpdateNhaHangDto dto);
        Task<bool> DeleteAsync(int id);
    }
}
