using System.Collections.Generic;
using System.Threading.Tasks;
using backend.DTOs;
using backend.Data;

namespace backend.Services
{
    public class ChuyenDiService : IChuyenDiService
    {
        private readonly IChuyenDiRepository _repository;

        public ChuyenDiService(IChuyenDiRepository repository)
        {
            _repository = repository;
        }

        public Task<IEnumerable<ChuyenDiDto>> GetAllAsync() => _repository.GetAllAsync();

        public Task<ChuyenDiDto> GetByIdAsync(int id) => _repository.GetByIdAsync(id);

        public Task<IEnumerable<ChuyenDiDto>> GetByNguoiDungAsync(int maNguoiDung) => _repository.GetByNguoiDungAsync(maNguoiDung);

        public async Task<ChuyenDiDto> CreateAsync(CreateChuyenDiDto dto)
        {
            int id = await _repository.CreateAsync(dto);
            return await _repository.GetByIdAsync(id);
        }

        public Task<bool> UpdateAsync(int id, UpdateChuyenDiDto dto) => _repository.UpdateAsync(id, dto);

        public Task<bool> DeleteAsync(int id) => _repository.DeleteAsync(id);
    }
}
