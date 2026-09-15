USE WebDuLich;

-- TourKhoiHanh: ko co NgayKetThuc, co SoChoToiDa thay SoCho, TrangThai la OpenForBooking
INSERT IGNORE INTO TourKhoiHanh (MaTour, NgayKhoiHanh, SoChoToiDa, GiaApDung, TrangThai) VALUES
(1, '2026-10-05', 20, 2900000, 'OpenForBooking'),
(1, '2026-10-12', 20, 2900000, 'OpenForBooking'),
(1, '2026-10-19', 20, 3100000, 'OpenForBooking'),
(1, '2026-11-02', 20, 3200000, 'OpenForBooking'),
(2, '2026-10-08', 25, 4500000, 'OpenForBooking'),
(2, '2026-10-22', 25, 4800000, 'OpenForBooking'),
(2, '2026-11-05', 25, 5200000, 'OpenForBooking'),
(3, '2026-10-10', 10, 2500000, 'OpenForBooking'),
(3, '2026-10-24', 10, 2700000, 'OpenForBooking'),
(3, '2026-11-07', 10, 3000000, 'OpenForBooking'),
(4, '2026-10-15', 15, 2200000, 'OpenForBooking'),
(4, '2026-10-29', 15, 2500000, 'OpenForBooking'),
(5, '2026-10-10', 20, 1800000, 'OpenForBooking'),
(5, '2026-10-24', 20, 2000000, 'OpenForBooking'),
(6, '2026-10-17', 12, 2800000, 'OpenForBooking'),
(6, '2026-10-31', 12, 3000000, 'OpenForBooking'),
(7, '2026-10-11', 20, 1900000, 'OpenForBooking'),
(7, '2026-10-25', 20, 2100000, 'OpenForBooking'),
(8, '2026-10-04', 25, 1500000, 'OpenForBooking'),
(8, '2026-10-11', 25, 1500000, 'OpenForBooking'),
(8, '2026-10-18', 25, 1700000, 'OpenForBooking');

-- LichTrinh: co Ngay (date), ko co NgayTao 
INSERT IGNORE INTO LichTrinh (MaChuyenDi, NgayThu, Ngay, TieuDe) VALUES
(1, 1, '2026-10-12', 'Ngay 1 - Xuat phat Ha Noi'),
(1, 2, '2026-10-13', 'Ngay 2 - Kham pha Ha Long'),
(1, 3, '2026-10-14', 'Ngay 3 - Ve Ha Noi'),
(2, 1, '2026-11-05', 'Ngay 1 - Da Nang'),
(2, 2, '2026-11-06', 'Ngay 2 - Ba Na Hills');

-- LichTrinhChiTiet: dung MaDiaDiem, MaNhaHang, MaKhachSan rieng biet, ThuTu thay SapXep
INSERT IGNORE INTO LichTrinhChiTiet (MaLichTrinh, ThuTu, LoaiDiaDiem, MaDiaDiem, ThoiGianBatDau, ThoiGianKetThuc, ChiPhi, GhiChu) VALUES
(1, 1, 'DiaDiem', 1, '09:00:00', '17:00:00', 0, 'Tour tau ghep vinh Ha Long'),
(2, 1, 'NhaHang', NULL, '12:00:00', '13:00:00', 300000, 'An trua hai san'),
(3, 1, 'DiaDiem', 1, '08:00:00', '11:00:00', 0, 'Cheo kayak'),
(4, 1, 'DiaDiem', 2, '08:00:00', '11:00:00', 0, 'Tam bien buoi sang'),
(4, 2, 'NhaHang', NULL, '12:00:00', '13:00:00', 60000, 'An trua dac san'),
(5, 1, 'DiaDiem', 3, '08:00:00', '17:00:00', 150000, 'Mua ve tham quan pho co');

-- ChuyenDi: MaNguoiDung (ko phai MaNguoiTao)
INSERT IGNORE INTO ChuyenDi (MaNguoiDung, TenChuyenDi, DiemKhoiHanh, DiemDen, NgayBatDau, NgayKetThuc, SoNguoi, NganSach, TrangThai) VALUES
(2, 'Hanh trinh Ha Long cung gia dinh', 'Ha Noi', 'Quang Ninh', '2026-10-12', '2026-10-14', 4, 15000000, 'Confirmed'),
(3, 'Kham pha mien Trung voi ban be', 'Ha Noi', 'Da Nang - Hoi An - Hue', '2026-11-05', '2026-11-10', 3, 20000000, 'Planning'),
(4, 'Trekking Ha Giang', 'TP. HCM', 'Ha Giang', '2026-10-24', '2026-10-27', 2, 12000000, 'Planning');

-- ThanhVienChuyenDi: NgayThamGia thay NgayTham
INSERT IGNORE INTO ThanhVienChuyenDi (MaChuyenDi, MaNguoiDung, VaiTro, TrangThai) VALUES
(1, 2, 'Owner', 'Accepted'),
(1, 3, 'Member', 'Accepted'),
(2, 3, 'Owner', 'Accepted'),
(2, 4, 'Member', 'Pending'),
(3, 4, 'Owner', 'Accepted'),
(3, 5, 'Member', 'Accepted');

-- ChiPhi
INSERT IGNORE INTO ChiPhi (MaChuyenDi, MaNguoiTao, TenChiPhi, SoTien, LoaiChiPhi, NgayChiTieu) VALUES
(1, 2, 'Ve tau Ha Noi - Ha Long', 400000, 'DiChuyen', '2026-10-12'),
(1, 2, 'Tour tau du thuyen', 2900000, 'Tour', '2026-10-12'),
(1, 3, 'An toi hai san', 800000, 'AnUong', '2026-10-12'),
(2, 3, 'Ve may bay Ha Noi - Da Nang', 2400000, 'DiChuyen', '2026-11-05'),
(3, 4, 'Thue xe may 3 ngay', 900000, 'DiChuyen', '2026-10-24');

SELECT 'DONE - Du lieu mau da chen xong!' AS KetQua;