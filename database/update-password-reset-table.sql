-- Update admin_password_resets table to support both superadmin and district_admin
-- This script creates the table with new structure OR updates existing table from old structure

-- Step 1: Create the table if it doesn't exist (with new structure)
CREATE TABLE IF NOT EXISTS admin_password_resets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT NOT NULL,
  user_type ENUM('superadmin', 'district_admin') DEFAULT 'superadmin',
  email VARCHAR(255) NOT NULL,
  otp VARCHAR(6) NOT NULL,
  token VARCHAR(512) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_token (token),
  INDEX idx_expires_at (expires_at),
  INDEX idx_admin_type (admin_id, user_type)
);

-- Step 2: Check if table has old structure (superadmin_id exists but admin_id doesn't)
-- Only update if it's an old structure table
SET @has_superadmin_id = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'admin_password_resets' 
    AND COLUMN_NAME = 'superadmin_id'
);

SET @has_admin_id = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'admin_password_resets' 
    AND COLUMN_NAME = 'admin_id'
);

-- Step 3: Only add columns if table has old structure (has superadmin_id but not admin_id)
-- If table was just created above, it already has admin_id, so skip this
SET @needs_update = IF(@has_superadmin_id > 0 AND @has_admin_id = 0, 1, 0);

-- Add admin_id column only if needed
SET @sql1 = IF(@needs_update = 1,
  'ALTER TABLE admin_password_resets ADD COLUMN admin_id INT AFTER id',
  'SELECT "admin_id already exists or table is new" AS message'
);
PREPARE stmt1 FROM @sql1;
EXECUTE stmt1;
DEALLOCATE PREPARE stmt1;

-- Add user_type column only if needed
SET @has_user_type = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'admin_password_resets' 
    AND COLUMN_NAME = 'user_type'
);

SET @sql2 = IF(@needs_update = 1 AND @has_user_type = 0,
  'ALTER TABLE admin_password_resets ADD COLUMN user_type ENUM(\'superadmin\', \'district_admin\') DEFAULT \'superadmin\' AFTER admin_id',
  'SELECT "user_type already exists or update not needed" AS message'
);
PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

-- Step 4: Migrate existing data from superadmin_id to admin_id (if old structure exists)
SET @sql3 = IF(@needs_update = 1,
  'UPDATE admin_password_resets SET admin_id = superadmin_id, user_type = \'superadmin\' WHERE admin_id IS NULL AND superadmin_id IS NOT NULL',
  'SELECT "No data migration needed" AS message'
);
PREPARE stmt3 FROM @sql3;
EXECUTE stmt3;
DEALLOCATE PREPARE stmt3;

-- Step 5: Add index if it doesn't exist
SET @has_index = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'admin_password_resets' 
    AND INDEX_NAME = 'idx_admin_type'
);

SET @sql4 = IF(@has_index = 0,
  'ALTER TABLE admin_password_resets ADD INDEX idx_admin_type (admin_id, user_type)',
  'SELECT "Index already exists" AS message'
);
PREPARE stmt4 FROM @sql4;
EXECUTE stmt4;
DEALLOCATE PREPARE stmt4;

-- Note: The superadmin_id column can be kept for backward compatibility
-- or removed if you want to fully migrate to the new structure
-- To remove: ALTER TABLE admin_password_resets DROP COLUMN superadmin_id;

