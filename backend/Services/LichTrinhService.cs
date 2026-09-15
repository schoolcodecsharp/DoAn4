using System.Collections.Generic;
using System.Threading.Tasks;
using backend.DTOs;
using backend.Data;

namespace backend.Services
{
    public class LichTrinhService : ILichTrinhService
    {
        private readonly ILichTrinhRepository _repository;

        public LichTrinhService(ILichTrinhRepository repository)
        {
            _repository = repository;
        }

        public Task<IEnumerable<LichTrinhDto>> GetAllAsync() => _repository.GetAllAsync();

        public Task<LichTrinhDto> GetByIdAsync(int id) => _repository.GetByIdAsync(id);

        public Task<IEnumerable<LichTrinhDto>> GetByChuyenDiAsync(int maChuyenDi) => _repository.GetByChuyenDiAsync(maChuyenDi);

        public async Task<LichTrinhDto> CreateAsync(CreateLichTrinhDto dto)
        {
            int id = await _repository.CreateAsync(dto);
            return await _repository.GetByIdAsync(id);
        }

        public Task<bool> UpdateAsync(int id, UpdateLichTrinhDto dto) => _repository.UpdateAsync(id, dto);

        public Task<bool> DeleteAsync(int id) => _repository.DeleteAsync(id);
    }
}
