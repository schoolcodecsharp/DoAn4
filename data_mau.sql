-- ============================================================
-- SCRIPT CHÈN DỮ LIỆU MẪU – WebDuLich
-- Chạy sau khi đã tạo schema (CSDL.sql)
-- ============================================================

USE WebDuLich;

-- ─────────────────────────────────────────────
-- 1. VAI TRÒ
-- ─────────────────────────────────────────────
INSERT IGNORE INTO VaiTro (TenVaiTro, MoTa, TrangThai) VALUES
('Admin', 'Quản trị viên hệ thống', TRUE),
('User',  'Người dùng thông thường', TRUE);

-- ─────────────────────────────────────────────
-- 2. NGƯỜI DÙNG (mật khẩu = BCrypt của "123456")
-- ─────────────────────────────────────────────
INSERT IGNORE INTO NguoiDung (MaVaiTro, HoTen, Email, MatKhau, SoDienThoai, NgaySinh, GioiTinh, NgayTao, TrangThai) VALUES
(1, 'Nguyễn Văn Trường', 'admin@nvtdulich.vn',
 '$2a$11$K7OzO5fDPzgI7cF9NnLXf.HJI7RKmqT4nV5eEzJqY6BOkp8wAHs4i',
 '0901234567', '2000-01-15', 'Nam', NOW(), TRUE),

(2, 'Trần Thị Mai',      'mai.tran@gmail.com',
 '$2a$11$K7OzO5fDPzgI7cF9NnLXf.HJI7RKmqT4nV5eEzJqY6BOkp8wAHs4i',
 '0912345678', '1998-05-20', 'Nu',  NOW(), TRUE),

(2, 'Lê Minh Khoa',      'khoa.le@gmail.com',
 '$2a$11$K7OzO5fDPzgI7cF9NnLXf.HJI7RKmqT4nV5eEzJqY6BOkp8wAHs4i',
 '0923456789', '1995-09-10', 'Nam', NOW(), TRUE),

(2, 'Phạm Ngọc Hà',      'ha.pham@gmail.com',
 '$2a$11$K7OzO5fDPzgI7cF9NnLXf.HJI7RKmqT4nV5eEzJqY6BOkp8wAHs4i',
 '0934567890', '2001-03-25', 'Nu',  NOW(), TRUE),

(2, 'Hoàng Văn Bình',    'binh.hoang@gmail.com',
 '$2a$11$K7OzO5fDPzgI7cF9NnLXf.HJI7RKmqT4nV5eEzJqY6BOkp8wAHs4i',
 '0945678901', '1993-11-08', 'Nam', NOW(), TRUE);

-- ─────────────────────────────────────────────
-- 3. LOẠI ĐỊA ĐIỂM
-- ─────────────────────────────────────────────
INSERT IGNORE INTO LoaiDiaDiem (TenLoai, MoTa, TrangThai) VALUES
('Danh lam thắng cảnh', 'Các địa điểm thiên nhiên nổi tiếng', TRUE),
('Di tích lịch sử',     'Các di tích văn hóa lịch sử',       TRUE),
('Bãi biển',            'Các bãi biển đẹp',                   TRUE),
('Núi cao - Đèo',       'Địa điểm trekking, leo núi',         TRUE),
('Làng nghề - Phố cổ',  'Làng nghề truyền thống, phố cổ',    TRUE),
('Công viên - Vườn',    'Công viên, khu vui chơi',            TRUE);

-- ─────────────────────────────────────────────
-- 4. ĐỊA ĐIỂM
-- ─────────────────────────────────────────────
INSERT IGNORE INTO DiaDiem
  (MaLoai, TenDiaDiem, MoTa, DiaChi, TinhThanh, ViDo, KinhDo,
   GiaVe, GioMoCua, GioDongCua, ThoiGianThamQuan, DiemDanhGia, TrangThai, NgayTao)
VALUES
(1, 'Vịnh Hạ Long',
 'Di sản thiên nhiên thế giới với hàng nghìn hòn đảo đá vôi kỳ vĩ, vùng nước trong xanh huyền bí.',
 'TP. Hạ Long', 'Quảng Ninh', 20.9101, 107.1839,
 0, '06:00:00', '18:00:00', 480, 4.8, TRUE, NOW()),

