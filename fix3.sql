USE WebDuLich;

INSERT IGNORE INTO ChuyenDi (MaNguoiDung, TenChuyenDi, DiemKhoiHanh, DiemDen, NgayBatDau, NgayKetThuc, SoNguoi, NganSach, TrangThai) VALUES
(2,'Hanh trinh Ha Long cung gia dinh','Ha Noi','Quang Ninh','2026-10-12','2026-10-14',4,15000000,'Confirmed'),
(3,'Kham pha mien Trung','Ha Noi','Da Nang','2026-11-05','2026-11-10',3,20000000,'Planning'),
(4,'Trekking Ha Giang','TP. HCM','Ha Giang','2026-10-24','2026-10-27',2,12000000,'Planning');

INSERT IGNORE INTO ThanhVienChuyenDi (MaChuyenDi, MaNguoiDung, VaiTro, TrangThai) VALUES
(1,2,'Owner','Accepted'),(1,3,'Member','Accepted'),
(2,3,'Owner','Accepted'),(2,4,'Member','Pending'),
(3,4,'Owner','Accepted'),(3,5,'Member','Accepted');

INSERT IGNORE INTO LichTrinh (MaChuyenDi, NgayThu, Ngay, TieuDe) VALUES
(1,1,'2026-10-12','Ngay 1 - Xuat phat Ha Noi di Ha Long'),
(1,2,'2026-10-13','Ngay 2 - Kham pha vinh Ha Long'),
(1,3,'2026-10-14','Ngay 3 - Ve Ha Noi'),
(2,1,'2026-11-05','Ngay 1 - Den Da Nang'),
(2,2,'2026-11-06','Ngay 2 - Ba Na Hills - Cau Vang');

INSERT IGNORE INTO LichTrinhChiTiet (MaLichTrinh, ThuTu, LoaiDiaDiem, MaDiaDiem, ThoiGianBatDau, ThoiGianKetThuc, ChiPhi, GhiChu) VALUES
(1,1,'DiaDiem',1,'09:00:00','17:00:00',0,'Tour tau ghep vinh Ha Long'),
(1,2,'DiaDiem',NULL,'19:00:00','21:00:00',300000,'An toi hai san'),
(2,1,'DiaDiem',1,'06:00:00','09:00:00',0,'Cheo kayak sang som'),
(4,1,'DiaDiem',2,'08:00:00','11:00:00',0,'Tam bien My Khe buoi sang'),
(4,2,'NhaHang',NULL,'12:00:00','13:00:00',60000,'Mi Quang Ba Vi'),
(5,1,'DiaDiem',NULL,'08:00:00','17:00:00',800000,'Ba Na Hills - Cau Vang');

INSERT IGNORE INTO ChiPhi (MaChuyenDi, MaNguoiDung, TenChiPhi, SoTien, LoaiChiPhi, NgayChi) VALUES
(1,2,'Ve xe Ha Noi - Ha Long',400000,'DiChuyen','2026-10-12'),
(1,2,'Tour tau du thuyen',2900000,'VeThamQuan','2026-10-12'),
(1,3,'An toi hai san',800000,'AnUong','2026-10-12'),
(2,3,'Ve may bay Ha Noi - Da Nang',2400000,'DiChuyen','2026-11-05'),
(3,4,'Thue xe may 3 ngay',900000,'DiChuyen','2026-10-24');

INSERT IGNORE INTO YeuThich (MaNguoiDung, MaTour) VALUES
(2,1),(2,2),(2,6),(3,1),(3,3),(4,2),(4,7),(5,5),(5,8);

INSERT IGNORE INTO DanhGia (MaNguoiDung, MaTour, SoSao, NoiDung) VALUES
(2,1,5,'Tour Ha Long tuyet voi! Tau dep, huong dan vien nhiet tinh!'),
(3,1,4,'Trai nghiem tot, thuc an ngon. Hoi dong khach mot chut.'),
(4,2,5,'Tour Da Nang rat worth it! Ba Na Hills va Hoi An dep lam!'),
(5,2,5,'Cau Vang thuc su an tuong. Anh dep, guide tot bung.'),
(2,3,5,'Ha Giang Loop la trai nghiem dang nho nhat doi! Canh dep vo cung!'),
(3,5,4,'Hue co kinh va day ap lich su. Bun bo Hue an la nghien.');

INSERT IGNORE INTO DanhGia (MaNguoiDung, MaDiaDiem, SoSao, NoiDung) VALUES
(2,1,5,'Vinh Ha Long dep hon trong anh nhieu! Mot lan trong doi phai den!'),
(3,3,5,'Pho co Hoi An ve dem tho mong vo cung. Den long lung linh!'),
(4,2,4,'Bien My Khe nuoc trong xanh, song vua phai, rat de boi.'),
(5,4,5,'Ma Pi Leng dep den nghet tho! Song Nho Que xanh tuyet!');

SELECT CONCAT('ChuyenDi: ',COUNT(*)) FROM ChuyenDi
UNION ALL SELECT CONCAT('ThanhVienChuyenDi: ',COUNT(*)) FROM ThanhVienChuyenDi
UNION ALL SELECT CONCAT('LichTrinh: ',COUNT(*)) FROM LichTrinh
UNION ALL SELECT CONCAT('LichTrinhChiTiet: ',COUNT(*)) FROM LichTrinhChiTiet
UNION ALL SELECT CONCAT('ChiPhi: ',COUNT(*)) FROM ChiPhi
UNION ALL SELECT CONCAT('YeuThich: ',COUNT(*)) FROM YeuThich
UNION ALL SELECT CONCAT('DanhGia: ',COUNT(*)) FROM DanhGia;