using backend.Data; using backend.DTOs;
namespace backend.Services;
public class MaGiamGiaService : IMaGiamGiaService
{
    private readonly IMaGiamGiaRepository _repo;
    public MaGiamGiaService(IMaGiamGiaRepository repo) => _repo = repo;
    public Task<IEnumerable<MaGiamGiaResponseDto>> GetAllAsync() => _repo.GetAllAsync();
    public Task<MaGiamGiaResponseDto?> GetByIdAsync(int id) => _repo.GetByIdAsync(id);
    public Task<MaGiamGiaResponseDto?> GetByCodeAsync(string code) => _repo.GetByCodeAsync(code);
    public Task<int> CreateAsync(CreateMaGiamGiaDto dto) => _repo.CreateAsync(dto);
    public Task<bool> UpdateAsync(int id, UpdateMaGiamGiaDto dto) => _repo.UpdateAsync(id, dto);
    public Task<bool> DeleteAsync(int id) => _repo.DeleteAsync(id);
}