using System.Collections.Generic;
using System.Threading.Tasks;
using backend.DTOs;

namespace backend.Services
{
    public interface INguoiDungService
    {
        Task<IEnumerable<NguoiDungResponseDto>> GetAllAsync();
        Task<NguoiDungResponseDto?> GetByIdAsync(int id);
        Task<NguoiDungResponseDto?> GetByEmailAsync(string email);
        Task<int> CreateAsync(CreateNguoiDungDto dto);
        Task<bool> UpdateAsync(int id, UpdateNguoiDungDto dto);
        Task<bool> DeleteAsync(int id);
    }
}
