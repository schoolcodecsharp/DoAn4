using System.Collections.Generic;
using System.Threading.Tasks;
using backend.DTOs;

namespace backend.Services
{
    public interface IThanhVienChuyenDiService
    {
        Task<IEnumerable<ThanhVienChuyenDiDto>> GetAllAsync();
        Task<ThanhVienChuyenDiDto> GetByIdAsync(int id);
        Task<IEnumerable<ThanhVienChuyenDiDto>> GetByChuyenDiAsync(int maChuyenDi);
        Task<ThanhVienChuyenDiDto> CreateAsync(CreateThanhVienChuyenDiDto dto);
        Task<bool> UpdateAsync(int id, UpdateThanhVienChuyenDiDto dto);
        Task<bool> UpdateTrangThaiAsync(int id, string trangThai);
        Task<bool> DeleteAsync(int id);
    }
}