(3, 'Biển Mỹ Khê',
 'Một trong những bãi biển đẹp nhất châu Á với bờ cát trắng mịn dài hơn 9km.',
 'Q. Sơn Trà', 'Đà Nẵng', 16.0544, 108.2534,
 0, '05:00:00', '22:00:00', 120, 4.6, TRUE, NOW()),

(2, 'Phố cổ Hội An',
 'Đô thị cổ được UNESCO công nhận, nổi tiếng với những chiếc đèn lồng rực rỡ và kiến trúc truyền thống.',
 'TP. Hội An', 'Quảng Nam', 15.8801, 108.3380,
 150000, '07:00:00', '21:00:00', 240, 4.9, TRUE, NOW()),

(4, 'Đèo Mã Pí Lèng',
 'Con đèo hiểm trở bậc nhất Việt Nam, nhìn xuống dòng sông Nho Quế xanh ngắt uốn lượn.',
 'Huyện Mèo Vạc', 'Hà Giang', 23.1833, 105.4333,
 0, '00:00:00', '23:59:00', 180, 4.9, TRUE, NOW()),

(5, 'Phố cổ Đồng Văn',
 'Khu phố cổ đặc trưng vùng cao nguyên đá với kiến trúc người Mông, Lô Lô độc đáo.',
 'Huyện Đồng Văn', 'Hà Giang', 23.2760, 105.3660,
 0, '07:00:00', '22:00:00', 180, 4.7, TRUE, NOW()),

(1, 'Thác Bản Giốc',
 'Thác nước xuyên quốc gia hùng vĩ nhất Đông Nam Á, nằm giữa núi rừng biên giới Cao Bằng.',
 'Huyện Trùng Khánh', 'Cao Bằng', 22.8550, 106.7080,
 100000, '07:00:00', '17:30:00', 180, 4.8, TRUE, NOW()),

(2, 'Đại Nội Huế',
 'Quần thể kiến trúc cung đình triều Nguyễn được UNESCO công nhận là di sản văn hóa thế giới.',
 'TP. Huế', 'Thừa Thiên Huế', 16.4698, 107.5796,
 250000, '07:00:00', '17:30:00', 240, 4.7, TRUE, NOW()),

(3, 'Đảo Lý Sơn',
 'Hòn đảo ngọc với phong cảnh núi lửa độc đáo, biển xanh trong và danh tiếng "Vương quốc tỏi".',
 'Huyện Lý Sơn', 'Quảng Ngãi', 15.3830, 109.1250,
 0, '06:00:00', '18:00:00', 360, 4.6, TRUE, NOW()),

(6, 'Vườn Hoa Đà Lạt',
 'Vườn hoa thành phố ngập tràn sắc màu với hàng trăm loài hoa đặc trưng xứ lạnh.',
 'TP. Đà Lạt', 'Lâm Đồng', 11.9404, 108.4583,
 120000, '07:30:00', '17:30:00', 120, 4.4, TRUE, NOW()),

(1, 'Chợ nổi Cái Răng',
 'Chợ nổi sầm uất nhất miền Tây, họp từ sáng sớm với hàng trăm ghe thuyền chở nông sản.',
 'Q. Cái Răng', 'Cần Thơ', 10.0140, 105.7550,
 200000, '05:00:00', '09:00:00', 120, 4.5, TRUE, NOW());

-- ─────────────────────────────────────────────
-- 5. NHÀ HÀNG
-- ─────────────────────────────────────────────
INSERT IGNORE INTO NhaHang
  (TenNhaHang, MoTa, DiaChi, TinhThanh, GiaMin, GiaMax, GioMoCua, GioDongCua, SoDienThoai, DiemDanhGia, TrangThai, NgayTao)
VALUES
('Nhà Hàng Đại Dương', 'Hải sản tươi sống Hạ Long, view nhìn ra vịnh',
 '12 Hạ Long, P.Bãi Cháy', 'Quảng Ninh', 200000, 800000, '10:00:00', '22:00:00', '0203111222', 4.5, TRUE, NOW()),

('Mì Quảng Bà Vị', 'Mì Quảng chính hiệu Đà Nẵng, bí quyết gia truyền 30 năm',
 '74 Đống Đa', 'Đà Nẵng', 40000, 80000, '06:30:00', '20:00:00', '0236222333', 4.7, TRUE, NOW()),

('Cao Lầu Phố Hội', 'Quán ăn cao lầu và các món đặc sản Hội An',
 '8 Trần Phú', 'Quảng Nam', 50000, 120000, '08:00:00', '21:30:00', '0235333444', 4.6, TRUE, NOW()),

