-- =========================================================
-- DATABASE: WEB DU LỊCH (BẢN CHỈNH SỬA & BỔ SUNG)
-- Đề tài: Website hỗ trợ đặt lịch du lịch
-- Công nghệ: React + ASP.NET Core Web API + MySQL
--
-- GHI CHÚ CÁC THAY ĐỔI SO VỚI BẢN GỐC:
-- 1. Thêm CHECK CONSTRAINT cho các bảng đa hình (TourChiTiet,
--    LichTrinhChiTiet, DanhGia, YeuThich) để tránh điền sai
--    khóa ngoại (VD: LoaiDiaDiem = 'DiaDiem' nhưng lại điền
--    MaNhaHang).
-- 2. Khai báo rõ ON DELETE cho khóa ngoại thay vì để mặc định
--    RESTRICT (để tránh lỗi khó hiểu khi xóa dữ liệu cha).
-- 3. Thêm bảng LoaiPhong + DatPhong để hỗ trợ đặt phòng khách
--    sạn trực tiếp (không chỉ qua Tour).
-- 4. Thêm bảng ThanhToan để tách trạng thái thanh toán ra khỏi
--    trạng thái đơn đặt (đặt tour / đặt phòng).
-- 5. Thêm bảng HinhAnh dùng chung để hỗ trợ nhiều ảnh cho một
--    địa điểm / nhà hàng / khách sạn / tour (thay vì chỉ 1
--    AnhDaiDien).
-- 6. Thêm bảng MaGiamGia + LichSuSuDungMa để hỗ trợ mã khuyến
--    mãi khi đặt tour/phòng.
-- 7. Đăng nhập dùng access JWT; không lưu refresh token khi chưa có luồng gia hạn.
-- 8. Bổ sung index còn thiếu (DanhGia, YeuThich theo người dùng).
-- =========================================================


-- =========================================================
-- 1. TẠO DATABASE
-- =========================================================

-- Dùng utf8mb4 (chuẩn khuyến nghị hiện tại của MySQL 8) thay vì
-- utf8/utf8mb3 cũ - hỗ trợ đầy đủ Unicode 4-byte (kể cả emoji),
-- không còn cảnh báo deprecated (3719/3778/3720)

-- Xoá database cũ (nếu có) để mỗi lần chạy lại file đều sạch,
-- không bị báo "database exists" khi chạy nhiều lần


DROP DATABASE IF EXISTS WebDuLich;

CREATE DATABASE WebDuLich
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE WebDuLich;


-- =========================================================
-- 2. BẢNG VAI TRÒ
-- =========================================================

CREATE TABLE VaiTro (
    MaVaiTro INT AUTO_INCREMENT PRIMARY KEY,
    TenVaiTro VARCHAR(50) NOT NULL UNIQUE,
    MoTa VARCHAR(255),
    TrangThai BOOLEAN DEFAULT TRUE
);


-- =========================================================
-- 3. BẢNG NGƯỜI DÙNG
-- =========================================================

CREATE TABLE NguoiDung (
    MaNguoiDung INT AUTO_INCREMENT PRIMARY KEY,
    MaVaiTro INT NOT NULL,

    HoTen VARCHAR(100) NOT NULL,
    Email VARCHAR(150) NOT NULL UNIQUE,

    -- Lưu HASH mật khẩu (bcrypt/argon2), KHÔNG lưu plain text
    MatKhau VARCHAR(255) NOT NULL,

    SoDienThoai VARCHAR(20),
    AnhDaiDien VARCHAR(500),

    NgaySinh DATE,
    GioiTinh ENUM('Nam', 'Nu', 'Khac'),

    NgayTao DATETIME DEFAULT CURRENT_TIMESTAMP,
    NgayCapNhat DATETIME DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    TrangThai BOOLEAN DEFAULT TRUE,

    FOREIGN KEY (MaVaiTro)
        REFERENCES VaiTro(MaVaiTro)
        ON DELETE RESTRICT
);


-- =========================================================
-- 4. ĐĂNG NHẬP JWT (không cần bảng token riêng)
-- =========================================================

-- JWT hết hạn thì người dùng đăng nhập lại. Không có API gia hạn token.


-- =========================================================
-- 5. BẢNG LOẠI ĐỊA ĐIỂM
-- =========================================================

CREATE TABLE LoaiDiaDiem (
    MaLoai INT AUTO_INCREMENT PRIMARY KEY,
    TenLoai VARCHAR(100) NOT NULL UNIQUE,
    MoTa VARCHAR(500),
    TrangThai BOOLEAN DEFAULT TRUE
);


-- =========================================================
-- 6. BẢNG ĐỊA ĐIỂM DU LỊCH
-- =========================================================

CREATE TABLE DiaDiem (
    MaDiaDiem INT AUTO_INCREMENT PRIMARY KEY,
    MaLoai INT NOT NULL,

    TenDiaDiem VARCHAR(200) NOT NULL,

    MoTa TEXT,

    DiaChi VARCHAR(300),
    PhuongXa VARCHAR(100),
    QuanHuyen VARCHAR(100),
    TinhThanh VARCHAR(100),

    ViDo DECIMAL(10,7),
    KinhDo DECIMAL(10,7),

    GiaVe DECIMAL(15,2) DEFAULT 0,

    -- Khoảng giá vé (VD: vé người lớn / trẻ em / VIP khác nhau)
    -- dùng để ước tính chi phí khi lập kế hoạch chuyến đi
    GiaVeMin DECIMAL(15,2) DEFAULT 0,
    GiaVeMax DECIMAL(15,2) DEFAULT 0,

    GioMoCua TIME,
    GioDongCua TIME,

    ThoiGianThamQuan INT DEFAULT 60,

    DiemDanhGia DECIMAL(3,2) DEFAULT 0,
    LuotXem INT DEFAULT 0,

    TrangThai BOOLEAN DEFAULT TRUE,

    NgayTao DATETIME DEFAULT CURRENT_TIMESTAMP,
    NgayCapNhat DATETIME DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (MaLoai)
        REFERENCES LoaiDiaDiem(MaLoai)
        ON DELETE RESTRICT
);


-- =========================================================
-- 7. BẢNG NHÀ HÀNG
-- =========================================================

