-- ============================================================
-- DỮ LIỆU MẪU CHUẨN – WebDuLich
-- Chạy CSDL.sql trước, sau đó chạy file này.
-- Có thể chạy lại nhiều lần: dữ liệu cũ được xóa sạch.
-- Mật khẩu mẫu cho mọi tài khoản: 123456
-- ============================================================
USE WebDuLich;

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE ThanhToan;
TRUNCATE TABLE DatPhong;
TRUNCATE TABLE DatTour;
TRUNCATE TABLE YeuThich;
TRUNCATE TABLE DanhGia;
TRUNCATE TABLE ChiPhi;
TRUNCATE TABLE MaGiamGia;
TRUNCATE TABLE HinhAnh;
TRUNCATE TABLE LichTrinhChiTiet;
TRUNCATE TABLE LichTrinh;
TRUNCATE TABLE ThanhVienChuyenDi;
TRUNCATE TABLE ChuyenDi;
TRUNCATE TABLE TourChiTiet;
TRUNCATE TABLE TourKhoiHanh;
TRUNCATE TABLE Tour;
TRUNCATE TABLE LoaiPhong;
TRUNCATE TABLE KhachSan;
TRUNCATE TABLE NhaHang;
TRUNCATE TABLE DiaDiem;
TRUNCATE TABLE LoaiDiaDiem;
TRUNCATE TABLE NguoiDung;
TRUNCATE TABLE VaiTro;
SET FOREIGN_KEY_CHECKS = 1;

START TRANSACTION;

-- 1. Phân quyền và người dùng
INSERT INTO VaiTro (MaVaiTro, TenVaiTro, MoTa, TrangThai) VALUES
(1, 'Admin', 'Quản trị hệ thống', TRUE),
(2, 'User', 'Người dùng thông thường', TRUE);

INSERT INTO NguoiDung
(MaNguoiDung, MaVaiTro, HoTen, Email, MatKhau, SoDienThoai, NgaySinh, GioiTinh, TrangThai) VALUES
(1, 1, 'Quản trị viên', 'admin@nvtdulich.vn', '$2a$11$K7OzO5fDPzgI7cF9NnLXf.HJI7RKmqT4nV5eEzJqY6BOkp8wAHs4i', '0901234567', '2000-01-15', 'Nam', TRUE),
(2, 2, 'Trần Thị Mai', 'mai.tran@gmail.com', '$2a$11$K7OzO5fDPzgI7cF9NnLXf.HJI7RKmqT4nV5eEzJqY6BOkp8wAHs4i', '0912345678', '1998-05-20', 'Nu', TRUE),
(3, 2, 'Lê Minh Khoa', 'khoa.le@gmail.com', '$2a$11$K7OzO5fDPzgI7cF9NnLXf.HJI7RKmqT4nV5eEzJqY6BOkp8wAHs4i', '0923456789', '1995-09-10', 'Nam', TRUE);

-- 2. Danh mục địa điểm
INSERT INTO LoaiDiaDiem (MaLoai, TenLoai, MoTa, TrangThai) VALUES
(1, 'Danh lam thắng cảnh', 'Cảnh quan thiên nhiên nổi tiếng', TRUE),
(2, 'Di tích lịch sử', 'Di tích văn hóa và lịch sử', TRUE),
(3, 'Bãi biển', 'Các bãi biển đẹp', TRUE),
(4, 'Núi cao - Đèo', 'Điểm trekking và ngắm cảnh', TRUE),
(5, 'Làng nghề - Phố cổ', 'Không gian văn hóa truyền thống', TRUE),
(6, 'Công viên - Vườn', 'Công viên và khu vui chơi', TRUE);

INSERT INTO DiaDiem
(MaDiaDiem, MaLoai, TenDiaDiem, MoTa, DiaChi, QuanHuyen, TinhThanh, ViDo, KinhDo,
 GiaVe, GiaVeMin, GiaVeMax, GioMoCua, GioDongCua, ThoiGianThamQuan, DiemDanhGia, TrangThai) VALUES
(1, 1, 'Vịnh Hạ Long', 'Di sản thiên nhiên thế giới với hàng nghìn đảo đá vôi.', 'Hạ Long', 'Hạ Long', 'Quảng Ninh', 20.9101000, 107.1839000, 250000, 150000, 350000, '06:00', '18:00', 480, 4.8, TRUE),
(2, 3, 'Biển Mỹ Khê', 'Bãi biển cát trắng nổi tiếng tại Đà Nẵng.', 'Võ Nguyên Giáp', 'Sơn Trà', 'Đà Nẵng', 16.0544000, 108.2534000, 0, 0, 0, '05:00', '22:00', 180, 4.6, TRUE),
(3, 1, 'Cầu Vàng', 'Cây cầu biểu tượng trên đỉnh Bà Nà.', 'Bà Nà Hills', 'Hòa Vang', 'Đà Nẵng', 15.9959000, 107.9965000, 900000, 750000, 950000, '07:00', '18:00', 180, 4.8, TRUE),
(4, 5, 'Phố cổ Hội An', 'Đô thị cổ nổi tiếng với kiến trúc truyền thống và đèn lồng.', 'Trần Phú', 'Hội An', 'Quảng Nam', 15.8801000, 108.3380000, 120000, 80000, 150000, '07:00', '21:00', 240, 4.9, TRUE),
(5, 4, 'Đèo Mã Pí Lèng', 'Cung đèo nhìn xuống sông Nho Quế.', 'Quốc lộ 4C', 'Mèo Vạc', 'Hà Giang', 23.1833000, 105.4333000, 0, 0, 0, '00:00', '23:59', 180, 4.9, TRUE),
(6, 5, 'Phố cổ Đồng Văn', 'Khu phố cổ đặc trưng của cao nguyên đá.', 'Trung tâm Đồng Văn', 'Đồng Văn', 'Hà Giang', 23.2760000, 105.3660000, 0, 0, 0, '07:00', '22:00', 180, 4.7, TRUE),
(7, 1, 'Thác Bản Giốc', 'Thác nước hùng vĩ tại biên giới Việt Nam.', 'Đàm Thủy', 'Trùng Khánh', 'Cao Bằng', 22.8550000, 106.7080000, 100000, 80000, 120000, '07:00', '17:30', 180, 4.8, TRUE),
(8, 2, 'Đại Nội Huế', 'Quần thể kiến trúc cung đình triều Nguyễn.', '23/8', 'Phú Xuân', 'Thừa Thiên Huế', 16.4698000, 107.5796000, 250000, 200000, 250000, '07:00', '17:30', 240, 4.7, TRUE),
(9, 1, 'Đảo Lý Sơn', 'Đảo núi lửa với biển xanh và ruộng tỏi.', 'Đảo Lý Sơn', 'Lý Sơn', 'Quảng Ngãi', 15.3830000, 109.1250000, 0, 0, 0, '06:00', '18:00', 360, 4.6, TRUE),
(10, 1, 'Chợ nổi Cái Răng', 'Chợ nổi đặc trưng của miền Tây Nam Bộ.', 'Sông Cần Thơ', 'Cái Răng', 'Cần Thơ', 10.0140000, 105.7550000, 200000, 150000, 250000, '05:00', '09:00', 120, 4.5, TRUE);

-- 3. Nhà hàng, khách sạn và phòng
INSERT INTO NhaHang
(MaNhaHang, TenNhaHang, MoTa, DiaChi, QuanHuyen, TinhThanh, GiaMin, GiaMax, GioMoCua, GioDongCua, SoDienThoai, DiemDanhGia, TrangThai) VALUES
(1, 'Nhà hàng Đại Dương', 'Hải sản tươi sống nhìn ra vịnh.', '12 Hạ Long', 'Hạ Long', 'Quảng Ninh', 200000, 800000, '10:00', '22:00', '0203111222', 4.5, TRUE),
(2, 'Mì Quảng Bà Vị', 'Mì Quảng gia truyền.', '74 Đống Đa', 'Hải Châu', 'Đà Nẵng', 40000, 80000, '06:30', '20:00', '0236222333', 4.7, TRUE),
(3, 'Cao Lầu Phố Hội', 'Đặc sản Hội An.', '8 Trần Phú', 'Hội An', 'Quảng Nam', 50000, 120000, '08:00', '21:30', '0235333444', 4.6, TRUE),
(4, 'Bún Bò Huế Bà Ngoại', 'Bún bò Huế truyền thống.', '38 Lý Thường Kiệt', 'Huế', 'Thừa Thiên Huế', 35000, 60000, '06:00', '14:00', '0234444555', 4.8, TRUE),
(5, 'Hải Sản Lý Sơn', 'Hải sản tại bến đảo.', 'Cảng An Vĩnh', 'Lý Sơn', 'Quảng Ngãi', 150000, 600000, '08:00', '20:00', '0255666777', 4.7, TRUE);

INSERT INTO KhachSan
(MaKhachSan, TenKhachSan, LoaiLuuTru, MoTa, DiaChi, QuanHuyen, TinhThanh, GiaPhongMin, GiaPhongMax, SoDienThoai, DiemDanhGia, TrangThai) VALUES
(1, 'Vinpearl Resort Hạ Long', 'Resort', 'Resort nhìn ra vịnh Hạ Long.', 'Đảo Rều', 'Hạ Long', 'Quảng Ninh', 2500000, 8000000, '0203100200', 4.8, TRUE),
(2, 'Mường Thanh Luxury Đà Nẵng', 'Hotel', 'Khách sạn gần biển Mỹ Khê.', '60 Võ Nguyên Giáp', 'Ngũ Hành Sơn', 'Đà Nẵng', 1200000, 3000000, '0236300400', 4.7, TRUE),
(3, 'Hội An Riverside Resort', 'Resort', 'Resort ven sông Thu Bồn.', '175 Cửa Đại', 'Hội An', 'Quảng Nam', 900000, 2200000, '0235400500', 4.6, TRUE),
(4, 'Laluna Homestay Hà Giang', 'Homestay', 'Homestay nhìn ra núi.', 'Quốc lộ 4C', 'Mèo Vạc', 'Hà Giang', 350000, 550000, '0219500600', 4.9, TRUE),
(5, 'Saigon Morin Huế', 'Hotel', 'Khách sạn lịch sử bên sông Hương.', '30 Lê Lợi', 'Huế', 'Thừa Thiên Huế', 800000, 1400000, '0234600700', 4.6, TRUE);

INSERT INTO LoaiPhong
(MaLoaiPhong, MaKhachSan, TenLoaiPhong, MoTa, SucChua, SoLuongPhong, GiaMoiDem, TrangThai) VALUES
(1, 1, 'Deluxe View Vịnh', 'Phòng có ban công nhìn ra vịnh.', 2, 30, 2500000, TRUE),
(2, 1, 'Suite Panorama', 'Suite cao cấp view 180 độ.', 2, 10, 5500000, TRUE),
(3, 2, 'Superior', 'Phòng view thành phố.', 2, 50, 1200000, TRUE),
(4, 2, 'Junior Suite', 'Suite có phòng khách riêng.', 2, 15, 3000000, TRUE),
(5, 3, 'Garden View', 'Phòng nhìn ra vườn.', 2, 20, 900000, TRUE),
(6, 3, 'Bungalow Ven Sông', 'Bungalow nhìn ra sông Thu Bồn.', 2, 8, 2200000, TRUE),
(7, 4, 'Phòng Đơn View Núi', 'Phòng nhỏ nhìn ra núi.', 2, 6, 350000, TRUE),
(8, 5, 'Superior Sông Hương', 'Phòng nhìn ra sông Hương.', 2, 20, 1400000, TRUE);

-- 4. Tour, ngày khởi hành và lịch trình tour
INSERT INTO Tour
(MaTour, MaNguoiTao, TenTour, MoTa, DiemKhoiHanh, DiemDen, SoNgay, SoDem, GiaTour, GiaTourMin, GiaTourMax, SoNguoiToiDa, SoNguoiToiThieu, TrangThai) VALUES
(1, 1, 'Hạ Long 2 ngày 1 đêm', 'Du thuyền, hang động và chèo kayak.', 'Hà Nội', 'Quảng Ninh', 2, 1, 2900000, 2900000, 3200000, 30, 1, 'Active'),
(2, 1, 'Đà Nẵng - Hội An 4 ngày 3 đêm', 'Biển Mỹ Khê, Cầu Vàng và phố cổ Hội An.', 'TP. HCM', 'Đà Nẵng - Quảng Nam', 4, 3, 4500000, 4500000, 5200000, 30, 1, 'Active'),
(3, 1, 'Hà Giang Loop 4 ngày 3 đêm', 'Mã Pí Lèng và phố cổ Đồng Văn.', 'Hà Nội', 'Hà Giang', 4, 3, 2500000, 2500000, 3000000, 20, 1, 'Active'),
(4, 1, 'Cao Bằng - Bản Giốc 3 ngày 2 đêm', 'Khám phá thác Bản Giốc.', 'Hà Nội', 'Cao Bằng', 3, 2, 2200000, 2200000, 2800000, 25, 1, 'Active'),
(5, 1, 'Huế - Di sản cố đô 3 ngày 2 đêm', 'Đại Nội và ẩm thực xứ Huế.', 'Đà Nẵng', 'Thừa Thiên Huế', 3, 2, 1800000, 1800000, 2300000, 25, 1, 'Active'),
(6, 1, 'Lý Sơn đảo ngọc 3 ngày 2 đêm', 'Cổng Tò Vò, Hang Câu và biển đảo.', 'Quảng Ngãi', 'Lý Sơn', 3, 2, 2800000, 2800000, 3500000, 20, 1, 'Active'),
(7, 1, 'Đà Lạt mộng mơ 3 ngày 2 đêm', 'Thành phố ngàn hoa và rừng thông.', 'TP. HCM', 'Lâm Đồng', 3, 2, 1900000, 1900000, 2500000, 30, 1, 'Active'),
(8, 1, 'Cần Thơ miền Tây 2 ngày 1 đêm', 'Chợ nổi và trải nghiệm sông nước.', 'TP. HCM', 'Cần Thơ', 2, 1, 1500000, 1500000, 1900000, 30, 1, 'Active');

INSERT INTO TourKhoiHanh
(MaKhoiHanh, MaTour, NgayKhoiHanh, SoChoToiDa, SoChoDaDat, GiaApDung, TrangThai) VALUES
(1, 1, '2026-10-05', 30, 2, 2900000, 'OpenForBooking'), (2, 1, '2026-11-02', 30, 0, 3200000, 'OpenForBooking'),
(3, 2, '2026-10-08', 30, 3, 4500000, 'OpenForBooking'), (4, 2, '2026-11-05', 30, 0, 5200000, 'OpenForBooking'),
(5, 3, '2026-10-10', 20, 0, 2500000, 'OpenForBooking'), (6, 3, '2026-11-07', 20, 0, 3000000, 'OpenForBooking'),
(7, 4, '2026-10-15', 25, 0, 2200000, 'OpenForBooking'), (8, 4, '2026-10-29', 25, 0, 2800000, 'OpenForBooking'),
(9, 5, '2026-10-10', 25, 0, 1800000, 'OpenForBooking'), (10, 5, '2026-10-24', 25, 0, 2300000, 'OpenForBooking'),
(11, 6, '2026-10-17', 20, 0, 2800000, 'OpenForBooking'), (12, 6, '2026-10-31', 20, 0, 3500000, 'OpenForBooking'),
(13, 7, '2026-10-11', 30, 0, 1900000, 'OpenForBooking'), (14, 7, '2026-10-25', 30, 0, 2500000, 'OpenForBooking'),
(15, 8, '2026-10-04', 30, 0, 1500000, 'OpenForBooking'), (16, 8, '2026-10-18', 30, 0, 1900000, 'OpenForBooking');

