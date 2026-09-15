using backend.Data; using backend.DTOs;
namespace backend.Services;
public class ThanhToanService : IThanhToanService
{
    private readonly IThanhToanRepository _repo;
    public ThanhToanService(IThanhToanRepository repo) => _repo = repo;
    public Task<IEnumerable<ThanhToanResponseDto>> GetAllAsync() => _repo.GetAllAsync();
    public Task<ThanhToanResponseDto?> GetByIdAsync(int id) => _repo.GetByIdAsync(id);
    public Task<IEnumerable<ThanhToanResponseDto>> GetByDatTourAsync(int id) => _repo.GetByDatTourAsync(id);
    public Task<IEnumerable<ThanhToanResponseDto>> GetByDatPhongAsync(int id) => _repo.GetByDatPhongAsync(id);
    public Task<int> CreateAsync(CreateThanhToanDto dto) => _repo.CreateAsync(dto);
    public Task<bool> UpdateAsync(int id, UpdateThanhToanDto dto) => _repo.UpdateAsync(id, dto);
    public Task<bool> DeleteAsync(int id) => _repo.DeleteAsync(id);
}