-- Run after backup and preflight: no nonpositive amounts or duplicate non-null references.
ALTER TABLE ThanhToan ADD CONSTRAINT ck_payment_positive CHECK (SoTien > 0);
CREATE UNIQUE INDEX ux_payment_reference ON ThanhToan(MaGiaoDich);