INSERT INTO TourChiTiet
(MaTourChiTiet, MaTour, NgayThu, ThuTu, LoaiDiaDiem, MaDiaDiem, MaNhaHang, MaKhachSan, ThoiGianBatDau, ThoiGianKetThuc, ChiPhi, GhiChu) VALUES
(1, 1, 1, 1, 'DiaDiem', 1, NULL, NULL, '09:00', '12:00', 250000, 'Tham quan Vịnh Hạ Long'),
(2, 1, 1, 2, 'NhaHang', NULL, 1, NULL, '12:30', '14:00', 300000, 'Ăn trưa hải sản'),
(3, 1, 1, 3, 'KhachSan', NULL, NULL, 1, '15:00', '16:00', 2500000, 'Nhận phòng'),
(4, 2, 1, 1, 'DiaDiem', 2, NULL, NULL, '08:00', '11:00', 0, 'Tắm biển Mỹ Khê'),
(5, 2, 2, 1, 'DiaDiem', 3, NULL, NULL, '08:00', '16:00', 900000, 'Khám phá Bà Nà Hills'),
(6, 2, 3, 1, 'DiaDiem', 4, NULL, NULL, '09:00', '20:00', 120000, 'Tham quan Hội An'),
(7, 3, 2, 1, 'DiaDiem', 5, NULL, NULL, '08:00', '12:00', 0, 'Chinh phục Mã Pí Lèng'),
(8, 3, 2, 2, 'DiaDiem', 6, NULL, NULL, '14:00', '20:00', 0, 'Dạo phố cổ Đồng Văn'),
(9, 4, 2, 1, 'DiaDiem', 7, NULL, NULL, '08:00', '12:00', 100000, 'Tham quan thác Bản Giốc'),
(10, 5, 1, 1, 'DiaDiem', 8, NULL, NULL, '08:00', '12:00', 250000, 'Tham quan Đại Nội'),
(11, 5, 1, 2, 'NhaHang', NULL, 4, NULL, '12:30', '13:30', 60000, 'Ăn bún bò Huế'),
(12, 6, 1, 1, 'DiaDiem', 9, NULL, NULL, '08:00', '17:00', 0, 'Khám phá đảo Lý Sơn'),
(13, 6, 1, 2, 'NhaHang', NULL, 5, NULL, '18:00', '20:00', 400000, 'Ăn hải sản'),
(14, 8, 1, 1, 'DiaDiem', 10, NULL, NULL, '05:00', '09:00', 200000, 'Đi chợ nổi Cái Răng');

-- 5. Ảnh: nhiều dòng cùng MaTour/MaDiaDiem thể hiện quan hệ 1-N.
INSERT INTO HinhAnh (MaTour, DuongDan, MoTa, ThuTu) VALUES
(1, '/media/vietnam/ha-long.jpg', 'Vịnh Hạ Long', 0),
(2, '/media/vietnam/my-khe.jpg', 'Biển Mỹ Khê', 0),
(2, '/media/vietnam/cau-vang.jpg', 'Cầu Vàng Bà Nà', 1),
(2, '/media/vietnam/hoi-an.jpg', 'Phố cổ Hội An', 2),
(3, '/media/vietnam/ma-pi-leng.jpg', 'Đèo Mã Pí Lèng', 0),
(3, '/media/vietnam/dong-van.jpg', 'Phố cổ Đồng Văn', 1),
(4, '/media/vietnam/ban-gioc.jpg', 'Thác Bản Giốc', 0),
(5, '/media/vietnam/dai-noi-hue.jpg', 'Đại Nội Huế', 0),
(5, '/media/vietnam/saigon-morin-hue.jpg', 'Khách sạn lịch sử tại Huế', 1),
(6, '/media/vietnam/ly-son.jpg', 'Đảo Lý Sơn', 0),
(7, '/media/vietnam/vuon-hoa-da-lat.jpg', 'Vườn hoa Đà Lạt', 0),
(8, '/media/vietnam/cai-rang.jpg', 'Chợ nổi Cái Răng', 0);

INSERT INTO HinhAnh (MaDiaDiem, DuongDan, MoTa, ThuTu) VALUES
(1, '/media/vietnam/ha-long.jpg', 'Vịnh Hạ Long', 0),
(2, '/media/vietnam/my-khe.jpg', 'Bãi biển Mỹ Khê', 0),
(2, '/media/vietnam/cau-vang.jpg', 'Đà Nẵng nhìn từ Bà Nà', 1),
(3, '/media/vietnam/cau-vang.jpg', 'Cầu Vàng', 0),
(3, '/media/vietnam/my-khe.jpg', 'Phong cảnh Đà Nẵng', 1),
(4, '/media/vietnam/hoi-an.jpg', 'Phố cổ Hội An', 0),
(4, '/media/vietnam/cau-vang.jpg', 'Hành trình Đà Nẵng - Hội An', 1),
(5, '/media/vietnam/ma-pi-leng.jpg', 'Đèo Mã Pí Lèng', 0),
(5, '/media/vietnam/dong-van.jpg', 'Cao nguyên đá Đồng Văn', 1),
(6, '/media/vietnam/dong-van.jpg', 'Phố cổ Đồng Văn', 0),
(6, '/media/vietnam/ma-pi-leng.jpg', 'Cung đường Hà Giang', 1),
(7, '/media/vietnam/ban-gioc.jpg', 'Thác Bản Giốc', 0),
(8, '/media/vietnam/dai-noi-hue.jpg', 'Đại Nội Huế', 0),
(9, '/media/vietnam/ly-son.jpg', 'Đảo Lý Sơn', 0),
(10, '/media/vietnam/cai-rang.jpg', 'Chợ nổi Cái Răng', 0);

INSERT INTO HinhAnh (MaKhachSan, DuongDan, MoTa, ThuTu) VALUES
(1, '/media/vietnam/ha-long.jpg', 'Không gian nhìn ra vịnh', 0),
(5, '/media/vietnam/saigon-morin-hue.jpg', 'Mặt ngoài Saigon Morin Huế', 0);

-- 6. Dữ liệu nghiệp vụ
INSERT INTO MaGiamGia
(MaCode, Code, MoTa, LoaiGiam, GiaTriGiam, GiamToiDa, DonHangToiThieu, SoLuong, SoLuongDaDung, NgayBatDau, NgayKetThuc, TrangThai) VALUES
(1, 'WELCOME10', 'Giảm 10% cho khách hàng mới', 'PhanTram', 10, 500000, 1000000, 100, 0, '2026-01-01', '2026-12-31 23:59:59', TRUE),
(2, 'HALONG200', 'Giảm 200.000đ tour Hạ Long', 'SoTien', 200000, NULL, 2000000, 50, 3, '2026-09-01', '2026-11-30 23:59:59', TRUE),
(3, 'DANANG500', 'Giảm 500.000đ tour Đà Nẵng', 'SoTien', 500000, NULL, 4000000, 30, 5, '2026-09-01', '2026-11-30 23:59:59', TRUE);

INSERT INTO ChuyenDi
(MaChuyenDi, MaNguoiDung, TenChuyenDi, DiemKhoiHanh, DiemDen, NgayBatDau, NgayKetThuc, SoNguoi, NganSach, MoTa, TrangThai) VALUES
(1, 2, 'Hạ Long cùng gia đình', 'Hà Nội', 'Quảng Ninh', '2026-10-12', '2026-10-14', 4, 15000000, 'Chuyến đi gia đình', 'Confirmed'),
(2, 3, 'Khám phá miền Trung', 'Hà Nội', 'Đà Nẵng - Hội An', '2026-11-05', '2026-11-10', 3, 20000000, 'Đi cùng bạn bè', 'Planning');

INSERT INTO ThanhVienChuyenDi (MaThanhVien, MaChuyenDi, MaNguoiDung, VaiTro, TrangThai) VALUES
(1, 1, 2, 'Owner', 'Accepted'), (2, 1, 3, 'Member', 'Accepted'), (3, 2, 3, 'Owner', 'Accepted');

INSERT INTO LichTrinh (MaLichTrinh, MaChuyenDi, NgayThu, Ngay, TieuDe, GhiChu) VALUES
(1, 1, 1, '2026-10-12', 'Khởi hành và tham quan vịnh', 'Có mặt lúc 06:30'),
(2, 1, 2, '2026-10-13', 'Vui chơi tại Hạ Long', NULL),
(3, 2, 1, '2026-11-05', 'Khám phá Đà Nẵng', NULL),
(4, 2, 2, '2026-11-06', 'Bà Nà Hills', NULL);

INSERT INTO LichTrinhChiTiet
(MaChiTiet, MaLichTrinh, ThuTu, LoaiDiaDiem, MaDiaDiem, MaNhaHang, MaKhachSan, ThoiGianBatDau, ThoiGianKetThuc, ChiPhi, GhiChu) VALUES
(1, 1, 1, 'DiaDiem', 1, NULL, NULL, '09:00', '12:00', 250000, 'Đi tàu tham quan'),
(2, 1, 2, 'NhaHang', NULL, 1, NULL, '12:30', '14:00', 300000, 'Ăn trưa'),
(3, 1, 3, 'KhachSan', NULL, NULL, 1, '15:00', '16:00', 2500000, 'Nhận phòng'),
(4, 3, 1, 'DiaDiem', 2, NULL, NULL, '08:00', '11:00', 0, 'Tắm biển'),
(5, 3, 2, 'NhaHang', NULL, 2, NULL, '12:00', '13:00', 70000, 'Ăn mì Quảng'),
(6, 4, 1, 'DiaDiem', 3, NULL, NULL, '08:00', '16:00', 900000, 'Tham quan Bà Nà');

INSERT INTO DatTour
(MaDatTour, MaNguoiDung, MaTour, MaKhoiHanh, NgayKhoiHanh, SoNguoi, GiaMoiNguoi, TongTien, TrangThai, GhiChu) VALUES
(1, 2, 1, 1, '2026-10-05', 2, 2900000, 5800000, 'Confirmed', 'Phòng đôi'),
(2, 3, 2, 3, '2026-10-08', 3, 4500000, 13500000, 'Pending', NULL);

INSERT INTO DatPhong
(MaDatPhong, MaNguoiDung, MaLoaiPhong, NgayNhanPhong, NgayTraPhong, SoLuongPhong, SoNguoi, GiaMoiDem, TongTien, TrangThai, GhiChu) VALUES
(1, 2, 5, '2026-11-05', '2026-11-07', 1, 2, 900000, 1800000, 'Confirmed', 'Nhận phòng sau 14 giờ');

INSERT INTO ThanhToan
(MaThanhToan, LoaiDon, MaDatTour, MaDatPhong, SoTien, PhuongThuc, MaGiaoDich, TrangThai, NgayThanhToan) VALUES
(1, 'DatTour', 1, NULL, 5800000, 'ChuyenKhoan', 'TOUR-2026-0001', 'ThanhCong', NOW()),
(2, 'DatTour', 2, NULL, 13500000, 'VNPay', 'TOUR-2026-0002', 'ChoThanhToan', NULL),
(3, 'DatPhong', NULL, 1, 1800000, 'Momo', 'ROOM-2026-0001', 'ThanhCong', NOW());

INSERT INTO ChiPhi (MaChiPhi, MaChuyenDi, MaNguoiDung, TenChiPhi, LoaiChiPhi, SoTien, NgayChi, GhiChu) VALUES
(1, 1, 2, 'Vé xe Hà Nội - Hạ Long', 'DiChuyen', 800000, '2026-10-12', 'Bốn người'),
(2, 1, 2, 'Ăn tối hải sản', 'AnUong', 1200000, '2026-10-12', 'Cả gia đình'),
(3, 2, 3, 'Khách sạn Hội An', 'KhachSan', 1800000, '2026-11-06', 'Hai đêm');

INSERT INTO DanhGia (MaDanhGia, MaNguoiDung, MaTour, MaDiaDiem, MaNhaHang, MaKhachSan, SoSao, NoiDung, TrangThai) VALUES
(1, 2, 1, NULL, NULL, NULL, 5, 'Tour Hạ Long rất đáng trải nghiệm.', TRUE),
(2, 3, 2, NULL, NULL, NULL, 5, 'Lịch trình Đà Nẵng - Hội An hợp lý.', TRUE),
(3, 2, NULL, 1, NULL, NULL, 5, 'Vịnh Hạ Long đẹp và hùng vĩ.', TRUE),
(4, 3, NULL, 4, NULL, NULL, 5, 'Hội An về đêm rất đẹp.', TRUE);

INSERT INTO YeuThich (MaYeuThich, MaNguoiDung, MaTour, MaDiaDiem, MaNhaHang, MaKhachSan) VALUES
(1, 2, 1, NULL, NULL, NULL), (2, 2, NULL, 4, NULL, NULL),
(3, 3, 3, NULL, NULL, NULL), (4, 3, NULL, 5, NULL, NULL);

