using System.Collections.Generic;
using System.Threading.Tasks;
using backend.DTOs;

namespace backend.Services
{
    public interface ILoaiDiaDiemService
    {
        Task<IEnumerable<LoaiDiaDiemResponseDto>> GetAllAsync();
        Task<LoaiDiaDiemResponseDto?> GetByIdAsync(int id);
        Task<int> CreateAsync(CreateLoaiDiaDiemDto dto);
        Task<bool> UpdateAsync(int id, UpdateLoaiDiaDiemDto dto);
        Task<bool> DeleteAsync(int id);
    }
}