CREATE TABLE NhaHang (
    MaNhaHang INT AUTO_INCREMENT PRIMARY KEY,

    TenNhaHang VARCHAR(200) NOT NULL,

    MoTa TEXT,

    DiaChi VARCHAR(300),
    PhuongXa VARCHAR(100),
    QuanHuyen VARCHAR(100),
    TinhThanh VARCHAR(100),

    ViDo DECIMAL(10,7),
    KinhDo DECIMAL(10,7),

    GiaMin DECIMAL(15,2) DEFAULT 0,
    GiaMax DECIMAL(15,2) DEFAULT 0,

    GioMoCua TIME,
    GioDongCua TIME,

    SoDienThoai VARCHAR(20),

    DiemDanhGia DECIMAL(3,2) DEFAULT 0,
    LuotXem INT DEFAULT 0,

    TrangThai BOOLEAN DEFAULT TRUE,

    NgayTao DATETIME DEFAULT CURRENT_TIMESTAMP,
    NgayCapNhat DATETIME DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);


-- =========================================================
-- 8. BẢNG KHÁCH SẠN / HOMESTAY
-- =========================================================

CREATE TABLE KhachSan (
    MaKhachSan INT AUTO_INCREMENT PRIMARY KEY,

    TenKhachSan VARCHAR(200) NOT NULL,

    LoaiLuuTru ENUM(
        'Hotel',
        'Homestay',
        'Resort',
        'Hostel',
        'Villa'
    ) DEFAULT 'Hotel',

    MoTa TEXT,

    DiaChi VARCHAR(300),
    PhuongXa VARCHAR(100),
    QuanHuyen VARCHAR(100),
    TinhThanh VARCHAR(100),

    ViDo DECIMAL(10,7),
    KinhDo DECIMAL(10,7),

    -- Giá min/max được TÍNH TỪ bảng LoaiPhong (nên cập nhật
    -- bằng trigger hoặc ở tầng service mỗi khi LoaiPhong đổi giá)
    GiaPhongMin DECIMAL(15,2) DEFAULT 0,
    GiaPhongMax DECIMAL(15,2) DEFAULT 0,

    SoDienThoai VARCHAR(20),

    DiemDanhGia DECIMAL(3,2) DEFAULT 0,
    LuotXem INT DEFAULT 0,

    TrangThai BOOLEAN DEFAULT TRUE,

    NgayTao DATETIME DEFAULT CURRENT_TIMESTAMP,
    NgayCapNhat DATETIME DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);


-- =========================================================
-- 9. BẢNG LOẠI PHÒNG (MỚI)
-- =========================================================
-- Mỗi khách sạn có nhiều loại phòng, mỗi loại có số lượng
-- và giá riêng -> cần thiết để hỗ trợ ĐẶT PHÒNG thực tế

CREATE TABLE LoaiPhong (
    MaLoaiPhong INT AUTO_INCREMENT PRIMARY KEY,
    MaKhachSan INT NOT NULL,

    TenLoaiPhong VARCHAR(150) NOT NULL,
    MoTa VARCHAR(500),

    SucChua INT DEFAULT 2,
    SoLuongPhong INT NOT NULL DEFAULT 1,

    GiaMoiDem DECIMAL(15,2) NOT NULL,

    TrangThai BOOLEAN DEFAULT TRUE,

    FOREIGN KEY (MaKhachSan)
        REFERENCES KhachSan(MaKhachSan)
        ON DELETE CASCADE
);


-- =========================================================
-- 10. BẢNG ĐẶT PHÒNG (MỚI)
-- =========================================================

CREATE TABLE DatPhong (
    MaDatPhong INT AUTO_INCREMENT PRIMARY KEY,

    MaNguoiDung INT NOT NULL,
    MaLoaiPhong INT NOT NULL,

    NgayNhanPhong DATE NOT NULL,
    NgayTraPhong DATE NOT NULL,

    SoLuongPhong INT NOT NULL DEFAULT 1,
    SoNguoi INT NOT NULL DEFAULT 1,

    GiaMoiDem DECIMAL(15,2) NOT NULL,
    TongTien DECIMAL(15,2) NOT NULL,

    TrangThai ENUM(
        'Pending',
        'Confirmed',
        'CheckedIn',
        'CheckedOut',
        'Cancelled'
    ) DEFAULT 'Pending',

    GhiChu VARCHAR(500),

    NgayDat DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (MaNguoiDung)
        REFERENCES NguoiDung(MaNguoiDung)
        ON DELETE RESTRICT,

    FOREIGN KEY (MaLoaiPhong)
        REFERENCES LoaiPhong(MaLoaiPhong)
        ON DELETE RESTRICT,

    CHECK (NgayTraPhong > NgayNhanPhong)
);


-- =========================================================
-- 11. BẢNG TOUR
-- =========================================================

CREATE TABLE Tour (
    MaTour INT AUTO_INCREMENT PRIMARY KEY,

    MaNguoiTao INT NOT NULL,

    TenTour VARCHAR(200) NOT NULL,

    MoTa TEXT,

    DiemKhoiHanh VARCHAR(200),
    DiemDen VARCHAR(200),

    SoNgay INT NOT NULL,
    SoDem INT DEFAULT 0,

    GiaTour DECIMAL(15,2) NOT NULL,

    -- Khoảng giá theo các đợt khởi hành (TourKhoiHanh.GiaApDung
    -- có thể chênh lệch theo mùa/ngày lễ). Nên tính tự động bằng
    -- trigger (xem cuối file) mỗi khi TourKhoiHanh thay đổi.
    GiaTourMin DECIMAL(15,2) DEFAULT 0,
    GiaTourMax DECIMAL(15,2) DEFAULT 0,

    SoNguoiToiDa INT DEFAULT 20,
    SoNguoiToiThieu INT DEFAULT 1,

    DiemDanhGia DECIMAL(3,2) DEFAULT 0,
    LuotXem INT DEFAULT 0,

    TrangThai ENUM(
        'Draft',
        'Active',
        'Inactive'
    ) DEFAULT 'Draft',

    NgayTao DATETIME DEFAULT CURRENT_TIMESTAMP,

    NgayCapNhat DATETIME DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (MaNguoiTao)
        REFERENCES NguoiDung(MaNguoiDung)
        ON DELETE RESTRICT
);


-- =========================================================
-- 12. NGÀY KHỞI HÀNH CỦA TOUR (MỚI)
-- =========================================================
-- Một Tour (mẫu lịch trình) có thể có NHIỀU đợt khởi hành,
-- mỗi đợt có số chỗ còn lại riêng -> cần thiết cho web đặt
-- tour thực tế (khách chọn ngày khởi hành khi đặt)

