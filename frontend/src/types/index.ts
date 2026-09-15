export interface NguoiDung {
  maNguoiDung: number;
  tenDangNhap: string;
  email: string;
  matKhau: string;
  hoTen: string;
  soDienThoai?: string;
  anhDaiDien?: string;
  ngayTao: Date;
  maVaiTro: number;
  vaiTro?: VaiTro;
}

export interface VaiTro {
  maVaiTro: number;
  tenVaiTro: string;
  moTa?: string;
}

export interface DiaDiem {
  maDiaDiem: number;
  tenDiaDiem: string;
  moTa?: string;
  diaChi?: string;
  kinhDo?: number;
  viDo?: number;
  maLoaiDiaDiem: number;
  loaiDiaDiem?: LoaiDiaDiem;
  tinhThanh?: string;
  anhDaiDien?: string;
}

export interface LoaiDiaDiem {
  maLoaiDiaDiem: number;
  tenLoaiDiaDiem: string;
  moTa?: string;
}

export interface NhaHang {
  maNhaHang: number;
  tenNhaHang: string;
  moTa?: string;
  diaChi?: string;
  soDienThoai?: string;
  tinhThanh?: string;
  giaTrungBinh?: number;
  anhDaiDien?: string;
}

export interface KhachSan {
  maKhachSan: number;
  tenKhachSan: string;
  moTa?: string;
  diaChi?: string;
  soDienThoai?: string;
  tinhThanh?: string;
  hangSao?: number;
  anhDaiDien?: string;
}

export interface LoaiPhong {
  maLoaiPhong: number;
  maKhachSan: number;
  tenLoaiPhong: string;
  moTa?: string;
  sucChua: number;
  giaPhongDem: number;
  khachSan?: KhachSan;
}

export interface Tour {
  maTour: number;
  tenTour: string;
  moTa?: string;
  thoiGian: string;
  giaCoBan: number;
  hinhAnh?: string;
}

export interface TourKhoiHanh {
  maTourKhoiHanh: number;
  maTour: number;
  ngayKhoiHanh: Date;
  ngayKetThuc: Date;
  soChoToiDa: number;
  soChoDaDat: number;
  trangThai: string;
  tour?: Tour;
}

export interface TourChiTiet {
  maTourChiTiet: number;
  maTour: number;
  ngayThu: number;
  tieuDe: string;
  moTa?: string;
  tour?: Tour;
}

export interface DatTour {
  maDatTour: number;
  maNguoiDung: number;
  maTourKhoiHanh: number;
  ngayDat: Date;
  soNguoi: number;
  tongTien: number;
  trangThai: string;
  nguoiDung?: NguoiDung;
  tourKhoiHanh?: TourKhoiHanh;
}

export interface DatPhong {
  maDatPhong: number;
  maNguoiDung: number;
  maLoaiPhong: number;
  ngayNhanPhong: Date;
  ngayTraPhong: Date;
  tongTien: number;
  trangThai: string;
  nguoiDung?: NguoiDung;
  loaiPhong?: LoaiPhong;
}

export interface ChuyenDi {
  maChuyenDi: number;
  maNguoiDung: number;
  tenChuyenDi: string;
  moTa?: string;
  ngayBatDau?: Date;
  ngayKetThuc?: Date;
  nguoiDung?: NguoiDung;
}

export interface ThanhVienChuyenDi {
  maChuyenDi: number;
  maNguoiDung: number;
  vaiTro: string;
  chuyenDi?: ChuyenDi;
  nguoiDung?: NguoiDung;
}

export interface LichTrinh {
  maLichTrinh: number;
  maChuyenDi: number;
  ngay: Date;
  tieuDe?: string;
  chuyenDi?: ChuyenDi;
}

export interface LichTrinhChiTiet {
  maLichTrinhChiTiet: number;
  maLichTrinh: number;
  thoiGian?: string;
  hoatDong: string;
  maDiaDiem?: number;
  maNhaHang?: number;
  ghiChu?: string;
  lichTrinh?: LichTrinh;
  diaDiem?: DiaDiem;
  nhaHang?: NhaHang;
}

export interface ThanhToan {
  maThanhToan: number;
  maDatTour?: number;
  maDatPhong?: number;
  phuongThuc: string;
  soTien: number;
  ngayThanhToan: Date;
  trangThai: string;
}

export interface MaGiamGia {
  maGiamGiaId: number;
  code: string;
  phanTramGiam: number;
  giamToiDa?: number;
  soLuong: number;
  ngayHieuLuc: Date;
  ngayHetHan: Date;
}

export interface HinhAnh {
  maHinhAnh: number;
  url: string;
  thucTheId: number;
  loaiThucThe: string;
}

export interface ChiPhi {
  maChiPhi: number;
  maChuyenDi: number;
  tenChiPhi: string;
  soTien: number;
  ngayTra: Date;
  nguoiTra: number;
  chuyenDi?: ChuyenDi;
}

export interface DanhGia {
  maDanhGia: number;
  maNguoiDung: number;
  maTour?: number;
  maDiaDiem?: number;
  maKhachSan?: number;
  maNhaHang?: number;
  diem: number;
  noiDung?: string;
  ngayDanhGia: Date;
  nguoiDung?: NguoiDung;
}

export interface YeuThich {
  maYeuThich: number;
  maNguoiDung: number;
  maTour?: number;
  maDiaDiem?: number;
  maKhachSan?: number;
  maNhaHang?: number;
  nguoiDung?: NguoiDung;
}

export interface AuthUser {
  maNguoiDung: number;
  tenDangNhap: string;
  email: string;
  hoTen: string;
  anhDaiDien?: string;
  maVaiTro: number;
  token: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}
