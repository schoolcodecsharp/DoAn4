using System.Collections.Generic;
using System.Threading.Tasks;
using backend.DTOs;

namespace backend.Services
{
    public interface ITourChiTietService
    {
        Task<IEnumerable<TourChiTietResponseDto>> GetAllAsync();
        Task<TourChiTietResponseDto> GetByIdAsync(int id);
        Task<IEnumerable<TourChiTietResponseDto>> GetByTourAsync(int maTour);
        Task<TourChiTietResponseDto> CreateAsync(CreateTourChiTietDto dto);
        Task<bool> UpdateAsync(int id, UpdateTourChiTietDto dto);
        Task<bool> DeleteAsync(int id);
    }
}
