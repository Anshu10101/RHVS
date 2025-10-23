-- Add signature_path column to registration_tokens table (if it doesn't exist)
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE table_name = 'registration_tokens' 
   AND table_schema = DATABASE() 
   AND column_name = 'signature_path') > 0,
  'SELECT ''Column signature_path already exists in registration_tokens'' as message;',
  'ALTER TABLE registration_tokens ADD COLUMN signature_path VARCHAR(500) AFTER profile_photo_path;'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update the registration_tokens table to handle signature uploads
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
   WHERE table_name = 'registration_tokens' 
   AND table_schema = DATABASE() 
   AND index_name = 'idx_registration_tokens_signature') > 0,
  'SELECT ''Index idx_registration_tokens_signature already exists'' as message;',
  'CREATE INDEX idx_registration_tokens_signature ON registration_tokens(signature_path);'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
