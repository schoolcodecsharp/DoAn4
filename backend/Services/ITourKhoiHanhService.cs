using System.Collections.Generic;
using System.Threading.Tasks;
using backend.DTOs;

namespace backend.Services
{
    public interface ITourKhoiHanhService
    {
        Task<IEnumerable<TourKhoiHanhResponseDto>> GetAllAsync();
        Task<TourKhoiHanhResponseDto> GetByIdAsync(int id);
        Task<IEnumerable<TourKhoiHanhResponseDto>> GetByTourAsync(int maTour);
        Task<TourKhoiHanhResponseDto> CreateAsync(CreateTourKhoiHanhDto dto);
        Task<bool> UpdateAsync(int id, UpdateTourKhoiHanhDto dto);
        Task<bool> DeleteAsync(int id);
    }
}
