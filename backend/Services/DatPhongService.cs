using System.Collections.Generic;
using System.Threading.Tasks;
using backend.Data;
using backend.DTOs;

namespace backend.Services
{
    public class DatPhongService : IDatPhongService
    {
        private readonly IDatPhongRepository _repo;

        public DatPhongService(IDatPhongRepository repo)
        {
            _repo = repo;
        }

        public Task<IEnumerable<DatPhongResponseDto>> GetAllAsync() => _repo.GetAllAsync();

        public Task<DatPhongResponseDto> GetByIdAsync(int id) => _repo.GetByIdAsync(id);

        public Task<IEnumerable<DatPhongResponseDto>> GetByNguoiDungAsync(int maNguoiDung) => _repo.GetByNguoiDungAsync(maNguoiDung);

        public async Task<DatPhongResponseDto> CreateAsync(CreateDatPhongDto dto)
        {
            var id = await _repo.CreateAsync(dto);
            return await _repo.GetByIdAsync(id);
        }

        public Task<bool> UpdateAsync(int id, UpdateDatPhongDto dto) => _repo.UpdateAsync(id, dto);

        public Task<bool> DeleteAsync(int id) => _repo.DeleteAsync(id);
    }
}
