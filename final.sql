USE WebDuLich;

INSERT IGNORE INTO LichTrinhChiTiet (MaLichTrinh, ThuTu, LoaiDiaDiem, MaDiaDiem, ThoiGianBatDau, ThoiGianKetThuc, ChiPhi, GhiChu) VALUES
(6,1,'DiaDiem',1,'09:00:00','17:00:00',0,'Tour tau ghep vinh Ha Long'),
(6,2,'NhaHang',NULL,'19:00:00','21:00:00',300000,'An toi hai san'),
(7,1,'DiaDiem',1,'06:00:00','09:00:00',0,'Cheo kayak sang som'),
(9,1,'DiaDiem',2,'08:00:00','11:00:00',0,'Tam bien My Khe buoi sang'),
(9,2,'NhaHang',NULL,'12:00:00','13:00:00',60000,'An trua mi quang'),
(10,1,'DiaDiem',NULL,'08:00:00','17:00:00',800000,'Ba Na Hills - Cau Vang');

SELECT CONCAT('LichTrinhChiTiet: ',COUNT(*)) AS KetQua FROM LichTrinhChiTiet;

-- Tong ket toan bo du lieu
SELECT '=== TONG KET DU LIEU ===' AS '';
SELECT CONCAT('NguoiDung: ',COUNT(*)) FROM NguoiDung
UNION ALL SELECT CONCAT('DiaDiem: ',COUNT(*)) FROM DiaDiem
UNION ALL SELECT CONCAT('LoaiDiaDiem: ',COUNT(*)) FROM LoaiDiaDiem
UNION ALL SELECT CONCAT('NhaHang: ',COUNT(*)) FROM NhaHang
UNION ALL SELECT CONCAT('KhachSan: ',COUNT(*)) FROM KhachSan
UNION ALL SELECT CONCAT('LoaiPhong: ',COUNT(*)) FROM LoaiPhong
UNION ALL SELECT CONCAT('Tour: ',COUNT(*)) FROM Tour
UNION ALL SELECT CONCAT('TourKhoiHanh: ',COUNT(*)) FROM TourKhoiHanh
UNION ALL SELECT CONCAT('TourChiTiet: ',COUNT(*)) FROM TourChiTiet
UNION ALL SELECT CONCAT('ChuyenDi: ',COUNT(*)) FROM ChuyenDi
UNION ALL SELECT CONCAT('ThanhVienChuyenDi: ',COUNT(*)) FROM ThanhVienChuyenDi
UNION ALL SELECT CONCAT('LichTrinh: ',COUNT(*)) FROM LichTrinh
UNION ALL SELECT CONCAT('LichTrinhChiTiet: ',COUNT(*)) FROM LichTrinhChiTiet
UNION ALL SELECT CONCAT('MaGiamGia: ',COUNT(*)) FROM MaGiamGia
UNION ALL SELECT CONCAT('DanhGia: ',COUNT(*)) FROM DanhGia
UNION ALL SELECT CONCAT('YeuThich: ',COUNT(*)) FROM YeuThich
UNION ALL SELECT CONCAT('ChiPhi: ',COUNT(*)) FROM ChiPhi;