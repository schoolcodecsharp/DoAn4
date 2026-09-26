-- Read-only audit. No DROP, DELETE or re-seeding is needed for 1-N images.
USE WebDuLich;

-- Each owner can have any number of different images. ThuTu determines order.
-- The unique key is (MaTour, DuongDan), NOT MaTour alone (same for MaDiaDiem).
SELECT t.MaTour, t.TenTour, COUNT(h.MaHinhAnh) AS SoAnh
FROM Tour t LEFT JOIN HinhAnh h ON h.MaTour = t.MaTour
GROUP BY t.MaTour, t.TenTour;
SELECT d.MaDiaDiem, d.TenDiaDiem, COUNT(h.MaHinhAnh) AS SoAnh
FROM DiaDiem d LEFT JOIN HinhAnh h ON h.MaDiaDiem = d.MaDiaDiem
GROUP BY d.MaDiaDiem, d.TenDiaDiem;

-- Must return zero rows: an image belongs to exactly one existing owner.
SELECT * FROM HinhAnh
WHERE (MaTour IS NOT NULL) + (MaDiaDiem IS NOT NULL)
    + (MaNhaHang IS NOT NULL) + (MaKhachSan IS NOT NULL)
    + (MaLoaiPhong IS NOT NULL) <> 1;

-- To add photos, INSERT new HinhAnh rows using the same owner ID,
-- distinct real /media/... paths, and increasing ThuTu. Do not duplicate
-- one photo under fake paths or attach photos of unrelated destinations.
