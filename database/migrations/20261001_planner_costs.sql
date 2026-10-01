-- Additive only. Run through --upgrade-planner (backup + resumable checks).
-- Existing zero ticket prices are NOT treated as evidence of free admission.
ALTER TABLE DiaDiem ADD COLUMN MienPhi BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE LichTrinhChiTiet ADD COLUMN DuToan JSON NULL;
