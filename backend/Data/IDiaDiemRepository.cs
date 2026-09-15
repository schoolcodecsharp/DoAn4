using backend.DTOs;

namespace backend.Data
{
    public interface IDiaDiemRepository
    {
        Task<IEnumerable<DiaDiemDto>> GetAllAsync();
        Task<DiaDiemDto?> GetByIdAsync(int id);
        Task<IEnumerable<DiaDiemDto>> GetByFilterAsync(string? tinh, int? maLoai, string? keyword);
        Task<int> CreateAsync(CreateDiaDiemDto dto);
        Task<bool> UpdateAsync(int id, UpdateDiaDiemDto dto);
        Task<bool> DeleteAsync(int id);
    }
}
