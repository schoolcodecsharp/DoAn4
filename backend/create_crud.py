import os

base_dir = r'd:\DoAn4\backend'

def write_file(subpath, content):
    path = os.path.join(base_dir, subpath)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8-sig') as f:
        f.write(content.strip())

dtos = {
    'Models/DTOs/DatTourDto.cs': '''
using System;

namespace backend.DTOs
{
    public class DatTourDto
    {
        public int MaDatTour { get; set; }
        public int MaNguoiDung { get; set; }
        public int MaTour { get; set; }
        public int? MaKhoiHanh { get; set; }
        public DateTime? NgayDat { get; set; }
        public DateTime NgayKhoiHanh { get; set; }
        public int SoNguoi { get; set; }
        public decimal GiaMoiNguoi { get; set; }
        public decimal TongTien { get; set; }
        public string TrangThai { get; set; }
        public string GhiChu { get; set; }
    }

    public class CreateDatTourDto
    {
        public int MaNguoiDung { get; set; }
        public int MaTour { get; set; }
        public int? MaKhoiHanh { get; set; }
        public DateTime NgayKhoiHanh { get; set; }
        public int SoNguoi { get; set; }
        public decimal GiaMoiNguoi { get; set; }
        public decimal TongTien { get; set; }
        public string TrangThai { get; set; } = "Pending";
        public string GhiChu { get; set; }
    }

    public class UpdateDatTourDto
    {
        public int MaNguoiDung { get; set; }
        public int MaTour { get; set; }
        public int? MaKhoiHanh { get; set; }
        public DateTime NgayKhoiHanh { get; set; }
        public int SoNguoi { get; set; }
        public decimal GiaMoiNguoi { get; set; }
        public decimal TongTien { get; set; }
        public string TrangThai { get; set; }
        public string GhiChu { get; set; }
    }
}
''',
    'Models/DTOs/ThanhToanDto.cs': '''
using System;

namespace backend.DTOs
{
    public class ThanhToanDto
    {
        public int MaThanhToan { get; set; }
        public string LoaiDon { get; set; }
        public int? MaDatTour { get; set; }
        public int? MaDatPhong { get; set; }
        public decimal SoTien { get; set; }
        public string PhuongThuc { get; set; }
        public string MaGiaoDich { get; set; }
        public string TrangThai { get; set; }
        public DateTime? NgayThanhToan { get; set; }
        public DateTime? NgayTao { get; set; }
    }

    public class CreateThanhToanDto
    {
        public string LoaiDon { get; set; }
        public int? MaDatTour { get; set; }
        public int? MaDatPhong { get; set; }
        public decimal SoTien { get; set; }
        public string PhuongThuc { get; set; }
        public string MaGiaoDich { get; set; }
        public string TrangThai { get; set; } = "ChoThanhToan";
    }

    public class UpdateThanhToanDto
    {
        public string LoaiDon { get; set; }
        public int? MaDatTour { get; set; }
        public int? MaDatPhong { get; set; }
        public decimal SoTien { get; set; }
        public string PhuongThuc { get; set; }
        public string MaGiaoDich { get; set; }
        public string TrangThai { get; set; }
    }
}
''',
    'Models/DTOs/MaGiamGiaDto.cs': '''
using System;

namespace backend.DTOs
{
    public class MaGiamGiaDto
    {
        public int MaCode { get; set; }
        public string Code { get; set; }
        public string MoTa { get; set; }
        public string LoaiGiam { get; set; }
        public decimal GiaTriGiam { get; set; }
        public decimal? GiamToiDa { get; set; }
        public decimal DonHangToiThieu { get; set; }
        public int SoLuong { get; set; }
        public int SoLuongDaDung { get; set; }
        public DateTime NgayBatDau { get; set; }
        public DateTime NgayKetThuc { get; set; }
        public bool TrangThai { get; set; }
    }

    public class CreateMaGiamGiaDto
    {
        public string Code { get; set; }
        public string MoTa { get; set; }
        public string LoaiGiam { get; set; }
        public decimal GiaTriGiam { get; set; }
        public decimal? GiamToiDa { get; set; }
        public decimal DonHangToiThieu { get; set; } = 0;
        public int SoLuong { get; set; } = 0;
        public int SoLuongDaDung { get; set; } = 0;
        public DateTime NgayBatDau { get; set; }
        public DateTime NgayKetThuc { get; set; }
        public bool TrangThai { get; set; } = true;
    }

    public class UpdateMaGiamGiaDto
    {
        public string Code { get; set; }
        public string MoTa { get; set; }
        public string LoaiGiam { get; set; }
        public decimal GiaTriGiam { get; set; }
        public decimal? GiamToiDa { get; set; }
        public decimal DonHangToiThieu { get; set; }
        public int SoLuong { get; set; }
        public int SoLuongDaDung { get; set; }
        public DateTime NgayBatDau { get; set; }
        public DateTime NgayKetThuc { get; set; }
        public bool TrangThai { get; set; }
    }
}
''',
    'Models/DTOs/HinhAnhDto.cs': '''
using System;

namespace backend.DTOs
{
    public class HinhAnhDto
    {
        public int MaHinhAnh { get; set; }
        public string LoaiDoiTuong { get; set; }
        public int MaDoiTuong { get; set; }
        public string DuongDan { get; set; }
        public string MoTa { get; set; }
        public int ThuTu { get; set; }
        public DateTime? NgayTao { get; set; }
    }

    public class CreateHinhAnhDto
    {
        public string LoaiDoiTuong { get; set; }
        public int MaDoiTuong { get; set; }
        public string DuongDan { get; set; }
        public string MoTa { get; set; }
        public int ThuTu { get; set; } = 0;
    }

    public class UpdateHinhAnhDto
    {
        public string LoaiDoiTuong { get; set; }
        public int MaDoiTuong { get; set; }
        public string DuongDan { get; set; }
        public string MoTa { get; set; }
        public int ThuTu { get; set; }
    }
}
''',
    'Models/DTOs/ChiPhiDto.cs': '''
using System;

namespace backend.DTOs
{
    public class ChiPhiDto
    {
        public int MaChiPhi { get; set; }
        public int MaChuyenDi { get; set; }
        public int? MaNguoiDung { get; set; }
        public string TenChiPhi { get; set; }
        public string LoaiChiPhi { get; set; }
        public decimal SoTien { get; set; }
        public DateTime? NgayChi { get; set; }
        public string GhiChu { get; set; }
        public DateTime? NgayTao { get; set; }
    }

    public class CreateChiPhiDto
    {
        public int MaChuyenDi { get; set; }
        public int? MaNguoiDung { get; set; }
        public string TenChiPhi { get; set; }
        public string LoaiChiPhi { get; set; } = "Khac";
        public decimal SoTien { get; set; }
        public DateTime? NgayChi { get; set; }
        public string GhiChu { get; set; }
    }

    public class UpdateChiPhiDto
    {
        public int MaChuyenDi { get; set; }
        public int? MaNguoiDung { get; set; }
        public string TenChiPhi { get; set; }
        public string LoaiChiPhi { get; set; }
        public decimal SoTien { get; set; }
        public DateTime? NgayChi { get; set; }
        public string GhiChu { get; set; }
    }
}
''',
    'Models/DTOs/DanhGiaDto.cs': '''
using System;

namespace backend.DTOs
{
    public class DanhGiaDto
    {
        public int MaDanhGia { get; set; }
        public int MaNguoiDung { get; set; }
        public int? MaTour { get; set; }
        public int? MaDiaDiem { get; set; }
        public int? MaNhaHang { get; set; }
        public int? MaKhachSan { get; set; }
        public int SoSao { get; set; }
        public string NoiDung { get; set; }
        public DateTime? NgayDanhGia { get; set; }
        public bool TrangThai { get; set; }
    }

    public class CreateDanhGiaDto
    {
        public int MaNguoiDung { get; set; }
        public int? MaTour { get; set; }
        public int? MaDiaDiem { get; set; }
        public int? MaNhaHang { get; set; }
        public int? MaKhachSan { get; set; }
        public int SoSao { get; set; }
        public string NoiDung { get; set; }
        public bool TrangThai { get; set; } = true;
    }

    public class UpdateDanhGiaDto
    {
        public int MaNguoiDung { get; set; }
        public int? MaTour { get; set; }
        public int? MaDiaDiem { get; set; }
        public int? MaNhaHang { get; set; }
        public int? MaKhachSan { get; set; }
        public int SoSao { get; set; }
        public string NoiDung { get; set; }
        public bool TrangThai { get; set; }
    }
}
''',
    'Models/DTOs/YeuThichDto.cs': '''
using System;

namespace backend.DTOs
{
    public class YeuThichDto
    {
        public int MaYeuThich { get; set; }
        public int MaNguoiDung { get; set; }
        public int? MaTour { get; set; }
        public int? MaDiaDiem { get; set; }
        public int? MaNhaHang { get; set; }
        public int? MaKhachSan { get; set; }
        public DateTime? NgayThem { get; set; }
    }

    public class CreateYeuThichDto
    {
        public int MaNguoiDung { get; set; }
        public int? MaTour { get; set; }
        public int? MaDiaDiem { get; set; }
        public int? MaNhaHang { get; set; }
        public int? MaKhachSan { get; set; }
    }

    public class UpdateYeuThichDto
    {
        public int MaNguoiDung { get; set; }
        public int? MaTour { get; set; }
        public int? MaDiaDiem { get; set; }
        public int? MaNhaHang { get; set; }
        public int? MaKhachSan { get; set; }
    }
}
''',
    'Data/IDatTourRepository.cs': '''
using System.Collections.Generic;
using System.Threading.Tasks;
using backend.DTOs;

namespace backend.Data
{
    public interface IDatTourRepository
    {
        Task<IEnumerable<DatTourDto>> GetAllAsync();
        Task<DatTourDto> GetByIdAsync(int id);
        Task<IEnumerable<DatTourDto>> GetByNguoiDungAsync(int maNguoiDung);
        Task<int> CreateAsync(CreateDatTourDto dto);
        Task<bool> UpdateAsync(int id, UpdateDatTourDto dto);
        Task<bool> DeleteAsync(int id);
    }
}
''',
    'Data/DatTourRepository.cs': '''
using System.Collections.Generic;
using System.Threading.Tasks;
using backend.DTOs;
using Dapper;
using Microsoft.Extensions.Configuration;
using MySqlConnector;

namespace backend.Data
{
    public class DatTourRepository : IDatTourRepository
    {
        private readonly string _connectionString;
        public DatTourRepository(IConfiguration config)
        {
            _connectionString = config.GetConnectionString("DefaultConnection")!;
        }
        private MySqlConnection GetConnection() => new MySqlConnection(_connectionString);

        public async Task<IEnumerable<DatTourDto>> GetAllAsync()
        {
            using var conn = GetConnection();
            return await conn.QueryAsync<DatTourDto>("SELECT * FROM DatTour");
        }

        public async Task<DatTourDto> GetByIdAsync(int id)
        {
            using var conn = GetConnection();
            return await conn.QueryFirstOrDefaultAsync<DatTourDto>("SELECT * FROM DatTour WHERE MaDatTour = @Id", new { Id = id });
        }

        public async Task<IEnumerable<DatTourDto>> GetByNguoiDungAsync(int maNguoiDung)
        {
            using var conn = GetConnection();
            return await conn.QueryAsync<DatTourDto>("SELECT * FROM DatTour WHERE MaNguoiDung = @MaNguoiDung", new { MaNguoiDung = maNguoiDung });
        }

        public async Task<int> CreateAsync(CreateDatTourDto dto)
        {
            using var conn = GetConnection();
            var sql = @"INSERT INTO DatTour (MaNguoiDung, MaTour, MaKhoiHanh, NgayDat, NgayKhoiHanh, SoNguoi, GiaMoiNguoi, TongTien, TrangThai, GhiChu) 
                        VALUES (@MaNguoiDung, @MaTour, @MaKhoiHanh, NOW(), @NgayKhoiHanh, @SoNguoi, @GiaMoiNguoi, @TongTien, @TrangThai, @GhiChu);
                        SELECT LAST_INSERT_ID();";
            return await conn.ExecuteScalarAsync<int>(sql, dto);
        }

        public async Task<bool> UpdateAsync(int id, UpdateDatTourDto dto)
        {
            using var conn = GetConnection();
            var sql = @"UPDATE DatTour SET MaNguoiDung = @MaNguoiDung, MaTour = @MaTour, MaKhoiHanh = @MaKhoiHanh, 
                        NgayKhoiHanh = @NgayKhoiHanh, SoNguoi = @SoNguoi, GiaMoiNguoi = @GiaMoiNguoi, TongTien = @TongTien, 
                        TrangThai = @TrangThai, GhiChu = @GhiChu WHERE MaDatTour = @Id";
            var parameters = new DynamicParameters(dto);
            parameters.Add("Id", id);
            var affectedRows = await conn.ExecuteAsync(sql, parameters);
            return affectedRows > 0;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            using var conn = GetConnection();
            return await conn.ExecuteAsync("DELETE FROM DatTour WHERE MaDatTour = @Id", new { Id = id }) > 0;
        }
    }
}
''',
    'Data/IThanhToanRepository.cs': '''
using System.Collections.Generic;
using System.Threading.Tasks;
using backend.DTOs;

namespace backend.Data
{
    public interface IThanhToanRepository
    {
        Task<IEnumerable<ThanhToanDto>> GetAllAsync();
        Task<ThanhToanDto> GetByIdAsync(int id);
        Task<int> CreateAsync(CreateThanhToanDto dto);
        Task<bool> UpdateAsync(int id, UpdateThanhToanDto dto);
        Task<bool> DeleteAsync(int id);
    }
}
''',
    'Data/ThanhToanRepository.cs': '''
using System.Collections.Generic;
using System.Threading.Tasks;
using backend.DTOs;
using Dapper;
using Microsoft.Extensions.Configuration;
using MySqlConnector;

namespace backend.Data
{
    public class ThanhToanRepository : IThanhToanRepository
    {
        private readonly string _connectionString;
        public ThanhToanRepository(IConfiguration config)
        {
            _connectionString = config.GetConnectionString("DefaultConnection")!;
        }
        private MySqlConnection GetConnection() => new MySqlConnection(_connectionString);

        public async Task<IEnumerable<ThanhToanDto>> GetAllAsync()
        {
            using var conn = GetConnection();
            return await conn.QueryAsync<ThanhToanDto>("SELECT * FROM ThanhToan");
        }

        public async Task<ThanhToanDto> GetByIdAsync(int id)
        {
            using var conn = GetConnection();
            return await conn.QueryFirstOrDefaultAsync<ThanhToanDto>("SELECT * FROM ThanhToan WHERE MaThanhToan = @Id", new { Id = id });
        }

        public async Task<int> CreateAsync(CreateThanhToanDto dto)
        {
            using var conn = GetConnection();
            var sql = @"INSERT INTO ThanhToan (LoaiDon, MaDatTour, MaDatPhong, SoTien, PhuongThuc, MaGiaoDich, TrangThai, NgayTao) 
                        VALUES (@LoaiDon, @MaDatTour, @MaDatPhong, @SoTien, @PhuongThuc, @MaGiaoDich, @TrangThai, NOW());
                        SELECT LAST_INSERT_ID();";
            return await conn.ExecuteScalarAsync<int>(sql, dto);
        }

        public async Task<bool> UpdateAsync(int id, UpdateThanhToanDto dto)
        {
            using var conn = GetConnection();
            var sql = @"UPDATE ThanhToan SET LoaiDon = @LoaiDon, MaDatTour = @MaDatTour, MaDatPhong = @MaDatPhong, 
                        SoTien = @SoTien, PhuongThuc = @PhuongThuc, MaGiaoDich = @MaGiaoDich, TrangThai = @TrangThai 
                        WHERE MaThanhToan = @Id";
            var parameters = new DynamicParameters(dto);
            parameters.Add("Id", id);
            var affectedRows = await conn.ExecuteAsync(sql, parameters);
            return affectedRows > 0;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            using var conn = GetConnection();
            return await conn.ExecuteAsync("DELETE FROM ThanhToan WHERE MaThanhToan = @Id", new { Id = id }) > 0;
        }
    }
}
''',
    'Data/IMaGiamGiaRepository.cs': '''
using System.Collections.Generic;
using System.Threading.Tasks;
using backend.DTOs;

namespace backend.Data
{
    public interface IMaGiamGiaRepository
    {
        Task<IEnumerable<MaGiamGiaDto>> GetAllAsync();
        Task<MaGiamGiaDto> GetByIdAsync(int id);
        Task<MaGiamGiaDto> GetByCodeAsync(string code);
        Task<int> CreateAsync(CreateMaGiamGiaDto dto);
        Task<bool> UpdateAsync(int id, UpdateMaGiamGiaDto dto);
        Task<bool> DeleteAsync(int id);
    }
}
''',
    'Data/MaGiamGiaRepository.cs': '''
using System.Collections.Generic;
using System.Threading.Tasks;
using backend.DTOs;
using Dapper;
using Microsoft.Extensions.Configuration;
using MySqlConnector;

namespace backend.Data
{
    public class MaGiamGiaRepository : IMaGiamGiaRepository
    {
        private readonly string _connectionString;
        public MaGiamGiaRepository(IConfiguration config)
        {
            _connectionString = config.GetConnectionString("DefaultConnection")!;
        }
        private MySqlConnection GetConnection() => new MySqlConnection(_connectionString);

        public async Task<IEnumerable<MaGiamGiaDto>> GetAllAsync()
        {
            using var conn = GetConnection();
            return await conn.QueryAsync<MaGiamGiaDto>("SELECT * FROM MaGiamGia");
        }

        public async Task<MaGiamGiaDto> GetByIdAsync(int id)
        {
            using var conn = GetConnection();
            return await conn.QueryFirstOrDefaultAsync<MaGiamGiaDto>("SELECT * FROM MaGiamGia WHERE MaCode = @Id", new { Id = id });
        }

        public async Task<MaGiamGiaDto> GetByCodeAsync(string code)
        {
            using var conn = GetConnection();
            return await conn.QueryFirstOrDefaultAsync<MaGiamGiaDto>("SELECT * FROM MaGiamGia WHERE Code = @Code", new { Code = code });
        }

        public async Task<int> CreateAsync(CreateMaGiamGiaDto dto)
        {
            using var conn = GetConnection();
            var sql = @"INSERT INTO MaGiamGia (Code, MoTa, LoaiGiam, GiaTriGiam, GiamToiDa, DonHangToiThieu, SoLuong, SoLuongDaDung, NgayBatDau, NgayKetThuc, TrangThai) 
                        VALUES (@Code, @MoTa, @LoaiGiam, @GiaTriGiam, @GiamToiDa, @DonHangToiThieu, @SoLuong, @SoLuongDaDung, @NgayBatDau, @NgayKetThuc, @TrangThai);
                        SELECT LAST_INSERT_ID();";
            return await conn.ExecuteScalarAsync<int>(sql, dto);
        }

        public async Task<bool> UpdateAsync(int id, UpdateMaGiamGiaDto dto)
        {
            using var conn = GetConnection();
            var sql = @"UPDATE MaGiamGia SET Code = @Code, MoTa = @MoTa, LoaiGiam = @LoaiGiam, GiaTriGiam = @GiaTriGiam, 
                        GiamToiDa = @GiamToiDa, DonHangToiThieu = @DonHangToiThieu, SoLuong = @SoLuong, SoLuongDaDung = @SoLuongDaDung, 
                        NgayBatDau = @NgayBatDau, NgayKetThuc = @NgayKetThuc, TrangThai = @TrangThai WHERE MaCode = @Id";
            var parameters = new DynamicParameters(dto);
            parameters.Add("Id", id);
            var affectedRows = await conn.ExecuteAsync(sql, parameters);
            return affectedRows > 0;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            using var conn = GetConnection();
            return await conn.ExecuteAsync("DELETE FROM MaGiamGia WHERE MaCode = @Id", new { Id = id }) > 0;
        }
    }
}
''',
    'Data/IHinhAnhRepository.cs': '''
using System.Collections.Generic;
using System.Threading.Tasks;
using backend.DTOs;

namespace backend.Data
{
    public interface IHinhAnhRepository
    {
        Task<IEnumerable<HinhAnhDto>> GetAllAsync();
        Task<HinhAnhDto> GetByIdAsync(int id);
        Task<IEnumerable<HinhAnhDto>> GetByLoaiVaMaAsync(string loai, int maDoiTuong);
        Task<int> CreateAsync(CreateHinhAnhDto dto);
        Task<bool> UpdateAsync(int id, UpdateHinhAnhDto dto);
        Task<bool> DeleteAsync(int id);
    }
}
''',
    'Data/HinhAnhRepository.cs': '''
using System.Collections.Generic;
using System.Threading.Tasks;
using backend.DTOs;
using Dapper;
using Microsoft.Extensions.Configuration;
using MySqlConnector;

namespace backend.Data
{
    public class HinhAnhRepository : IHinhAnhRepository
    {
        private readonly string _connectionString;
        public HinhAnhRepository(IConfiguration config)
        {
            _connectionString = config.GetConnectionString("DefaultConnection")!;
        }
        private MySqlConnection GetConnection() => new MySqlConnection(_connectionString);

        public async Task<IEnumerable<HinhAnhDto>> GetAllAsync()
        {
            using var conn = GetConnection();
            return await conn.QueryAsync<HinhAnhDto>("SELECT * FROM HinhAnh");
        }

        public async Task<HinhAnhDto> GetByIdAsync(int id)
        {
            using var conn = GetConnection();
            return await conn.QueryFirstOrDefaultAsync<HinhAnhDto>("SELECT * FROM HinhAnh WHERE MaHinhAnh = @Id", new { Id = id });
        }

        public async Task<IEnumerable<HinhAnhDto>> GetByLoaiVaMaAsync(string loai, int maDoiTuong)
        {
            using var conn = GetConnection();
            return await conn.QueryAsync<HinhAnhDto>("SELECT * FROM HinhAnh WHERE LoaiDoiTuong = @Loai AND MaDoiTuong = @MaDoiTuong ORDER BY ThuTu ASC", new { Loai = loai, MaDoiTuong = maDoiTuong });
        }

        public async Task<int> CreateAsync(CreateHinhAnhDto dto)
        {
            using var conn = GetConnection();
            var sql = @"INSERT INTO HinhAnh (LoaiDoiTuong, MaDoiTuong, DuongDan, MoTa, ThuTu, NgayTao) 
                        VALUES (@LoaiDoiTuong, @MaDoiTuong, @DuongDan, @MoTa, @ThuTu, NOW());
                        SELECT LAST_INSERT_ID();";
            return await conn.ExecuteScalarAsync<int>(sql, dto);
        }

        public async Task<bool> UpdateAsync(int id, UpdateHinhAnhDto dto)
        {
            using var conn = GetConnection();
            var sql = @"UPDATE HinhAnh SET LoaiDoiTuong = @LoaiDoiTuong, MaDoiTuong = @MaDoiTuong, DuongDan = @DuongDan, 
                        MoTa = @MoTa, ThuTu = @ThuTu WHERE MaHinhAnh = @Id";
            var parameters = new DynamicParameters(dto);
            parameters.Add("Id", id);
            var affectedRows = await conn.ExecuteAsync(sql, parameters);
            return affectedRows > 0;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            using var conn = GetConnection();
            return await conn.ExecuteAsync("DELETE FROM HinhAnh WHERE MaHinhAnh = @Id", new { Id = id }) > 0;
        }
    }
}
''',
    'Data/IChiPhiRepository.cs': '''
using System.Collections.Generic;
using System.Threading.Tasks;
using backend.DTOs;

namespace backend.Data
{
    public interface IChiPhiRepository
    {
        Task<IEnumerable<ChiPhiDto>> GetAllAsync();
        Task<ChiPhiDto> GetByIdAsync(int id);
        Task<IEnumerable<ChiPhiDto>> GetByChuyenDiAsync(int maChuyenDi);
        Task<int> CreateAsync(CreateChiPhiDto dto);
        Task<bool> UpdateAsync(int id, UpdateChiPhiDto dto);
        Task<bool> DeleteAsync(int id);
    }
}
''',
    'Data/ChiPhiRepository.cs': '''
using System.Collections.Generic;
using System.Threading.Tasks;
using backend.DTOs;
using Dapper;
using Microsoft.Extensions.Configuration;
using MySqlConnector;

namespace backend.Data
{
    public class ChiPhiRepository : IChiPhiRepository
    {
        private readonly string _connectionString;
        public ChiPhiRepository(IConfiguration config)
        {
            _connectionString = config.GetConnectionString("DefaultConnection")!;
        }
        private MySqlConnection GetConnection() => new MySqlConnection(_connectionString);

        public async Task<IEnumerable<ChiPhiDto>> GetAllAsync()
        {
            using var conn = GetConnection();
            return await conn.QueryAsync<ChiPhiDto>("SELECT * FROM ChiPhi");
        }

        public async Task<ChiPhiDto> GetByIdAsync(int id)
        {
            using var conn = GetConnection();
            return await conn.QueryFirstOrDefaultAsync<ChiPhiDto>("SELECT * FROM ChiPhi WHERE MaChiPhi = @Id", new { Id = id });
        }

        public async Task<IEnumerable<ChiPhiDto>> GetByChuyenDiAsync(int maChuyenDi)
        {
            using var conn = GetConnection();
            return await conn.QueryAsync<ChiPhiDto>("SELECT * FROM ChiPhi WHERE MaChuyenDi = @MaChuyenDi", new { MaChuyenDi = maChuyenDi });
        }

        public async Task<int> CreateAsync(CreateChiPhiDto dto)
        {
            using var conn = GetConnection();
            var sql = @"INSERT INTO ChiPhi (MaChuyenDi, MaNguoiDung, TenChiPhi, LoaiChiPhi, SoTien, NgayChi, GhiChu, NgayTao) 
                        VALUES (@MaChuyenDi, @MaNguoiDung, @TenChiPhi, @LoaiChiPhi, @SoTien, @NgayChi, @GhiChu, NOW());
                        SELECT LAST_INSERT_ID();";
            return await conn.ExecuteScalarAsync<int>(sql, dto);
        }

        public async Task<bool> UpdateAsync(int id, UpdateChiPhiDto dto)
        {
            using var conn = GetConnection();
            var sql = @"UPDATE ChiPhi SET MaChuyenDi = @MaChuyenDi, MaNguoiDung = @MaNguoiDung, TenChiPhi = @TenChiPhi, 
                        LoaiChiPhi = @LoaiChiPhi, SoTien = @SoTien, NgayChi = @NgayChi, GhiChu = @GhiChu WHERE MaChiPhi = @Id";
            var parameters = new DynamicParameters(dto);
            parameters.Add("Id", id);
            var affectedRows = await conn.ExecuteAsync(sql, parameters);
            return affectedRows > 0;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            using var conn = GetConnection();
            return await conn.ExecuteAsync("DELETE FROM ChiPhi WHERE MaChiPhi = @Id", new { Id = id }) > 0;
        }
    }
}
''',
    'Data/IDanhGiaRepository.cs': '''
using System.Collections.Generic;
using System.Threading.Tasks;
using backend.DTOs;

namespace backend.Data
{
    public interface IDanhGiaRepository
    {
        Task<IEnumerable<DanhGiaDto>> GetAllAsync();
        Task<DanhGiaDto> GetByIdAsync(int id);
        Task<IEnumerable<DanhGiaDto>> GetByTourAsync(int maTour);
        Task<IEnumerable<DanhGiaDto>> GetByDiaDiemAsync(int maDiaDiem);
        Task<IEnumerable<DanhGiaDto>> GetByNguoiDungAsync(int maNguoiDung);
        Task<int> CreateAsync(CreateDanhGiaDto dto);
        Task<bool> UpdateAsync(int id, UpdateDanhGiaDto dto);
        Task<bool> DeleteAsync(int id);
    }
}
''',
    'Data/DanhGiaRepository.cs': '''
using System.Collections.Generic;
using System.Threading.Tasks;
using backend.DTOs;
using Dapper;
using Microsoft.Extensions.Configuration;
using MySqlConnector;

namespace backend.Data
{
    public class DanhGiaRepository : IDanhGiaRepository
    {
        private readonly string _connectionString;
        public DanhGiaRepository(IConfiguration config)
        {
            _connectionString = config.GetConnectionString("DefaultConnection")!;
        }
        private MySqlConnection GetConnection() => new MySqlConnection(_connectionString);

        public async Task<IEnumerable<DanhGiaDto>> GetAllAsync()
        {
            using var conn = GetConnection();
            return await conn.QueryAsync<DanhGiaDto>("SELECT * FROM DanhGia");
        }

        public async Task<DanhGiaDto> GetByIdAsync(int id)
        {
            using var conn = GetConnection();
            return await conn.QueryFirstOrDefaultAsync<DanhGiaDto>("SELECT * FROM DanhGia WHERE MaDanhGia = @Id", new { Id = id });
        }

        public async Task<IEnumerable<DanhGiaDto>> GetByTourAsync(int maTour)
        {
            using var conn = GetConnection();
            return await conn.QueryAsync<DanhGiaDto>("SELECT * FROM DanhGia WHERE MaTour = @MaTour", new { MaTour = maTour });
        }

        public async Task<IEnumerable<DanhGiaDto>> GetByDiaDiemAsync(int maDiaDiem)
        {
            using var conn = GetConnection();
            return await conn.QueryAsync<DanhGiaDto>("SELECT * FROM DanhGia WHERE MaDiaDiem = @MaDiaDiem", new { MaDiaDiem = maDiaDiem });
        }

        public async Task<IEnumerable<DanhGiaDto>> GetByNguoiDungAsync(int maNguoiDung)
        {
            using var conn = GetConnection();
            return await conn.QueryAsync<DanhGiaDto>("SELECT * FROM DanhGia WHERE MaNguoiDung = @MaNguoiDung", new { MaNguoiDung = maNguoiDung });
        }

        public async Task<int> CreateAsync(CreateDanhGiaDto dto)
        {
            using var conn = GetConnection();
            var sql = @"INSERT INTO DanhGia (MaNguoiDung, MaTour, MaDiaDiem, MaNhaHang, MaKhachSan, SoSao, NoiDung, NgayDanhGia, TrangThai) 
                        VALUES (@MaNguoiDung, @MaTour, @MaDiaDiem, @MaNhaHang, @MaKhachSan, @SoSao, @NoiDung, NOW(), @TrangThai);
                        SELECT LAST_INSERT_ID();";
            return await conn.ExecuteScalarAsync<int>(sql, dto);
        }

        public async Task<bool> UpdateAsync(int id, UpdateDanhGiaDto dto)
        {
            using var conn = GetConnection();
            var sql = @"UPDATE DanhGia SET MaNguoiDung = @MaNguoiDung, MaTour = @MaTour, MaDiaDiem = @MaDiaDiem, 
                        MaNhaHang = @MaNhaHang, MaKhachSan = @MaKhachSan, SoSao = @SoSao, NoiDung = @NoiDung, TrangThai = @TrangThai 
                        WHERE MaDanhGia = @Id";
            var parameters = new DynamicParameters(dto);
            parameters.Add("Id", id);
            var affectedRows = await conn.ExecuteAsync(sql, parameters);
            return affectedRows > 0;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            using var conn = GetConnection();
            return await conn.ExecuteAsync("DELETE FROM DanhGia WHERE MaDanhGia = @Id", new { Id = id }) > 0;
        }
    }
}
''',
    'Data/IYeuThichRepository.cs': '''
using System.Collections.Generic;
using System.Threading.Tasks;
using backend.DTOs;

namespace backend.Data
{
    public interface IYeuThichRepository
    {
        Task<IEnumerable<YeuThichDto>> GetAllAsync();
        Task<YeuThichDto> GetByIdAsync(int id);
        Task<IEnumerable<YeuThichDto>> GetByNguoiDungAsync(int maNguoiDung);
        Task<int> CreateAsync(CreateYeuThichDto dto);
        Task<bool> UpdateAsync(int id, UpdateYeuThichDto dto);
        Task<bool> DeleteAsync(int id);
        Task<bool> DeleteByNguoiDungAndTourAsync(int maNguoiDung, int maTour);
    }
}
''',
    'Data/YeuThichRepository.cs': '''
using System.Collections.Generic;
using System.Threading.Tasks;
using backend.DTOs;
using Dapper;
using Microsoft.Extensions.Configuration;
using MySqlConnector;

namespace backend.Data
{
    public class YeuThichRepository : IYeuThichRepository
    {
        private readonly string _connectionString;
        public YeuThichRepository(IConfiguration config)
        {
            _connectionString = config.GetConnectionString("DefaultConnection")!;
        }
        private MySqlConnection GetConnection() => new MySqlConnection(_connectionString);

        public async Task<IEnumerable<YeuThichDto>> GetAllAsync()
        {
            using var conn = GetConnection();
            return await conn.QueryAsync<YeuThichDto>("SELECT * FROM YeuThich");
        }

        public async Task<YeuThichDto> GetByIdAsync(int id)
        {
            using var conn = GetConnection();
            return await conn.QueryFirstOrDefaultAsync<YeuThichDto>("SELECT * FROM YeuThich WHERE MaYeuThich = @Id", new { Id = id });
        }

        public async Task<IEnumerable<YeuThichDto>> GetByNguoiDungAsync(int maNguoiDung)
        {
            using var conn = GetConnection();
            return await conn.QueryAsync<YeuThichDto>("SELECT * FROM YeuThich WHERE MaNguoiDung = @MaNguoiDung", new { MaNguoiDung = maNguoiDung });
        }

        public async Task<int> CreateAsync(CreateYeuThichDto dto)
        {
            using var conn = GetConnection();
            var sql = @"INSERT INTO YeuThich (MaNguoiDung, MaTour, MaDiaDiem, MaNhaHang, MaKhachSan, NgayThem) 
                        VALUES (@MaNguoiDung, @MaTour, @MaDiaDiem, @MaNhaHang, @MaKhachSan, NOW());
                        SELECT LAST_INSERT_ID();";
            return await conn.ExecuteScalarAsync<int>(sql, dto);
        }

        public async Task<bool> UpdateAsync(int id, UpdateYeuThichDto dto)
        {
            using var conn = GetConnection();
            var sql = @"UPDATE YeuThich SET MaNguoiDung = @MaNguoiDung, MaTour = @MaTour, MaDiaDiem = @MaDiaDiem, 
                        MaNhaHang = @MaNhaHang, MaKhachSan = @MaKhachSan WHERE MaYeuThich = @Id";
            var parameters = new DynamicParameters(dto);
            parameters.Add("Id", id);
            var affectedRows = await conn.ExecuteAsync(sql, parameters);
            return affectedRows > 0;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            using var conn = GetConnection();
            return await conn.ExecuteAsync("DELETE FROM YeuThich WHERE MaYeuThich = @Id", new { Id = id }) > 0;
        }

        public async Task<bool> DeleteByNguoiDungAndTourAsync(int maNguoiDung, int maTour)
        {
            using var conn = GetConnection();
            return await conn.ExecuteAsync("DELETE FROM YeuThich WHERE MaNguoiDung = @MaNguoiDung AND MaTour = @MaTour", new { MaNguoiDung = maNguoiDung, MaTour = maTour }) > 0;
        }
    }
}
''',
    'Services/IDatTourService.cs': '''
using System.Collections.Generic;
using System.Threading.Tasks;
using backend.DTOs;

namespace backend.Services
{
    public interface IDatTourService
    {
        Task<IEnumerable<DatTourDto>> GetAllAsync();
        Task<DatTourDto> GetByIdAsync(int id);
        Task<IEnumerable<DatTourDto>> GetByNguoiDungAsync(int maNguoiDung);
        Task<int> CreateAsync(CreateDatTourDto dto);
        Task<bool> UpdateAsync(int id, UpdateDatTourDto dto);
        Task<bool> DeleteAsync(int id);
    }
}
''',
    'Services/DatTourService.cs': '''
using System.Collections.Generic;
using System.Threading.Tasks;
using backend.DTOs;
using backend.Data;

namespace backend.Services
{
    public class DatTourService : IDatTourService
    {
        private readonly IDatTourRepository _repository;
        public DatTourService(IDatTourRepository repository)
        {
            _repository = repository;
        }

        public async Task<IEnumerable<DatTourDto>> GetAllAsync() => await _repository.GetAllAsync();
        public async Task<DatTourDto> GetByIdAsync(int id) => await _repository.GetByIdAsync(id);
        public async Task<IEnumerable<DatTourDto>> GetByNguoiDungAsync(int maNguoiDung) => await _repository.GetByNguoiDungAsync(maNguoiDung);
        public async Task<int> CreateAsync(CreateDatTourDto dto) => await _repository.CreateAsync(dto);
        public async Task<bool> UpdateAsync(int id, UpdateDatTourDto dto) => await _repository.UpdateAsync(id, dto);
        public async Task<bool> DeleteAsync(int id) => await _repository.DeleteAsync(id);
    }
}
''',
    'Services/IThanhToanService.cs': '''
using System.Collections.Generic;
using System.Threading.Tasks;
using backend.DTOs;

namespace backend.Services
{
    public interface IThanhToanService
    {
        Task<IEnumerable<ThanhToanDto>> GetAllAsync();
        Task<ThanhToanDto> GetByIdAsync(int id);
        Task<int> CreateAsync(CreateThanhToanDto dto);
        Task<bool> UpdateAsync(int id, UpdateThanhToanDto dto);
        Task<bool> DeleteAsync(int id);
    }
}
''',
    'Services/ThanhToanService.cs': '''
using System.Collections.Generic;
using System.Threading.Tasks;
using backend.DTOs;
using backend.Data;

namespace backend.Services
{
    public class ThanhToanService : IThanhToanService
    {
        private readonly IThanhToanRepository _repository;
        public ThanhToanService(IThanhToanRepository repository)
        {
            _repository = repository;
        }

        public async Task<IEnumerable<ThanhToanDto>> GetAllAsync() => await _repository.GetAllAsync();
        public async Task<ThanhToanDto> GetByIdAsync(int id) => await _repository.GetByIdAsync(id);
        public async Task<int> CreateAsync(CreateThanhToanDto dto) => await _repository.CreateAsync(dto);
        public async Task<bool> UpdateAsync(int id, UpdateThanhToanDto dto) => await _repository.UpdateAsync(id, dto);
        public async Task<bool> DeleteAsync(int id) => await _repository.DeleteAsync(id);
    }
}
''',
    'Services/IMaGiamGiaService.cs': '''
using System.Collections.Generic;
using System.Threading.Tasks;
using backend.DTOs;

namespace backend.Services
{
    public interface IMaGiamGiaService
    {
        Task<IEnumerable<MaGiamGiaDto>> GetAllAsync();
        Task<MaGiamGiaDto> GetByIdAsync(int id);
        Task<MaGiamGiaDto> ValidateCodeAsync(string code);
        Task<int> CreateAsync(CreateMaGiamGiaDto dto);
        Task<bool> UpdateAsync(int id, UpdateMaGiamGiaDto dto);
        Task<bool> DeleteAsync(int id);
    }
}
''',
    'Services/MaGiamGiaService.cs': '''
using System.Collections.Generic;
using System.Threading.Tasks;
using backend.DTOs;
using backend.Data;

namespace backend.Services
{
    public class MaGiamGiaService : IMaGiamGiaService
    {
        private readonly IMaGiamGiaRepository _repository;
        public MaGiamGiaService(IMaGiamGiaRepository repository)
        {
            _repository = repository;
        }

        public async Task<IEnumerable<MaGiamGiaDto>> GetAllAsync() => await _repository.GetAllAsync();
        public async Task<MaGiamGiaDto> GetByIdAsync(int id) => await _repository.GetByIdAsync(id);
        public async Task<MaGiamGiaDto> ValidateCodeAsync(string code) => await _repository.GetByCodeAsync(code);
        public async Task<int> CreateAsync(CreateMaGiamGiaDto dto) => await _repository.CreateAsync(dto);
        public async Task<bool> UpdateAsync(int id, UpdateMaGiamGiaDto dto) => await _repository.UpdateAsync(id, dto);
        public async Task<bool> DeleteAsync(int id) => await _repository.DeleteAsync(id);
    }
}
''',
    'Services/IHinhAnhService.cs': '''
using System.Collections.Generic;
using System.Threading.Tasks;
using backend.DTOs;

namespace backend.Services
{
    public interface IHinhAnhService
    {
        Task<IEnumerable<HinhAnhDto>> GetAllAsync();
        Task<HinhAnhDto> GetByIdAsync(int id);
        Task<IEnumerable<HinhAnhDto>> GetByLoaiVaMaAsync(string loai, int maDoiTuong);
        Task<int> CreateAsync(CreateHinhAnhDto dto);
        Task<bool> UpdateAsync(int id, UpdateHinhAnhDto dto);
        Task<bool> DeleteAsync(int id);
    }
}
''',
    'Services/HinhAnhService.cs': '''
using System.Collections.Generic;
using System.Threading.Tasks;
using backend.DTOs;
using backend.Data;

namespace backend.Services
{
    public class HinhAnhService : IHinhAnhService
    {
        private readonly IHinhAnhRepository _repository;
        public HinhAnhService(IHinhAnhRepository repository)
        {
            _repository = repository;
        }

        public async Task<IEnumerable<HinhAnhDto>> GetAllAsync() => await _repository.GetAllAsync();
        public async Task<HinhAnhDto> GetByIdAsync(int id) => await _repository.GetByIdAsync(id);
        public async Task<IEnumerable<HinhAnhDto>> GetByLoaiVaMaAsync(string loai, int maDoiTuong) => await _repository.GetByLoaiVaMaAsync(loai, maDoiTuong);
        public async Task<int> CreateAsync(CreateHinhAnhDto dto) => await _repository.CreateAsync(dto);
        public async Task<bool> UpdateAsync(int id, UpdateHinhAnhDto dto) => await _repository.UpdateAsync(id, dto);
        public async Task<bool> DeleteAsync(int id) => await _repository.DeleteAsync(id);
    }
}
''',
    'Services/IChiPhiService.cs': '''
using System.Collections.Generic;
using System.Threading.Tasks;
using backend.DTOs;

namespace backend.Services
{
    public interface IChiPhiService
    {
        Task<IEnumerable<ChiPhiDto>> GetAllAsync();
        Task<ChiPhiDto> GetByIdAsync(int id);
        Task<IEnumerable<ChiPhiDto>> GetByChuyenDiAsync(int maChuyenDi);
        Task<int> CreateAsync(CreateChiPhiDto dto);
        Task<bool> UpdateAsync(int id, UpdateChiPhiDto dto);
        Task<bool> DeleteAsync(int id);
    }
}
''',
    'Services/ChiPhiService.cs': '''
using System.Collections.Generic;
using System.Threading.Tasks;
using backend.DTOs;
using backend.Data;

namespace backend.Services
{
    public class ChiPhiService : IChiPhiService
    {
        private readonly IChiPhiRepository _repository;
        public ChiPhiService(IChiPhiRepository repository)
        {
            _repository = repository;
        }

        public async Task<IEnumerable<ChiPhiDto>> GetAllAsync() => await _repository.GetAllAsync();
        public async Task<ChiPhiDto> GetByIdAsync(int id) => await _repository.GetByIdAsync(id);
        public async Task<IEnumerable<ChiPhiDto>> GetByChuyenDiAsync(int maChuyenDi) => await _repository.GetByChuyenDiAsync(maChuyenDi);
        public async Task<int> CreateAsync(CreateChiPhiDto dto) => await _repository.CreateAsync(dto);
        public async Task<bool> UpdateAsync(int id, UpdateChiPhiDto dto) => await _repository.UpdateAsync(id, dto);
        public async Task<bool> DeleteAsync(int id) => await _repository.DeleteAsync(id);
    }
}
''',
    'Services/IDanhGiaService.cs': '''
using System.Collections.Generic;
using System.Threading.Tasks;
using backend.DTOs;

namespace backend.Services
{
    public interface IDanhGiaService
    {
        Task<IEnumerable<DanhGiaDto>> GetAllAsync();
        Task<DanhGiaDto> GetByIdAsync(int id);
        Task<IEnumerable<DanhGiaDto>> GetByTourAsync(int maTour);
        Task<IEnumerable<DanhGiaDto>> GetByDiaDiemAsync(int maDiaDiem);
        Task<IEnumerable<DanhGiaDto>> GetByNguoiDungAsync(int maNguoiDung);
        Task<int> CreateAsync(CreateDanhGiaDto dto);
        Task<bool> UpdateAsync(int id, UpdateDanhGiaDto dto);
        Task<bool> DeleteAsync(int id);
    }
}
''',
    'Services/DanhGiaService.cs': '''
using System.Collections.Generic;
using System.Threading.Tasks;
using backend.DTOs;
using backend.Data;

namespace backend.Services
{
    public class DanhGiaService : IDanhGiaService
    {
        private readonly IDanhGiaRepository _repository;
        public DanhGiaService(IDanhGiaRepository repository)
        {
            _repository = repository;
        }

        public async Task<IEnumerable<DanhGiaDto>> GetAllAsync() => await _repository.GetAllAsync();
        public async Task<DanhGiaDto> GetByIdAsync(int id) => await _repository.GetByIdAsync(id);
        public async Task<IEnumerable<DanhGiaDto>> GetByTourAsync(int maTour) => await _repository.GetByTourAsync(maTour);
        public async Task<IEnumerable<DanhGiaDto>> GetByDiaDiemAsync(int maDiaDiem) => await _repository.GetByDiaDiemAsync(maDiaDiem);
        public async Task<IEnumerable<DanhGiaDto>> GetByNguoiDungAsync(int maNguoiDung) => await _repository.GetByNguoiDungAsync(maNguoiDung);
        public async Task<int> CreateAsync(CreateDanhGiaDto dto) => await _repository.CreateAsync(dto);
        public async Task<bool> UpdateAsync(int id, UpdateDanhGiaDto dto) => await _repository.UpdateAsync(id, dto);
        public async Task<bool> DeleteAsync(int id) => await _repository.DeleteAsync(id);
    }
}
''',
    'Services/IYeuThichService.cs': '''
using System.Collections.Generic;
using System.Threading.Tasks;
using backend.DTOs;

namespace backend.Services
{
    public interface IYeuThichService
    {
        Task<IEnumerable<YeuThichDto>> GetAllAsync();
        Task<YeuThichDto> GetByIdAsync(int id);
        Task<IEnumerable<YeuThichDto>> GetByNguoiDungAsync(int maNguoiDung);
        Task<int> CreateAsync(CreateYeuThichDto dto);
        Task<bool> UpdateAsync(int id, UpdateYeuThichDto dto);
        Task<bool> DeleteAsync(int id);
        Task<bool> DeleteByNguoiDungAndTourAsync(int maNguoiDung, int maTour);
    }
}
''',
    'Services/YeuThichService.cs': '''
using System.Collections.Generic;
using System.Threading.Tasks;
using backend.DTOs;
using backend.Data;

namespace backend.Services
{
    public class YeuThichService : IYeuThichService
    {
        private readonly IYeuThichRepository _repository;
        public YeuThichService(IYeuThichRepository repository)
        {
            _repository = repository;
        }

        public async Task<IEnumerable<YeuThichDto>> GetAllAsync() => await _repository.GetAllAsync();
        public async Task<YeuThichDto> GetByIdAsync(int id) => await _repository.GetByIdAsync(id);
        public async Task<IEnumerable<YeuThichDto>> GetByNguoiDungAsync(int maNguoiDung) => await _repository.GetByNguoiDungAsync(maNguoiDung);
        public async Task<int> CreateAsync(CreateYeuThichDto dto) => await _repository.CreateAsync(dto);
        public async Task<bool> UpdateAsync(int id, UpdateYeuThichDto dto) => await _repository.UpdateAsync(id, dto);
        public async Task<bool> DeleteAsync(int id) => await _repository.DeleteAsync(id);
        public async Task<bool> DeleteByNguoiDungAndTourAsync(int maNguoiDung, int maTour) => await _repository.DeleteByNguoiDungAndTourAsync(maNguoiDung, maTour);
    }
}
''',
    'Controllers/DatTourController.cs': '''
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using backend.DTOs;
using backend.Services;

namespace backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DatTourController : ControllerBase
    {
        private readonly IDatTourService _service;

        public DatTourController(IDatTourService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = await _service.GetAllAsync();
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var result = await _service.GetByIdAsync(id);
            if (result == null) return NotFound();
            return Ok(result);
        }

        [HttpGet("bynguoidung/{maNguoiDung}")]
        public async Task<IActionResult> GetByNguoiDung(int maNguoiDung)
        {
            var result = await _service.GetByNguoiDungAsync(maNguoiDung);
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateDatTourDto dto)
        {
            var id = await _service.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = id }, dto);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateDatTourDto dto)
        {
            var updated = await _service.UpdateAsync(id, dto);
            if (!updated) return NotFound();
            return Ok();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var deleted = await _service.DeleteAsync(id);
            if (!deleted) return NotFound();
            return Ok();
        }
    }
}
''',
    'Controllers/ThanhToanController.cs': '''
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using backend.DTOs;
using backend.Services;

namespace backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ThanhToanController : ControllerBase
    {
        private readonly IThanhToanService _service;

        public ThanhToanController(IThanhToanService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = await _service.GetAllAsync();
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var result = await _service.GetByIdAsync(id);
            if (result == null) return NotFound();
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateThanhToanDto dto)
        {
            var id = await _service.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = id }, dto);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateThanhToanDto dto)
        {
            var updated = await _service.UpdateAsync(id, dto);
            if (!updated) return NotFound();
            return Ok();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var deleted = await _service.DeleteAsync(id);
            if (!deleted) return NotFound();
            return Ok();
        }
    }
}
''',
    'Controllers/MaGiamGiaController.cs': '''
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using backend.DTOs;
using backend.Services;

namespace backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MaGiamGiaController : ControllerBase
    {
        private readonly IMaGiamGiaService _service;

        public MaGiamGiaController(IMaGiamGiaService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = await _service.GetAllAsync();
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var result = await _service.GetByIdAsync(id);
            if (result == null) return NotFound();
            return Ok(result);
        }

        [HttpPost("validate")]
        public async Task<IActionResult> ValidateCode([FromBody] string code)
        {
            if (string.IsNullOrWhiteSpace(code)) return BadRequest();
            var result = await _service.ValidateCodeAsync(code);
            if (result == null) return NotFound("Mã giảm giá không hợp lệ");
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateMaGiamGiaDto dto)
        {
            var id = await _service.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = id }, dto);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateMaGiamGiaDto dto)
        {
            var updated = await _service.UpdateAsync(id, dto);
            if (!updated) return NotFound();
            return Ok();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var deleted = await _service.DeleteAsync(id);
            if (!deleted) return NotFound();
            return Ok();
        }
    }
}
''',
    'Controllers/HinhAnhController.cs': '''
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using backend.DTOs;
using backend.Services;

namespace backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class HinhAnhController : ControllerBase
    {
        private readonly IHinhAnhService _service;

        public HinhAnhController(IHinhAnhService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = await _service.GetAllAsync();
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var result = await _service.GetByIdAsync(id);
            if (result == null) return NotFound();
            return Ok(result);
        }

        [HttpGet("{loai}/{maDoiTuong}")]
        public async Task<IActionResult> GetByLoaiVaMa(string loai, int maDoiTuong)
        {
            var result = await _service.GetByLoaiVaMaAsync(loai, maDoiTuong);
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateHinhAnhDto dto)
        {
            var id = await _service.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = id }, dto);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateHinhAnhDto dto)
        {
            var updated = await _service.UpdateAsync(id, dto);
            if (!updated) return NotFound();
            return Ok();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var deleted = await _service.DeleteAsync(id);
            if (!deleted) return NotFound();
            return Ok();
        }
    }
}
''',
    'Controllers/ChiPhiController.cs': '''
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using backend.DTOs;
using backend.Services;

namespace backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ChiPhiController : ControllerBase
    {
        private readonly IChiPhiService _service;

        public ChiPhiController(IChiPhiService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = await _service.GetAllAsync();
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var result = await _service.GetByIdAsync(id);
            if (result == null) return NotFound();
            return Ok(result);
        }

        [HttpGet("bychuyendi/{maChuyenDi}")]
        public async Task<IActionResult> GetByChuyenDi(int maChuyenDi)
        {
            var result = await _service.GetByChuyenDiAsync(maChuyenDi);
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateChiPhiDto dto)
        {
            var id = await _service.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = id }, dto);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateChiPhiDto dto)
        {
            var updated = await _service.UpdateAsync(id, dto);
            if (!updated) return NotFound();
            return Ok();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var deleted = await _service.DeleteAsync(id);
            if (!deleted) return NotFound();
            return Ok();
        }
    }
}
''',
    'Controllers/DanhGiaController.cs': '''
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using backend.DTOs;
using backend.Services;

namespace backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DanhGiaController : ControllerBase
    {
        private readonly IDanhGiaService _service;

        public DanhGiaController(IDanhGiaService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = await _service.GetAllAsync();
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var result = await _service.GetByIdAsync(id);
            if (result == null) return NotFound();
            return Ok(result);
        }

        [HttpGet("bytour/{maTour}")]
        public async Task<IActionResult> GetByTour(int maTour)
        {
            var result = await _service.GetByTourAsync(maTour);
            return Ok(result);
        }

        [HttpGet("bydiadiem/{maDiaDiem}")]
        public async Task<IActionResult> GetByDiaDiem(int maDiaDiem)
        {
            var result = await _service.GetByDiaDiemAsync(maDiaDiem);
            return Ok(result);
        }

        [HttpGet("bynguoidung/{maNguoiDung}")]
        public async Task<IActionResult> GetByNguoiDung(int maNguoiDung)
        {
            var result = await _service.GetByNguoiDungAsync(maNguoiDung);
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateDanhGiaDto dto)
        {
            var id = await _service.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = id }, dto);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateDanhGiaDto dto)
        {
            var updated = await _service.UpdateAsync(id, dto);
            if (!updated) return NotFound();
            return Ok();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var deleted = await _service.DeleteAsync(id);
            if (!deleted) return NotFound();
            return Ok();
        }
    }
}
''',
    'Controllers/YeuThichController.cs': '''
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using backend.DTOs;
using backend.Services;

namespace backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class YeuThichController : ControllerBase
    {
        private readonly IYeuThichService _service;

        public YeuThichController(IYeuThichService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = await _service.GetAllAsync();
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var result = await _service.GetByIdAsync(id);
            if (result == null) return NotFound();
            return Ok(result);
        }

        [HttpGet("bynguoidung/{maNguoiDung}")]
        public async Task<IActionResult> GetByNguoiDung(int maNguoiDung)
        {
            var result = await _service.GetByNguoiDungAsync(maNguoiDung);
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateYeuThichDto dto)
        {
            var id = await _service.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = id }, dto);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateYeuThichDto dto)
        {
            var updated = await _service.UpdateAsync(id, dto);
            if (!updated) return NotFound();
            return Ok();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var deleted = await _service.DeleteAsync(id);
            if (!deleted) return NotFound();
            return Ok();
        }

        [HttpDelete("bynguoidung/{maNguoiDung}/tour/{maTour}")]
        public async Task<IActionResult> DeleteByNguoiDungAndTour(int maNguoiDung, int maTour)
        {
            var deleted = await _service.DeleteByNguoiDungAndTourAsync(maNguoiDung, maTour);
            if (!deleted) return NotFound();
            return Ok();
        }
    }
}
'''
}

for subpath, content in dtos.items():
    write_file(subpath, content)
    print(f"Created: {subpath}")
