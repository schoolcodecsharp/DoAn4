using System.Collections.Generic;
using System.Threading.Tasks;
using backend.Data;
using backend.DTOs;

namespace backend.Services
{
    public class VaiTroService : IVaiTroService
    {
        private readonly IVaiTroRepository _repository;

        public VaiTroService(IVaiTroRepository repository)
        {
            _repository = repository;
        }

        public async Task<IEnumerable<VaiTroResponseDto>> GetAllAsync()
        {
            return await _repository.GetAllAsync();
        }

        public async Task<VaiTroResponseDto?> GetByIdAsync(int id)
        {
            return await _repository.GetByIdAsync(id);
        }

        public async Task<int> CreateAsync(CreateVaiTroDto dto)
        {
            return await _repository.CreateAsync(dto);
        }

        public async Task<bool> UpdateAsync(int id, UpdateVaiTroDto dto)
        {
            return await _repository.UpdateAsync(id, dto);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            return await _repository.DeleteAsync(id);
        }
    }
}
