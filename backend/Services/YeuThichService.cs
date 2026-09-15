using backend.Data; using backend.DTOs;
namespace backend.Services;
public class YeuThichService : IYeuThichService
{
    private readonly IYeuThichRepository _repo;
    public YeuThichService(IYeuThichRepository repo) => _repo = repo;
    public Task<IEnumerable<YeuThichResponseDto>> GetAllAsync() => _repo.GetAllAsync();
    public Task<YeuThichResponseDto?> GetByIdAsync(int id) => _repo.GetByIdAsync(id);
    public Task<IEnumerable<YeuThichResponseDto>> GetByNguoiDungAsync(int id) => _repo.GetByNguoiDungAsync(id);
    public Task<int> CreateAsync(CreateYeuThichDto dto) => _repo.CreateAsync(dto);
    public Task<bool> DeleteAsync(int id) => _repo.DeleteAsync(id);
    public Task<bool> DeleteByNguoiDungTourAsync(int maNguoiDung, int maTour) => _repo.DeleteByNguoiDungTourAsync(maNguoiDung, maTour);
}