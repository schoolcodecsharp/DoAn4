USE WebDuLich;

-- TourKhoiHanh
INSERT IGNORE INTO TourKhoiHanh (MaTour, NgayKhoiHanh, SoChoToiDa, GiaApDung, TrangThai) VALUES
(1,'2026-10-05',20,2900000,'OpenForBooking'),(1,'2026-10-12',20,2900000,'OpenForBooking'),
(1,'2026-10-19',20,3100000,'OpenForBooking'),(1,'2026-11-02',20,3200000,'OpenForBooking'),
(2,'2026-10-08',25,4500000,'OpenForBooking'),(2,'2026-10-22',25,4800000,'OpenForBooking'),
(2,'2026-11-05',25,5200000,'OpenForBooking'),(3,'2026-10-10',10,2500000,'OpenForBooking'),
(3,'2026-10-24',10,2700000,'OpenForBooking'),(3,'2026-11-07',10,3000000,'OpenForBooking'),
(4,'2026-10-15',15,2200000,'OpenForBooking'),(4,'2026-10-29',15,2500000,'OpenForBooking'),
(5,'2026-10-10',20,1800000,'OpenForBooking'),(5,'2026-10-24',20,2000000,'OpenForBooking'),
(6,'2026-10-17',12,2800000,'OpenForBooking'),(6,'2026-10-31',12,3000000,'OpenForBooking'),
(7,'2026-10-11',20,1900000,'OpenForBooking'),(7,'2026-10-25',20,2100000,'OpenForBooking'),
(8,'2026-10-04',25,1500000,'OpenForBooking'),(8,'2026-10-11',25,1500000,'OpenForBooking'),
(8,'2026-10-18',25,1700000,'OpenForBooking');

-- TourChiTiet
INSERT IGNORE INTO TourChiTiet (MaTour, SoNgay, TieuDe, MoTa, SapXep) VALUES
(1,1,'Xuat phat Ha Noi - Len tau','Don tai Ha Noi, di chuyen den cang Tuan Chau. Tham quan hang Thien Cung, Dau Go.',1),
(1,2,'Cheo Kayak - Ve Ha Noi','Sang som tap Thai Cuc Quyen tren bong. Cheo kayak kham pha hang toi. Ve Ha Noi 16h.',2),
(2,1,'Bay Da Nang - Bien My Khe','Don san bay, nhan phong. Tam bien My Khe. Dao cau Rong buoi toi.',1),
(2,2,'Ba Na Hills - Cau Vang','Cap treo len Ba Na Hills. Tham quan Cau Vang, Lang Phap, Fantasy Park.',2),
(2,3,'Pho co Hoi An','Di chuyen Hoi An. Tham quan pho co, chua Cau. Ngam Hoi An ve dem.',3),
(2,4,'Tu do - Bay ve','Buoi sang tu do. Ra san bay, bay ve TP.HCM.',4),
(3,1,'Ha Noi - Ha Giang','Xuat phat toi tu Ha Noi, xe giuong nam den Ha Giang sang hom sau.',1),
(3,2,'Ma Pi Leng - Dong Van','Thue xe may, chinh phuc deo Ma Pi Leng. Ngam song Nho Que. Den pho co Dong Van.',2),
(3,3,'Lung Cu - Sung La','Tham cot co Lung Cu. Kham pha thung lung Sung La. Ve Ha Giang nghi dem.',3),
(3,4,'Ve Ha Noi','Tu do buoi sang. Xe ve Ha Noi chieu toi.',4),
(4,1,'Ha Noi - Ban Gioc','Khoi hanh Ha Noi, den Cao Bang tham quan thac Ban Gioc huong vi.',1),
(4,2,'Dong Nguom Ngao - Lang Da','Kham pha dong Nguom Ngao, lang da Khuoi Ky van hoa dan toc.',2),
(4,3,'Ve Ha Noi','An sang dac san, mua qua luu niem, ve Ha Noi.',3),
(5,1,'Da Nang - Dai Noi Hue','Di chuyen Hue, tham quan Dai Noi, chieu dao chua Thien Mu.',1),
(5,2,'Lang Tam - Cho Dong Ba','Tham quan lang Khai Dinh, Minh Mang. Kham pha cho Dong Ba.',2),
(5,3,'Tu do - Ve Da Nang','Bu sang tu do, ve Da Nang.',3),
(6,1,'Quang Ngai - Dao Ly Son','Tau ra dao Ly Son. Tham quan Cong To Vo, bai bien.',1),
(6,2,'Nui Thoi Loi - Lang chai','Leo nui Thoi Loi ngam toan canh. Kham pha lang chai.',2),
(6,3,'Hang Cau - Ve dat lien','Tham quan Hang Cau, mua tau ve dat lien.',3),
(7,1,'TP.HCM - Da Lat','Xe len Da Lat, nhan phong, dao Quang truong Lam Vien buoi toi.',1),
(7,2,'Ho Xuan Huong - Vuon Hoa','Dao ho Xuan Huong sang som. Tham quan vuon hoa thanh pho.',2),
(7,3,'Thac Datanla - Ve TP.HCM','Tham quan thac Datanla. Mua sam. Ve TP.HCM.',3),
(8,1,'TP.HCM - Can Tho','Xe den Can Tho, dao ben Ninh Kieu buoi toi.',1),
(8,2,'Cho noi Cai Rang - Ve TP.HCM','5h sang ra cho noi Cai Rang. Vuon cay an trai. Ve TP.HCM.',2);

