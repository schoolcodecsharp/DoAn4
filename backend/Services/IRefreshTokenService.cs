using System.Collections.Generic;
using System.Threading.Tasks;
using backend.DTOs;

namespace backend.Services
{
    public interface IRefreshTokenService
    {
        Task<IEnumerable<RefreshTokenResponseDto>> GetAllAsync();
        Task<RefreshTokenResponseDto?> GetByIdAsync(int id);
        Task<int> CreateAsync(CreateRefreshTokenDto dto);
        Task<bool> UpdateAsync(int id, UpdateRefreshTokenDto dto);
        Task<bool> DeleteAsync(int id);
    }
}