-- BEGIN COMPLETION 20260916
-- Dữ liệu minh họa phục vụ kiểm thử, không phải cam kết dịch vụ thực tế.
-- Bổ sung theo tên/khóa nghiệp vụ; không xóa hoặc ghi đè dữ liệu hiện có.
INSERT INTO DiaDiem(MaLoai,TenDiaDiem,MoTa,DiaChi,QuanHuyen,TinhThanh,ThoiGianThamQuan,TrangThai)
SELECT 6,'Vườn hoa Đà Lạt','Lịch trình mẫu: khám phá các khu trưng bày hoa và chụp ảnh; giờ và chi phí cần xác nhận khi đặt dịch vụ.','Đà Lạt','Đà Lạt','Lâm Đồng',120,1
WHERE NOT EXISTS(SELECT 1 FROM DiaDiem WHERE TenDiaDiem='Vườn hoa Đà Lạt');
INSERT INTO DiaDiem(MaLoai,TenDiaDiem,MoTa,DiaChi,QuanHuyen,TinhThanh,ThoiGianThamQuan,TrangThai)
SELECT 1,'Hồ Xuân Hương','Lịch trình mẫu: đi bộ ven hồ, ngắm cảnh và tìm hiểu không gian trung tâm Đà Lạt.','Trung tâm Đà Lạt','Đà Lạt','Lâm Đồng',90,1
WHERE NOT EXISTS(SELECT 1 FROM DiaDiem WHERE TenDiaDiem='Hồ Xuân Hương');
INSERT INTO TourChiTiet(MaTour,NgayThu,ThuTu,LoaiDiaDiem,MaDiaDiem,ThoiGianBatDau,ThoiGianKetThuc,ChiPhi,GhiChu)
SELECT t.MaTour,2,1,'DiaDiem',d.MaDiaDiem,'08:00','11:00',0,'Lịch trình mẫu: Ăn sáng trước giờ tập trung, lên tàu ngắm các đảo đá và nghe giới thiệu cảnh quan vịnh; chuẩn bị áo phao theo hướng dẫn.'
FROM Tour t JOIN DiaDiem d ON d.TenDiaDiem='Vịnh Hạ Long'
WHERE t.TenTour='Hạ Long 2 ngày 1 đêm' AND t.SoNgay>=2
AND NOT EXISTS(SELECT 1 FROM TourChiTiet c WHERE c.MaTour=t.MaTour AND c.NgayThu=2 AND c.ThuTu=1);
INSERT INTO TourChiTiet(MaTour,NgayThu,ThuTu,LoaiDiaDiem,MaDiaDiem,ThoiGianBatDau,ThoiGianKetThuc,ChiPhi,GhiChu)
SELECT t.MaTour,2,2,'DiaDiem',d.MaDiaDiem,'13:00','15:00',0,'Lịch trình mẫu: Dạo khu vực ven vịnh, chụp ảnh lưu niệm; kiểm tra hành lý và tập trung lên xe về Hà Nội.'
FROM Tour t JOIN DiaDiem d ON d.TenDiaDiem='Vịnh Hạ Long'
WHERE t.TenTour='Hạ Long 2 ngày 1 đêm' AND t.SoNgay>=2
AND NOT EXISTS(SELECT 1 FROM TourChiTiet c WHERE c.MaTour=t.MaTour AND c.NgayThu=2 AND c.ThuTu=2);
INSERT INTO TourChiTiet(MaTour,NgayThu,ThuTu,LoaiDiaDiem,MaDiaDiem,ThoiGianBatDau,ThoiGianKetThuc,ChiPhi,GhiChu)
SELECT t.MaTour,4,1,'DiaDiem',d.MaDiaDiem,'07:00','09:00',0,'Lịch trình mẫu: Đi bộ buổi sáng bên biển Mỹ Khê, chụp ảnh và nghỉ ngơi; không xuống nước khi có cảnh báo thời tiết.'
FROM Tour t JOIN DiaDiem d ON d.TenDiaDiem='Biển Mỹ Khê'
WHERE t.TenTour='Đà Nẵng - Hội An 4 ngày 3 đêm' AND t.SoNgay>=4
AND NOT EXISTS(SELECT 1 FROM TourChiTiet c WHERE c.MaTour=t.MaTour AND c.NgayThu=4 AND c.ThuTu=1);
INSERT INTO TourChiTiet(MaTour,NgayThu,ThuTu,LoaiDiaDiem,MaDiaDiem,ThoiGianBatDau,ThoiGianKetThuc,ChiPhi,GhiChu)
SELECT t.MaTour,4,2,'DiaDiem',d.MaDiaDiem,'10:00','11:00',0,'Lịch trình mẫu: Tập trung ven biển, tổng kết hành trình Đà Nẵng – Hội An; về nơi lưu trú lấy hành lý và ra sân bay theo giờ hẹn.'
FROM Tour t JOIN DiaDiem d ON d.TenDiaDiem='Biển Mỹ Khê'
WHERE t.TenTour='Đà Nẵng - Hội An 4 ngày 3 đêm' AND t.SoNgay>=4
AND NOT EXISTS(SELECT 1 FROM TourChiTiet c WHERE c.MaTour=t.MaTour AND c.NgayThu=4 AND c.ThuTu=2);
INSERT INTO TourChiTiet(MaTour,NgayThu,ThuTu,LoaiDiaDiem,MaDiaDiem,ThoiGianBatDau,ThoiGianKetThuc,ChiPhi,GhiChu)
SELECT t.MaTour,1,1,'DiaDiem',d.MaDiaDiem,'14:00','16:00',0,'Lịch trình mẫu: Đến Đồng Văn sau chặng di chuyển; nghe phổ biến an toàn và đi bộ làm quen với không gian phố cổ.'
FROM Tour t JOIN DiaDiem d ON d.TenDiaDiem='Phố cổ Đồng Văn'
WHERE t.TenTour='Hà Giang Loop 4 ngày 3 đêm' AND t.SoNgay>=1
AND NOT EXISTS(SELECT 1 FROM TourChiTiet c WHERE c.MaTour=t.MaTour AND c.NgayThu=1 AND c.ThuTu=1);
INSERT INTO TourChiTiet(MaTour,NgayThu,ThuTu,LoaiDiaDiem,MaDiaDiem,ThoiGianBatDau,ThoiGianKetThuc,ChiPhi,GhiChu)
SELECT t.MaTour,1,2,'DiaDiem',d.MaDiaDiem,'17:00','19:00',0,'Lịch trình mẫu: Khám phá các ngôi nhà cổ và không gian sinh hoạt địa phương; tự chọn bữa tối, sau đó về nơi lưu trú nghỉ ngơi.'
FROM Tour t JOIN DiaDiem d ON d.TenDiaDiem='Phố cổ Đồng Văn'
WHERE t.TenTour='Hà Giang Loop 4 ngày 3 đêm' AND t.SoNgay>=1
AND NOT EXISTS(SELECT 1 FROM TourChiTiet c WHERE c.MaTour=t.MaTour AND c.NgayThu=1 AND c.ThuTu=2);
INSERT INTO TourChiTiet(MaTour,NgayThu,ThuTu,LoaiDiaDiem,MaDiaDiem,ThoiGianBatDau,ThoiGianKetThuc,ChiPhi,GhiChu)
SELECT t.MaTour,3,1,'DiaDiem',d.MaDiaDiem,'08:00','11:00',0,'Lịch trình mẫu: Ngắm cảnh cao nguyên đá từ cung đèo, dừng chụp ảnh ở vị trí được hướng dẫn; không dừng xe ở khúc cua.'
FROM Tour t JOIN DiaDiem d ON d.TenDiaDiem='Đèo Mã Pí Lèng'
WHERE t.TenTour='Hà Giang Loop 4 ngày 3 đêm' AND t.SoNgay>=3
AND NOT EXISTS(SELECT 1 FROM TourChiTiet c WHERE c.MaTour=t.MaTour AND c.NgayThu=3 AND c.ThuTu=1);
INSERT INTO TourChiTiet(MaTour,NgayThu,ThuTu,LoaiDiaDiem,MaDiaDiem,ThoiGianBatDau,ThoiGianKetThuc,ChiPhi,GhiChu)
SELECT t.MaTour,3,2,'DiaDiem',d.MaDiaDiem,'14:00','17:00',0,'Lịch trình mẫu: Trở lại Đồng Văn, tìm hiểu đời sống địa phương và chọn quà lưu niệm; thời gian còn lại tự do nghỉ ngơi.'
FROM Tour t JOIN DiaDiem d ON d.TenDiaDiem='Phố cổ Đồng Văn'
WHERE t.TenTour='Hà Giang Loop 4 ngày 3 đêm' AND t.SoNgay>=3
AND NOT EXISTS(SELECT 1 FROM TourChiTiet c WHERE c.MaTour=t.MaTour AND c.NgayThu=3 AND c.ThuTu=2);
INSERT INTO TourChiTiet(MaTour,NgayThu,ThuTu,LoaiDiaDiem,MaDiaDiem,ThoiGianBatDau,ThoiGianKetThuc,ChiPhi,GhiChu)
SELECT t.MaTour,4,1,'DiaDiem',d.MaDiaDiem,'07:00','09:00',0,'Lịch trình mẫu: Ăn sáng và dạo phố cổ, kiểm tra hành lý trước hành trình trở về.'
FROM Tour t JOIN DiaDiem d ON d.TenDiaDiem='Phố cổ Đồng Văn'
WHERE t.TenTour='Hà Giang Loop 4 ngày 3 đêm' AND t.SoNgay>=4
AND NOT EXISTS(SELECT 1 FROM TourChiTiet c WHERE c.MaTour=t.MaTour AND c.NgayThu=4 AND c.ThuTu=1);
INSERT INTO TourChiTiet(MaTour,NgayThu,ThuTu,LoaiDiaDiem,MaDiaDiem,ThoiGianBatDau,ThoiGianKetThuc,ChiPhi,GhiChu)
SELECT t.MaTour,4,2,'DiaDiem',d.MaDiaDiem,'09:30','10:30',0,'Lịch trình mẫu: Tập trung tại điểm hẹn ở Đồng Văn, tổng kết chuyến đi; lên xe về Hà Nội, nghỉ dọc đường theo điều phối.'
FROM Tour t JOIN DiaDiem d ON d.TenDiaDiem='Phố cổ Đồng Văn'
WHERE t.TenTour='Hà Giang Loop 4 ngày 3 đêm' AND t.SoNgay>=4
AND NOT EXISTS(SELECT 1 FROM TourChiTiet c WHERE c.MaTour=t.MaTour AND c.NgayThu=4 AND c.ThuTu=2);
INSERT INTO TourChiTiet(MaTour,NgayThu,ThuTu,LoaiDiaDiem,MaDiaDiem,ThoiGianBatDau,ThoiGianKetThuc,ChiPhi,GhiChu)
SELECT t.MaTour,1,1,'DiaDiem',d.MaDiaDiem,'14:00','15:30',0,'Lịch trình mẫu: Sau chặng di chuyển đến khu vực Bản Giốc, nhận hướng dẫn an toàn và đi bộ ngắm cảnh quanh điểm tham quan.'
FROM Tour t JOIN DiaDiem d ON d.TenDiaDiem='Thác Bản Giốc'
WHERE t.TenTour='Cao Bằng - Bản Giốc 3 ngày 2 đêm' AND t.SoNgay>=1
AND NOT EXISTS(SELECT 1 FROM TourChiTiet c WHERE c.MaTour=t.MaTour AND c.NgayThu=1 AND c.ThuTu=1);
INSERT INTO TourChiTiet(MaTour,NgayThu,ThuTu,LoaiDiaDiem,MaDiaDiem,ThoiGianBatDau,ThoiGianKetThuc,ChiPhi,GhiChu)
SELECT t.MaTour,1,2,'DiaDiem',d.MaDiaDiem,'16:00','17:00',0,'Lịch trình mẫu: Chụp ảnh toàn cảnh thác từ khu vực được phép; tập trung về nơi lưu trú và dùng bữa tối tự chọn.'
FROM Tour t JOIN DiaDiem d ON d.TenDiaDiem='Thác Bản Giốc'
WHERE t.TenTour='Cao Bằng - Bản Giốc 3 ngày 2 đêm' AND t.SoNgay>=1
AND NOT EXISTS(SELECT 1 FROM TourChiTiet c WHERE c.MaTour=t.MaTour AND c.NgayThu=1 AND c.ThuTu=2);
INSERT INTO TourChiTiet(MaTour,NgayThu,ThuTu,LoaiDiaDiem,MaDiaDiem,ThoiGianBatDau,ThoiGianKetThuc,ChiPhi,GhiChu)
SELECT t.MaTour,3,1,'DiaDiem',d.MaDiaDiem,'08:00','09:30',0,'Lịch trình mẫu: Ngắm thác buổi sáng, đi bộ thư giãn và dành thời gian chụp ảnh trước khi rời Cao Bằng.'
FROM Tour t JOIN DiaDiem d ON d.TenDiaDiem='Thác Bản Giốc'
WHERE t.TenTour='Cao Bằng - Bản Giốc 3 ngày 2 đêm' AND t.SoNgay>=3
AND NOT EXISTS(SELECT 1 FROM TourChiTiet c WHERE c.MaTour=t.MaTour AND c.NgayThu=3 AND c.ThuTu=1);
INSERT INTO TourChiTiet(MaTour,NgayThu,ThuTu,LoaiDiaDiem,MaDiaDiem,ThoiGianBatDau,ThoiGianKetThuc,ChiPhi,GhiChu)
SELECT t.MaTour,3,2,'DiaDiem',d.MaDiaDiem,'10:00','11:00',0,'Lịch trình mẫu: Kiểm tra hành lý tại điểm hẹn, tổng kết hành trình và lên xe trở về Hà Nội.'
FROM Tour t JOIN DiaDiem d ON d.TenDiaDiem='Thác Bản Giốc'
WHERE t.TenTour='Cao Bằng - Bản Giốc 3 ngày 2 đêm' AND t.SoNgay>=3
AND NOT EXISTS(SELECT 1 FROM TourChiTiet c WHERE c.MaTour=t.MaTour AND c.NgayThu=3 AND c.ThuTu=2);
INSERT INTO TourChiTiet(MaTour,NgayThu,ThuTu,LoaiDiaDiem,MaDiaDiem,ThoiGianBatDau,ThoiGianKetThuc,ChiPhi,GhiChu)
SELECT t.MaTour,2,1,'DiaDiem',d.MaDiaDiem,'08:00','11:00',0,'Lịch trình mẫu: Tiếp tục tìm hiểu không gian kiến trúc cung đình, nghe giới thiệu các khu vực mở cửa và chụp ảnh theo hướng dẫn.'
FROM Tour t JOIN DiaDiem d ON d.TenDiaDiem='Đại Nội Huế'
WHERE t.TenTour='Huế - Di sản cố đô 3 ngày 2 đêm' AND t.SoNgay>=2
AND NOT EXISTS(SELECT 1 FROM TourChiTiet c WHERE c.MaTour=t.MaTour AND c.NgayThu=2 AND c.ThuTu=1);
INSERT INTO TourChiTiet(MaTour,NgayThu,ThuTu,LoaiDiaDiem,MaDiaDiem,ThoiGianBatDau,ThoiGianKetThuc,ChiPhi,GhiChu)
SELECT t.MaTour,2,2,'DiaDiem',d.MaDiaDiem,'14:00','16:00',0,'Lịch trình mẫu: Dạo các sân vườn trong quần thể, nghỉ chân và tìm hiểu những câu chuyện văn hóa; kết thúc tham quan trước giờ đóng cửa.'
FROM Tour t JOIN DiaDiem d ON d.TenDiaDiem='Đại Nội Huế'
WHERE t.TenTour='Huế - Di sản cố đô 3 ngày 2 đêm' AND t.SoNgay>=2
AND NOT EXISTS(SELECT 1 FROM TourChiTiet c WHERE c.MaTour=t.MaTour AND c.NgayThu=2 AND c.ThuTu=2);
INSERT INTO TourChiTiet(MaTour,NgayThu,ThuTu,LoaiDiaDiem,MaDiaDiem,ThoiGianBatDau,ThoiGianKetThuc,ChiPhi,GhiChu)
SELECT t.MaTour,3,1,'DiaDiem',d.MaDiaDiem,'08:00','09:30',0,'Lịch trình mẫu: Dạo khu vực kinh thành, chụp ảnh buổi sáng và chọn quà lưu niệm ở khu vực cho phép.'
FROM Tour t JOIN DiaDiem d ON d.TenDiaDiem='Đại Nội Huế'
WHERE t.TenTour='Huế - Di sản cố đô 3 ngày 2 đêm' AND t.SoNgay>=3
AND NOT EXISTS(SELECT 1 FROM TourChiTiet c WHERE c.MaTour=t.MaTour AND c.NgayThu=3 AND c.ThuTu=1);
INSERT INTO TourChiTiet(MaTour,NgayThu,ThuTu,LoaiDiaDiem,MaDiaDiem,ThoiGianBatDau,ThoiGianKetThuc,ChiPhi,GhiChu)
SELECT t.MaTour,3,2,'DiaDiem',d.MaDiaDiem,'10:00','11:00',0,'Lịch trình mẫu: Tập trung tổng kết chuyến đi, kiểm tra hành lý; trở về Đà Nẵng theo lịch xe đã thống nhất.'
FROM Tour t JOIN DiaDiem d ON d.TenDiaDiem='Đại Nội Huế'
WHERE t.TenTour='Huế - Di sản cố đô 3 ngày 2 đêm' AND t.SoNgay>=3
AND NOT EXISTS(SELECT 1 FROM TourChiTiet c WHERE c.MaTour=t.MaTour AND c.NgayThu=3 AND c.ThuTu=2);
INSERT INTO TourChiTiet(MaTour,NgayThu,ThuTu,LoaiDiaDiem,MaDiaDiem,ThoiGianBatDau,ThoiGianKetThuc,ChiPhi,GhiChu)
SELECT t.MaTour,2,1,'DiaDiem',d.MaDiaDiem,'08:00','11:00',0,'Lịch trình mẫu: Khám phá cảnh quan núi lửa và bờ biển trên đảo theo tuyến đã thống nhất; mang nước uống và đồ chống nắng.'
FROM Tour t JOIN DiaDiem d ON d.TenDiaDiem='Đảo Lý Sơn'
WHERE t.TenTour='Lý Sơn đảo ngọc 3 ngày 2 đêm' AND t.SoNgay>=2
AND NOT EXISTS(SELECT 1 FROM TourChiTiet c WHERE c.MaTour=t.MaTour AND c.NgayThu=2 AND c.ThuTu=1);
INSERT INTO TourChiTiet(MaTour,NgayThu,ThuTu,LoaiDiaDiem,MaDiaDiem,ThoiGianBatDau,ThoiGianKetThuc,ChiPhi,GhiChu)
SELECT t.MaTour,2,2,'DiaDiem',d.MaDiaDiem,'14:00','16:30',0,'Lịch trình mẫu: Tìm hiểu ruộng tỏi và đời sống cư dân đảo, chụp ảnh cảnh biển; không đi sát mép đá khi sóng lớn.'
FROM Tour t JOIN DiaDiem d ON d.TenDiaDiem='Đảo Lý Sơn'
WHERE t.TenTour='Lý Sơn đảo ngọc 3 ngày 2 đêm' AND t.SoNgay>=2
AND NOT EXISTS(SELECT 1 FROM TourChiTiet c WHERE c.MaTour=t.MaTour AND c.NgayThu=2 AND c.ThuTu=2);
INSERT INTO TourChiTiet(MaTour,NgayThu,ThuTu,LoaiDiaDiem,MaDiaDiem,ThoiGianBatDau,ThoiGianKetThuc,ChiPhi,GhiChu)
SELECT t.MaTour,3,1,'DiaDiem',d.MaDiaDiem,'07:00','09:00',0,'Lịch trình mẫu: Ngắm biển buổi sáng, ăn sáng và chuẩn bị hành lý trước khi rời đảo.'
FROM Tour t JOIN DiaDiem d ON d.TenDiaDiem='Đảo Lý Sơn'
WHERE t.TenTour='Lý Sơn đảo ngọc 3 ngày 2 đêm' AND t.SoNgay>=3
AND NOT EXISTS(SELECT 1 FROM TourChiTiet c WHERE c.MaTour=t.MaTour AND c.NgayThu=3 AND c.ThuTu=1);
INSERT INTO TourChiTiet(MaTour,NgayThu,ThuTu,LoaiDiaDiem,MaDiaDiem,ThoiGianBatDau,ThoiGianKetThuc,ChiPhi,GhiChu)
SELECT t.MaTour,3,2,'DiaDiem',d.MaDiaDiem,'09:30','11:00',0,'Lịch trình mẫu: Tập trung tại điểm hẹn, di chuyển ra cảng theo giờ tàu đã xác nhận; lịch về có thể điều chỉnh theo thời tiết.'
FROM Tour t JOIN DiaDiem d ON d.TenDiaDiem='Đảo Lý Sơn'
WHERE t.TenTour='Lý Sơn đảo ngọc 3 ngày 2 đêm' AND t.SoNgay>=3
AND NOT EXISTS(SELECT 1 FROM TourChiTiet c WHERE c.MaTour=t.MaTour AND c.NgayThu=3 AND c.ThuTu=2);
INSERT INTO TourChiTiet(MaTour,NgayThu,ThuTu,LoaiDiaDiem,MaDiaDiem,ThoiGianBatDau,ThoiGianKetThuc,ChiPhi,GhiChu)
SELECT t.MaTour,1,1,'DiaDiem',d.MaDiaDiem,'14:00','16:00',0,'Lịch trình mẫu: Đến Đà Lạt, gửi hành lý rồi đi bộ ven hồ Xuân Hương để làm quen với thành phố; nghỉ chân và chụp ảnh.'
FROM Tour t JOIN DiaDiem d ON d.TenDiaDiem='Hồ Xuân Hương'
WHERE t.TenTour='Đà Lạt mộng mơ 3 ngày 2 đêm' AND t.SoNgay>=1
AND NOT EXISTS(SELECT 1 FROM TourChiTiet c WHERE c.MaTour=t.MaTour AND c.NgayThu=1 AND c.ThuTu=1);
INSERT INTO TourChiTiet(MaTour,NgayThu,ThuTu,LoaiDiaDiem,MaDiaDiem,ThoiGianBatDau,ThoiGianKetThuc,ChiPhi,GhiChu)
SELECT t.MaTour,1,2,'DiaDiem',d.MaDiaDiem,'16:30','18:00',0,'Lịch trình mẫu: Ngắm cảnh cuối chiều quanh hồ, nghe giới thiệu hành trình ngày tiếp theo; tự chọn bữa tối và về nơi lưu trú.'
FROM Tour t JOIN DiaDiem d ON d.TenDiaDiem='Hồ Xuân Hương'
WHERE t.TenTour='Đà Lạt mộng mơ 3 ngày 2 đêm' AND t.SoNgay>=1
AND NOT EXISTS(SELECT 1 FROM TourChiTiet c WHERE c.MaTour=t.MaTour AND c.NgayThu=1 AND c.ThuTu=2);
INSERT INTO TourChiTiet(MaTour,NgayThu,ThuTu,LoaiDiaDiem,MaDiaDiem,ThoiGianBatDau,ThoiGianKetThuc,ChiPhi,GhiChu)
SELECT t.MaTour,2,1,'DiaDiem',d.MaDiaDiem,'08:00','11:00',0,'Lịch trình mẫu: Tham quan các khu trưng bày hoa, tìm hiểu cách chăm sóc cây và chụp ảnh; không bước vào bồn hoa.'
FROM Tour t JOIN DiaDiem d ON d.TenDiaDiem='Vườn hoa Đà Lạt'
WHERE t.TenTour='Đà Lạt mộng mơ 3 ngày 2 đêm' AND t.SoNgay>=2
AND NOT EXISTS(SELECT 1 FROM TourChiTiet c WHERE c.MaTour=t.MaTour AND c.NgayThu=2 AND c.ThuTu=1);
INSERT INTO TourChiTiet(MaTour,NgayThu,ThuTu,LoaiDiaDiem,MaDiaDiem,ThoiGianBatDau,ThoiGianKetThuc,ChiPhi,GhiChu)
SELECT t.MaTour,2,2,'DiaDiem',d.MaDiaDiem,'14:00','16:00',0,'Lịch trình mẫu: Dạo ven hồ và nghỉ ngơi sau buổi tham quan; dành thời gian tự do khám phá khu trung tâm theo nhóm.'
FROM Tour t JOIN DiaDiem d ON d.TenDiaDiem='Hồ Xuân Hương'
WHERE t.TenTour='Đà Lạt mộng mơ 3 ngày 2 đêm' AND t.SoNgay>=2
AND NOT EXISTS(SELECT 1 FROM TourChiTiet c WHERE c.MaTour=t.MaTour AND c.NgayThu=2 AND c.ThuTu=2);
INSERT INTO TourChiTiet(MaTour,NgayThu,ThuTu,LoaiDiaDiem,MaDiaDiem,ThoiGianBatDau,ThoiGianKetThuc,ChiPhi,GhiChu)
SELECT t.MaTour,3,1,'DiaDiem',d.MaDiaDiem,'08:00','09:30',0,'Lịch trình mẫu: Chụp ảnh lưu niệm tại vườn hoa, dành thời gian chọn quà và nghỉ chân trước khi kết thúc chuyến đi.'
FROM Tour t JOIN DiaDiem d ON d.TenDiaDiem='Vườn hoa Đà Lạt'
WHERE t.TenTour='Đà Lạt mộng mơ 3 ngày 2 đêm' AND t.SoNgay>=3
AND NOT EXISTS(SELECT 1 FROM TourChiTiet c WHERE c.MaTour=t.MaTour AND c.NgayThu=3 AND c.ThuTu=1);
INSERT INTO TourChiTiet(MaTour,NgayThu,ThuTu,LoaiDiaDiem,MaDiaDiem,ThoiGianBatDau,ThoiGianKetThuc,ChiPhi,GhiChu)
SELECT t.MaTour,3,2,'DiaDiem',d.MaDiaDiem,'10:00','11:00',0,'Lịch trình mẫu: Tập trung tại điểm hẹn ven hồ, kiểm tra hành lý và lên xe trở về TP. HCM.'
FROM Tour t JOIN DiaDiem d ON d.TenDiaDiem='Hồ Xuân Hương'
WHERE t.TenTour='Đà Lạt mộng mơ 3 ngày 2 đêm' AND t.SoNgay>=3
AND NOT EXISTS(SELECT 1 FROM TourChiTiet c WHERE c.MaTour=t.MaTour AND c.NgayThu=3 AND c.ThuTu=2);
INSERT INTO TourChiTiet(MaTour,NgayThu,ThuTu,LoaiDiaDiem,MaDiaDiem,ThoiGianBatDau,ThoiGianKetThuc,ChiPhi,GhiChu)
SELECT t.MaTour,2,1,'DiaDiem',d.MaDiaDiem,'05:30','07:00',0,'Lịch trình mẫu: Lên thuyền theo hướng dẫn, quan sát hoạt động mua bán trên sông và tìm hiểu cách giới thiệu hàng hóa của thương hồ.'
FROM Tour t JOIN DiaDiem d ON d.TenDiaDiem='Chợ nổi Cái Răng'
WHERE t.TenTour='Cần Thơ miền Tây 2 ngày 1 đêm' AND t.SoNgay>=2
AND NOT EXISTS(SELECT 1 FROM TourChiTiet c WHERE c.MaTour=t.MaTour AND c.NgayThu=2 AND c.ThuTu=1);
INSERT INTO TourChiTiet(MaTour,NgayThu,ThuTu,LoaiDiaDiem,MaDiaDiem,ThoiGianBatDau,ThoiGianKetThuc,ChiPhi,GhiChu)
SELECT t.MaTour,2,2,'DiaDiem',d.MaDiaDiem,'07:30','09:00',0,'Lịch trình mẫu: Ăn sáng tự chọn trên hành trình, chụp ảnh sinh hoạt sông nước; về bến, lấy hành lý và trở về TP. HCM.'
FROM Tour t JOIN DiaDiem d ON d.TenDiaDiem='Chợ nổi Cái Răng'
WHERE t.TenTour='Cần Thơ miền Tây 2 ngày 1 đêm' AND t.SoNgay>=2
AND NOT EXISTS(SELECT 1 FROM TourChiTiet c WHERE c.MaTour=t.MaTour AND c.NgayThu=2 AND c.ThuTu=2);
INSERT INTO HinhAnh(MaTour,DuongDan,MoTa,ThuTu,Nguon,TacGia,GiayPhep,UrlGiayPhep)
SELECT o.MaTour,'/media/vietnam/ha-long.jpg','Vịnh Hạ Long, Quảng Ninh',(SELECT COALESCE(MAX(h.ThuTu),-1)+1 FROM HinhAnh h WHERE h.MaTour=o.MaTour),'https://commons.wikimedia.org/wiki/File:HaLongBay.JPG','No machine-readable author provided. AlfredBoc assumed (based on copyright claims).','Public domain',''
FROM Tour o WHERE o.TenTour='Hạ Long 2 ngày 1 đêm' AND NOT EXISTS(SELECT 1 FROM HinhAnh h WHERE h.MaTour=o.MaTour AND h.DuongDan='/media/vietnam/ha-long.jpg');
INSERT INTO HinhAnh(MaDiaDiem,DuongDan,MoTa,ThuTu,Nguon,TacGia,GiayPhep,UrlGiayPhep)
SELECT o.MaDiaDiem,'/media/vietnam/ha-long.jpg','Vịnh Hạ Long, Quảng Ninh',(SELECT COALESCE(MAX(h.ThuTu),-1)+1 FROM HinhAnh h WHERE h.MaDiaDiem=o.MaDiaDiem),'https://commons.wikimedia.org/wiki/File:HaLongBay.JPG','No machine-readable author provided. AlfredBoc assumed (based on copyright claims).','Public domain',''
FROM DiaDiem o WHERE o.TenDiaDiem='Vịnh Hạ Long' AND NOT EXISTS(SELECT 1 FROM HinhAnh h WHERE h.MaDiaDiem=o.MaDiaDiem AND h.DuongDan='/media/vietnam/ha-long.jpg');
INSERT INTO HinhAnh(MaKhachSan,DuongDan,MoTa,ThuTu,Nguon,TacGia,GiayPhep,UrlGiayPhep)
SELECT o.MaKhachSan,'/media/vietnam/ha-long.jpg','Vịnh Hạ Long, Quảng Ninh',(SELECT COALESCE(MAX(h.ThuTu),-1)+1 FROM HinhAnh h WHERE h.MaKhachSan=o.MaKhachSan),'https://commons.wikimedia.org/wiki/File:HaLongBay.JPG','No machine-readable author provided. AlfredBoc assumed (based on copyright claims).','Public domain',''
FROM KhachSan o WHERE o.TenKhachSan='Vinpearl Resort Hạ Long' AND NOT EXISTS(SELECT 1 FROM HinhAnh h WHERE h.MaKhachSan=o.MaKhachSan AND h.DuongDan='/media/vietnam/ha-long.jpg');
INSERT INTO HinhAnh(MaTour,DuongDan,MoTa,ThuTu,Nguon,TacGia,GiayPhep,UrlGiayPhep)
SELECT o.MaTour,'/media/vietnam/my-khe.jpg','Bãi biển Mỹ Khê, Đà Nẵng',(SELECT COALESCE(MAX(h.ThuTu),-1)+1 FROM HinhAnh h WHERE h.MaTour=o.MaTour),'https://commons.wikimedia.org/wiki/File:My_Khe_Beach_1.jpg','Christophe95','CC BY-SA 4.0','https://creativecommons.org/licenses/by-sa/4.0'
FROM Tour o WHERE o.TenTour='Đà Nẵng - Hội An 4 ngày 3 đêm' AND NOT EXISTS(SELECT 1 FROM HinhAnh h WHERE h.MaTour=o.MaTour AND h.DuongDan='/media/vietnam/my-khe.jpg');
INSERT INTO HinhAnh(MaDiaDiem,DuongDan,MoTa,ThuTu,Nguon,TacGia,GiayPhep,UrlGiayPhep)
SELECT o.MaDiaDiem,'/media/vietnam/my-khe.jpg','Bãi biển Mỹ Khê, Đà Nẵng',(SELECT COALESCE(MAX(h.ThuTu),-1)+1 FROM HinhAnh h WHERE h.MaDiaDiem=o.MaDiaDiem),'https://commons.wikimedia.org/wiki/File:My_Khe_Beach_1.jpg','Christophe95','CC BY-SA 4.0','https://creativecommons.org/licenses/by-sa/4.0'
FROM DiaDiem o WHERE o.TenDiaDiem='Biển Mỹ Khê' AND NOT EXISTS(SELECT 1 FROM HinhAnh h WHERE h.MaDiaDiem=o.MaDiaDiem AND h.DuongDan='/media/vietnam/my-khe.jpg');
INSERT INTO HinhAnh(MaTour,DuongDan,MoTa,ThuTu,Nguon,TacGia,GiayPhep,UrlGiayPhep)
SELECT o.MaTour,'/media/vietnam/cau-vang.jpg','Cầu Vàng, Bà Nà, Đà Nẵng',(SELECT COALESCE(MAX(h.ThuTu),-1)+1 FROM HinhAnh h WHERE h.MaTour=o.MaTour),'https://commons.wikimedia.org/wiki/File:Golden_Bridge,_Da_Nang_(I).jpg','This Photo was taken by Supanut Arunoprayote.

