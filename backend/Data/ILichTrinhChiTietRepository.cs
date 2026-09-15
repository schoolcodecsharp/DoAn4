using System.Collections.Generic;
using System.Threading.Tasks;
using backend.DTOs;

namespace backend.Data
{
    public interface ILichTrinhChiTietRepository
    {
        Task<IEnumerable<LichTrinhChiTietDto>> GetAllAsync();
        Task<LichTrinhChiTietDto> GetByIdAsync(int id);
        Task<IEnumerable<LichTrinhChiTietDto>> GetByLichTrinhAsync(int maLichTrinh);
        Task<int> CreateAsync(CreateLichTrinhChiTietDto dto);
        Task<bool> UpdateAsync(int id, UpdateLichTrinhChiTietDto dto);
        Task<bool> DeleteAsync(int id);
    }
}
