using System.Collections.Generic;
using System.Threading.Tasks;
using backend.Data;
using backend.DTOs;

namespace backend.Services
{
    public class TourKhoiHanhService : ITourKhoiHanhService
    {
        private readonly ITourKhoiHanhRepository _repo;

        public TourKhoiHanhService(ITourKhoiHanhRepository repo)
        {
            _repo = repo;
        }

        public Task<IEnumerable<TourKhoiHanhResponseDto>> GetAllAsync() => _repo.GetAllAsync();

        public Task<TourKhoiHanhResponseDto> GetByIdAsync(int id) => _repo.GetByIdAsync(id);

        public Task<IEnumerable<TourKhoiHanhResponseDto>> GetByTourAsync(int maTour) => _repo.GetByTourAsync(maTour);

        public async Task<TourKhoiHanhResponseDto> CreateAsync(CreateTourKhoiHanhDto dto)
        {
            var id = await _repo.CreateAsync(dto);
            return await _repo.GetByIdAsync(id);
        }

        public Task<bool> UpdateAsync(int id, UpdateTourKhoiHanhDto dto) => _repo.UpdateAsync(id, dto);

        public Task<bool> DeleteAsync(int id) => _repo.DeleteAsync(id);
    }
}
