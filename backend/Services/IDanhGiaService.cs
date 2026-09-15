using backend.DTOs;
namespace backend.Services;
public interface IDanhGiaService
{
    Task<IEnumerable<DanhGiaResponseDto>> GetAllAsync();
    Task<DanhGiaResponseDto?> GetByIdAsync(int id);
    Task<IEnumerable<DanhGiaResponseDto>> GetByTourAsync(int maTour);
    Task<IEnumerable<DanhGiaResponseDto>> GetByDiaDiemAsync(int maDiaDiem);
    Task<IEnumerable<DanhGiaResponseDto>> GetByNguoiDungAsync(int maNguoiDung);
    Task<int> CreateAsync(CreateDanhGiaDto dto);
    Task<bool> UpdateAsync(int id, UpdateDanhGiaDto dto);
    Task<bool> DeleteAsync(int id);
}