CREATE TABLE TourKhoiHanh (
    MaKhoiHanh INT AUTO_INCREMENT PRIMARY KEY,
    MaTour INT NOT NULL,

    NgayKhoiHanh DATE NOT NULL,
    SoChoToiDa INT NOT NULL,
    SoChoDaDat INT NOT NULL DEFAULT 0,

    GiaApDung DECIMAL(15,2) NOT NULL,

    TrangThai ENUM(
        'OpenForBooking',
        'FullyBooked',
        'Cancelled',
        'Completed'
    ) DEFAULT 'OpenForBooking',

    FOREIGN KEY (MaTour)
        REFERENCES Tour(MaTour)
        ON DELETE CASCADE,

    UNIQUE (MaTour, NgayKhoiHanh),
    CHECK (SoChoDaDat <= SoChoToiDa)
);


-- =========================================================
-- 13. CHI TIẾT TOUR
-- =========================================================

CREATE TABLE TourChiTiet (
    MaTourChiTiet INT AUTO_INCREMENT PRIMARY KEY,

    MaTour INT NOT NULL,

    NgayThu INT NOT NULL,
    ThuTu INT NOT NULL,

    LoaiDiaDiem ENUM(
        'DiaDiem',
        'NhaHang',
        'KhachSan'
    ) NOT NULL,

    MaDiaDiem INT NULL,
    MaNhaHang INT NULL,
    MaKhachSan INT NULL,

    ThoiGianBatDau TIME,
    ThoiGianKetThuc TIME,

    ChiPhi DECIMAL(15,2) DEFAULT 0,

    GhiChu VARCHAR(500),

    FOREIGN KEY (MaTour)
        REFERENCES Tour(MaTour)
        ON DELETE CASCADE,

    FOREIGN KEY (MaDiaDiem)
        REFERENCES DiaDiem(MaDiaDiem)
        ON DELETE RESTRICT,

    FOREIGN KEY (MaNhaHang)
        REFERENCES NhaHang(MaNhaHang)
        ON DELETE RESTRICT,

    FOREIGN KEY (MaKhachSan)
        REFERENCES KhachSan(MaKhachSan)
        ON DELETE RESTRICT,

    -- Đảm bảo chỉ đúng 1 trong 3 cột khóa ngoại được điền,
    -- và phải khớp với LoaiDiaDiem
    CHECK (
        (LoaiDiaDiem = 'DiaDiem'  AND MaDiaDiem  IS NOT NULL AND MaNhaHang IS NULL AND MaKhachSan IS NULL) OR
        (LoaiDiaDiem = 'NhaHang'  AND MaNhaHang  IS NOT NULL AND MaDiaDiem IS NULL AND MaKhachSan IS NULL) OR
        (LoaiDiaDiem = 'KhachSan' AND MaKhachSan IS NOT NULL AND MaDiaDiem IS NULL AND MaNhaHang  IS NULL)
    )
);


-- =========================================================
-- 14. BẢNG CHUYẾN ĐI (tự tạo lịch trình)
-- =========================================================

CREATE TABLE ChuyenDi (
    MaChuyenDi INT AUTO_INCREMENT PRIMARY KEY,

    MaNguoiDung INT NOT NULL,

    TenChuyenDi VARCHAR(200) NOT NULL,

    DiemKhoiHanh VARCHAR(200),
    DiemDen VARCHAR(200),

    NgayBatDau DATE NOT NULL,
    NgayKetThuc DATE NOT NULL,

    SoNguoi INT DEFAULT 1,

    NganSach DECIMAL(15,2) DEFAULT 0,

    MoTa TEXT,

    TrangThai ENUM(
        'Draft',
        'Planning',
        'Confirmed',
        'Completed',
        'Cancelled'
    ) DEFAULT 'Draft',

    NgayTao DATETIME DEFAULT CURRENT_TIMESTAMP,

    NgayCapNhat DATETIME DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (MaNguoiDung)
        REFERENCES NguoiDung(MaNguoiDung)
        ON DELETE CASCADE,

    CHECK (NgayKetThuc >= NgayBatDau)
);


-- =========================================================
-- 15. THÀNH VIÊN CHUYẾN ĐI
-- =========================================================

CREATE TABLE ThanhVienChuyenDi (
    MaThanhVien INT AUTO_INCREMENT PRIMARY KEY,

    MaChuyenDi INT NOT NULL,
    MaNguoiDung INT NOT NULL,

    VaiTro ENUM(
        'Owner',
        'Member'
    ) DEFAULT 'Member',

    TrangThai ENUM(
        'Pending',
        'Accepted',
        'Rejected'
    ) DEFAULT 'Pending',

    NgayThamGia DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (MaChuyenDi)
        REFERENCES ChuyenDi(MaChuyenDi)
        ON DELETE CASCADE,

    FOREIGN KEY (MaNguoiDung)
        REFERENCES NguoiDung(MaNguoiDung)
        ON DELETE CASCADE,

    UNIQUE (MaChuyenDi, MaNguoiDung)
);


-- =========================================================
-- 16. BẢNG LỊCH TRÌNH
-- =========================================================

CREATE TABLE LichTrinh (
    MaLichTrinh INT AUTO_INCREMENT PRIMARY KEY,

    MaChuyenDi INT NOT NULL,

    NgayThu INT NOT NULL,
    Ngay DATE NOT NULL,

    TieuDe VARCHAR(200),

    GhiChu TEXT,

    FOREIGN KEY (MaChuyenDi)
        REFERENCES ChuyenDi(MaChuyenDi)
        ON DELETE CASCADE,

    UNIQUE (MaChuyenDi, Ngay)
);


-- =========================================================
-- 17. CHI TIẾT LỊCH TRÌNH
-- =========================================================

