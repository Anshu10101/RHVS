-- Migration: Add district column to contact_info and offices tables
-- This allows district-specific contact information and offices
-- Note: offices table already has district_id and state_id (INT), but we'll use district VARCHAR for consistency

-- Add district column to contact_info table (if it doesn't exist)
SET @exist := (SELECT COUNT(*) FROM information_schema.COLUMNS 
               WHERE TABLE_SCHEMA = DATABASE() 
               AND TABLE_NAME = 'contact_info' 
               AND COLUMN_NAME = 'district');
SET @sqlstmt := IF(@exist = 0, 
    'ALTER TABLE contact_info ADD COLUMN district VARCHAR(100) NULL AFTER contact_type',
    'SELECT "Column district already exists in contact_info" as message');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add owner_admin_id to contact_info table (if it doesn't exist)
SET @exist := (SELECT COUNT(*) FROM information_schema.COLUMNS 
               WHERE TABLE_SCHEMA = DATABASE() 
               AND TABLE_NAME = 'contact_info' 
               AND COLUMN_NAME = 'owner_admin_id');
SET @sqlstmt := IF(@exist = 0, 
    'ALTER TABLE contact_info ADD COLUMN owner_admin_id INT NULL AFTER created_by',
    'SELECT "Column owner_admin_id already exists in contact_info" as message');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add indexes for contact_info (if they don't exist)
SET @exist := (SELECT COUNT(*) FROM information_schema.STATISTICS 
               WHERE TABLE_SCHEMA = DATABASE() 
               AND TABLE_NAME = 'contact_info' 
               AND INDEX_NAME = 'idx_district');
SET @sqlstmt := IF(@exist = 0, 
    'ALTER TABLE contact_info ADD INDEX idx_district (district)',
    'SELECT "Index idx_district already exists in contact_info" as message');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM information_schema.STATISTICS 
               WHERE TABLE_SCHEMA = DATABASE() 
               AND TABLE_NAME = 'contact_info' 
               AND INDEX_NAME = 'idx_owner_admin');
SET @sqlstmt := IF(@exist = 0, 
    'ALTER TABLE contact_info ADD INDEX idx_owner_admin (owner_admin_id)',
    'SELECT "Index idx_owner_admin already exists in contact_info" as message');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add district column to offices table (if it doesn't exist)
-- Note: offices already has district_id (INT), but we'll use district VARCHAR for consistency
SET @exist := (SELECT COUNT(*) FROM information_schema.COLUMNS 
               WHERE TABLE_SCHEMA = DATABASE() 
               AND TABLE_NAME = 'offices' 
               AND COLUMN_NAME = 'district');
SET @sqlstmt := IF(@exist = 0, 
    'ALTER TABLE offices ADD COLUMN district VARCHAR(100) NULL AFTER state',
    'SELECT "Column district already exists in offices" as message');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add owner_admin_id to offices table (if it doesn't exist)
SET @exist := (SELECT COUNT(*) FROM information_schema.COLUMNS 
               WHERE TABLE_SCHEMA = DATABASE() 
               AND TABLE_NAME = 'offices' 
               AND COLUMN_NAME = 'owner_admin_id');
SET @sqlstmt := IF(@exist = 0, 
    'ALTER TABLE offices ADD COLUMN owner_admin_id INT NULL AFTER created_by',
    'SELECT "Column owner_admin_id already exists in offices" as message');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add indexes for offices (if they don't exist)
SET @exist := (SELECT COUNT(*) FROM information_schema.STATISTICS 
               WHERE TABLE_SCHEMA = DATABASE() 
               AND TABLE_NAME = 'offices' 
               AND INDEX_NAME = 'idx_district');
SET @sqlstmt := IF(@exist = 0, 
    'ALTER TABLE offices ADD INDEX idx_district (district)',
    'SELECT "Index idx_district already exists in offices" as message');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM information_schema.STATISTICS 
               WHERE TABLE_SCHEMA = DATABASE() 
               AND TABLE_NAME = 'offices' 
               AND INDEX_NAME = 'idx_owner_admin');
SET @sqlstmt := IF(@exist = 0, 
    'ALTER TABLE offices ADD INDEX idx_owner_admin (owner_admin_id)',
    'SELECT "Index idx_owner_admin already exists in offices" as message');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Note: Existing records will have district and owner_admin_id as NULL, which means they're global/superadmin content
-- This ensures existing data remains accessible to everyone until explicitly assigned to a district