Feel free to use any of my images, but please mention me as the author and may send me a message.  (สามารถใช้ภาพได้อิสระ แต่กรุณาใส่เครดิตผู้ถ่ายและอาจส่งข้อความบอกกล่าวด้วย) 



Please do not upload an updated image here without consultation with the Author. The author would like to make corrections only at his own source. This ensures that the changes are preserved.Please if you think that any changes should be required, please inform the author.Otherwise you can upload a new image with a new name. Please use one of the templates derivative or extract.','CC BY 4.0','https://creativecommons.org/licenses/by/4.0'
FROM Tour o WHERE o.TenTour='Đà Nẵng - Hội An 4 ngày 3 đêm' AND NOT EXISTS(SELECT 1 FROM HinhAnh h WHERE h.MaTour=o.MaTour AND h.DuongDan='/media/vietnam/cau-vang.jpg');
INSERT INTO HinhAnh(MaDiaDiem,DuongDan,MoTa,ThuTu,Nguon,TacGia,GiayPhep,UrlGiayPhep)
SELECT o.MaDiaDiem,'/media/vietnam/cau-vang.jpg','Cầu Vàng, Bà Nà, Đà Nẵng',(SELECT COALESCE(MAX(h.ThuTu),-1)+1 FROM HinhAnh h WHERE h.MaDiaDiem=o.MaDiaDiem),'https://commons.wikimedia.org/wiki/File:Golden_Bridge,_Da_Nang_(I).jpg','This Photo was taken by Supanut Arunoprayote.

