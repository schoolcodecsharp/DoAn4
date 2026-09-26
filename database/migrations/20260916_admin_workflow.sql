-- Additive migration. Run after backup; never resets business data.
CREATE TABLE IF NOT EXISTS NhatKyAdmin (
    MaNhatKy BIGINT AUTO_INCREMENT PRIMARY KEY,
    MaNguoiDung INT NOT NULL,
    HanhDong VARCHAR(10) NOT NULL,
    DoiTuong VARCHAR(80) NOT NULL,
    MaDoiTuong VARCHAR(80) NULL,
    TraceId VARCHAR(100) NOT NULL,
    KetQua VARCHAR(20) NOT NULL DEFAULT 'Started',
    HttpStatus INT NULL,
    ThoiGian DATETIME(6) NOT NULL DEFAULT (UTC_TIMESTAMP(6)),
    INDEX idx_nhatky_time (ThoiGian, MaNhatKy),
    INDEX idx_nhatky_actor (MaNguoiDung, MaNhatKy)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
