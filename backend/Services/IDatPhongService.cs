using System.Collections.Generic;
using System.Threading.Tasks;
using backend.DTOs;

namespace backend.Services
{
    public interface IDatPhongService
    {
        Task<IEnumerable<DatPhongResponseDto>> GetAllAsync();
        Task<DatPhongResponseDto> GetByIdAsync(int id);
        Task<IEnumerable<DatPhongResponseDto>> GetByNguoiDungAsync(int maNguoiDung);
        Task<DatPhongResponseDto> CreateAsync(CreateDatPhongDto dto);
        Task<bool> UpdateAsync(int id, UpdateDatPhongDto dto);
        Task<bool> DeleteAsync(int id);
    }
}