('Bún Bò Huế Bà Ngoại', 'Bún bò Huế cay đúng vị với đầy đủ chân giò, huyết',
 '38 Lý Thường Kiệt', 'Thừa Thiên Huế', 35000, 60000, '06:00:00', '14:00:00', '0234444555', 4.8, TRUE, NOW()),

('Bánh Căn Đà Lạt', 'Bánh căn nóng hổi với trứng cút, mực, tôm',
 '35 Nguyễn Thái Học', 'Lâm Đồng', 30000, 60000, '15:00:00', '22:00:00', '0263555666', 4.6, TRUE, NOW()),

('Hải Sản Lý Sơn', 'Hải sản tươi sống ngay bến đảo: tôm hùm, bào ngư, cá thu',
 'Cảng An Vĩnh', 'Quảng Ngãi', 150000, 600000, '08:00:00', '20:00:00', '0255666777', 4.7, TRUE, NOW()),

('Phở Lý Quốc Sư', 'Phở bò Hà Nội chuẩn vị, nước dùng ninh 12 tiếng',
 '10 Lý Quốc Sư', 'Hà Nội', 60000, 100000, '06:00:00', '22:00:00', '0243777888', 4.8, TRUE, NOW()),

('Đặc Sản Miền Tây', 'Lẩu mắm, cá kho tộ, canh chua cá linh đặc sản Cần Thơ',
 '15 Hai Bà Trưng', 'Cần Thơ', 80000, 300000, '10:00:00', '22:00:00', '0292888999', 4.5, TRUE, NOW());

-- ─────────────────────────────────────────────
-- 6. KHÁCH SẠN
-- ─────────────────────────────────────────────
INSERT IGNORE INTO KhachSan
  (TenKhachSan, LoaiLuuTru, MoTa, DiaChi, TinhThanh, AnhDaiDien, GiaPhongMin, GiaPhongMax, SoDienThoai, DiemDanhGia, TrangThai, NgayTao)
VALUES
('Vinpearl Resort Hạ Long', 'Resort',
 'Resort 5 sao nằm trên đồi nhìn xuống vịnh Hạ Long, hồ bơi vô cực ấn tượng.',
 'Cẩm Phả', 'Quảng Ninh', '/images/Vinh-ha-long.jpg',
 2500000, 8000000, '0203100200', 4.8, TRUE, NOW()),

('Mường Thanh Luxury Đà Nẵng', 'Hotel',
 'Khách sạn 5 sao ngay trung tâm Đà Nẵng, view biển Mỹ Khê tuyệt đẹp.',
 '60 Võ Nguyên Giáp', 'Đà Nẵng', '/images/da-nang-my-khe.jpg',
 1200000, 4500000, '0236300400', 4.7, TRUE, NOW()),

('Hội An Riverside Resort', 'Resort',
 'Resort ven sông Thu Bồn yên tĩnh, thiết kế kiến trúc truyền thống Hội An.',
 '175 Cửa Đại', 'Quảng Nam', '/images/hoi-an.jpg',
 900000, 3500000, '0235400500', 4.6, TRUE, NOW()),

('Laluna Homestay Hà Giang', 'Homestay',
 'Homestay nhỏ xinh giữa núi rừng Hà Giang, view ruộng bậc thang ngoạn mục.',
 'Đường vào đèo Mã Pí Lèng', 'Hà Giang', '/images/ma-pi-leng.jpg',
 350000, 700000, '0219500600', 4.9, TRUE, NOW()),

('Saigon Morin Huế', 'Hotel',
 'Khách sạn lịch sử 4 sao bên bờ sông Hương, vận hành từ năm 1901.',
 '30 Lê Lợi', 'Thừa Thiên Huế', '/images/hue-truong-tien.jpg',
 800000, 2800000, '0234600700', 4.6, TRUE, NOW()),

('Đà Lạt Wonder Resort', 'Resort',
 'Resort giữa rừng thông Đà Lạt, không khí mát mẻ quanh năm.',
 'Hồ Tuyền Lâm', 'Lâm Đồng', NULL,
 700000, 2500000, '0263700800', 4.7, TRUE, NOW()),