CREATE TABLE LichTrinhChiTiet (
    MaChiTiet INT AUTO_INCREMENT PRIMARY KEY,

    MaLichTrinh INT NOT NULL,

    ThuTu INT NOT NULL,

    LoaiDiaDiem ENUM(
        'DiaDiem',
        'NhaHang',
        'KhachSan'
    ) NOT NULL,

    MaDiaDiem INT NULL,
    MaNhaHang INT NULL,
    MaKhachSan INT NULL,

    ThoiGianBatDau TIME,
    ThoiGianKetThuc TIME,

    ChiPhi DECIMAL(15,2) DEFAULT 0,

    GhiChu VARCHAR(500),

    FOREIGN KEY (MaLichTrinh)
        REFERENCES LichTrinh(MaLichTrinh)
        ON DELETE CASCADE,

    FOREIGN KEY (MaDiaDiem)
        REFERENCES DiaDiem(MaDiaDiem)
        ON DELETE RESTRICT,

    FOREIGN KEY (MaNhaHang)
        REFERENCES NhaHang(MaNhaHang)
        ON DELETE RESTRICT,

    FOREIGN KEY (MaKhachSan)
        REFERENCES KhachSan(MaKhachSan)
        ON DELETE RESTRICT,

    CHECK (
        (LoaiDiaDiem = 'DiaDiem'  AND MaDiaDiem  IS NOT NULL AND MaNhaHang IS NULL AND MaKhachSan IS NULL) OR
        (LoaiDiaDiem = 'NhaHang'  AND MaNhaHang  IS NOT NULL AND MaDiaDiem IS NULL AND MaKhachSan IS NULL) OR
        (LoaiDiaDiem = 'KhachSan' AND MaKhachSan IS NOT NULL AND MaDiaDiem IS NULL AND MaNhaHang  IS NULL)
    )
);


-- =========================================================
-- 18. BẢNG ĐẶT TOUR
-- =========================================================

CREATE TABLE DatTour (
    MaDatTour INT AUTO_INCREMENT PRIMARY KEY,

    MaNguoiDung INT NOT NULL,
    MaTour INT NOT NULL,
    MaKhoiHanh INT NULL,

    NgayDat DATETIME DEFAULT CURRENT_TIMESTAMP,

    NgayKhoiHanh DATE NOT NULL,

    SoNguoi INT NOT NULL,

    GiaMoiNguoi DECIMAL(15,2) NOT NULL,

    TongTien DECIMAL(15,2) NOT NULL,

    TrangThai ENUM(
        'Pending',
        'Confirmed',
        'Cancelled',
        'Completed'
    ) DEFAULT 'Pending',

    GhiChu VARCHAR(500),

    FOREIGN KEY (MaNguoiDung)
        REFERENCES NguoiDung(MaNguoiDung)
        ON DELETE RESTRICT,

    FOREIGN KEY (MaTour)
        REFERENCES Tour(MaTour)
        ON DELETE RESTRICT,

    FOREIGN KEY (MaKhoiHanh)
        REFERENCES TourKhoiHanh(MaKhoiHanh)
        ON DELETE SET NULL
);


-- =========================================================
-- 19. BẢNG THANH TOÁN (MỚI)
-- =========================================================
-- Dùng chung cho cả đặt Tour và đặt Phòng, tách biệt trạng
-- thái thanh toán ra khỏi trạng thái đơn đặt

CREATE TABLE ThanhToan (
    MaThanhToan INT AUTO_INCREMENT PRIMARY KEY,

    LoaiDon ENUM(
        'DatTour',
        'DatPhong'
    ) NOT NULL,

    MaDatTour INT NULL,
    MaDatPhong INT NULL,

    SoTien DECIMAL(15,2) NOT NULL CHECK (SoTien > 0),

    PhuongThuc ENUM(
        'TienMat',
        'ChuyenKhoan',
        'VNPay',
        'Momo',
        'ZaloPay'
    ) NOT NULL,

    MaGiaoDich VARCHAR(150) UNIQUE,

    TrangThai ENUM(
        'ChoThanhToan',
        'ThanhCong',
        'ThatBai',
        'DaHoanTien'
    ) DEFAULT 'ChoThanhToan',

    NgayThanhToan DATETIME,

    NgayTao DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (MaDatTour)
        REFERENCES DatTour(MaDatTour)
        ON DELETE CASCADE,

    FOREIGN KEY (MaDatPhong)
        REFERENCES DatPhong(MaDatPhong)
        ON DELETE CASCADE,

    CHECK (
        (LoaiDon = 'DatTour'  AND MaDatTour  IS NOT NULL AND MaDatPhong IS NULL) OR
        (LoaiDon = 'DatPhong' AND MaDatPhong IS NOT NULL AND MaDatTour  IS NULL)
    )
);


-- =========================================================
-- 20. BẢNG MÃ GIẢM GIÁ (MỚI)
-- =========================================================

CREATE TABLE MaGiamGia (
    MaCode INT AUTO_INCREMENT PRIMARY KEY,

    Code VARCHAR(50) NOT NULL UNIQUE,
    MoTa VARCHAR(255),

    LoaiGiam ENUM('PhanTram', 'SoTien') NOT NULL,
    GiaTriGiam DECIMAL(15,2) NOT NULL,
    GiamToiDa DECIMAL(15,2) NULL,

    DonHangToiThieu DECIMAL(15,2) DEFAULT 0,

    SoLuong INT DEFAULT 0,
    SoLuongDaDung INT DEFAULT 0,

    NgayBatDau DATETIME NOT NULL,
    NgayKetThuc DATETIME NOT NULL,

    TrangThai BOOLEAN DEFAULT TRUE,

    CHECK (NgayKetThuc > NgayBatDau)
);


-- =========================================================
-- 21. BẢNG HÌNH ẢNH DÙNG CHUNG (MỚI)
-- =========================================================
-- Mỗi ảnh thuộc đúng một đối tượng. Dùng khóa ngoại thật để
-- không thể lưu ảnh mồ côi. Backend suy ra LoaiDoiTuong và
-- MaDoiTuong khi SELECT để giữ tương thích với API hiện tại.

