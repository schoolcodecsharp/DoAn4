using System.Collections.Generic;
using System.Threading.Tasks;
using backend.DTOs;

namespace backend.Data
{
    public interface IChuyenDiRepository
    {
        Task<IEnumerable<ChuyenDiDto>> GetAllAsync();
        Task<ChuyenDiDto> GetByIdAsync(int id);
        Task<IEnumerable<ChuyenDiDto>> GetByNguoiDungAsync(int maNguoiDung);
        Task<int> CreateAsync(CreateChuyenDiDto dto);
        Task<bool> UpdateAsync(int id, UpdateChuyenDiDto dto);
        Task<bool> DeleteAsync(int id);
    }
}
