using backend.DTOs;
namespace backend.Services;
public interface IYeuThichService
{
    Task<IEnumerable<YeuThichResponseDto>> GetAllAsync();
    Task<YeuThichResponseDto?> GetByIdAsync(int id);
    Task<IEnumerable<YeuThichResponseDto>> GetByNguoiDungAsync(int maNguoiDung);
    Task<int> CreateAsync(CreateYeuThichDto dto);
    Task<bool> DeleteAsync(int id);
    Task<bool> DeleteByNguoiDungTourAsync(int maNguoiDung, int maTour);
}