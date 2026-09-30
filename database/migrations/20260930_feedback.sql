-- Existing database: use AdminSmoke --upgrade-feedback (backup + rerun guard).
-- Do not execute CSDL.sql against an existing database.
ALTER TABLE DanhGia
    ADD COLUMN MaDatTourXacMinh INT NULL,
    ADD COLUMN MaDatPhongXacMinh INT NULL,
    ADD CONSTRAINT fk_danhgia_dat_tour_xac_minh FOREIGN KEY (MaDatTourXacMinh) REFERENCES DatTour(MaDatTour),
    ADD CONSTRAINT fk_danhgia_dat_phong_xac_minh FOREIGN KEY (MaDatPhongXacMinh) REFERENCES DatPhong(MaDatPhong),
    ADD CONSTRAINT chk_danhgia_bang_chung CHECK (MaDatTourXacMinh IS NULL OR MaDatPhongXacMinh IS NULL);

CREATE TABLE IF NOT EXISTS BinhLuan (
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