Feel free to use any of my images, but please mention me as the author and may send me a message.  (สามารถใช้ภาพได้อิสระ แต่กรุณาใส่เครดิตผู้ถ่ายและอาจส่งข้อความบอกกล่าวด้วย) 



Please do not upload an updated image here without consultation with the Author. The author would like to make corrections only at his own source. This ensures that the changes are preserved.Please if you think that any changes should be required, please inform the author.Otherwise you can upload a new image with a new name. Please use one of the templates derivative or extract.','CC BY 4.0','https://creativecommons.org/licenses/by/4.0'
FROM DiaDiem o WHERE o.TenDiaDiem='Cầu Vàng' AND NOT EXISTS(SELECT 1 FROM HinhAnh h WHERE h.MaDiaDiem=o.MaDiaDiem AND h.DuongDan='/media/vietnam/cau-vang.jpg');
INSERT INTO HinhAnh(MaTour,DuongDan,MoTa,ThuTu,Nguon,TacGia,GiayPhep,UrlGiayPhep)
SELECT o.MaTour,'/media/vietnam/hoi-an.jpg','Phố cổ Hội An bên sông Thu Bồn',(SELECT COALESCE(MAX(h.ThuTu),-1)+1 FROM HinhAnh h WHERE h.MaTour=o.MaTour),'https://commons.wikimedia.org/wiki/File:Hoi%27an_by_the_river.jpg','John Lian','CC BY-SA 4.0','https://creativecommons.org/licenses/by-sa/4.0'
FROM Tour o WHERE o.TenTour='Đà Nẵng - Hội An 4 ngày 3 đêm' AND NOT EXISTS(SELECT 1 FROM HinhAnh h WHERE h.MaTour=o.MaTour AND h.DuongDan='/media/vietnam/hoi-an.jpg');
INSERT INTO HinhAnh(MaDiaDiem,DuongDan,MoTa,ThuTu,Nguon,TacGia,GiayPhep,UrlGiayPhep)
SELECT o.MaDiaDiem,'/media/vietnam/hoi-an.jpg','Phố cổ Hội An bên sông Thu Bồn',(SELECT COALESCE(MAX(h.ThuTu),-1)+1 FROM HinhAnh h WHERE h.MaDiaDiem=o.MaDiaDiem),'https://commons.wikimedia.org/wiki/File:Hoi%27an_by_the_river.jpg','John Lian','CC BY-SA 4.0','https://creativecommons.org/licenses/by-sa/4.0'
FROM DiaDiem o WHERE o.TenDiaDiem='Phố cổ Hội An' AND NOT EXISTS(SELECT 1 FROM HinhAnh h WHERE h.MaDiaDiem=o.MaDiaDiem AND h.DuongDan='/media/vietnam/hoi-an.jpg');
INSERT INTO HinhAnh(MaKhachSan,DuongDan,MoTa,ThuTu,Nguon,TacGia,GiayPhep,UrlGiayPhep)
SELECT o.MaKhachSan,'/media/vietnam/hoi-an.jpg','Phố cổ Hội An bên sông Thu Bồn',(SELECT COALESCE(MAX(h.ThuTu),-1)+1 FROM HinhAnh h WHERE h.MaKhachSan=o.MaKhachSan),'https://commons.wikimedia.org/wiki/File:Hoi%27an_by_the_river.jpg','John Lian','CC BY-SA 4.0','https://creativecommons.org/licenses/by-sa/4.0'
FROM KhachSan o WHERE o.TenKhachSan='Hội An Riverside Resort' AND NOT EXISTS(SELECT 1 FROM HinhAnh h WHERE h.MaKhachSan=o.MaKhachSan AND h.DuongDan='/media/vietnam/hoi-an.jpg');
INSERT INTO HinhAnh(MaTour,DuongDan,MoTa,ThuTu,Nguon,TacGia,GiayPhep,UrlGiayPhep)
SELECT o.MaTour,'/media/vietnam/ma-pi-leng.jpg','Đèo Mã Pí Lèng, Hà Giang',(SELECT COALESCE(MAX(h.ThuTu),-1)+1 FROM HinhAnh h WHERE h.MaTour=o.MaTour),'https://commons.wikimedia.org/wiki/File:M%C3%A3_P%C3%AD_L%C3%A8ng_by_minhphuc_99kdd.jpg','minhphuc_99kdd','CC0','http://creativecommons.org/publicdomain/zero/1.0/deed.en'
FROM Tour o WHERE o.TenTour='Hà Giang Loop 4 ngày 3 đêm' AND NOT EXISTS(SELECT 1 FROM HinhAnh h WHERE h.MaTour=o.MaTour AND h.DuongDan='/media/vietnam/ma-pi-leng.jpg');
INSERT INTO HinhAnh(MaDiaDiem,DuongDan,MoTa,ThuTu,Nguon,TacGia,GiayPhep,UrlGiayPhep)
SELECT o.MaDiaDiem,'/media/vietnam/ma-pi-leng.jpg','Đèo Mã Pí Lèng, Hà Giang',(SELECT COALESCE(MAX(h.ThuTu),-1)+1 FROM HinhAnh h WHERE h.MaDiaDiem=o.MaDiaDiem),'https://commons.wikimedia.org/wiki/File:M%C3%A3_P%C3%AD_L%C3%A8ng_by_minhphuc_99kdd.jpg','minhphuc_99kdd','CC0','http://creativecommons.org/publicdomain/zero/1.0/deed.en'
FROM DiaDiem o WHERE o.TenDiaDiem='Đèo Mã Pí Lèng' AND NOT EXISTS(SELECT 1 FROM HinhAnh h WHERE h.MaDiaDiem=o.MaDiaDiem AND h.DuongDan='/media/vietnam/ma-pi-leng.jpg');
INSERT INTO HinhAnh(MaKhachSan,DuongDan,MoTa,ThuTu,Nguon,TacGia,GiayPhep,UrlGiayPhep)
SELECT o.MaKhachSan,'/media/vietnam/ma-pi-leng.jpg','Đèo Mã Pí Lèng, Hà Giang',(SELECT COALESCE(MAX(h.ThuTu),-1)+1 FROM HinhAnh h WHERE h.MaKhachSan=o.MaKhachSan),'https://commons.wikimedia.org/wiki/File:M%C3%A3_P%C3%AD_L%C3%A8ng_by_minhphuc_99kdd.jpg','minhphuc_99kdd','CC0','http://creativecommons.org/publicdomain/zero/1.0/deed.en'
FROM KhachSan o WHERE o.TenKhachSan='Laluna Homestay Hà Giang' AND NOT EXISTS(SELECT 1 FROM HinhAnh h WHERE h.MaKhachSan=o.MaKhachSan AND h.DuongDan='/media/vietnam/ma-pi-leng.jpg');
INSERT INTO HinhAnh(MaTour,DuongDan,MoTa,ThuTu,Nguon,TacGia,GiayPhep,UrlGiayPhep)
SELECT o.MaTour,'/media/vietnam/dong-van.jpg','Phố cổ Đồng Văn, Hà Giang',(SELECT COALESCE(MAX(h.ThuTu),-1)+1 FROM HinhAnh h WHERE h.MaTour=o.MaTour),'https://commons.wikimedia.org/wiki/File:Dong_Van_old_town.jpg','HuangWending18072009','CC0','http://creativecommons.org/publicdomain/zero/1.0/deed.en'
FROM Tour o WHERE o.TenTour='Hà Giang Loop 4 ngày 3 đêm' AND NOT EXISTS(SELECT 1 FROM HinhAnh h WHERE h.MaTour=o.MaTour AND h.DuongDan='/media/vietnam/dong-van.jpg');
INSERT INTO HinhAnh(MaDiaDiem,DuongDan,MoTa,ThuTu,Nguon,TacGia,GiayPhep,UrlGiayPhep)
SELECT o.MaDiaDiem,'/media/vietnam/dong-van.jpg','Phố cổ Đồng Văn, Hà Giang',(SELECT COALESCE(MAX(h.ThuTu),-1)+1 FROM HinhAnh h WHERE h.MaDiaDiem=o.MaDiaDiem),'https://commons.wikimedia.org/wiki/File:Dong_Van_old_town.jpg','HuangWending18072009','CC0','http://creativecommons.org/publicdomain/zero/1.0/deed.en'
FROM DiaDiem o WHERE o.TenDiaDiem='Phố cổ Đồng Văn' AND NOT EXISTS(SELECT 1 FROM HinhAnh h WHERE h.MaDiaDiem=o.MaDiaDiem AND h.DuongDan='/media/vietnam/dong-van.jpg');
INSERT INTO HinhAnh(MaTour,DuongDan,MoTa,ThuTu,Nguon,TacGia,GiayPhep,UrlGiayPhep)
SELECT o.MaTour,'/media/vietnam/ban-gioc.jpg','Thác Bản Giốc, Cao Bằng',(SELECT COALESCE(MAX(h.ThuTu),-1)+1 FROM HinhAnh h WHERE h.MaTour=o.MaTour),'https://commons.wikimedia.org/wiki/File:Ban_Gioc_Waterfall_-_Trung_Kanh_District_-_Cao_Bang_Province_-_Vietnam_-_01_(48119813303).jpg','Adam Jones from Kelowna, BC, Canada','CC BY-SA 2.0','https://creativecommons.org/licenses/by-sa/2.0'
FROM Tour o WHERE o.TenTour='Cao Bằng - Bản Giốc 3 ngày 2 đêm' AND NOT EXISTS(SELECT 1 FROM HinhAnh h WHERE h.MaTour=o.MaTour AND h.DuongDan='/media/vietnam/ban-gioc.jpg');
INSERT INTO HinhAnh(MaDiaDiem,DuongDan,MoTa,ThuTu,Nguon,TacGia,GiayPhep,UrlGiayPhep)
SELECT o.MaDiaDiem,'/media/vietnam/ban-gioc.jpg','Thác Bản Giốc, Cao Bằng',(SELECT COALESCE(MAX(h.ThuTu),-1)+1 FROM HinhAnh h WHERE h.MaDiaDiem=o.MaDiaDiem),'https://commons.wikimedia.org/wiki/File:Ban_Gioc_Waterfall_-_Trung_Kanh_District_-_Cao_Bang_Province_-_Vietnam_-_01_(48119813303).jpg','Adam Jones from Kelowna, BC, Canada','CC BY-SA 2.0','https://creativecommons.org/licenses/by-sa/2.0'
FROM DiaDiem o WHERE o.TenDiaDiem='Thác Bản Giốc' AND NOT EXISTS(SELECT 1 FROM HinhAnh h WHERE h.MaDiaDiem=o.MaDiaDiem AND h.DuongDan='/media/vietnam/ban-gioc.jpg');
INSERT INTO HinhAnh(MaTour,DuongDan,MoTa,ThuTu,Nguon,TacGia,GiayPhep,UrlGiayPhep)
SELECT o.MaTour,'/media/vietnam/dai-noi-hue.jpg','Ngọ Môn, Đại Nội Huế',(SELECT COALESCE(MAX(h.ThuTu),-1)+1 FROM HinhAnh h WHERE h.MaTour=o.MaTour),'https://commons.wikimedia.org/wiki/File:Main_gate_of_Imperial_palace_in_Hue_-_citadel_-_2011.jpg','Andrea Schaffer from Sydney, Australia','CC BY 2.0','https://creativecommons.org/licenses/by/2.0'
FROM Tour o WHERE o.TenTour='Huế - Di sản cố đô 3 ngày 2 đêm' AND NOT EXISTS(SELECT 1 FROM HinhAnh h WHERE h.MaTour=o.MaTour AND h.DuongDan='/media/vietnam/dai-noi-hue.jpg');
INSERT INTO HinhAnh(MaDiaDiem,DuongDan,MoTa,ThuTu,Nguon,TacGia,GiayPhep,UrlGiayPhep)
SELECT o.MaDiaDiem,'/media/vietnam/dai-noi-hue.jpg','Ngọ Môn, Đại Nội Huế',(SELECT COALESCE(MAX(h.ThuTu),-1)+1 FROM HinhAnh h WHERE h.MaDiaDiem=o.MaDiaDiem),'https://commons.wikimedia.org/wiki/File:Main_gate_of_Imperial_palace_in_Hue_-_citadel_-_2011.jpg','Andrea Schaffer from Sydney, Australia','CC BY 2.0','https://creativecommons.org/licenses/by/2.0'
FROM DiaDiem o WHERE o.TenDiaDiem='Đại Nội Huế' AND NOT EXISTS(SELECT 1 FROM HinhAnh h WHERE h.MaDiaDiem=o.MaDiaDiem AND h.DuongDan='/media/vietnam/dai-noi-hue.jpg');
INSERT INTO HinhAnh(MaTour,DuongDan,MoTa,ThuTu,Nguon,TacGia,GiayPhep,UrlGiayPhep)
SELECT o.MaTour,'/media/vietnam/ly-son.jpg','Ruộng tỏi trên đảo Lý Sơn, Quảng Ngãi',(SELECT COALESCE(MAX(h.ThuTu),-1)+1 FROM HinhAnh h WHERE h.MaTour=o.MaTour),'https://commons.wikimedia.org/wiki/File:Ly_Son_Islands_(14983179006).jpg','minhphuc_99kdd','Public domain',''
FROM Tour o WHERE o.TenTour='Lý Sơn đảo ngọc 3 ngày 2 đêm' AND NOT EXISTS(SELECT 1 FROM HinhAnh h WHERE h.MaTour=o.MaTour AND h.DuongDan='/media/vietnam/ly-son.jpg');
INSERT INTO HinhAnh(MaDiaDiem,DuongDan,MoTa,ThuTu,Nguon,TacGia,GiayPhep,UrlGiayPhep)
SELECT o.MaDiaDiem,'/media/vietnam/ly-son.jpg','Ruộng tỏi trên đảo Lý Sơn, Quảng Ngãi',(SELECT COALESCE(MAX(h.ThuTu),-1)+1 FROM HinhAnh h WHERE h.MaDiaDiem=o.MaDiaDiem),'https://commons.wikimedia.org/wiki/File:Ly_Son_Islands_(14983179006).jpg','minhphuc_99kdd','Public domain',''
FROM DiaDiem o WHERE o.TenDiaDiem='Đảo Lý Sơn' AND NOT EXISTS(SELECT 1 FROM HinhAnh h WHERE h.MaDiaDiem=o.MaDiaDiem AND h.DuongDan='/media/vietnam/ly-son.jpg');
INSERT INTO HinhAnh(MaTour,DuongDan,MoTa,ThuTu,Nguon,TacGia,GiayPhep,UrlGiayPhep)
SELECT o.MaTour,'/media/vietnam/vuon-hoa-da-lat.jpg','Vườn hoa Đà Lạt, Lâm Đồng',(SELECT COALESCE(MAX(h.ThuTu),-1)+1 FROM HinhAnh h WHERE h.MaTour=o.MaTour),'https://commons.wikimedia.org/wiki/File:Da_Lat_Flower_Park_1.jpg','hector garcia','CC BY-SA 2.0','https://creativecommons.org/licenses/by-sa/2.0'
FROM Tour o WHERE o.TenTour='Đà Lạt mộng mơ 3 ngày 2 đêm' AND NOT EXISTS(SELECT 1 FROM HinhAnh h WHERE h.MaTour=o.MaTour AND h.DuongDan='/media/vietnam/vuon-hoa-da-lat.jpg');
INSERT INTO HinhAnh(MaTour,DuongDan,MoTa,ThuTu,Nguon,TacGia,GiayPhep,UrlGiayPhep)
SELECT o.MaTour,'/media/vietnam/cai-rang.jpg','Chợ nổi Cái Răng, Cần Thơ',(SELECT COALESCE(MAX(h.ThuTu),-1)+1 FROM HinhAnh h WHERE h.MaTour=o.MaTour),'https://commons.wikimedia.org/wiki/File:Le_march%C3%A9_flottant_(Cai_Rang,_Vietnam)_(6642699407).jpg','Jean-Pierre Dalbéra from Paris, France','CC BY 2.0','https://creativecommons.org/licenses/by/2.0'
FROM Tour o WHERE o.TenTour='Cần Thơ miền Tây 2 ngày 1 đêm' AND NOT EXISTS(SELECT 1 FROM HinhAnh h WHERE h.MaTour=o.MaTour AND h.DuongDan='/media/vietnam/cai-rang.jpg');
INSERT INTO HinhAnh(MaDiaDiem,DuongDan,MoTa,ThuTu,Nguon,TacGia,GiayPhep,UrlGiayPhep)
SELECT o.MaDiaDiem,'/media/vietnam/cai-rang.jpg','Chợ nổi Cái Răng, Cần Thơ',(SELECT COALESCE(MAX(h.ThuTu),-1)+1 FROM HinhAnh h WHERE h.MaDiaDiem=o.MaDiaDiem),'https://commons.wikimedia.org/wiki/File:Le_march%C3%A9_flottant_(Cai_Rang,_Vietnam)_(6642699407).jpg','Jean-Pierre Dalbéra from Paris, France','CC BY 2.0','https://creativecommons.org/licenses/by/2.0'
FROM DiaDiem o WHERE o.TenDiaDiem='Chợ nổi Cái Răng' AND NOT EXISTS(SELECT 1 FROM HinhAnh h WHERE h.MaDiaDiem=o.MaDiaDiem AND h.DuongDan='/media/vietnam/cai-rang.jpg');
INSERT INTO HinhAnh(MaTour,DuongDan,MoTa,ThuTu,Nguon,TacGia,GiayPhep,UrlGiayPhep)
SELECT o.MaTour,'/media/vietnam/saigon-morin-hue.jpg','Mặt ngoài khách sạn Saigon Morin, Huế',(SELECT COALESCE(MAX(h.ThuTu),-1)+1 FROM HinhAnh h WHERE h.MaTour=o.MaTour),'https://commons.wikimedia.org/wiki/File:Hotel_Saigon_Morin,_Hue_(2024)_02.jpg','Chainwit.','CC BY 4.0','https://creativecommons.org/licenses/by/4.0'
FROM Tour o WHERE o.TenTour='Huế - Di sản cố đô 3 ngày 2 đêm' AND NOT EXISTS(SELECT 1 FROM HinhAnh h WHERE h.MaTour=o.MaTour AND h.DuongDan='/media/vietnam/saigon-morin-hue.jpg');
INSERT INTO HinhAnh(MaKhachSan,DuongDan,MoTa,ThuTu,Nguon,TacGia,GiayPhep,UrlGiayPhep)
SELECT o.MaKhachSan,'/media/vietnam/saigon-morin-hue.jpg','Mặt ngoài khách sạn Saigon Morin, Huế',(SELECT COALESCE(MAX(h.ThuTu),-1)+1 FROM HinhAnh h WHERE h.MaKhachSan=o.MaKhachSan),'https://commons.wikimedia.org/wiki/File:Hotel_Saigon_Morin,_Hue_(2024)_02.jpg','Chainwit.','CC BY 4.0','https://creativecommons.org/licenses/by/4.0'
FROM KhachSan o WHERE o.TenKhachSan='Saigon Morin Huế' AND NOT EXISTS(SELECT 1 FROM HinhAnh h WHERE h.MaKhachSan=o.MaKhachSan AND h.DuongDan='/media/vietnam/saigon-morin-hue.jpg');
INSERT INTO HinhAnh(MaTour,DuongDan,MoTa,ThuTu,Nguon,TacGia,GiayPhep,UrlGiayPhep)
SELECT o.MaTour,'/media/vietnam/ha-long-panorama.jpg','Toàn cảnh vịnh Hạ Long',(SELECT COALESCE(MAX(h.ThuTu),-1)+1 FROM HinhAnh h WHERE h.MaTour=o.MaTour),'https://commons.wikimedia.org/wiki/File:Halong_Bay_in_Vietnam.jpg','Thomas Hirsch / User:Ravn','CC BY-SA 3.0','http://creativecommons.org/licenses/by-sa/3.0/'
FROM Tour o WHERE o.TenTour='Hạ Long 2 ngày 1 đêm' AND NOT EXISTS(SELECT 1 FROM HinhAnh h WHERE h.MaTour=o.MaTour AND h.DuongDan='/media/vietnam/ha-long-panorama.jpg');
INSERT INTO HinhAnh(MaDiaDiem,DuongDan,MoTa,ThuTu,Nguon,TacGia,GiayPhep,UrlGiayPhep)
SELECT o.MaDiaDiem,'/media/vietnam/ha-long-panorama.jpg','Toàn cảnh vịnh Hạ Long',(SELECT COALESCE(MAX(h.ThuTu),-1)+1 FROM HinhAnh h WHERE h.MaDiaDiem=o.MaDiaDiem),'https://commons.wikimedia.org/wiki/File:Halong_Bay_in_Vietnam.jpg','Thomas Hirsch / User:Ravn','CC BY-SA 3.0','http://creativecommons.org/licenses/by-sa/3.0/'
FROM DiaDiem o WHERE o.TenDiaDiem='Vịnh Hạ Long' AND NOT EXISTS(SELECT 1 FROM HinhAnh h WHERE h.MaDiaDiem=o.MaDiaDiem AND h.DuongDan='/media/vietnam/ha-long-panorama.jpg');
INSERT INTO HinhAnh(MaTour,DuongDan,MoTa,ThuTu,Nguon,TacGia,GiayPhep,UrlGiayPhep)
SELECT o.MaTour,'/media/vietnam/ban-gioc-waterfall.jpg','Thác Bản Giốc — góc nhìn khác',(SELECT COALESCE(MAX(h.ThuTu),-1)+1 FROM HinhAnh h WHERE h.MaTour=o.MaTour),'https://commons.wikimedia.org/wiki/File:Ban_Gioc_-_Detian_Falls2.jpg','jankgo','CC BY 2.0','https://creativecommons.org/licenses/by/2.0'
FROM Tour o WHERE o.TenTour='Cao Bằng - Bản Giốc 3 ngày 2 đêm' AND NOT EXISTS(SELECT 1 FROM HinhAnh h WHERE h.MaTour=o.MaTour AND h.DuongDan='/media/vietnam/ban-gioc-waterfall.jpg');
INSERT INTO HinhAnh(MaDiaDiem,DuongDan,MoTa,ThuTu,Nguon,TacGia,GiayPhep,UrlGiayPhep)
SELECT o.MaDiaDiem,'/media/vietnam/ban-gioc-waterfall.jpg','Thác Bản Giốc — góc nhìn khác',(SELECT COALESCE(MAX(h.ThuTu),-1)+1 FROM HinhAnh h WHERE h.MaDiaDiem=o.MaDiaDiem),'https://commons.wikimedia.org/wiki/File:Ban_Gioc_-_Detian_Falls2.jpg','jankgo','CC BY 2.0','https://creativecommons.org/licenses/by/2.0'
FROM DiaDiem o WHERE o.TenDiaDiem='Thác Bản Giốc' AND NOT EXISTS(SELECT 1 FROM HinhAnh h WHERE h.MaDiaDiem=o.MaDiaDiem AND h.DuongDan='/media/vietnam/ban-gioc-waterfall.jpg');
INSERT INTO HinhAnh(MaDiaDiem,DuongDan,MoTa,ThuTu,Nguon,TacGia,GiayPhep,UrlGiayPhep)
SELECT o.MaDiaDiem,'/media/vietnam/hue-imperial-gate.jpg','Cổng thành trong Đại Nội Huế',(SELECT COALESCE(MAX(h.ThuTu),-1)+1 FROM HinhAnh h WHERE h.MaDiaDiem=o.MaDiaDiem),'https://commons.wikimedia.org/wiki/File:Gate_in_Imperial_City,_Hu%E1%BA%BF_(III).jpg','This Photo was taken by Supanut Arunoprayote.