('Ninh Kiều Riverside Hotel', 'Hotel',
 'Khách sạn view sông Hậu đẹp, gần chợ nổi Cái Răng 10 phút.',
 '2 Hai Bà Trưng', 'Cần Thơ', '/images/can-tho-ninh-kieu.jpg',
 600000, 1800000, '0292800900', 4.4, TRUE, NOW()),

('Bản Giốc Retreat', 'Homestay',
 'Homestay ngay cạnh thác Bản Giốc, view núi rừng biên giới hùng vĩ.',
 'Gần Thác Bản Giốc, Trùng Khánh', 'Cao Bằng', '/images/ban-gioc.png',
 400000, 900000, '0206900100', 4.8, TRUE, NOW());

-- ─────────────────────────────────────────────
-- 7. LOẠI PHÒNG
-- ─────────────────────────────────────────────
INSERT IGNORE INTO LoaiPhong (MaKhachSan, TenLoaiPhong, MoTa, SucChua, SoLuongPhong, GiaMoiDem, TrangThai) VALUES
-- Vinpearl Hạ Long (MaKhachSan=1)
(1, 'Phòng Deluxe View Vịnh', 'Phòng rộng 42m², ban công view vịnh Hạ Long', 2, 30, 2500000, TRUE),
(1, 'Suite Panorama',          'Suite cao cấp 80m², phòng khách riêng, view 180°', 2, 10, 5500000, TRUE),
(1, 'Villa Hướng Biển',        'Villa riêng 150m² với hồ bơi mini', 4, 5, 8000000, TRUE),
-- Mường Thanh Đà Nẵng (MaKhachSan=2)
(2, 'Phòng Superior',          'Phòng 32m², view thành phố hoặc biển', 2, 50, 1200000, TRUE),
(2, 'Phòng Deluxe Biển',       'Phòng 38m², ban công nhìn thẳng ra biển Mỹ Khê', 2, 40, 1800000, TRUE),
(2, 'Phòng Junior Suite',      'Suite 55m², phòng khách riêng, bathtub', 2, 15, 3000000, TRUE),
-- Hội An Riverside (MaKhachSan=3)
(3, 'Phòng Garden View',       'Phòng 28m², nhìn ra vườn nhiệt đới', 2, 20, 900000, TRUE),
(3, 'Bungalow Ven Sông',       'Bungalow độc lập 45m², sân riêng nhìn sông Thu Bồn', 2, 8, 2200000, TRUE),
-- Laluna Homestay Hà Giang (MaKhachSan=4)
(4, 'Phòng Đơn View Núi',      'Phòng nhỏ xinh 18m², cửa sổ nhìn núi rừng', 2, 6, 350000, TRUE),
(4, 'Phòng Đôi Truyền Thống',  'Phòng 25m², nội thất gỗ bản địa, view đồng ruộng', 2, 4, 550000, TRUE),
-- Saigon Morin Huế (MaKhachSan=5)
(5, 'Phòng Classic',           'Phòng phong cách Đông Dương 30m², sàn gỗ cổ điển', 2, 25, 800000, TRUE),
(5, 'Phòng Superior Sông Hương','Phòng 35m², ban công nhìn sông Hương', 2, 20, 1400000, TRUE),
-- Ninh Kiều Hotel Cần Thơ (MaKhachSan=7)
(7, 'Phòng Standard',          'Phòng 25m², tiện nghi đầy đủ', 2, 30, 600000, TRUE),
(7, 'Phòng Deluxe View Sông',  'Phòng 32m², view sông Hậu', 2, 20, 1100000, TRUE);

-- ─────────────────────────────────────────────
-- 8. TOUR
-- ─────────────────────────────────────────────
INSERT IGNORE INTO Tour
  (MaNguoiTao, TenTour, MoTa, DiemKhoiHanh, DiemDen, SoNgay, SoDem,
   GiaTour, GiaTourMin, GiaTourMax, AnhDaiDien, TrangThai, NgayTao)
VALUES
(1, 'Hạ Long Bay 2N1Đ Trải Nghiệm',
 'Khám phá vịnh Hạ Long trên du thuyền cao cấp. Tham quan hang Thiên Cung, Đầu Gỗ, chèo kayak, ngủ đêm trên tàu.',
 'Hà Nội', 'Hạ Long – Quảng Ninh', 2, 1,
 2900000, 2900000, 3200000, '/images/Vinh-ha-long.jpg', 'Active', NOW()),

