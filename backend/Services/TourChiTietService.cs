using System.Collections.Generic;
using System.Threading.Tasks;
using backend.Data;
using backend.DTOs;

namespace backend.Services
{
    public class TourChiTietService : ITourChiTietService
    {
        private readonly ITourChiTietRepository _repo;
        private readonly ITourRepository _tours;

        public TourChiTietService(ITourChiTietRepository repo, ITourRepository tours)
        {
            _repo = repo;
            _tours = tours;
        }

        public Task<IEnumerable<TourChiTietResponseDto>> GetAllAsync() => _repo.GetAllAsync();

        public Task<TourChiTietResponseDto> GetByIdAsync(int id) => _repo.GetByIdAsync(id);

        public Task<IEnumerable<TourChiTietResponseDto>> GetByTourAsync(int maTour) => _repo.GetByTourAsync(maTour);

        public async Task<TourChiTietResponseDto> CreateAsync(CreateTourChiTietDto dto)
        {
            await Validate(dto.MaTour,dto.NgayThu,dto.ThuTu,dto.LoaiDiaDiem,dto.MaDiaDiem,dto.MaNhaHang,dto.MaKhachSan,dto.ThoiGianBatDau,dto.ThoiGianKetThuc,dto.ChiPhi);
            var id = await _repo.CreateAsync(dto);
            return await _repo.GetByIdAsync(id);
        }

        public async Task<bool> UpdateAsync(int id, UpdateTourChiTietDto dto) {
            await Validate(dto.MaTour,dto.NgayThu,dto.ThuTu,dto.LoaiDiaDiem,dto.MaDiaDiem,dto.MaNhaHang,dto.MaKhachSan,dto.ThoiGianBatDau,dto.ThoiGianKetThuc,dto.ChiPhi);
            return await _repo.UpdateAsync(id,dto);
        }

        private async Task Validate(int tourId,int day,int order,string type,int? destination,int? restaurant,int? hotel,TimeSpan? start,TimeSpan? end,decimal price) {
            var tour = await _tours.GetByIdAsync(tourId);
            if (tour == null || day < 1 || day > tour.SoNgay || order < 1 || price < 0)
                throw new backend.Security.RequestRuleException("Ngày hoạt động phải nằm trong thời lượng tour; thứ tự phải dương và chi phí không âm.");
            var validOwner = type switch {
                "DiaDiem" => destination > 0 && restaurant == null && hotel == null,
                "NhaHang" => restaurant > 0 && destination == null && hotel == null,
                "KhachSan" => hotel > 0 && destination == null && restaurant == null,
                _ => false
            };
            if (!validOwner || start < TimeSpan.Zero || end < TimeSpan.Zero || start >= TimeSpan.FromDays(1) || end >= TimeSpan.FromDays(1) || (start.HasValue && end.HasValue && end <= start))
                throw new backend.Security.RequestRuleException("Chọn đúng một điểm dừng và giờ bắt đầu/kết thúc hợp lệ trong ngày.");
        }

        public Task<bool> DeleteAsync(int id) => _repo.DeleteAsync(id);
    }
}