-- ChuyenDi
INSERT IGNORE INTO ChuyenDi (MaNguoiDung, TenChuyenDi, DiemKhoiHanh, DiemDen, NgayBatDau, NgayKetThuc, SoNguoi, NganSach, TrangThai) VALUES
(2,'Hanh trinh Ha Long cung gia dinh','Ha Noi','Quang Ninh','2026-10-12','2026-10-14',4,15000000,'Confirmed'),
(3,'Kham pha mien Trung voi ban be','Ha Noi','Da Nang','2026-11-05','2026-11-10',3,20000000,'Planning'),
(4,'Trekking Ha Giang','TP. HCM','Ha Giang','2026-10-24','2026-10-27',2,12000000,'Planning');

-- ThanhVienChuyenDi
INSERT IGNORE INTO ThanhVienChuyenDi (MaChuyenDi, MaNguoiDung, VaiTro, TrangThai) VALUES
(1,2,'Owner','Accepted'),(1,3,'Member','Accepted'),
(2,3,'Owner','Accepted'),(2,4,'Member','Pending'),
(3,4,'Owner','Accepted'),(3,5,'Member','Accepted');

-- LichTrinh (Ngay la date NOT NULL)
INSERT IGNORE INTO LichTrinh (MaChuyenDi, NgayThu, Ngay, TieuDe) VALUES
(1,1,'2026-10-12','Ngay 1 - Xuat phat Ha Noi'),
(1,2,'2026-10-13','Ngay 2 - Kham pha Ha Long'),
(1,3,'2026-10-14','Ngay 3 - Ve Ha Noi'),
(2,1,'2026-11-05','Ngay 1 - Da Nang'),
(2,2,'2026-11-06','Ngay 2 - Ba Na Hills');

-- LichTrinhChiTiet
INSERT IGNORE INTO LichTrinhChiTiet (MaLichTrinh, ThuTu, LoaiDiaDiem, MaDiaDiem, ThoiGianBatDau, ThoiGianKetThuc, ChiPhi, GhiChu) VALUES
(1,1,'DiaDiem',1,'09:00:00','17:00:00',0,'Tour tau ghep vinh Ha Long'),
(2,1,'DiaDiem',1,'08:00:00','11:00:00',0,'Cheo kayak'),
(4,1,'DiaDiem',2,'08:00:00','11:00:00',0,'Tam bien buoi sang'),
(5,1,'DiaDiem',3,'08:00:00','17:00:00',150000,'Mua ve tham quan pho co');

-- ChiPhi (MaNguoiDung, NgayChi)
INSERT IGNORE INTO ChiPhi (MaChuyenDi, MaNguoiDung, TenChiPhi, SoTien, LoaiChiPhi, NgayChi) VALUES
(1,2,'Ve tau Ha Noi - Ha Long',400000,'DiChuyen','2026-10-12'),
(1,2,'Tour tau du thuyen Ha Long',2900000,'VeThamQuan','2026-10-12'),
(1,3,'An toi hai san',800000,'AnUong','2026-10-12'),
(2,3,'Ve may bay Ha Noi - Da Nang',2400000,'DiChuyen','2026-11-05'),
(3,4,'Thue xe may 3 ngay',900000,'DiChuyen','2026-10-24');

-- YeuThich
INSERT IGNORE INTO YeuThich (MaNguoiDung, MaTour) VALUES
(2,1),(2,2),(2,6),(3,1),(3,3),(4,2),(4,7),(5,5),(5,8);

SELECT CONCAT('NguoiDung: ', COUNT(*)) AS info FROM NguoiDung
UNION ALL SELECT CONCAT('DiaDiem: ', COUNT(*)) FROM DiaDiem
UNION ALL SELECT CONCAT('NhaHang: ', COUNT(*)) FROM NhaHang
UNION ALL SELECT CONCAT('KhachSan: ', COUNT(*)) FROM KhachSan
UNION ALL SELECT CONCAT('LoaiPhong: ', COUNT(*)) FROM LoaiPhong
UNION ALL SELECT CONCAT('Tour: ', COUNT(*)) FROM Tour
UNION ALL SELECT CONCAT('TourKhoiHanh: ', COUNT(*)) FROM TourKhoiHanh
UNION ALL SELECT CONCAT('TourChiTiet: ', COUNT(*)) FROM TourChiTiet
UNION ALL SELECT CONCAT('ChuyenDi: ', COUNT(*)) FROM ChuyenDi
UNION ALL SELECT CONCAT('MaGiamGia: ', COUNT(*)) FROM MaGiamGia
UNION ALL SELECT CONCAT('DanhGia: ', COUNT(*)) FROM DanhGia
UNION ALL SELECT CONCAT('YeuThich: ', COUNT(*)) FROM YeuThich;