CREATE TABLE HinhAnh (
    MaHinhAnh INT AUTO_INCREMENT PRIMARY KEY,

    MaTour INT NULL,
    MaDiaDiem INT NULL,
    MaNhaHang INT NULL,
    MaKhachSan INT NULL,
    MaLoaiPhong INT NULL,

    DuongDan VARCHAR(500) NOT NULL,
    MoTa VARCHAR(255),
    ThuTu INT DEFAULT 0,
    Nguon VARCHAR(1000),
    TacGia TEXT,
    GiayPhep VARCHAR(100),
    UrlGiayPhep VARCHAR(500),

    NgayTao DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_hinhanh_tour FOREIGN KEY (MaTour)
        REFERENCES Tour(MaTour) ON DELETE CASCADE,
    CONSTRAINT fk_hinhanh_diadiem FOREIGN KEY (MaDiaDiem)
        REFERENCES DiaDiem(MaDiaDiem) ON DELETE CASCADE,
    CONSTRAINT fk_hinhanh_nhahang FOREIGN KEY (MaNhaHang)
        REFERENCES NhaHang(MaNhaHang) ON DELETE CASCADE,
    CONSTRAINT fk_hinhanh_khachsan FOREIGN KEY (MaKhachSan)
        REFERENCES KhachSan(MaKhachSan) ON DELETE CASCADE,
    CONSTRAINT fk_hinhanh_loaiphong FOREIGN KEY (MaLoaiPhong)
        REFERENCES LoaiPhong(MaLoaiPhong) ON DELETE CASCADE,

    CONSTRAINT chk_hinhanh_mot_chu_so_huu CHECK (
        (MaTour IS NOT NULL) +
        (MaDiaDiem IS NOT NULL) +
        (MaNhaHang IS NOT NULL) +
        (MaKhachSan IS NOT NULL) +
        (MaLoaiPhong IS NOT NULL) = 1
    ),
    CONSTRAINT chk_hinhanh_thutu CHECK (ThuTu >= 0),

    UNIQUE KEY uq_hinhanh_tour (MaTour, DuongDan),
    UNIQUE KEY uq_hinhanh_diadiem (MaDiaDiem, DuongDan),
    UNIQUE KEY uq_hinhanh_nhahang (MaNhaHang, DuongDan),
    UNIQUE KEY uq_hinhanh_khachsan (MaKhachSan, DuongDan),
    UNIQUE KEY uq_hinhanh_loaiphong (MaLoaiPhong, DuongDan),
    INDEX idx_hinhanh_tour (MaTour, ThuTu),
    INDEX idx_hinhanh_diadiem (MaDiaDiem, ThuTu),
    INDEX idx_hinhanh_nhahang (MaNhaHang, ThuTu),
    INDEX idx_hinhanh_khachsan (MaKhachSan, ThuTu),
    INDEX idx_hinhanh_loaiphong (MaLoaiPhong, ThuTu)
);


-- =========================================================
-- 22. BẢNG CHI PHÍ (quản lý chi tiêu chuyến tự tạo)
-- =========================================================

CREATE TABLE ChiPhi (
    MaChiPhi INT AUTO_INCREMENT PRIMARY KEY,

    MaChuyenDi INT NOT NULL,

    MaNguoiDung INT NULL,

    TenChiPhi VARCHAR(200) NOT NULL,

    LoaiChiPhi ENUM(
        'DiChuyen',
        'AnUong',
        'KhachSan',
        'VeThamQuan',
        'MuaSam',
        'Khac'
    ) DEFAULT 'Khac',

    SoTien DECIMAL(15,2) NOT NULL,

    NgayChi DATE,

    GhiChu VARCHAR(500),

    NgayTao DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (MaChuyenDi)
        REFERENCES ChuyenDi(MaChuyenDi)
        ON DELETE CASCADE,

    FOREIGN KEY (MaNguoiDung)
        REFERENCES NguoiDung(MaNguoiDung)
        ON DELETE SET NULL
);


-- =========================================================
-- 23. BẢNG ĐÁNH GIÁ
-- =========================================================

CREATE TABLE DanhGia (
    MaDanhGia INT AUTO_INCREMENT PRIMARY KEY,
    MaDatTourXacMinh INT NULL,
    MaDatPhongXacMinh INT NULL,
    CONSTRAINT fk_danhgia_dat_tour_xac_minh FOREIGN KEY (MaDatTourXacMinh) REFERENCES DatTour(MaDatTour),
    CONSTRAINT fk_danhgia_dat_phong_xac_minh FOREIGN KEY (MaDatPhongXacMinh) REFERENCES DatPhong(MaDatPhong),
    CONSTRAINT chk_danhgia_bang_chung CHECK (MaDatTourXacMinh IS NULL OR MaDatPhongXacMinh IS NULL),

    MaNguoiDung INT NOT NULL,

    MaTour INT NULL,
    MaDiaDiem INT NULL,
    MaNhaHang INT NULL,
    MaKhachSan INT NULL,

    SoSao INT NOT NULL,

    NoiDung TEXT,

    NgayDanhGia DATETIME DEFAULT CURRENT_TIMESTAMP,

    TrangThai BOOLEAN DEFAULT TRUE,

    FOREIGN KEY (MaNguoiDung)
        REFERENCES NguoiDung(MaNguoiDung)
        ON DELETE CASCADE,

    FOREIGN KEY (MaTour)
        REFERENCES Tour(MaTour)
        ON DELETE CASCADE,

    FOREIGN KEY (MaDiaDiem)
        REFERENCES DiaDiem(MaDiaDiem)
        ON DELETE CASCADE,

    FOREIGN KEY (MaNhaHang)
        REFERENCES NhaHang(MaNhaHang)
        ON DELETE CASCADE,

    FOREIGN KEY (MaKhachSan)
        REFERENCES KhachSan(MaKhachSan)
        ON DELETE CASCADE,

    CHECK (SoSao BETWEEN 1 AND 5),

    -- Đảm bảo đánh giá chỉ gắn với đúng 1 loại đối tượng
    CHECK (
        (MaTour IS NOT NULL) + (MaDiaDiem IS NOT NULL) +
        (MaNhaHang IS NOT NULL) + (MaKhachSan IS NOT NULL) = 1
    )
);


-- =========================================================
-- BÌNH LUẬN CÔNG KHAI, TÁCH KHỎI ĐÁNH GIÁ CÓ XÁC MINH
-- =========================================================

