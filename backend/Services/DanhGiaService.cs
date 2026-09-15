using backend.Data; using backend.DTOs;
namespace backend.Services;
public class DanhGiaService : IDanhGiaService
{
    private readonly IDanhGiaRepository _repo;
    public DanhGiaService(IDanhGiaRepository repo) => _repo = repo;
    public Task<IEnumerable<DanhGiaResponseDto>> GetAllAsync() => _repo.GetAllAsync();
    public Task<DanhGiaResponseDto?> GetByIdAsync(int id) => _repo.GetByIdAsync(id);
    public Task<IEnumerable<DanhGiaResponseDto>> GetByTourAsync(int id) => _repo.GetByTourAsync(id);
    public Task<IEnumerable<DanhGiaResponseDto>> GetByDiaDiemAsync(int id) => _repo.GetByDiaDiemAsync(id);
    public Task<IEnumerable<DanhGiaResponseDto>> GetByNguoiDungAsync(int id) => _repo.GetByNguoiDungAsync(id);
    public Task<int> CreateAsync(CreateDanhGiaDto dto) => _repo.CreateAsync(dto);
    public Task<bool> UpdateAsync(int id, UpdateDanhGiaDto dto) => _repo.UpdateAsync(id, dto);
    public Task<bool> DeleteAsync(int id) => _repo.DeleteAsync(id);
}