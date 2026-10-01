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
            Validate(dto);
            return await _repository.CreateAsync(dto);
        }

        public async Task<bool> UpdateAsync(int id, UpdateNhaHangDto dto)
        {
            Validate(dto);
            return await _repository.UpdateAsync(id, dto);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            return await _repository.DeleteAsync(id);
        }
        private static void Validate(CreateNhaHangDto dto)
        {
            dto.TinhThanh = ProvinceCatalog.Require(dto.TinhThanh);
            if (string.IsNullOrWhiteSpace(dto.TenNhaHang) || dto.TenNhaHang.Trim().Length > 200 ||
                dto.GiaMin < 0 || dto.GiaMax < dto.GiaMin || dto.GiaMax > 1000000000 ||
                dto.GioMoCua < TimeSpan.Zero || dto.GioMoCua >= TimeSpan.FromDays(1) ||
                dto.GioDongCua < TimeSpan.Zero || dto.GioDongCua >= TimeSpan.FromDays(1))
                throw new backend.Security.RequestRuleException("Nhập tên nhà hàng, khoảng chi phí không âm (thấp nhất ≤ cao nhất) và giờ hợp lệ.");
            dto.TenNhaHang = dto.TenNhaHang.Trim();
        }
    }
}
