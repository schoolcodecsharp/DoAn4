using backend.Data; using backend.DTOs;
namespace backend.Services;
public class ChiPhiService : IChiPhiService
{
    private readonly IChiPhiRepository _repo;
    public ChiPhiService(IChiPhiRepository repo) => _repo = repo;
    public Task<IEnumerable<ChiPhiResponseDto>> GetAllAsync() => _repo.GetAllAsync();
    public Task<ChiPhiResponseDto?> GetByIdAsync(int id) => _repo.GetByIdAsync(id);
    public Task<IEnumerable<ChiPhiResponseDto>> GetByChuyenDiAsync(int id) => _repo.GetByChuyenDiAsync(id);
    public Task<int> CreateAsync(CreateChiPhiDto dto) {
        Validate(dto.TenChiPhi,dto.LoaiChiPhi,dto.SoTien,dto.GhiChu);
        if (dto.NgayChi.HasValue) StorageRules.Date(dto.NgayChi.Value,"Ngày chi");
        if(dto.MaChuyenDi<1||dto.MaNguoiDung<1)throw new backend.Security.RequestRuleException("Chọn chuyến đi và người chi hợp lệ.");
        return _repo.CreateAsync(dto);
    }
    public async Task<bool> UpdateAsync(int id, UpdateChiPhiDto dto) {
        var old=await _repo.GetByIdAsync(id);if(old==null)return false;
        if (dto.NgayChi.HasValue) StorageRules.Date(dto.NgayChi.Value,"Ngày chi");
        Validate(dto.TenChiPhi??old.TenChiPhi,dto.LoaiChiPhi??old.LoaiChiPhi,dto.SoTien??old.SoTien,dto.GhiChu??old.GhiChu);
        return await _repo.UpdateAsync(id,dto);
    }
    private static void Validate(string name,string type,decimal amount,string? note) {
        if(string.IsNullOrWhiteSpace(name)||name.Length>200||type is not ("DiChuyen" or "AnUong" or "KhachSan" or "VeThamQuan" or "MuaSam" or "Khac")||amount<0||amount>1000000000||decimal.Round(amount,2)!=amount||note?.Length>500)
            throw new backend.Security.RequestRuleException("Nhập tên khoản chi (tối đa 200 ký tự), nhóm hợp lệ, số tiền không âm và ghi chú tối đa 500 ký tự.");
    }
    public Task<bool> DeleteAsync(int id) => _repo.DeleteAsync(id);
}