Feel free to use any of my images, but please mention me as the author and may send me a message.  (สามารถใช้ภาพได้อิสระ แต่กรุณาใส่เครดิตผู้ถ่ายและอาจส่งข้อความบอกกล่าวด้วย) 



Please do not upload an updated image here without consultation with the Author. The author would like to make corrections only at his own source. This ensures that the changes are preserved.Please if you think that any changes should be required, please inform the author.Otherwise you can upload a new image with a new name. Please use one of the templates derivative or extract.','CC BY 4.0','https://creativecommons.org/licenses/by/4.0'
FROM DiaDiem o WHERE o.TenDiaDiem='Đại Nội Huế' AND NOT EXISTS(SELECT 1 FROM HinhAnh h WHERE h.MaDiaDiem=o.MaDiaDiem AND h.DuongDan='/media/vietnam/hue-imperial-gate.jpg');
INSERT INTO HinhAnh(MaTour,DuongDan,MoTa,ThuTu,Nguon,TacGia,GiayPhep,UrlGiayPhep)
SELECT o.MaTour,'/media/vietnam/ly-son-coast.jpg','Cảnh quan đảo Lý Sơn',(SELECT COALESCE(MAX(h.ThuTu),-1)+1 FROM HinhAnh h WHERE h.MaTour=o.MaTour),'https://commons.wikimedia.org/wiki/File:Ly_Son3.jpg','BertholdD','CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0'
FROM Tour o WHERE o.TenTour='Lý Sơn đảo ngọc 3 ngày 2 đêm' AND NOT EXISTS(SELECT 1 FROM HinhAnh h WHERE h.MaTour=o.MaTour AND h.DuongDan='/media/vietnam/ly-son-coast.jpg');
INSERT INTO HinhAnh(MaDiaDiem,DuongDan,MoTa,ThuTu,Nguon,TacGia,GiayPhep,UrlGiayPhep)
SELECT o.MaDiaDiem,'/media/vietnam/ly-son-coast.jpg','Cảnh quan đảo Lý Sơn',(SELECT COALESCE(MAX(h.ThuTu),-1)+1 FROM HinhAnh h WHERE h.MaDiaDiem=o.MaDiaDiem),'https://commons.wikimedia.org/wiki/File:Ly_Son3.jpg','BertholdD','CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0'
FROM DiaDiem o WHERE o.TenDiaDiem='Đảo Lý Sơn' AND NOT EXISTS(SELECT 1 FROM HinhAnh h WHERE h.MaDiaDiem=o.MaDiaDiem AND h.DuongDan='/media/vietnam/ly-son-coast.jpg');
INSERT INTO HinhAnh(MaTour,DuongDan,MoTa,ThuTu,Nguon,TacGia,GiayPhep,UrlGiayPhep)
SELECT o.MaTour,'/media/vietnam/da-lat-flower-garden.jpg','Không gian vườn hoa Đà Lạt',(SELECT COALESCE(MAX(h.ThuTu),-1)+1 FROM HinhAnh h WHERE h.MaTour=o.MaTour),'https://commons.wikimedia.org/wiki/File:Da_Lat_Flower_Park_2.jpg','nerdcoregirl','CC BY-SA 2.0','https://creativecommons.org/licenses/by-sa/2.0'
FROM Tour o WHERE o.TenTour='Đà Lạt mộng mơ 3 ngày 2 đêm' AND NOT EXISTS(SELECT 1 FROM HinhAnh h WHERE h.MaTour=o.MaTour AND h.DuongDan='/media/vietnam/da-lat-flower-garden.jpg');
INSERT INTO HinhAnh(MaTour,DuongDan,MoTa,ThuTu,Nguon,TacGia,GiayPhep,UrlGiayPhep)
SELECT o.MaTour,'/media/vietnam/cai-rang-boats.jpg','Thuyền tại chợ nổi Cái Răng',(SELECT COALESCE(MAX(h.ThuTu),-1)+1 FROM HinhAnh h WHERE h.MaTour=o.MaTour),'https://commons.wikimedia.org/wiki/File:Cai_Rang_Floating_Market_1.jpg','Christophe95','CC BY-SA 4.0','https://creativecommons.org/licenses/by-sa/4.0'
FROM Tour o WHERE o.TenTour='Cần Thơ miền Tây 2 ngày 1 đêm' AND NOT EXISTS(SELECT 1 FROM HinhAnh h WHERE h.MaTour=o.MaTour AND h.DuongDan='/media/vietnam/cai-rang-boats.jpg');
INSERT INTO HinhAnh(MaDiaDiem,DuongDan,MoTa,ThuTu,Nguon,TacGia,GiayPhep,UrlGiayPhep)
SELECT o.MaDiaDiem,'/media/vietnam/cai-rang-boats.jpg','Thuyền tại chợ nổi Cái Răng',(SELECT COALESCE(MAX(h.ThuTu),-1)+1 FROM HinhAnh h WHERE h.MaDiaDiem=o.MaDiaDiem),'https://commons.wikimedia.org/wiki/File:Cai_Rang_Floating_Market_1.jpg','Christophe95','CC BY-SA 4.0','https://creativecommons.org/licenses/by-sa/4.0'
FROM DiaDiem o WHERE o.TenDiaDiem='Chợ nổi Cái Răng' AND NOT EXISTS(SELECT 1 FROM HinhAnh h WHERE h.MaDiaDiem=o.MaDiaDiem AND h.DuongDan='/media/vietnam/cai-rang-boats.jpg');
INSERT INTO HinhAnh(MaTour,DuongDan,MoTa,ThuTu,Nguon,TacGia,GiayPhep,UrlGiayPhep)
SELECT o.MaTour,'/media/vietnam/xuan-huong-lake.jpg','Hồ Xuân Hương, Đà Lạt',(SELECT COALESCE(MAX(h.ThuTu),-1)+1 FROM HinhAnh h WHERE h.MaTour=o.MaTour),'https://commons.wikimedia.org/wiki/File:Da_Lat_-_Xuan_Huong_Lake.jpg','P. Hughes','CC BY 4.0','https://creativecommons.org/licenses/by/4.0'
FROM Tour o WHERE o.TenTour='Đà Lạt mộng mơ 3 ngày 2 đêm' AND NOT EXISTS(SELECT 1 FROM HinhAnh h WHERE h.MaTour=o.MaTour AND h.DuongDan='/media/vietnam/xuan-huong-lake.jpg');
INSERT INTO HinhAnh(MaTour,DuongDan,MoTa,ThuTu,Nguon,TacGia,GiayPhep,UrlGiayPhep)
SELECT o.MaTour,'/media/vietnam/xuan-huong-lakeside.jpg','Ven hồ Xuân Hương',(SELECT COALESCE(MAX(h.ThuTu),-1)+1 FROM HinhAnh h WHERE h.MaTour=o.MaTour),'https://commons.wikimedia.org/wiki/File:Xuan_Huong_Lake_08.jpg','Diane Selwyn','Public domain',''
FROM Tour o WHERE o.TenTour='Đà Lạt mộng mơ 3 ngày 2 đêm' AND NOT EXISTS(SELECT 1 FROM HinhAnh h WHERE h.MaTour=o.MaTour AND h.DuongDan='/media/vietnam/xuan-huong-lakeside.jpg');
INSERT INTO HinhAnh(MaDiaDiem,DuongDan,MoTa,ThuTu,Nguon,TacGia,GiayPhep,UrlGiayPhep)
SELECT o.MaDiaDiem,'/media/vietnam/vuon-hoa-da-lat.jpg','Vườn hoa Đà Lạt, Lâm Đồng',(SELECT COALESCE(MAX(h.ThuTu),-1)+1 FROM HinhAnh h WHERE h.MaDiaDiem=o.MaDiaDiem),'https://commons.wikimedia.org/wiki/File:Da_Lat_Flower_Park_1.jpg','hector garcia','CC BY-SA 2.0','https://creativecommons.org/licenses/by-sa/2.0'
FROM DiaDiem o WHERE o.TenDiaDiem='Vườn hoa Đà Lạt' AND NOT EXISTS(SELECT 1 FROM HinhAnh h WHERE h.MaDiaDiem=o.MaDiaDiem AND h.DuongDan='/media/vietnam/vuon-hoa-da-lat.jpg');
INSERT INTO HinhAnh(MaDiaDiem,DuongDan,MoTa,ThuTu,Nguon,TacGia,GiayPhep,UrlGiayPhep)
SELECT o.MaDiaDiem,'/media/vietnam/da-lat-flower-garden.jpg','Không gian vườn hoa Đà Lạt',(SELECT COALESCE(MAX(h.ThuTu),-1)+1 FROM HinhAnh h WHERE h.MaDiaDiem=o.MaDiaDiem),'https://commons.wikimedia.org/wiki/File:Da_Lat_Flower_Park_2.jpg','nerdcoregirl','CC BY-SA 2.0','https://creativecommons.org/licenses/by-sa/2.0'
FROM DiaDiem o WHERE o.TenDiaDiem='Vườn hoa Đà Lạt' AND NOT EXISTS(SELECT 1 FROM HinhAnh h WHERE h.MaDiaDiem=o.MaDiaDiem AND h.DuongDan='/media/vietnam/da-lat-flower-garden.jpg');
INSERT INTO HinhAnh(MaDiaDiem,DuongDan,MoTa,ThuTu,Nguon,TacGia,GiayPhep,UrlGiayPhep)
SELECT o.MaDiaDiem,'/media/vietnam/xuan-huong-lake.jpg','Hồ Xuân Hương, Đà Lạt',(SELECT COALESCE(MAX(h.ThuTu),-1)+1 FROM HinhAnh h WHERE h.MaDiaDiem=o.MaDiaDiem),'https://commons.wikimedia.org/wiki/File:Da_Lat_-_Xuan_Huong_Lake.jpg','P. Hughes','CC BY 4.0','https://creativecommons.org/licenses/by/4.0'
FROM DiaDiem o WHERE o.TenDiaDiem='Hồ Xuân Hương' AND NOT EXISTS(SELECT 1 FROM HinhAnh h WHERE h.MaDiaDiem=o.MaDiaDiem AND h.DuongDan='/media/vietnam/xuan-huong-lake.jpg');
INSERT INTO HinhAnh(MaDiaDiem,DuongDan,MoTa,ThuTu,Nguon,TacGia,GiayPhep,UrlGiayPhep)
SELECT o.MaDiaDiem,'/media/vietnam/xuan-huong-lakeside.jpg','Ven hồ Xuân Hương',(SELECT COALESCE(MAX(h.ThuTu),-1)+1 FROM HinhAnh h WHERE h.MaDiaDiem=o.MaDiaDiem),'https://commons.wikimedia.org/wiki/File:Xuan_Huong_Lake_08.jpg','Diane Selwyn','Public domain',''
FROM DiaDiem o WHERE o.TenDiaDiem='Hồ Xuân Hương' AND NOT EXISTS(SELECT 1 FROM HinhAnh h WHERE h.MaDiaDiem=o.MaDiaDiem AND h.DuongDan='/media/vietnam/xuan-huong-lakeside.jpg');
INSERT INTO HinhAnh(MaNhaHang,DuongDan,MoTa,ThuTu,Nguon,TacGia,GiayPhep,UrlGiayPhep)
SELECT o.MaNhaHang,'/media/vietnam/ha-long.jpg','Ảnh minh họa khu vực du lịch; không phải ảnh cơ sở nhà hàng.',(SELECT COALESCE(MAX(h.ThuTu),-1)+1 FROM HinhAnh h WHERE h.MaNhaHang=o.MaNhaHang),'https://commons.wikimedia.org/wiki/File:HaLongBay.JPG','No machine-readable author provided. AlfredBoc assumed (based on copyright claims).','Public domain',''
FROM NhaHang o WHERE o.TenNhaHang='Nhà hàng Đại Dương' AND NOT EXISTS(SELECT 1 FROM HinhAnh h WHERE h.MaNhaHang=o.MaNhaHang AND h.DuongDan='/media/vietnam/ha-long.jpg');
INSERT INTO HinhAnh(MaNhaHang,DuongDan,MoTa,ThuTu,Nguon,TacGia,GiayPhep,UrlGiayPhep)
SELECT o.MaNhaHang,'/media/vietnam/ha-long-panorama.jpg','Ảnh minh họa khu vực du lịch; không phải ảnh cơ sở nhà hàng.',(SELECT COALESCE(MAX(h.ThuTu),-1)+1 FROM HinhAnh h WHERE h.MaNhaHang=o.MaNhaHang),'https://commons.wikimedia.org/wiki/File:Halong_Bay_in_Vietnam.jpg','Thomas Hirsch / User:Ravn','CC BY-SA 3.0','http://creativecommons.org/licenses/by-sa/3.0/'
FROM NhaHang o WHERE o.TenNhaHang='Nhà hàng Đại Dương' AND NOT EXISTS(SELECT 1 FROM HinhAnh h WHERE h.MaNhaHang=o.MaNhaHang AND h.DuongDan='/media/vietnam/ha-long-panorama.jpg');
INSERT INTO HinhAnh(MaNhaHang,DuongDan,MoTa,ThuTu,Nguon,TacGia,GiayPhep,UrlGiayPhep)
SELECT o.MaNhaHang,'/media/vietnam/my-khe.jpg','Ảnh minh họa khu vực du lịch; không phải ảnh cơ sở nhà hàng.',(SELECT COALESCE(MAX(h.ThuTu),-1)+1 FROM HinhAnh h WHERE h.MaNhaHang=o.MaNhaHang),'https://commons.wikimedia.org/wiki/File:My_Khe_Beach_1.jpg','Christophe95','CC BY-SA 4.0','https://creativecommons.org/licenses/by-sa/4.0'
FROM NhaHang o WHERE o.TenNhaHang='Mì Quảng Bà Vị' AND NOT EXISTS(SELECT 1 FROM HinhAnh h WHERE h.MaNhaHang=o.MaNhaHang AND h.DuongDan='/media/vietnam/my-khe.jpg');
INSERT INTO HinhAnh(MaNhaHang,DuongDan,MoTa,ThuTu,Nguon,TacGia,GiayPhep,UrlGiayPhep)
SELECT o.MaNhaHang,'/media/vietnam/cau-vang.jpg','Ảnh minh họa khu vực du lịch; không phải ảnh cơ sở nhà hàng.',(SELECT COALESCE(MAX(h.ThuTu),-1)+1 FROM HinhAnh h WHERE h.MaNhaHang=o.MaNhaHang),'https://commons.wikimedia.org/wiki/File:Golden_Bridge,_Da_Nang_(I).jpg','This Photo was taken by Supanut Arunoprayote.

