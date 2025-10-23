-- Add signature field to members table (if it doesn't exist)
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE table_name = 'members' 
   AND table_schema = DATABASE() 
   AND column_name = 'signature_path') > 0,
  'SELECT ''Column signature_path already exists'' as message;',
  'ALTER TABLE members ADD COLUMN signature_path VARCHAR(500) AFTER profile_photo_path;'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Create index for faster lookups (if it doesn't exist)
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
   WHERE table_name = 'members' 
   AND table_schema = DATABASE() 
   AND index_name = 'idx_signature_path') > 0,
  'SELECT ''Index idx_signature_path already exists'' as message;',
  'CREATE INDEX idx_signature_path ON members(signature_path);'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update activity logs to track signature uploads
ALTER TABLE activity_logs MODIFY COLUMN action ENUM(
  'login', 'logout', 'password_change', 'member_verification', 
  'member_added', 'member_updated', 'member_deleted', 
  'profile_photo_upload', 'signature_upload', 'member_added_direct'
) NOT NULL;
