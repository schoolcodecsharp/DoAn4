using System.Collections.Generic;
using System.Threading.Tasks;
using backend.DTOs;
using backend.Data;

namespace backend.Services
{
    public class LichTrinhChiTietService : ILichTrinhChiTietService
    {
        private readonly ILichTrinhChiTietRepository _repository;

        public LichTrinhChiTietService(ILichTrinhChiTietRepository repository)
        {
            _repository = repository;
        }

        public Task<IEnumerable<LichTrinhChiTietDto>> GetAllAsync() => _repository.GetAllAsync();

        public Task<LichTrinhChiTietDto> GetByIdAsync(int id) => _repository.GetByIdAsync(id);

        public Task<IEnumerable<LichTrinhChiTietDto>> GetByLichTrinhAsync(int maLichTrinh) => _repository.GetByLichTrinhAsync(maLichTrinh);

        public async Task<LichTrinhChiTietDto> CreateAsync(CreateLichTrinhChiTietDto dto)
        {
            int id = await _repository.CreateAsync(dto);
            return await _repository.GetByIdAsync(id);
        }

        public Task<bool> UpdateAsync(int id, UpdateLichTrinhChiTietDto dto) => _repository.UpdateAsync(id, dto);

        public Task<bool> DeleteAsync(int id) => _repository.DeleteAsync(id);
    }
}
