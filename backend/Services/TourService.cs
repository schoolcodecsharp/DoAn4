using System.Collections.Generic;
using System.Threading.Tasks;
using backend.Data;
using backend.DTOs;

namespace backend.Services
{
    public class TourService : ITourService
    {
        private readonly ITourRepository _repo;

        public TourService(ITourRepository repo)
        {
            _repo = repo;
        }

        public Task<IEnumerable<TourResponseDto>> GetAllAsync() => _repo.GetAllAsync();

        public Task<TourResponseDto> GetByIdAsync(int id) => _repo.GetByIdAsync(id);

        public Task<IEnumerable<TourResponseDto>> GetFilteredToursAsync(string tinh, string keyword, string trangthai) => _repo.GetFilteredToursAsync(tinh, keyword, trangthai);

        public async Task<TourResponseDto> CreateAsync(CreateTourDto dto)
        {
            var id = await _repo.CreateAsync(dto);
            return await _repo.GetByIdAsync(id);
        }

        public Task<bool> UpdateAsync(int id, UpdateTourDto dto) => _repo.UpdateAsync(id, dto);

        public Task<bool> DeleteAsync(int id) => _repo.DeleteAsync(id);
    }
}