Feel free to use any of my images, but please mention me as the author and may send me a message.  (สามารถใช้ภาพได้อิสระ แต่กรุณาใส่เครดิตผู้ถ่ายและอาจส่งข้อความบอกกล่าวด้วย) 



Please do not upload an updated image here without consultation with the Author. The author would like to make corrections only at his own source. This ensures that the changes are preserved.Please if you think that any changes should be required, please inform the author.Otherwise you can upload a new image with a new name. Please use one of the templates derivative or extract.','CC BY 4.0','https://creativecommons.org/licenses/by/4.0'
FROM NhaHang o WHERE o.TenNhaHang='Mì Quảng Bà Vị' AND NOT EXISTS(SELECT 1 FROM HinhAnh h WHERE h.MaNhaHang=o.MaNhaHang AND h.DuongDan='/media/vietnam/cau-vang.jpg');
INSERT INTO HinhAnh(MaNhaHang,DuongDan,MoTa,ThuTu,Nguon,TacGia,GiayPhep,UrlGiayPhep)
SELECT o.MaNhaHang,'/media/vietnam/hoi-an.jpg','Ảnh minh họa khu vực du lịch; không phải ảnh cơ sở nhà hàng.',(SELECT COALESCE(MAX(h.ThuTu),-1)+1 FROM HinhAnh h WHERE h.MaNhaHang=o.MaNhaHang),'https://commons.wikimedia.org/wiki/File:Hoi%27an_by_the_river.jpg','John Lian','CC BY-SA 4.0','https://creativecommons.org/licenses/by-sa/4.0'
FROM NhaHang o WHERE o.TenNhaHang='Cao Lầu Phố Hội' AND NOT EXISTS(SELECT 1 FROM HinhAnh h WHERE h.MaNhaHang=o.MaNhaHang AND h.DuongDan='/media/vietnam/hoi-an.jpg');
INSERT INTO HinhAnh(MaNhaHang,DuongDan,MoTa,ThuTu,Nguon,TacGia,GiayPhep,UrlGiayPhep)
SELECT o.MaNhaHang,'/media/vietnam/cau-vang.jpg','Ảnh minh họa khu vực du lịch; không phải ảnh cơ sở nhà hàng.',(SELECT COALESCE(MAX(h.ThuTu),-1)+1 FROM HinhAnh h WHERE h.MaNhaHang=o.MaNhaHang),'https://commons.wikimedia.org/wiki/File:Golden_Bridge,_Da_Nang_(I).jpg','This Photo was taken by Supanut Arunoprayote.

Feel free to use any of my images, but please mention me as the author and may send me a message.  (สามารถใช้ภาพได้อิสระ แต่กรุณาใส่เครดิตผู้ถ่ายและอาจส่งข้อความบอกกล่าวด้วย) 



Please do not upload an updated image here without consultation with the Author. The author would like to make corrections only at his own source. This ensures that the changes are preserved.Please if you think that any changes should be required, please inform the author.Otherwise you can upload a new image with a new name. Please use one of the templates derivative or extract.','CC BY 4.0','https://creativecommons.org/licenses/by/4.0'
FROM NhaHang o WHERE o.TenNhaHang='Cao Lầu Phố Hội' AND NOT EXISTS(SELECT 1 FROM HinhAnh h WHERE h.MaNhaHang=o.MaNhaHang AND h.DuongDan='/media/vietnam/cau-vang.jpg');
INSERT INTO HinhAnh(MaNhaHang,DuongDan,MoTa,ThuTu,Nguon,TacGia,GiayPhep,UrlGiayPhep)
SELECT o.MaNhaHang,'/media/vietnam/dai-noi-hue.jpg','Ảnh minh họa khu vực du lịch; không phải ảnh cơ sở nhà hàng.',(SELECT COALESCE(MAX(h.ThuTu),-1)+1 FROM HinhAnh h WHERE h.MaNhaHang=o.MaNhaHang),'https://commons.wikimedia.org/wiki/File:Main_gate_of_Imperial_palace_in_Hue_-_citadel_-_2011.jpg','Andrea Schaffer from Sydney, Australia','CC BY 2.0','https://creativecommons.org/licenses/by/2.0'
FROM NhaHang o WHERE o.TenNhaHang='Bún Bò Huế Bà Ngoại' AND NOT EXISTS(SELECT 1 FROM HinhAnh h WHERE h.MaNhaHang=o.MaNhaHang AND h.DuongDan='/media/vietnam/dai-noi-hue.jpg');
INSERT INTO HinhAnh(MaNhaHang,DuongDan,MoTa,ThuTu,Nguon,TacGia,GiayPhep,UrlGiayPhep)
SELECT o.MaNhaHang,'/media/vietnam/hue-imperial-gate.jpg','Ảnh minh họa khu vực du lịch; không phải ảnh cơ sở nhà hàng.',(SELECT COALESCE(MAX(h.ThuTu),-1)+1 FROM HinhAnh h WHERE h.MaNhaHang=o.MaNhaHang),'https://commons.wikimedia.org/wiki/File:Gate_in_Imperial_City,_Hu%E1%BA%BF_(III).jpg','This Photo was taken by Supanut Arunoprayote.

