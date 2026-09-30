using backend.Data; using backend.DTOs;
namespace backend.Services;
public class MaGiamGiaService : IMaGiamGiaService
{
    private readonly IMaGiamGiaRepository _repo;
    public MaGiamGiaService(IMaGiamGiaRepository repo) => _repo = repo;
    public Task<IEnumerable<MaGiamGiaResponseDto>> GetAllAsync() => _repo.GetAllAsync();
    public Task<MaGiamGiaResponseDto?> GetByIdAsync(int id) => _repo.GetByIdAsync(id);
    public Task<MaGiamGiaResponseDto?> GetByCodeAsync(string code) => _repo.GetByCodeAsync(code);
    public Task<int> CreateAsync(CreateMaGiamGiaDto dto) {
        Validate(dto.Code,dto.MoTa,dto.LoaiGiam,dto.GiaTriGiam,dto.GiamToiDa,dto.DonHangToiThieu,dto.SoLuong,0,dto.NgayBatDau,dto.NgayKetThuc);
        dto.Code=dto.Code.Trim().ToUpperInvariant();
        return _repo.CreateAsync(dto);
    }
    public async Task<bool> UpdateAsync(int id, UpdateMaGiamGiaDto dto) {
        var old=await _repo.GetByIdAsync(id); if(old==null)return false;
        Validate(old.Code,dto.MoTa??old.MoTa,old.LoaiGiam,dto.GiaTriGiam??old.GiaTriGiam,dto.GiamToiDa??old.GiamToiDa,
            dto.DonHangToiThieu??old.DonHangToiThieu,dto.SoLuong??old.SoLuong,old.SoLuongDaDung,dto.NgayBatDau??old.NgayBatDau,dto.NgayKetThuc??old.NgayKetThuc);
        return await _repo.UpdateAsync(id,dto);
    }
    private static void Validate(string code,string? note,string type,decimal value,decimal? cap,decimal minimum,int quantity,int used,DateTime start,DateTime end) {
        StorageRules.Date(start,"Ngày bắt đầu");
        StorageRules.Date(end,"Ngày kết thúc");
        StorageRules.Money(value,"Giá trị giảm");
        StorageRules.Money(minimum,"Đơn tối thiểu");
        if (cap.HasValue) StorageRules.Money(cap.Value,"Giảm tối đa");
        if(string.IsNullOrWhiteSpace(code)||code.Length>50||note?.Length>255||type is not ("PhanTram" or "SoTien")||
            value<=0||value>1000000000||type=="PhanTram"&&value>100||cap<0||minimum<0||quantity<0||quantity>0&&quantity<used||end<=start)
            throw new backend.Security.RequestRuleException("Kiểm tra mã (tối đa 50 ký tự), mức giảm, số lượng và ngày hiệu lực. Phần trăm không vượt 100; số lượng không thấp hơn lượt đã dùng.");
    }
    public Task<bool> DeleteAsync(int id) => _repo.DeleteAsync(id);
}
