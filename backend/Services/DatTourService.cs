using backend.Data; using backend.DTOs;
namespace backend.Services;
public class DatTourService : IDatTourService
{
    private readonly IDatTourRepository _repo;
    public DatTourService(IDatTourRepository repo) => _repo = repo;
    public Task<IEnumerable<DatTourResponseDto>> GetAllAsync() => _repo.GetAllAsync();
    public Task<DatTourResponseDto?> GetByIdAsync(int id) => _repo.GetByIdAsync(id);
    public Task<IEnumerable<DatTourResponseDto>> GetByNguoiDungAsync(int id) => _repo.GetByNguoiDungAsync(id);
    public Task<int> CreateAsync(CreateDatTourDto dto) => _repo.CreateAsync(dto);
    public Task<bool> UpdateAsync(int id, UpdateDatTourDto dto) => _repo.UpdateAsync(id, dto);
    public Task<bool> DeleteAsync(int id) => _repo.DeleteAsync(id);
}