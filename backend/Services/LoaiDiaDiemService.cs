using System.Collections.Generic;
using System.Threading.Tasks;
using backend.Data;
using backend.DTOs;

namespace backend.Services
{
    public class LoaiDiaDiemService : ILoaiDiaDiemService
    {
        private readonly ILoaiDiaDiemRepository _repository;

        public LoaiDiaDiemService(ILoaiDiaDiemRepository repository)
        {
            _repository = repository;
        }

        public async Task<IEnumerable<LoaiDiaDiemResponseDto>> GetAllAsync()
        {
            return await _repository.GetAllAsync();
        }

        public async Task<LoaiDiaDiemResponseDto?> GetByIdAsync(int id)
        {
            return await _repository.GetByIdAsync(id);
        }

        public async Task<int> CreateAsync(CreateLoaiDiaDiemDto dto)
        {
            return await _repository.CreateAsync(dto);
        }

        public async Task<bool> UpdateAsync(int id, UpdateLoaiDiaDiemDto dto)
        {
            return await _repository.UpdateAsync(id, dto);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            return await _repository.DeleteAsync(id);
        }
    }
}