(1, 'Đà Nẵng – Hội An – Bà Nà 4N3Đ',
 'Tour trọn gói khám phá miền Trung: tắm biển Mỹ Khê, cáp treo Bà Nà Hills, dạo phố cổ Hội An đêm đèn lồng.',
 'TP. HCM', 'Đà Nẵng – Quảng Nam', 4, 3,
 4500000, 4500000, 5200000, '/images/cau-vang.jpg', 'Active', NOW()),

(1, 'Hà Giang Loop 4N3Đ Xe Máy',
 'Chinh phục cung đường Hà Giang: đèo Mã Pí Lèng, cột cờ Lũng Cú, phố cổ Đồng Văn, thung lũng Sủng Là.',
 'Hà Nội', 'Hà Giang', 4, 3,
 2500000, 2500000, 3000000, '/images/ma-pi-leng.jpg', 'Active', NOW()),

(1, 'Cao Bằng – Thác Bản Giốc 3N2Đ',
 'Khám phá thác Bản Giốc hùng vĩ, động Ngườm Ngao, làng đá Khuổi Ky và văn hóa dân tộc vùng cao.',
 'Hà Nội', 'Cao Bằng', 3, 2,
 2200000, 2200000, 2800000, '/images/ban-gioc.png', 'Active', NOW()),

(1, 'Huế – Di Sản Cố Đô 3N2Đ',
 'Khám phá Đại Nội, chùa Thiên Mụ, lăng tẩm triều Nguyễn, thưởng thức ẩm thực cố đô.',
 'Đà Nẵng', 'Huế – Thừa Thiên Huế', 3, 2,
 1800000, 1800000, 2300000, '/images/hue-truong-tien.jpg', 'Active', NOW()),

(1, 'Lý Sơn Đảo Ngọc 3N2Đ',
 'Khám phá đảo Lý Sơn: Cổng Tò Vò, Hang Câu, núi Thới Lới, lặn ngắm san hô và thưởng thức hải sản tươi.',
 'Quảng Ngãi', 'Đảo Lý Sơn', 3, 2,
 2800000, 2800000, 3500000, '/images/ly-son.jpg', 'Active', NOW()),

(1, 'Đà Lạt Mộng Mơ 3N2Đ',
 'Thành phố ngàn hoa: vườn hoa, hồ Xuân Hương, nhà ga cổ, thác Datanla, cà phê vườn thông.',
 'TP. HCM', 'Đà Lạt – Lâm Đồng', 3, 2,
 1900000, 1900000, 2500000, NULL, 'Active', NOW()),

(1, 'Cần Thơ Miền Tây 2N1Đ',
 'Trải nghiệm chợ nổi Cái Răng, vườn cây ăn trái, đi xuồng kênh đào và ẩm thực sông nước miền Tây.',
 'TP. HCM', 'Cần Thơ', 2, 1,
 1500000, 1500000, 1900000, '/images/can-tho-ninh-kieu.jpg', 'Active', NOW());

-- ─────────────────────────────────────────────
-- 9. TOUR KHỞI HÀNH
-- ─────────────────────────────────────────────
INSERT IGNORE INTO TourKhoiHanh
  (MaTour, NgayKhoiHanh, NgayKetThuc, GiaApDung, SoCho, TrangThai)
VALUES
-- Tour Hạ Long (MaTour=1)
(1, '2026-10-05', '2026-10-06', 2900000, 20, 'Active'),
(1, '2026-10-12', '2026-10-13', 2900000, 20, 'Active'),
(1, '2026-10-19', '2026-10-20', 3100000, 20, 'Active'),
(1, '2026-11-02', '2026-11-03', 3200000, 20, 'Active'),
-- Tour Đà Nẵng (MaTour=2)
(2, '2026-10-08', '2026-10-11', 4500000, 25, 'Active'),
(2, '2026-10-22', '2026-10-25', 4800000, 25, 'Active'),
(2, '2026-11-05', '2026-11-08', 5200000, 25, 'Active'),
-- Tour Hà Giang (MaTour=3)
(3, '2026-10-10', '2026-10-13', 2500000, 10, 'Active'),
(3, '2026-10-24', '2026-10-27', 2700000, 10, 'Active'),
(3, '2026-11-07', '2026-11-10', 3000000, 10, 'Active'),
-- Tour Cao Bằng (MaTour=4)
(4, '2026-10-15', '2026-10-17', 2200000, 15, 'Active'),
(4, '2026-10-29', '2026-10-31', 2500000, 15, 'Active'),
-- Tour Huế (MaTour=5)
(5, '2026-10-10', '2026-10-12', 1800000, 20, 'Active'),
(5, '2026-10-24', '2026-10-26', 2000000, 20, 'Active'),
-- Tour Lý Sơn (MaTour=6)
(6, '2026-10-17', '2026-10-19', 2800000, 12, 'Active'),
(6, '2026-10-31', '2026-11-02', 3000000, 12, 'Active'),
-- Tour Đà Lạt (MaTour=7)
(7, '2026-10-11', '2026-10-13', 1900000, 20, 'Active'),
(7, '2026-10-25', '2026-10-27', 2100000, 20, 'Active'),
-- Tour Cần Thơ (MaTour=8)
(8, '2026-10-04', '2026-10-05', 1500000, 25, 'Active'),
(8, '2026-10-11', '2026-10-12', 1500000, 25, 'Active'),
(8, '2026-10-18', '2026-10-19', 1700000, 25, 'Active');

