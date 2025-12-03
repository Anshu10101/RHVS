-- Add print_as fields to department_posts table (SAFE VERSION - Can run multiple times)
-- These fields allow custom COMPLETE designation (post + department combined) to be printed on certificates and ID cards
-- If provided, this will be used instead of the default [level_prefix] [post] [department] format
-- If not provided, the system will use the default format
--
-- This version checks if columns exist before adding them - safe to run multiple times

-- Add print_as_name_en if it doesn't exist
SET @column_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'department_posts'
    AND COLUMN_NAME = 'print_as_name_en'
);

SET @sql = IF(@column_exists = 0,
  'ALTER TABLE `department_posts` ADD COLUMN `print_as_name_en` VARCHAR(255) NULL DEFAULT NULL COMMENT ''Complete English designation (post + department) to print on certificates/ID cards. If set, will be used with level prefix only.'';',
  'SELECT "Column print_as_name_en already exists, skipping." AS message;'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add print_as_name_hi if it doesn't exist
SET @column_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'department_posts'
    AND COLUMN_NAME = 'print_as_name_hi'
);

SET @sql = IF(@column_exists = 0,
  'ALTER TABLE `department_posts` ADD COLUMN `print_as_name_hi` VARCHAR(255) NULL DEFAULT NULL COMMENT ''Complete Hindi designation (post + department) to print on certificates/ID cards. If set, will be used with level prefix only.'';',
  'SELECT "Column print_as_name_hi already exists, skipping." AS message;'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

