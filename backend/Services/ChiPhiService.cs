using backend.Data; using backend.DTOs;
namespace backend.Services;
public class ChiPhiService : IChiPhiService
{
    private readonly IChiPhiRepository _repo;
    public ChiPhiService(IChiPhiRepository repo) => _repo = repo;
    public Task<IEnumerable<ChiPhiResponseDto>> GetAllAsync() => _repo.GetAllAsync();
    public Task<ChiPhiResponseDto?> GetByIdAsync(int id) => _repo.GetByIdAsync(id);
    public Task<IEnumerable<ChiPhiResponseDto>> GetByChuyenDiAsync(int id) => _repo.GetByChuyenDiAsync(id);
    public Task<int> CreateAsync(CreateChiPhiDto dto) => _repo.CreateAsync(dto);
    public Task<bool> UpdateAsync(int id, UpdateChiPhiDto dto) => _repo.UpdateAsync(id, dto);
    public Task<bool> DeleteAsync(int id) => _repo.DeleteAsync(id);
}