-- ─────────────────────────────────────────────
-- 10. TOUR CHI TIẾT (lịch trình từng ngày)
-- ─────────────────────────────────────────────
INSERT IGNORE INTO TourChiTiet (MaTour, SoNgay, TieuDe, MoTa, SapXep) VALUES
-- Tour Hạ Long (MaTour=1)
(1, 1, 'Xuất phát Hà Nội – Lên tàu', 'Đón tại Hà Nội, di chuyển đến cảng Tuần Châu. Làm thủ tục, lên tàu, check-in cabin. Tham quan hang Thiên Cung, Đầu Gỗ. Ăn trưa và tối trên tàu. Thưởng thức sunset trên boong.', 1),
(1, 2, 'Chèo Kayak – Về Hà Nội', 'Sáng sớm tập Thái Cực Quyền trên boong. Chèo kayak khám phá hang tối. Ăn sáng, trả phòng. Về Hà Nội khoảng 16h.', 2),
-- Tour Đà Nẵng (MaTour=2)
(2, 1, 'Bay Đà Nẵng – Biển Mỹ Khê', 'Đón sân bay, nhận phòng khách sạn. Tắm biển Mỹ Khê. Dạo cầu Rồng, cầu Tình Yêu buổi tối.', 1),
(2, 2, 'Bà Nà Hills – Cầu Vàng', 'Cáp treo lên Bà Nà Hills. Tham quan Cầu Vàng, Làng Pháp, Fantasy Park. Về Đà Nẵng.', 2),
(2, 3, 'Phố cổ Hội An', 'Di chuyển Hội An. Tham quan phố cổ, chùa Cầu. Mua sắm đèn lồng. Ngắm Hội An về đêm.', 3),
(2, 4, 'Tự do – Bay về', 'Buổi sáng tự do. Ra sân bay, bay về TP.HCM.', 4),
-- Tour Hà Giang (MaTour=3)
(3, 1, 'Hà Nội – Hà Giang', 'Xuất phát tối từ Hà Nội, xe giường nằm đến Hà Giang sáng hôm sau.', 1),
(3, 2, 'Mã Pí Lèng – Đồng Văn', 'Thuê xe máy, chinh phục đèo Mã Pí Lèng. Ngắm sông Nho Quế. Đến phố cổ Đồng Văn.', 2),
(3, 3, 'Lũng Cú – Sủng Là', 'Thăm cột cờ Lũng Cú. Khám phá thung lũng Sủng Là. Về Hà Giang nghỉ đêm.', 3),
(3, 4, 'Về Hà Nội', 'Tự do buổi sáng. Xe về Hà Nội chiều tối.', 4);

-- ─────────────────────────────────────────────
-- 11. MÃ GIẢM GIÁ
-- ─────────────────────────────────────────────
INSERT IGNORE INTO MaGiamGia
  (TenMa, MoTa, LoaiGiam, GiaTriGiam, GiamToiDa, DonHangToiThieu,
   SoLuong, SoLuongDaDung, NgayBatDau, NgayKetThuc, TrangThai)
VALUES
('WELCOME10', 'Giảm 10% cho khách hàng mới', 'PhanTram', 10, 500000, 1000000,
 100, 0, '2026-09-01', '2026-12-31', TRUE),

