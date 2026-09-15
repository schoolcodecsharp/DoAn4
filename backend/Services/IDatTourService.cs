using backend.DTOs;
namespace backend.Services;
public interface IDatTourService
{
    Task<IEnumerable<DatTourResponseDto>> GetAllAsync();
    Task<DatTourResponseDto?> GetByIdAsync(int id);
    Task<IEnumerable<DatTourResponseDto>> GetByNguoiDungAsync(int maNguoiDung);
    Task<int> CreateAsync(CreateDatTourDto dto);
    Task<bool> UpdateAsync(int id, UpdateDatTourDto dto);
    Task<bool> DeleteAsync(int id);
}