Feel free to use any of my images, but please mention me as the author and may send me a message.  (สามารถใช้ภาพได้อิสระ แต่กรุณาใส่เครดิตผู้ถ่ายและอาจส่งข้อความบอกกล่าวด้วย) 



Please do not upload an updated image here without consultation with the Author. The author would like to make corrections only at his own source. This ensures that the changes are preserved.Please if you think that any changes should be required, please inform the author.Otherwise you can upload a new image with a new name. Please use one of the templates derivative or extract.','CC BY 4.0','https://creativecommons.org/licenses/by/4.0'
FROM NhaHang o WHERE o.TenNhaHang='Bún Bò Huế Bà Ngoại' AND NOT EXISTS(SELECT 1 FROM HinhAnh h WHERE h.MaNhaHang=o.MaNhaHang AND h.DuongDan='/media/vietnam/hue-imperial-gate.jpg');
INSERT INTO HinhAnh(MaNhaHang,DuongDan,MoTa,ThuTu,Nguon,TacGia,GiayPhep,UrlGiayPhep)
SELECT o.MaNhaHang,'/media/vietnam/ly-son.jpg','Ảnh minh họa khu vực du lịch; không phải ảnh cơ sở nhà hàng.',(SELECT COALESCE(MAX(h.ThuTu),-1)+1 FROM HinhAnh h WHERE h.MaNhaHang=o.MaNhaHang),'https://commons.wikimedia.org/wiki/File:Ly_Son_Islands_(14983179006).jpg','minhphuc_99kdd','Public domain',''
FROM NhaHang o WHERE o.TenNhaHang='Hải Sản Lý Sơn' AND NOT EXISTS(SELECT 1 FROM HinhAnh h WHERE h.MaNhaHang=o.MaNhaHang AND h.DuongDan='/media/vietnam/ly-son.jpg');
INSERT INTO HinhAnh(MaNhaHang,DuongDan,MoTa,ThuTu,Nguon,TacGia,GiayPhep,UrlGiayPhep)
SELECT o.MaNhaHang,'/media/vietnam/ly-son-coast.jpg','Ảnh minh họa khu vực du lịch; không phải ảnh cơ sở nhà hàng.',(SELECT COALESCE(MAX(h.ThuTu),-1)+1 FROM HinhAnh h WHERE h.MaNhaHang=o.MaNhaHang),'https://commons.wikimedia.org/wiki/File:Ly_Son3.jpg','BertholdD','CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0'
FROM NhaHang o WHERE o.TenNhaHang='Hải Sản Lý Sơn' AND NOT EXISTS(SELECT 1 FROM HinhAnh h WHERE h.MaNhaHang=o.MaNhaHang AND h.DuongDan='/media/vietnam/ly-son-coast.jpg');
INSERT INTO HinhAnh(MaKhachSan,DuongDan,MoTa,ThuTu,Nguon,TacGia,GiayPhep,UrlGiayPhep)
SELECT o.MaKhachSan,'/media/vietnam/ha-long.jpg','Ảnh tham khảo cảnh quan khu vực lưu trú; không phải ảnh phòng.',(SELECT COALESCE(MAX(h.ThuTu),-1)+1 FROM HinhAnh h WHERE h.MaKhachSan=o.MaKhachSan),'https://commons.wikimedia.org/wiki/File:HaLongBay.JPG','No machine-readable author provided. AlfredBoc assumed (based on copyright claims).','Public domain',''
FROM KhachSan o WHERE o.TenKhachSan='Vinpearl Resort Hạ Long' AND NOT EXISTS(SELECT 1 FROM HinhAnh h WHERE h.MaKhachSan=o.MaKhachSan AND h.DuongDan='/media/vietnam/ha-long.jpg');
INSERT INTO HinhAnh(MaKhachSan,DuongDan,MoTa,ThuTu,Nguon,TacGia,GiayPhep,UrlGiayPhep)
SELECT o.MaKhachSan,'/media/vietnam/ha-long-panorama.jpg','Ảnh tham khảo cảnh quan khu vực lưu trú; không phải ảnh phòng.',(SELECT COALESCE(MAX(h.ThuTu),-1)+1 FROM HinhAnh h WHERE h.MaKhachSan=o.MaKhachSan),'https://commons.wikimedia.org/wiki/File:Halong_Bay_in_Vietnam.jpg','Thomas Hirsch / User:Ravn','CC BY-SA 3.0','http://creativecommons.org/licenses/by-sa/3.0/'
FROM KhachSan o WHERE o.TenKhachSan='Vinpearl Resort Hạ Long' AND NOT EXISTS(SELECT 1 FROM HinhAnh h WHERE h.MaKhachSan=o.MaKhachSan AND h.DuongDan='/media/vietnam/ha-long-panorama.jpg');
INSERT INTO HinhAnh(MaKhachSan,DuongDan,MoTa,ThuTu,Nguon,TacGia,GiayPhep,UrlGiayPhep)
SELECT o.MaKhachSan,'/media/vietnam/my-khe.jpg','Ảnh tham khảo cảnh quan khu vực lưu trú; không phải ảnh phòng.',(SELECT COALESCE(MAX(h.ThuTu),-1)+1 FROM HinhAnh h WHERE h.MaKhachSan=o.MaKhachSan),'https://commons.wikimedia.org/wiki/File:My_Khe_Beach_1.jpg','Christophe95','CC BY-SA 4.0','https://creativecommons.org/licenses/by-sa/4.0'
FROM KhachSan o WHERE o.TenKhachSan='Mường Thanh Luxury Đà Nẵng' AND NOT EXISTS(SELECT 1 FROM HinhAnh h WHERE h.MaKhachSan=o.MaKhachSan AND h.DuongDan='/media/vietnam/my-khe.jpg');
INSERT INTO HinhAnh(MaKhachSan,DuongDan,MoTa,ThuTu,Nguon,TacGia,GiayPhep,UrlGiayPhep)
SELECT o.MaKhachSan,'/media/vietnam/cau-vang.jpg','Ảnh tham khảo cảnh quan khu vực lưu trú; không phải ảnh phòng.',(SELECT COALESCE(MAX(h.ThuTu),-1)+1 FROM HinhAnh h WHERE h.MaKhachSan=o.MaKhachSan),'https://commons.wikimedia.org/wiki/File:Golden_Bridge,_Da_Nang_(I).jpg','This Photo was taken by Supanut Arunoprayote.

Feel free to use any of my images, but please mention me as the author and may send me a message.  (สามารถใช้ภาพได้อิสระ แต่กรุณาใส่เครดิตผู้ถ่ายและอาจส่งข้อความบอกกล่าวด้วย) 



Please do not upload an updated image here without consultation with the Author. The author would like to make corrections only at his own source. This ensures that the changes are preserved.Please if you think that any changes should be required, please inform the author.Otherwise you can upload a new image with a new name. Please use one of the templates derivative or extract.','CC BY 4.0','https://creativecommons.org/licenses/by/4.0'
FROM KhachSan o WHERE o.TenKhachSan='Mường Thanh Luxury Đà Nẵng' AND NOT EXISTS(SELECT 1 FROM HinhAnh h WHERE h.MaKhachSan=o.MaKhachSan AND h.DuongDan='/media/vietnam/cau-vang.jpg');
INSERT INTO HinhAnh(MaKhachSan,DuongDan,MoTa,ThuTu,Nguon,TacGia,GiayPhep,UrlGiayPhep)
SELECT o.MaKhachSan,'/media/vietnam/hoi-an.jpg','Ảnh tham khảo cảnh quan khu vực lưu trú; không phải ảnh phòng.',(SELECT COALESCE(MAX(h.ThuTu),-1)+1 FROM HinhAnh h WHERE h.MaKhachSan=o.MaKhachSan),'https://commons.wikimedia.org/wiki/File:Hoi%27an_by_the_river.jpg','John Lian','CC BY-SA 4.0','https://creativecommons.org/licenses/by-sa/4.0'
FROM KhachSan o WHERE o.TenKhachSan='Hội An Riverside Resort' AND NOT EXISTS(SELECT 1 FROM HinhAnh h WHERE h.MaKhachSan=o.MaKhachSan AND h.DuongDan='/media/vietnam/hoi-an.jpg');
INSERT INTO HinhAnh(MaKhachSan,DuongDan,MoTa,ThuTu,Nguon,TacGia,GiayPhep,UrlGiayPhep)
SELECT o.MaKhachSan,'/media/vietnam/cau-vang.jpg','Ảnh tham khảo cảnh quan khu vực lưu trú; không phải ảnh phòng.',(SELECT COALESCE(MAX(h.ThuTu),-1)+1 FROM HinhAnh h WHERE h.MaKhachSan=o.MaKhachSan),'https://commons.wikimedia.org/wiki/File:Golden_Bridge,_Da_Nang_(I).jpg','This Photo was taken by Supanut Arunoprayote.

Feel free to use any of my images, but please mention me as the author and may send me a message.  (สามารถใช้ภาพได้อิสระ แต่กรุณาใส่เครดิตผู้ถ่ายและอาจส่งข้อความบอกกล่าวด้วย) 



Please do not upload an updated image here without consultation with the Author. The author would like to make corrections only at his own source. This ensures that the changes are preserved.Please if you think that any changes should be required, please inform the author.Otherwise you can upload a new image with a new name. Please use one of the templates derivative or extract.','CC BY 4.0','https://creativecommons.org/licenses/by/4.0'
FROM KhachSan o WHERE o.TenKhachSan='Hội An Riverside Resort' AND NOT EXISTS(SELECT 1 FROM HinhAnh h WHERE h.MaKhachSan=o.MaKhachSan AND h.DuongDan='/media/vietnam/cau-vang.jpg');
INSERT INTO HinhAnh(MaKhachSan,DuongDan,MoTa,ThuTu,Nguon,TacGia,GiayPhep,UrlGiayPhep)
SELECT o.MaKhachSan,'/media/vietnam/ma-pi-leng.jpg','Ảnh tham khảo cảnh quan khu vực lưu trú; không phải ảnh phòng.',(SELECT COALESCE(MAX(h.ThuTu),-1)+1 FROM HinhAnh h WHERE h.MaKhachSan=o.MaKhachSan),'https://commons.wikimedia.org/wiki/File:M%C3%A3_P%C3%AD_L%C3%A8ng_by_minhphuc_99kdd.jpg','minhphuc_99kdd','CC0','http://creativecommons.org/publicdomain/zero/1.0/deed.en'
FROM KhachSan o WHERE o.TenKhachSan='Laluna Homestay Hà Giang' AND NOT EXISTS(SELECT 1 FROM HinhAnh h WHERE h.MaKhachSan=o.MaKhachSan AND h.DuongDan='/media/vietnam/ma-pi-leng.jpg');
INSERT INTO HinhAnh(MaKhachSan,DuongDan,MoTa,ThuTu,Nguon,TacGia,GiayPhep,UrlGiayPhep)
SELECT o.MaKhachSan,'/media/vietnam/dong-van.jpg','Ảnh tham khảo cảnh quan khu vực lưu trú; không phải ảnh phòng.',(SELECT COALESCE(MAX(h.ThuTu),-1)+1 FROM HinhAnh h WHERE h.MaKhachSan=o.MaKhachSan),'https://commons.wikimedia.org/wiki/File:Dong_Van_old_town.jpg','HuangWending18072009','CC0','http://creativecommons.org/publicdomain/zero/1.0/deed.en'
FROM KhachSan o WHERE o.TenKhachSan='Laluna Homestay Hà Giang' AND NOT EXISTS(SELECT 1 FROM HinhAnh h WHERE h.MaKhachSan=o.MaKhachSan AND h.DuongDan='/media/vietnam/dong-van.jpg');
INSERT INTO HinhAnh(MaKhachSan,DuongDan,MoTa,ThuTu,Nguon,TacGia,GiayPhep,UrlGiayPhep)
SELECT o.MaKhachSan,'/media/vietnam/saigon-morin-hue.jpg','Ảnh tham khảo cảnh quan khu vực lưu trú; không phải ảnh phòng.',(SELECT COALESCE(MAX(h.ThuTu),-1)+1 FROM HinhAnh h WHERE h.MaKhachSan=o.MaKhachSan),'https://commons.wikimedia.org/wiki/File:Hotel_Saigon_Morin,_Hue_(2024)_02.jpg','Chainwit.','CC BY 4.0','https://creativecommons.org/licenses/by/4.0'
FROM KhachSan o WHERE o.TenKhachSan='Saigon Morin Huế' AND NOT EXISTS(SELECT 1 FROM HinhAnh h WHERE h.MaKhachSan=o.MaKhachSan AND h.DuongDan='/media/vietnam/saigon-morin-hue.jpg');
INSERT INTO HinhAnh(MaKhachSan,DuongDan,MoTa,ThuTu,Nguon,TacGia,GiayPhep,UrlGiayPhep)
SELECT o.MaKhachSan,'/media/vietnam/dai-noi-hue.jpg','Ảnh tham khảo cảnh quan khu vực lưu trú; không phải ảnh phòng.',(SELECT COALESCE(MAX(h.ThuTu),-1)+1 FROM HinhAnh h WHERE h.MaKhachSan=o.MaKhachSan),'https://commons.wikimedia.org/wiki/File:Main_gate_of_Imperial_palace_in_Hue_-_citadel_-_2011.jpg','Andrea Schaffer from Sydney, Australia','CC BY 2.0','https://creativecommons.org/licenses/by/2.0'
FROM KhachSan o WHERE o.TenKhachSan='Saigon Morin Huế' AND NOT EXISTS(SELECT 1 FROM HinhAnh h WHERE h.MaKhachSan=o.MaKhachSan AND h.DuongDan='/media/vietnam/dai-noi-hue.jpg');
-- END COMPLETION 20260916

COMMIT;

SELECT 'Đã tạo lại toàn bộ dữ liệu mẫu' AS KetQua;
SELECT 'Tour' AS Bang, COUNT(*) AS SoLuong FROM Tour
UNION ALL SELECT 'DiaDiem', COUNT(*) FROM DiaDiem
UNION ALL SELECT 'HinhAnh', COUNT(*) FROM HinhAnh
UNION ALL SELECT 'TourChiTiet', COUNT(*) FROM TourChiTiet
UNION ALL SELECT 'TourKhoiHanh', COUNT(*) FROM TourKhoiHanh;
