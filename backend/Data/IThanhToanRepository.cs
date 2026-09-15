using backend.DTOs;

namespace backend.Data;

public interface IThanhToanRepository
{
    Task<IEnumerable<ThanhToanResponseDto>> GetAllAsync();
    Task<ThanhToanResponseDto?> GetByIdAsync(int id);
    Task<IEnumerable<ThanhToanResponseDto>> GetByDatTourAsync(int maDatTour);
    Task<IEnumerable<ThanhToanResponseDto>> GetByDatPhongAsync(int maDatPhong);
    Task<int> CreateAsync(CreateThanhToanDto dto);
    Task<bool> UpdateAsync(int id, UpdateThanhToanDto dto);
    Task<bool> DeleteAsync(int id);
}