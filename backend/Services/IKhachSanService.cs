using backend.DTOs;

namespace backend.Services
{
    public interface IKhachSanService
    {
        Task<IEnumerable<KhachSanDto>> GetAllAsync();
        Task<KhachSanDto?> GetByIdAsync(int id);
        Task<IEnumerable<KhachSanDto>> GetByFilterAsync(string? tinh, string? loai, string? keyword);
        Task<int> CreateAsync(CreateKhachSanDto dto);
        Task<bool> UpdateAsync(int id, UpdateKhachSanDto dto);
        Task<bool> DeleteAsync(int id);
    }
}