CREATE TABLE BinhLuan (
    MaBinhLuan INT AUTO_INCREMENT PRIMARY KEY,
    MaNguoiDung INT NOT NULL,
    MaTour INT NULL,
    MaDiaDiem INT NULL,
    MaKhachSan INT NULL,
    NoiDung VARCHAR(2000) NOT NULL,
    NgayTao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    TrangThai BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (MaNguoiDung) REFERENCES NguoiDung(MaNguoiDung) ON DELETE CASCADE,
    FOREIGN KEY (MaTour) REFERENCES Tour(MaTour) ON DELETE CASCADE,
    FOREIGN KEY (MaDiaDiem) REFERENCES DiaDiem(MaDiaDiem) ON DELETE CASCADE,
    FOREIGN KEY (MaKhachSan) REFERENCES KhachSan(MaKhachSan) ON DELETE CASCADE,
    CONSTRAINT chk_binhluan_doi_tuong CHECK ((MaTour IS NOT NULL) + (MaDiaDiem IS NOT NULL) + (MaKhachSan IS NOT NULL) = 1),
    INDEX ix_binhluan_tour (MaTour,TrangThai,MaBinhLuan),
    INDEX ix_binhluan_diadiem (MaDiaDiem,TrangThai,MaBinhLuan),
    INDEX ix_binhluan_khachsan (MaKhachSan,TrangThai,MaBinhLuan)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 24. BẢNG YÊU THÍCH
CREATE TABLE YeuThich (
    MaYeuThich INT AUTO_INCREMENT PRIMARY KEY,

    MaNguoiDung INT NOT NULL,

    MaTour INT NULL,
    MaDiaDiem INT NULL,
    MaNhaHang INT NULL,
    MaKhachSan INT NULL,

    NgayThem DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (MaNguoiDung)
        REFERENCES NguoiDung(MaNguoiDung)
        ON DELETE CASCADE,

    FOREIGN KEY (MaTour)
        REFERENCES Tour(MaTour)
        ON DELETE CASCADE,

    FOREIGN KEY (MaDiaDiem)
        REFERENCES DiaDiem(MaDiaDiem)
        ON DELETE CASCADE,

    FOREIGN KEY (MaNhaHang)
        REFERENCES NhaHang(MaNhaHang)
        ON DELETE CASCADE,

    FOREIGN KEY (MaKhachSan)
        REFERENCES KhachSan(MaKhachSan)
        ON DELETE CASCADE,

    CHECK (
        (MaTour IS NOT NULL) + (MaDiaDiem IS NOT NULL) +
        (MaNhaHang IS NOT NULL) + (MaKhachSan IS NOT NULL) = 1
    ),

    -- Tránh yêu thích trùng cùng 1 đối tượng
    UNIQUE KEY uq_yeuthich_tour (MaNguoiDung, MaTour),
    UNIQUE KEY uq_yeuthich_diadiem (MaNguoiDung, MaDiaDiem),
    UNIQUE KEY uq_yeuthich_nhahang (MaNguoiDung, MaNhaHang),
    UNIQUE KEY uq_yeuthich_khachsan (MaNguoiDung, MaKhachSan)
);


-- =========================================================
-- 25. INDEX
-- =========================================================

CREATE INDEX idx_nguoidung_email ON NguoiDung(Email);

CREATE INDEX idx_diadiem_tinh ON DiaDiem(TinhThanh);
CREATE INDEX idx_diadiem_loai ON DiaDiem(MaLoai);

CREATE INDEX idx_nhahang_tinh ON NhaHang(TinhThanh);

CREATE INDEX idx_khachsan_tinh ON KhachSan(TinhThanh);
CREATE INDEX idx_loaiphong_khachsan ON LoaiPhong(MaKhachSan);

CREATE INDEX idx_tour_trangthai ON Tour(TrangThai);
CREATE INDEX idx_tour_khoihanh_tour ON TourKhoiHanh(MaTour);
CREATE INDEX idx_tour_khoihanh_ngay ON TourKhoiHanh(NgayKhoiHanh);

CREATE INDEX idx_chuyendi_user ON ChuyenDi(MaNguoiDung);
CREATE INDEX idx_lichtrinh_chuyendi ON LichTrinh(MaChuyenDi);

CREATE INDEX idx_dat_tour_user ON DatTour(MaNguoiDung);
CREATE INDEX idx_dat_phong_user ON DatPhong(MaNguoiDung);
CREATE INDEX idx_dat_phong_loaiphong ON DatPhong(MaLoaiPhong);

CREATE INDEX idx_thanhtoan_dattour ON ThanhToan(MaDatTour);
CREATE INDEX idx_thanhtoan_datphong ON ThanhToan(MaDatPhong);

CREATE INDEX idx_danhgia_user ON DanhGia(MaNguoiDung);
CREATE INDEX idx_yeuthich_user ON YeuThich(MaNguoiDung);


-- =========================================================
-- 26. DỮ LIỆU MẪU
-- =========================================================
/*
  DỮ LIỆU MẪU CŨ ĐƯỢC VÔ HIỆU HÓA.
  Nguồn seed duy nhất của dự án là data_mau.sql.
  Khối cũ được giữ tạm để đối chiếu lịch sử và có thể xóa ở lần dọn dẹp sau.

-- Vai trò
INSERT INTO VaiTro (TenVaiTro, MoTa) VALUES
('Admin', 'Quản trị hệ thống'),
('User', 'Người dùng');

-- Người dùng mẫu
-- LƯU Ý: mật khẩu dưới đây CHỈ để test cấu trúc bảng.
-- Trong ứng dụng thật, tầng ASP.NET Core Web API phải HASH
-- mật khẩu (VD: BCrypt.Net) trước khi lưu vào cột MatKhau.
INSERT INTO NguoiDung (MaVaiTro, HoTen, Email, MatKhau, SoDienThoai) VALUES
(1, 'Quản trị viên', 'admin@gmail.com', '$2a$11$PLACEHOLDER_HASH_ADMIN', '0900000000'),
(2, 'Nguyễn Văn Trường', 'truong@gmail.com', '$2a$11$PLACEHOLDER_HASH_USER', '0912345678');

-- Loại địa điểm
INSERT INTO LoaiDiaDiem (TenLoai, MoTa) VALUES
('Địa điểm du lịch', 'Các địa điểm tham quan du lịch'),
('Điểm check-in', 'Địa điểm chụp ảnh, check-in'),
('Khu vui chơi', 'Các khu vui chơi giải trí'),
('Di tích lịch sử', 'Các địa điểm lịch sử'),
('Bảo tàng', 'Các bảo tàng'),
('Bãi biển', 'Các bãi biển'),
('Công viên', 'Các công viên'),
('Núi', 'Các địa điểm núi'),
('Cafe', 'Các quán cafe');


-- =========================================================
-- 27. DỮ LIỆU ĐỊA ĐIỂM MẪU
-- =========================================================

INSERT INTO DiaDiem
(MaLoai, TenDiaDiem, MoTa, DiaChi, QuanHuyen, TinhThanh, ViDo, KinhDo, GiaVe, GiaVeMin, GiaVeMax, ThoiGianThamQuan)
VALUES
(1, 'Vịnh Hạ Long', 'Địa điểm du lịch nổi tiếng tại Quảng Ninh', 'Hạ Long', 'Hạ Long', 'Quảng Ninh', 20.9101, 107.1839, 250000, 150000, 350000, 180),
(6, 'Bãi biển Mỹ Khê', 'Một trong những bãi biển nổi tiếng tại Đà Nẵng', 'Võ Nguyên Giáp', 'Sơn Trà', 'Đà Nẵng', 16.0544, 108.2022, 0, 0, 0, 180),
(2, 'Cầu Vàng', 'Địa điểm check-in nổi tiếng tại Bà Nà Hills', 'Bà Nà Hills', 'Hòa Vang', 'Đà Nẵng', 15.9959, 107.9965, 0, 0, 0, 120),
(4, 'Phố cổ Hội An', 'Khu phố cổ nổi tiếng tại Quảng Nam', 'Phố cổ Hội An', 'Hội An', 'Quảng Nam', 15.8801, 108.3380, 120000, 100000, 150000, 180);


-- =========================================================
-- 28. DỮ LIỆU NHÀ HÀNG MẪU
-- =========================================================

INSERT INTO NhaHang
(TenNhaHang, MoTa, DiaChi, QuanHuyen, TinhThanh, ViDo, KinhDo, GiaMin, GiaMax, SoDienThoai)
VALUES
('Nhà hàng Hải Sản A', 'Nhà hàng chuyên hải sản', 'Bãi Cháy', 'Hạ Long', 'Quảng Ninh', 20.9574, 107.0448, 100000, 500000, '0901111111'),
('Nhà hàng Đà Nẵng B', 'Nhà hàng đặc sản Đà Nẵng', 'Hải Châu', 'Hải Châu', 'Đà Nẵng', 16.0610, 108.2200, 50000, 300000, '0902222222'),
('Nhà hàng Hội An C', 'Nhà hàng đặc sản Hội An', 'Hội An', 'Hội An', 'Quảng Nam', 15.8775, 108.3260, 50000, 250000, '0903333333');


-- =========================================================
-- 29. DỮ LIỆU KHÁCH SẠN MẪU + LOẠI PHÒNG
-- =========================================================

INSERT INTO KhachSan
(TenKhachSan, LoaiLuuTru, MoTa, DiaChi, QuanHuyen, TinhThanh, ViDo, KinhDo, GiaPhongMin, GiaPhongMax, SoDienThoai)
VALUES
('Ha Long Hotel', 'Hotel', 'Khách sạn tại khu vực Hạ Long', 'Bãi Cháy', 'Hạ Long', 'Quảng Ninh', 20.9560, 107.0470, 500000, 2000000, '0904444444'),
('Da Nang Homestay', 'Homestay', 'Homestay gần trung tâm Đà Nẵng', 'Hải Châu', 'Hải Châu', 'Đà Nẵng', 16.0650, 108.2200, 300000, 1000000, '0905555555'),
('Hoi An Resort', 'Resort', 'Resort tại Hội An', 'Hội An', 'Hội An', 'Quảng Nam', 15.8800, 108.3500, 800000, 3000000, '0906666666');

-- Loại phòng cho từng khách sạn (MaKhachSan 1 = Ha Long Hotel, ...)
INSERT INTO LoaiPhong (MaKhachSan, TenLoaiPhong, MoTa, SucChua, SoLuongPhong, GiaMoiDem) VALUES
(1, 'Phòng Standard', 'Phòng tiêu chuẩn 2 người', 2, 10, 500000),
(1, 'Phòng Deluxe View Biển', 'Phòng cao cấp view biển', 2, 5, 2000000),
(2, 'Phòng đơn Homestay', 'Phòng đơn ấm cúng', 1, 6, 300000),
(2, 'Phòng đôi Homestay', 'Phòng đôi cho cặp đôi', 2, 6, 500000),
(3, 'Phòng Villa 2 Ngủ', 'Villa riêng biệt 2 phòng ngủ', 4, 4, 3000000);


-- =========================================================
-- 30. TOUR MẪU + NGÀY KHỞI HÀNH
-- =========================================================

INSERT INTO Tour
(MaNguoiTao, TenTour, MoTa, DiemKhoiHanh, DiemDen, SoNgay, SoDem, GiaTour, GiaTourMin, GiaTourMax, SoNguoiToiDa, SoNguoiToiThieu, TrangThai)
VALUES
(1, 'Hà Nội - Hạ Long 3 ngày 2 đêm', 'Tour du lịch Hạ Long 3 ngày 2 đêm', 'Hà Nội', 'Hạ Long', 3, 2, 2500000, 2500000, 2800000, 30, 1, 'Active'),
(1, 'Đà Nẵng - Hội An 3 ngày 2 đêm', 'Khám phá Đà Nẵng và Hội An', 'Hà Nội', 'Đà Nẵng', 3, 2, 3500000, 3500000, 3500000, 30, 1, 'Active');

-- Đợt khởi hành cho từng tour (giá có thể chênh lệch theo ngày lễ/mùa cao điểm)
INSERT INTO TourKhoiHanh (MaTour, NgayKhoiHanh, SoChoToiDa, SoChoDaDat, GiaApDung) VALUES
(1, '2026-10-10', 30, 0, 2500000),
(1, '2026-10-24', 30, 0, 2800000),
(2, '2026-10-15', 30, 0, 3500000);


-- =========================================================
-- 31. CHI TIẾT TOUR MẪU
-- =========================================================

-- Tour Hạ Long
INSERT INTO TourChiTiet
(MaTour, NgayThu, ThuTu, LoaiDiaDiem, MaDiaDiem, MaNhaHang, MaKhachSan, ThoiGianBatDau, ThoiGianKetThuc, ChiPhi, GhiChu)
VALUES
(1, 1, 1, 'DiaDiem', 1, NULL, NULL, '10:00:00', '13:00:00', 250000, 'Tham quan Vịnh Hạ Long'),
(1, 1, 2, 'NhaHang', NULL, 1, NULL, '13:00:00', '14:30:00', 200000, 'Ăn trưa'),
(1, 1, 3, 'KhachSan', NULL, NULL, 1, '15:00:00', '16:00:00', 700000, 'Nhận phòng');

-- Tour Đà Nẵng
INSERT INTO TourChiTiet
(MaTour, NgayThu, ThuTu, LoaiDiaDiem, MaDiaDiem, MaNhaHang, MaKhachSan, ThoiGianBatDau, ThoiGianKetThuc, ChiPhi, GhiChu)
VALUES
(2, 1, 1, 'DiaDiem', 2, NULL, NULL, '08:00:00', '11:00:00', 0, 'Tham quan biển Mỹ Khê'),
(2, 1, 2, 'NhaHang', NULL, 2, NULL, '11:30:00', '13:00:00', 150000, 'Ăn trưa'),
(2, 1, 3, 'DiaDiem', 3, NULL, NULL, '14:00:00', '16:00:00', 0, 'Check-in Cầu Vàng'),
(2, 2, 1, 'DiaDiem', 4, NULL, NULL, '08:00:00', '11:00:00', 120000, 'Tham quan Hội An');


-- =========================================================
-- 32. DỮ LIỆU MÃ GIẢM GIÁ MẪU
-- =========================================================

INSERT INTO MaGiamGia
(Code, MoTa, LoaiGiam, GiaTriGiam, GiamToiDa, DonHangToiThieu, SoLuong, NgayBatDau, NgayKetThuc)
VALUES
('WELCOME10', 'Giảm 10% cho khách hàng mới', 'PhanTram', 10, 300000, 1000000, 100, '2026-01-01 00:00:00', '2026-12-31 23:59:59'),
('SALE200K', 'Giảm ngay 200,000đ', 'SoTien', 200000, NULL, 2000000, 50, '2026-01-01 00:00:00', '2026-12-31 23:59:59');


-- =========================================================
-- 33. TRIGGER TỰ ĐỘNG CẬP NHẬT KHOẢNG GIÁ (MIN/MAX)
-- =========================================================
*/
-- Mục đích: khi người dùng lập kế hoạch, mỗi dịch vụ (Tour,
-- KhachSan) hiển thị sẵn khoảng giá A-B mà KHÔNG cần tự tính
-- lại ở tầng ứng dụng. Giá được lấy từ nguồn dữ liệu gốc:
--   - Tour: từ các đợt khởi hành TourKhoiHanh.GiaApDung
--   - KhachSan: từ các loại phòng LoaiPhong.GiaMoiDem
-- (DiaDiem.GiaVeMin/Max và NhaHang.GiaMin/Max hiện chưa có
--  bảng con tương ứng nên vẫn nhập tay như dữ liệu mẫu ở trên)

DELIMITER $$

-- ---- TOUR: cập nhật khi TourKhoiHanh thay đổi ----

CREATE TRIGGER trg_TourKhoiHanh_AfterInsert
AFTER INSERT ON TourKhoiHanh
FOR EACH ROW
BEGIN
    UPDATE Tour
    SET GiaTourMin = (SELECT MIN(GiaApDung) FROM TourKhoiHanh WHERE MaTour = NEW.MaTour),
        GiaTourMax = (SELECT MAX(GiaApDung) FROM TourKhoiHanh WHERE MaTour = NEW.MaTour)
    WHERE MaTour = NEW.MaTour;
END$$

CREATE TRIGGER trg_TourKhoiHanh_AfterUpdate
AFTER UPDATE ON TourKhoiHanh
FOR EACH ROW
BEGIN
    UPDATE Tour
    SET GiaTourMin = (SELECT MIN(GiaApDung) FROM TourKhoiHanh WHERE MaTour = NEW.MaTour),
        GiaTourMax = (SELECT MAX(GiaApDung) FROM TourKhoiHanh WHERE MaTour = NEW.MaTour)
    WHERE MaTour = NEW.MaTour;
END$$

CREATE TRIGGER trg_TourKhoiHanh_AfterDelete
AFTER DELETE ON TourKhoiHanh
FOR EACH ROW
BEGIN
    UPDATE Tour
    SET GiaTourMin = COALESCE((SELECT MIN(GiaApDung) FROM TourKhoiHanh WHERE MaTour = OLD.MaTour), 0),
        GiaTourMax = COALESCE((SELECT MAX(GiaApDung) FROM TourKhoiHanh WHERE MaTour = OLD.MaTour), 0)
    WHERE MaTour = OLD.MaTour;
END$$

-- ---- KHÁCH SẠN: cập nhật khi LoaiPhong thay đổi ----

CREATE TRIGGER trg_LoaiPhong_AfterInsert
AFTER INSERT ON LoaiPhong
FOR EACH ROW
BEGIN
    UPDATE KhachSan
    SET GiaPhongMin = (SELECT MIN(GiaMoiDem) FROM LoaiPhong WHERE MaKhachSan = NEW.MaKhachSan),
        GiaPhongMax = (SELECT MAX(GiaMoiDem) FROM LoaiPhong WHERE MaKhachSan = NEW.MaKhachSan)
    WHERE MaKhachSan = NEW.MaKhachSan;
END$$

CREATE TRIGGER trg_LoaiPhong_AfterUpdate
AFTER UPDATE ON LoaiPhong
FOR EACH ROW
BEGIN
    UPDATE KhachSan
    SET GiaPhongMin = (SELECT MIN(GiaMoiDem) FROM LoaiPhong WHERE MaKhachSan = NEW.MaKhachSan),
        GiaPhongMax = (SELECT MAX(GiaMoiDem) FROM LoaiPhong WHERE MaKhachSan = NEW.MaKhachSan)
    WHERE MaKhachSan = NEW.MaKhachSan;
END$$

CREATE TRIGGER trg_LoaiPhong_AfterDelete
AFTER DELETE ON LoaiPhong
FOR EACH ROW
BEGIN
    UPDATE KhachSan
    SET GiaPhongMin = COALESCE((SELECT MIN(GiaMoiDem) FROM LoaiPhong WHERE MaKhachSan = OLD.MaKhachSan), 0),
        GiaPhongMax = COALESCE((SELECT MAX(GiaMoiDem) FROM LoaiPhong WHERE MaKhachSan = OLD.MaKhachSan), 0)
    WHERE MaKhachSan = OLD.MaKhachSan;
END$$

DELIMITER ;


-- =========================================================
-- 34. KIỂM TRA DATABASE
-- =========================================================

-- Additive migration. Run after backup; never resets business data.
CREATE TABLE IF NOT EXISTS NhatKyAdmin (
    MaNhatKy BIGINT AUTO_INCREMENT PRIMARY KEY,
    MaNguoiDung INT NOT NULL,
    HanhDong VARCHAR(10) NOT NULL,
    DoiTuong VARCHAR(80) NOT NULL,
    MaDoiTuong VARCHAR(80) NULL,
    TraceId VARCHAR(100) NOT NULL,
    KetQua VARCHAR(20) NOT NULL DEFAULT 'Started',
    HttpStatus INT NULL,
    ThoiGian DATETIME(6) NOT NULL DEFAULT (UTC_TIMESTAMP(6)),
    INDEX idx_nhatky_time (ThoiGian, MaNhatKy),
    INDEX idx_nhatky_actor (MaNguoiDung, MaNhatKy)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SHOW TABLES;