('HALONG200', 'Giảm 200K tour Hạ Long', 'SoTien', 200000, NULL, 2000000,
 50, 3, '2026-09-01', '2026-11-30', TRUE),

('DANANG500', 'Giảm 500K tour Đà Nẵng', 'SoTien', 500000, NULL, 4000000,
 30, 5, '2026-09-01', '2026-11-30', TRUE),

('HOLIDAY15', 'Ưu đãi lễ 30/4 – giảm 15%', 'PhanTram', 15, 1000000, 2000000,
 200, 0, '2026-04-25', '2026-05-02', FALSE),

('SUMMER20', 'Ưu đãi hè – giảm 20%', 'PhanTram', 20, 2000000, 3000000,
 150, 12, '2026-06-01', '2026-08-31', FALSE),

('MUADONG50', 'Giảm 50K mùa đông', 'SoTien', 50000, NULL, 500000,
 500, 0, '2026-11-01', '2027-01-31', TRUE);

-- ─────────────────────────────────────────────
-- 12. ĐÁNH GIÁ MẪU
-- ─────────────────────────────────────────────
INSERT IGNORE INTO DanhGia (MaNguoiDung, MaTour, SoSao, NoiDung, NgayDanhGia) VALUES
(2, 1, 5, 'Tour Hạ Long tuyệt vời! Tàu đẹp, hướng dẫn viên nhiệt tình. Nhất định sẽ quay lại!', NOW()),
(3, 1, 4, 'Trải nghiệm tốt, thức ăn ngon. Chỉ hơi đông khách một chút.', NOW()),
(4, 2, 5, 'Tour Đà Nẵng rất worth it! Bà Nà Hills và Hội An đều rất đẹp.', NOW()),
(5, 2, 5, 'Cầu Vàng thực sự ấn tượng. Ảnh đẹp lắm, guide tốt bụng.', NOW()),
(2, 3, 5, 'Hà Giang Loop là trải nghiệm đáng nhớ nhất cuộc đời! Cảnh đẹp không tả được.', NOW()),
(3, 5, 4, 'Huế cổ kính và đầy ắp lịch sử. Bún bò Huế ăn là nghiện.', NOW());

INSERT IGNORE INTO DanhGia (MaNguoiDung, MaDiaDiem, SoSao, NoiDung, NgayDanhGia) VALUES
(2, 1, 5, 'Vịnh Hạ Long đẹp hơn trong ảnh nhiều! Một lần trong đời phải đến.', NOW()),
(3, 3, 5, 'Phố cổ Hội An về đêm thơ mộng vô cùng. Đèn lồng lung linh quá!', NOW()),
(4, 2, 4, 'Biển Mỹ Khê nước trong xanh, sóng vừa phải, rất dễ bơi.', NOW()),
(5, 4, 5, 'Mã Pí Lèng đẹp đến nghẹt thở! Sông Nho Quế xanh tuyệt!', NOW());

-- ─────────────────────────────────────────────
-- 13. YÊU THÍCH MẪU
-- ─────────────────────────────────────────────
INSERT IGNORE INTO YeuThich (MaNguoiDung, MaTour, NgayThem) VALUES
(2, 1, NOW()), (2, 2, NOW()), (2, 6, NOW()),
(3, 1, NOW()), (3, 3, NOW()),
(4, 2, NOW()), (4, 7, NOW()),
(5, 5, NOW()), (5, 8, NOW());

-- ─────────────────────────────────────────────
-- 14. CHUYẾN ĐI MẪU
-- ─────────────────────────────────────────────
INSERT IGNORE INTO ChuyenDi
  (MaNguoiTao, TenChuyenDi, DiemKhoiHanh, DiemDen, NgayBatDau, NgayKetThuc,
   SoNguoi, NganSach, TrangThai, NgayTao)
VALUES
(2, 'Hành trình Hạ Long cùng gia đình', 'Hà Nội', 'Quảng Ninh',
 '2026-10-12', '2026-10-14', 4, 15000000, 'Active', NOW()),
(3, 'Khám phá miền Trung với bạn bè', 'Hà Nội', 'Đà Nẵng – Hội An – Huế',
 '2026-11-05', '2026-11-10', 3, 20000000, 'Planning', NOW()),
(4, 'Trekking Hà Giang', 'TP. HCM', 'Hà Giang',
 '2026-10-24', '2026-10-27', 2, 12000000, 'Planning', NOW());

