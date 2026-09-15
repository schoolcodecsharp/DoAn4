using System.Collections.Generic;
using System.Threading.Tasks;
using backend.DTOs;

namespace backend.Services
{
    public interface ILichTrinhChiTietService
    {
        Task<IEnumerable<LichTrinhChiTietDto>> GetAllAsync();
        Task<LichTrinhChiTietDto> GetByIdAsync(int id);
        Task<IEnumerable<LichTrinhChiTietDto>> GetByLichTrinhAsync(int maLichTrinh);
        Task<LichTrinhChiTietDto> CreateAsync(CreateLichTrinhChiTietDto dto);
        Task<bool> UpdateAsync(int id, UpdateLichTrinhChiTietDto dto);
        Task<bool> DeleteAsync(int id);
    }
}
