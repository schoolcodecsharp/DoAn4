using backend.DTOs;
namespace backend.Data;
public interface IChiPhiRepository
{
    Task<IEnumerable<ChiPhiResponseDto>> GetAllAsync();
    Task<ChiPhiResponseDto?> GetByIdAsync(int id);
    Task<IEnumerable<ChiPhiResponseDto>> GetByChuyenDiAsync(int maChuyenDi);
    Task<int> CreateAsync(CreateChiPhiDto dto);
    Task<bool> UpdateAsync(int id, UpdateChiPhiDto dto);
    Task<bool> DeleteAsync(int id);
}