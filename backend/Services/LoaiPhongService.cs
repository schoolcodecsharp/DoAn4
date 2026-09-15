using backend.Data;
using backend.DTOs;

namespace backend.Services
{
    public class LoaiPhongService : ILoaiPhongService
    {
        private readonly ILoaiPhongRepository _repository;

        public LoaiPhongService(ILoaiPhongRepository repository)
        {
            _repository = repository;
        }

        public async Task<IEnumerable<LoaiPhongDto>> GetAllAsync()
        {
            return await _repository.GetAllAsync();
        }

        public async Task<LoaiPhongDto?> GetByIdAsync(int id)
        {
            return await _repository.GetByIdAsync(id);
        }

        public async Task<IEnumerable<LoaiPhongDto>> GetByKhachSanAsync(int maKhachSan)
        {
            return await _repository.GetByKhachSanAsync(maKhachSan);
        }

        public async Task<int> CreateAsync(CreateLoaiPhongDto dto)
        {
            return await _repository.CreateAsync(dto);
        }

        public async Task<bool> UpdateAsync(int id, UpdateLoaiPhongDto dto)
        {
            return await _repository.UpdateAsync(id, dto);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            return await _repository.DeleteAsync(id);
        }
    }
}
