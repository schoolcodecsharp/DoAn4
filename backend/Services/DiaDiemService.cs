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
            return await _repository.GetByFilterAsync(ProvinceCatalog.Require(tinh), maLoai, keyword);
        }

        public async Task<int> CreateAsync(CreateDiaDiemDto dto)
        {
            ValidatePrice(dto);
            dto.TinhThanh = ProvinceCatalog.Require(dto.TinhThanh);
            return await _repository.CreateAsync(dto);
        }

        public async Task<bool> UpdateAsync(int id, UpdateDiaDiemDto dto)
        {
            ValidatePrice(dto);
            dto.TinhThanh = ProvinceCatalog.Require(dto.TinhThanh);
            return await _repository.UpdateAsync(id, dto);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            return await _repository.DeleteAsync(id);
        }

        private static void ValidatePrice(CreateDiaDiemDto dto)
        {
            StorageRules.Money(dto.GiaVe, "Giá vé");
            StorageRules.Money(dto.GiaVeMin, "Giá vé thấp nhất");
            StorageRules.Money(dto.GiaVeMax, "Giá vé cao nhất");
            if (dto.MienPhi && (dto.GiaVe != 0 || dto.GiaVeMin != 0 || dto.GiaVeMax != 0))
                throw new backend.Security.RequestRuleException("Điểm miễn phí phải có các giá vé bằng 0.");
            if (dto.GiaVeMax > 0 && dto.GiaVeMax < dto.GiaVeMin)
                throw new backend.Security.RequestRuleException("Giá vé cao nhất phải không thấp hơn giá vé thấp nhất.");
        }
    }
}
