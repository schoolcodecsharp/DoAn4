using System.Collections.Generic;
using System.Threading.Tasks;
using backend.DTOs;
using backend.Data;

namespace backend.Services
{
    public class ThanhVienChuyenDiService : IThanhVienChuyenDiService
    {
        private readonly IThanhVienChuyenDiRepository _repository;

        public ThanhVienChuyenDiService(IThanhVienChuyenDiRepository repository)
        {
            _repository = repository;
        }

        public Task<IEnumerable<ThanhVienChuyenDiDto>> GetAllAsync() => _repository.GetAllAsync();

        public Task<ThanhVienChuyenDiDto> GetByIdAsync(int id) => _repository.GetByIdAsync(id);

        public Task<IEnumerable<ThanhVienChuyenDiDto>> GetByChuyenDiAsync(int maChuyenDi) => _repository.GetByChuyenDiAsync(maChuyenDi);

        public async Task<ThanhVienChuyenDiDto> CreateAsync(CreateThanhVienChuyenDiDto dto)
        {
            int id = await _repository.CreateAsync(dto);
            return await _repository.GetByIdAsync(id);
        }

        public Task<bool> UpdateAsync(int id, UpdateThanhVienChuyenDiDto dto) => _repository.UpdateAsync(id, dto);

        public Task<bool> UpdateTrangThaiAsync(int id, string trangThai) => _repository.UpdateTrangThaiAsync(id, trangThai);

        public Task<bool> DeleteAsync(int id) => _repository.DeleteAsync(id);
    }
}
