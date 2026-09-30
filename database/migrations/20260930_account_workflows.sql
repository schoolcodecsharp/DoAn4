-- Existing databases: use AdminSmoke --upgrade-account (backup + resumable columns).
ALTER TABLE DatTour ADD COLUMN YeuCauHuy ENUM('Pending','Approved','Rejected') NULL;
ALTER TABLE DatTour ADD COLUMN LyDoHuy VARCHAR(1000) NULL;
ALTER TABLE DatTour ADD COLUMN PhanHoiHuy VARCHAR(1000) NULL;
ALTER TABLE DatTour ADD COLUMN NgayYeuCauHuy DATETIME NULL;
ALTER TABLE DatPhong ADD COLUMN YeuCauHuy ENUM('Pending','Approved','Rejected') NULL;
ALTER TABLE DatPhong ADD COLUMN LyDoHuy VARCHAR(1000) NULL;
ALTER TABLE DatPhong ADD COLUMN PhanHoiHuy VARCHAR(1000) NULL;
ALTER TABLE DatPhong ADD COLUMN NgayYeuCauHuy DATETIME NULL;
ALTER TABLE ChuyenDi ADD COLUMN Revision INT NOT NULL DEFAULT 0;
