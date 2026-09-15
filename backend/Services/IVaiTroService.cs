using System.Collections.Generic;
using System.Threading.Tasks;
using backend.DTOs;

namespace backend.Services
{
    public interface IVaiTroService
    {
        Task<IEnumerable<VaiTroResponseDto>> GetAllAsync();
        Task<VaiTroResponseDto?> GetByIdAsync(int id);
        Task<int> CreateAsync(CreateVaiTroDto dto);
        Task<bool> UpdateAsync(int id, UpdateVaiTroDto dto);
        Task<bool> DeleteAsync(int id);
    }
}
