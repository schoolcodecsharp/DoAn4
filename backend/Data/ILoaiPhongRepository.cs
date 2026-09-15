using backend.DTOs;

namespace backend.Data
{
    public interface ILoaiPhongRepository
    {
        Task<IEnumerable<LoaiPhongDto>> GetAllAsync();
        Task<LoaiPhongDto?> GetByIdAsync(int id);
        Task<IEnumerable<LoaiPhongDto>> GetByKhachSanAsync(int maKhachSan);
        Task<int> CreateAsync(CreateLoaiPhongDto dto);
        Task<bool> UpdateAsync(int id, UpdateLoaiPhongDto dto);
        Task<bool> DeleteAsync(int id);
    }
}
