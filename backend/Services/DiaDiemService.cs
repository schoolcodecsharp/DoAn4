using backend.Data;
using backend.DTOs;

namespace backend.Services
{
    public class DiaDiemService : IDiaDiemService
    {
        private readonly IDiaDiemRepository _repository;

        public DiaDiemService(IDiaDiemRepository repository)
        {
            _repository = repository;
        }

        public async Task<IEnumerable<DiaDiemDto>> GetAllAsync()
        {
            return await _repository.GetAllAsync();
        }

        public async Task<DiaDiemDto?> GetByIdAsync(int id)
        {
            return await _repository.GetByIdAsync(id);
        }

        public async Task<IEnumerable<DiaDiemDto>> GetByFilterAsync(string? tinh, int? maLoai, string? keyword)
        {
            return await _repository.GetByFilterAsync(tinh, maLoai, keyword);
        }

        public async Task<int> CreateAsync(CreateDiaDiemDto dto)
        {
            return await _repository.CreateAsync(dto);
        }

        public async Task<bool> UpdateAsync(int id, UpdateDiaDiemDto dto)
        {
            return await _repository.UpdateAsync(id, dto);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            return await _repository.DeleteAsync(id);
        }
    }
}
