using System.Collections.Generic;
using System.Threading.Tasks;
using backend.Data;
using backend.DTOs;

namespace backend.Services
{
    public class TourChiTietService : ITourChiTietService
    {
        private readonly ITourChiTietRepository _repo;

        public TourChiTietService(ITourChiTietRepository repo)
        {
            _repo = repo;
        }

        public Task<IEnumerable<TourChiTietResponseDto>> GetAllAsync() => _repo.GetAllAsync();

        public Task<TourChiTietResponseDto> GetByIdAsync(int id) => _repo.GetByIdAsync(id);

        public Task<IEnumerable<TourChiTietResponseDto>> GetByTourAsync(int maTour) => _repo.GetByTourAsync(maTour);

        public async Task<TourChiTietResponseDto> CreateAsync(CreateTourChiTietDto dto)
        {
            var id = await _repo.CreateAsync(dto);
            return await _repo.GetByIdAsync(id);
        }

        public Task<bool> UpdateAsync(int id, UpdateTourChiTietDto dto) => _repo.UpdateAsync(id, dto);

        public Task<bool> DeleteAsync(int id) => _repo.DeleteAsync(id);
    }
}
