USE WebDuLich;

-- TourChiTiet: NgayThu (so ngay), ThuTu (thu tu hoat dong), LoaiDiaDiem, ko co TieuDe/MoTa/SapXep
INSERT IGNORE INTO TourChiTiet (MaTour, NgayThu, ThuTu, LoaiDiaDiem, MaDiaDiem, ThoiGianBatDau, ThoiGianKetThuc, ChiPhi, GhiChu) VALUES
(1,1,1,'DiaDiem',1,'09:00:00','17:00:00',0,'Tham quan vinh Ha Long, hang Thien Cung'),
(1,1,2,'NhaHang',NULL,'12:00:00','13:00:00',300000,'An trua tren tau'),
(1,2,1,'DiaDiem',1,'06:00:00','09:00:00',0,'Cheo kayak buoi sang'),
(2,1,1,'DiaDiem',2,'08:00:00','11:00:00',0,'Tam bien My Khe'),
(2,2,1,'DiaDiem',NULL,'08:00:00','17:00:00',800000,'Cap treo Ba Na Hills, Cau Vang'),
(2,3,1,'DiaDiem',3,'08:00:00','17:00:00',150000,'Tham quan pho co Hoi An'),
(3,2,1,'DiaDiem',4,'07:00:00','16:00:00',0,'Chieu phong Ma Pi Leng'),
(3,2,2,'DiaDiem',5,'16:00:00','18:00:00',0,'Pho co Dong Van'),
(4,1,1,'DiaDiem',6,'07:00:00','15:00:00',100000,'Tham quan thac Ban Gioc'),
(5,1,1,'DiaDiem',7,'08:00:00','17:00:00',250000,'Dai Noi Hue'),
(6,1,1,'DiaDiem',8,'09:00:00','17:00:00',0,'Kham pha dao Ly Son'),
(8,1,1,'DiaDiem',10,'05:00:00','09:00:00',200000,'Cho noi Cai Rang');

SELECT CONCAT('TourKhoiHanh: ', COUNT(*)) FROM TourKhoiHanh
UNION ALL SELECT CONCAT('TourChiTiet: ', COUNT(*)) FROM TourChiTiet
UNION ALL SELECT CONCAT('ChuyenDi: ', COUNT(*)) FROM ChuyenDi
UNION ALL SELECT CONCAT('LichTrinh: ', COUNT(*)) FROM LichTrinh
UNION ALL SELECT CONCAT('ChiPhi: ', COUNT(*)) FROM ChiPhi
UNION ALL SELECT CONCAT('YeuThich: ', COUNT(*)) FROM YeuThich
UNION ALL SELECT CONCAT('DanhGia: ', COUNT(*)) FROM DanhGia
UNION ALL SELECT CONCAT('Tour: ', COUNT(*)) FROM Tour;