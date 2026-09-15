using backend.Data; using backend.DTOs;
namespace backend.Services;
public class HinhAnhService : IHinhAnhService
{
    private readonly IHinhAnhRepository _repo;
    public HinhAnhService(IHinhAnhRepository repo) => _repo = repo;
    public Task<IEnumerable<HinhAnhResponseDto>> GetAllAsync() => _repo.GetAllAsync();
    public Task<HinhAnhResponseDto?> GetByIdAsync(int id) => _repo.GetByIdAsync(id);
    public Task<IEnumerable<HinhAnhResponseDto>> GetByDoiTuongAsync(string loai, int maDoiTuong) => _repo.GetByDoiTuongAsync(loai, maDoiTuong);
    public Task<int> CreateAsync(CreateHinhAnhDto dto) => _repo.CreateAsync(dto);
    public Task<bool> UpdateAsync(int id, UpdateHinhAnhDto dto) => _repo.UpdateAsync(id, dto);
    public Task<bool> DeleteAsync(int id) => _repo.DeleteAsync(id);
}