using System.Collections.Generic;
using System.Threading.Tasks;
using backend.DTOs;

namespace backend.Services
{
    public interface ITourService
    {
        Task<IEnumerable<TourResponseDto>> GetAllAsync();
        Task<TourResponseDto> GetByIdAsync(int id);
        Task<IEnumerable<TourResponseDto>> GetFilteredToursAsync(string tinh, string keyword, string trangthai);
        Task<TourResponseDto> CreateAsync(CreateTourDto dto);
        Task<bool> UpdateAsync(int id, UpdateTourDto dto);
        Task<bool> DeleteAsync(int id);
    }
}
