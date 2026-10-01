-- Safe additive schema. Apply with AdminSmoke --upgrade-provinces for backup,
-- reviewed seed, name normalization and verified catalog import in one transaction.
CREATE TABLE IF NOT EXISTS TinhThanh (
    Code INT NOT NULL PRIMARY KEY,
    Name VARCHAR(100) NOT NULL UNIQUE,
    DivisionType VARCHAR(40) NOT NULL,
    Aliases JSON NOT NULL,
    VerifiedOn DATE NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
