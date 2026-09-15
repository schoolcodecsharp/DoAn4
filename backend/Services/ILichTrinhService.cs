using System.Collections.Generic;
using System.Threading.Tasks;
using backend.DTOs;

namespace backend.Services
{
    public interface ILichTrinhService
    {
        Task<IEnumerable<LichTrinhDto>> GetAllAsync();
        Task<LichTrinhDto> GetByIdAsync(int id);
        Task<IEnumerable<LichTrinhDto>> GetByChuyenDiAsync(int maChuyenDi);
        Task<LichTrinhDto> CreateAsync(CreateLichTrinhDto dto);
        Task<bool> UpdateAsync(int id, UpdateLichTrinhDto dto);
        Task<bool> DeleteAsync(int id);
    }
}