-- ─────────────────────────────────────────────
-- 15. THÀNH VIÊN CHUYẾN ĐI
-- ─────────────────────────────────────────────
INSERT IGNORE INTO ThanhVienChuyenDi (MaChuyenDi, MaNguoiDung, VaiTro, TrangThai, NgayTham) VALUES
(1, 2, 'Owner',  'Accepted', NOW()),
(1, 3, 'Member', 'Accepted', NOW()),
(2, 3, 'Owner',  'Accepted', NOW()),
(2, 4, 'Member', 'Pending',  NOW()),
(3, 4, 'Owner',  'Accepted', NOW()),
(3, 5, 'Member', 'Accepted', NOW());

-- ─────────────────────────────────────────────
-- 16. LỊCH TRÌNH CHI TIẾT
-- ─────────────────────────────────────────────
INSERT IGNORE INTO LichTrinh (MaChuyenDi, NgayThu, TieuDe, NgayTao) VALUES
(1, 1, 'Ngày 1 – Xuất phát Hà Nội', NOW()),
(1, 2, 'Ngày 2 – Khám phá Hạ Long', NOW()),
(1, 3, 'Ngày 3 – Về Hà Nội', NOW()),
(2, 1, 'Ngày 1 – Đà Nẵng', NOW()),
(2, 2, 'Ngày 2 – Bà Nà Hills', NOW());

INSERT IGNORE INTO LichTrinhChiTiet
  (MaLichTrinh, LoaiDiaDiem, MaDoiTuong, TenDiaDiem, ThoiGianDen, ThoiGianRoi, ChiPhi, GhiChu, SapXep)
VALUES
(1, 'DiaDiem', 1, 'Vịnh Hạ Long', '09:00:00', '17:00:00', 0, 'Tour tàu ghép', 1),
(2, 'NhaHang', 1, 'Nhà Hàng Đại Dương', '12:00:00', '13:00:00', 300000, 'Ăn trưa hải sản', 1),
(3, 'DiaDiem', 1, 'Vịnh Hạ Long', '08:00:00', '11:00:00', 0, 'Chèo kayak', 1),
(4, 'DiaDiem', 2, 'Biển Mỹ Khê', '08:00:00', '11:00:00', 0, 'Tắm biển buổi sáng', 1),
(4, 'NhaHang', 2, 'Mì Quảng Bà Vị', '12:00:00', '13:00:00', 60000, 'Ăn trưa đặc sản', 2),
(5, 'DiaDiem', 3, 'Phố cổ Hội An', '08:00:00', '17:00:00', 150000, 'Mua vé tham quan phố cổ', 1);

-- ─────────────────────────────────────────────
-- 17. CHI PHÍ CHUYẾN ĐI
-- ─────────────────────────────────────────────
INSERT IGNORE INTO ChiPhi (MaChuyenDi, MaNguoiTao, TenChiPhi, SoTien, LoaiChiPhi, NgayChiTieu, GhiChu) VALUES
(1, 2, 'Vé tàu Hà Nội – Hạ Long', 400000, 'DiChuyen', '2026-10-12', 'Cả đoàn 4 người'),
(1, 2, 'Tour tàu du thuyền', 2900000, 'Tour', '2026-10-12', 'Mỗi người 2.9tr'),
(1, 3, 'Ăn tối hải sản', 800000, 'AnUong', '2026-10-12', 'Chia đều 4 người'),
(2, 3, 'Vé máy bay Hà Nội – Đà Nẵng', 2400000, 'DiChuyen', '2026-11-05', '3 vé khứ hồi'),
(3, 4, 'Thuê xe máy 3 ngày', 900000, 'DiChuyen', '2026-10-24', '2 xe × 3 ngày');

SELECT 'Chèn dữ liệu mẫu hoàn tất!' AS KetQua;
SELECT COUNT(*) AS 'Số NguoiDung' FROM NguoiDung;
SELECT COUNT(*) AS 'Số DiaDiem'   FROM DiaDiem;
SELECT COUNT(*) AS 'Số NhaHang'   FROM NhaHang;
SELECT COUNT(*) AS 'Số KhachSan'  FROM KhachSan;
SELECT COUNT(*) AS 'Số Tour'      FROM Tour;
SELECT COUNT(*) AS 'Số TourKhoiHanh' FROM TourKhoiHanh;
SELECT COUNT(*) AS 'Số MaGiamGia' FROM MaGiamGia;
