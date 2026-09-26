-- Run only after a verified backup. Current auth uses access JWT only.
-- Do not run CSDL.sql against an existing database: it drops all data.
USE WebDuLich;
DROP TABLE IF EXISTS RefreshToken;
