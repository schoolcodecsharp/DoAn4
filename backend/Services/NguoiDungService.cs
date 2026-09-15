using System.Collections.Generic;
using System.Threading.Tasks;
using backend.Data;
using backend.DTOs;

namespace backend.Services
{
    public class NguoiDungService : INguoiDungService
    {
        private readonly INguoiDungRepository _repository;

        public NguoiDungService(INguoiDungRepository repository)
        {
            _repository = repository;
        }

        public async Task<IEnumerable<NguoiDungResponseDto>> GetAllAsync()
        {
            return await _repository.GetAllAsync();
        }

        public async Task<NguoiDungResponseDto?> GetByIdAsync(int id)
        {
            return await _repository.GetByIdAsync(id);
        }

        public async Task<NguoiDungResponseDto?> GetByEmailAsync(string email)
        {
            return await _repository.GetByEmailAsync(email);
        }

        public async Task<int> CreateAsync(CreateNguoiDungDto dto)
        {
            return await _repository.CreateAsync(dto);
        }

        public async Task<bool> UpdateAsync(int id, UpdateNguoiDungDto dto)
        {
            return await _repository.UpdateAsync(id, dto);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            return await _repository.DeleteAsync(id);
        }
    }
}
