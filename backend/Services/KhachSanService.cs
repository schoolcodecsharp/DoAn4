using backend.Data;
using backend.DTOs;

namespace backend.Services
{
    public class KhachSanService : IKhachSanService
    {
        private readonly IKhachSanRepository _repository;

        public KhachSanService(IKhachSanRepository repository)
        {
            _repository = repository;
        }

        public async Task<IEnumerable<KhachSanDto>> GetAllAsync()
        {
            return await _repository.GetAllAsync();
        }

        public async Task<KhachSanDto?> GetByIdAsync(int id)
        {
            return await _repository.GetByIdAsync(id);
        }

        public async Task<IEnumerable<KhachSanDto>> GetByFilterAsync(string? tinh, string? loai, string? keyword)
        {
            return await _repository.GetByFilterAsync(ProvinceCatalog.Require(tinh), loai, keyword);
        }

        public async Task<int> CreateAsync(CreateKhachSanDto dto)
        {
            dto.TinhThanh = ProvinceCatalog.Require(dto.TinhThanh);
            return await _repository.CreateAsync(dto);
        }

        public async Task<bool> UpdateAsync(int id, UpdateKhachSanDto dto)
        {
            dto.TinhThanh = ProvinceCatalog.Require(dto.TinhThanh);
            return await _repository.UpdateAsync(id, dto);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            return await _repository.DeleteAsync(id);
        }
    }
}
