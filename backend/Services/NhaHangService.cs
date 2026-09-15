using backend.Data;
using backend.DTOs;

namespace backend.Services
{
    public class NhaHangService : INhaHangService
    {
        private readonly INhaHangRepository _repository;

        public NhaHangService(INhaHangRepository repository)
        {
            _repository = repository;
        }

        public async Task<IEnumerable<NhaHangDto>> GetAllAsync()
        {
            return await _repository.GetAllAsync();
        }

        public async Task<NhaHangDto?> GetByIdAsync(int id)
        {
            return await _repository.GetByIdAsync(id);
        }

        public async Task<int> CreateAsync(CreateNhaHangDto dto)
        {
            return await _repository.CreateAsync(dto);
        }

        public async Task<bool> UpdateAsync(int id, UpdateNhaHangDto dto)
        {
            return await _repository.UpdateAsync(id, dto);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            return await _repository.DeleteAsync(id);
        }
    }
}
