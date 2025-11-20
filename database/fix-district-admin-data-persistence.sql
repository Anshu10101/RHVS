-- Fix Data Persistence When District Admin is Removed
-- This script ensures that all content created by a district admin remains
-- when they are removed, and is accessible to the new district admin

-- ==========================================
-- 1. FIX SELLERS TABLE (Currently uses CASCADE - will delete sellers!)
-- ==========================================
-- Change from CASCADE to SET NULL so sellers remain when admin is deleted
-- First, drop the existing constraint
SET @constraint_name = (
  SELECT CONSTRAINT_NAME 
  FROM information_schema.KEY_COLUMN_USAGE 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'sellers' 
  AND COLUMN_NAME = 'added_by_admin_id'
  AND REFERENCED_TABLE_NAME = 'district_admins'
  LIMIT 1
);

SET @sql = IF(@constraint_name IS NOT NULL,
  CONCAT('ALTER TABLE sellers DROP FOREIGN KEY ', @constraint_name),
  'SELECT "No foreign key constraint found" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- First ensure column is nullable BEFORE trying to set values to NULL
ALTER TABLE sellers MODIFY COLUMN added_by_admin_id INT NULL;

-- Clean up orphaned references (now that column is nullable)
UPDATE sellers s
LEFT JOIN district_admins da ON s.added_by_admin_id = da.id
SET s.added_by_admin_id = NULL 
WHERE s.added_by_admin_id IS NOT NULL 
  AND da.id IS NULL;

-- Add new constraint with SET NULL
ALTER TABLE sellers 
  ADD CONSTRAINT fk_sellers_admin 
    FOREIGN KEY (added_by_admin_id) 
    REFERENCES district_admins(id) 
    ON DELETE SET NULL;

-- ==========================================
-- 2. ADD FOREIGN KEY CONSTRAINTS FOR CONTENT TABLES
-- ==========================================
-- These ensure data integrity while preserving content when admin is deleted

-- News table
-- First, clean up orphaned references
UPDATE news n
LEFT JOIN district_admins da ON n.owner_admin_id = da.id
SET n.owner_admin_id = NULL 
WHERE n.owner_admin_id IS NOT NULL 
  AND da.id IS NULL;

SET @constraint_name = (
  SELECT CONSTRAINT_NAME 
  FROM information_schema.KEY_COLUMN_USAGE 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'news' 
  AND COLUMN_NAME = 'owner_admin_id'
  AND REFERENCED_TABLE_NAME = 'district_admins'
  LIMIT 1
);

-- Drop existing constraint if it exists
SET @sql = IF(@constraint_name IS NOT NULL,
  CONCAT('ALTER TABLE news DROP FOREIGN KEY ', @constraint_name),
  'SELECT "No existing constraint to drop" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add new constraint with SET NULL
SET @sql = 'ALTER TABLE news ADD CONSTRAINT fk_news_owner FOREIGN KEY (owner_admin_id) REFERENCES district_admins(id) ON DELETE SET NULL';

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Events table
-- First, clean up orphaned references
UPDATE events e
LEFT JOIN district_admins da ON e.owner_admin_id = da.id
SET e.owner_admin_id = NULL 
WHERE e.owner_admin_id IS NOT NULL 
  AND da.id IS NULL;

SET @constraint_name = (
  SELECT CONSTRAINT_NAME 
  FROM information_schema.KEY_COLUMN_USAGE 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'events' 
  AND COLUMN_NAME = 'owner_admin_id'
  AND REFERENCED_TABLE_NAME = 'district_admins'
  LIMIT 1
);

-- Drop existing constraint if it exists
SET @sql = IF(@constraint_name IS NOT NULL,
  CONCAT('ALTER TABLE events DROP FOREIGN KEY ', @constraint_name),
  'SELECT "No existing constraint to drop" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add new constraint with SET NULL
SET @sql = 'ALTER TABLE events ADD CONSTRAINT fk_events_owner FOREIGN KEY (owner_admin_id) REFERENCES district_admins(id) ON DELETE SET NULL';

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Products table
-- First, clean up orphaned references (set invalid admin_ids to NULL)
UPDATE products p
LEFT JOIN district_admins da ON p.owner_admin_id = da.id
SET p.owner_admin_id = NULL 
WHERE p.owner_admin_id IS NOT NULL 
  AND da.id IS NULL;

SET @constraint_name = (
  SELECT CONSTRAINT_NAME 
  FROM information_schema.KEY_COLUMN_USAGE 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'products' 
  AND COLUMN_NAME = 'owner_admin_id'
  AND REFERENCED_TABLE_NAME = 'district_admins'
  LIMIT 1
);

-- Drop existing constraint if it exists
SET @sql = IF(@constraint_name IS NOT NULL,
  CONCAT('ALTER TABLE products DROP FOREIGN KEY ', @constraint_name),
  'SELECT "No existing constraint to drop" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add new constraint with SET NULL
SET @sql = 'ALTER TABLE products ADD CONSTRAINT fk_products_owner FOREIGN KEY (owner_admin_id) REFERENCES district_admins(id) ON DELETE SET NULL';

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Photo events table
-- First, clean up orphaned references
UPDATE photo_events pe
LEFT JOIN district_admins da ON pe.owner_admin_id = da.id
SET pe.owner_admin_id = NULL 
WHERE pe.owner_admin_id IS NOT NULL 
  AND da.id IS NULL;

SET @constraint_name = (
  SELECT CONSTRAINT_NAME 
  FROM information_schema.KEY_COLUMN_USAGE 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'photo_events' 
  AND COLUMN_NAME = 'owner_admin_id'
  AND REFERENCED_TABLE_NAME = 'district_admins'
  LIMIT 1
);

-- Drop existing constraint if it exists
SET @sql = IF(@constraint_name IS NOT NULL,
  CONCAT('ALTER TABLE photo_events DROP FOREIGN KEY ', @constraint_name),
  'SELECT "No existing constraint to drop" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add new constraint with SET NULL
SET @sql = 'ALTER TABLE photo_events ADD CONSTRAINT fk_photo_events_owner FOREIGN KEY (owner_admin_id) REFERENCES district_admins(id) ON DELETE SET NULL';

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Photo galleries table
-- First, clean up orphaned references
UPDATE photo_galleries pg
LEFT JOIN district_admins da ON pg.owner_admin_id = da.id
SET pg.owner_admin_id = NULL 
WHERE pg.owner_admin_id IS NOT NULL 
  AND da.id IS NULL;

SET @constraint_name = (
  SELECT CONSTRAINT_NAME 
  FROM information_schema.KEY_COLUMN_USAGE 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'photo_galleries' 
  AND COLUMN_NAME = 'owner_admin_id'
  AND REFERENCED_TABLE_NAME = 'district_admins'
  LIMIT 1
);

-- Drop existing constraint if it exists
SET @sql = IF(@constraint_name IS NOT NULL,
  CONCAT('ALTER TABLE photo_galleries DROP FOREIGN KEY ', @constraint_name),
  'SELECT "No existing constraint to drop" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add new constraint with SET NULL
SET @sql = 'ALTER TABLE photo_galleries ADD CONSTRAINT fk_photo_galleries_owner FOREIGN KEY (owner_admin_id) REFERENCES district_admins(id) ON DELETE SET NULL';

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Photos table
-- First, clean up orphaned references
UPDATE photos ph
LEFT JOIN district_admins da ON ph.owner_admin_id = da.id
SET ph.owner_admin_id = NULL 
WHERE ph.owner_admin_id IS NOT NULL 
  AND da.id IS NULL;

SET @constraint_name = (
  SELECT CONSTRAINT_NAME 
  FROM information_schema.KEY_COLUMN_USAGE 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'photos' 
  AND COLUMN_NAME = 'owner_admin_id'
  AND REFERENCED_TABLE_NAME = 'district_admins'
  LIMIT 1
);

-- Drop existing constraint if it exists
SET @sql = IF(@constraint_name IS NOT NULL,
  CONCAT('ALTER TABLE photos DROP FOREIGN KEY ', @constraint_name),
  'SELECT "No existing constraint to drop" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add new constraint with SET NULL
SET @sql = 'ALTER TABLE photos ADD CONSTRAINT fk_photos_owner FOREIGN KEY (owner_admin_id) REFERENCES district_admins(id) ON DELETE SET NULL';

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Gallery images table (if exists)
SET @table_exists = (
  SELECT COUNT(*) 
  FROM information_schema.TABLES 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'gallery_images'
);

-- Clean up orphaned references first
SET @sql = IF(@table_exists > 0,
  'UPDATE gallery_images gi LEFT JOIN district_admins da ON gi.owner_admin_id = da.id SET gi.owner_admin_id = NULL WHERE gi.owner_admin_id IS NOT NULL AND da.id IS NULL',
  'SELECT "gallery_images table does not exist" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check if constraint already exists and drop it
SET @constraint_name = IF(@table_exists > 0,
  (SELECT CONSTRAINT_NAME 
   FROM information_schema.KEY_COLUMN_USAGE 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'gallery_images' 
   AND COLUMN_NAME = 'owner_admin_id'
   AND REFERENCED_TABLE_NAME = 'district_admins'
   LIMIT 1),
  NULL
);

-- Drop existing constraint if it exists
SET @sql = IF(@constraint_name IS NOT NULL AND @table_exists > 0,
  CONCAT('ALTER TABLE gallery_images DROP FOREIGN KEY ', @constraint_name),
  IF(@table_exists > 0, 'SELECT "No existing constraint to drop" as message', 'SELECT "gallery_images table does not exist" as message')
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add constraint
SET @sql = IF(@table_exists > 0,
  'ALTER TABLE gallery_images ADD CONSTRAINT fk_gallery_images_owner FOREIGN KEY (owner_admin_id) REFERENCES district_admins(id) ON DELETE SET NULL',
  'SELECT "gallery_images table does not exist" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Gallery albums table (if exists)
SET @table_exists = (
  SELECT COUNT(*) 
  FROM information_schema.TABLES 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'gallery_albums'
);

-- Clean up orphaned references first
SET @sql = IF(@table_exists > 0,
  'UPDATE gallery_albums ga LEFT JOIN district_admins da ON ga.owner_admin_id = da.id SET ga.owner_admin_id = NULL WHERE ga.owner_admin_id IS NOT NULL AND da.id IS NULL',
  'SELECT "gallery_albums table does not exist" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check if constraint already exists and drop it
SET @constraint_name = IF(@table_exists > 0,
  (SELECT CONSTRAINT_NAME 
   FROM information_schema.KEY_COLUMN_USAGE 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'gallery_albums' 
   AND COLUMN_NAME = 'owner_admin_id'
   AND REFERENCED_TABLE_NAME = 'district_admins'
   LIMIT 1),
  NULL
);

-- Drop existing constraint if it exists
SET @sql = IF(@constraint_name IS NOT NULL AND @table_exists > 0,
  CONCAT('ALTER TABLE gallery_albums DROP FOREIGN KEY ', @constraint_name),
  IF(@table_exists > 0, 'SELECT "No existing constraint to drop" as message', 'SELECT "gallery_albums table does not exist" as message')
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add constraint
SET @sql = IF(@table_exists > 0,
  'ALTER TABLE gallery_albums ADD CONSTRAINT fk_gallery_albums_owner FOREIGN KEY (owner_admin_id) REFERENCES district_admins(id) ON DELETE SET NULL',
  'SELECT "gallery_albums table does not exist" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ==========================================
-- 3. FIX CONTENT_ORIGIN TABLE
-- ==========================================
-- Ensure content_origin records remain when admin is deleted
SET @table_exists = (
  SELECT COUNT(*) 
  FROM information_schema.TABLES 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'content_origin'
);

SET @constraint_name = (
  SELECT CONSTRAINT_NAME 
  FROM information_schema.KEY_COLUMN_USAGE 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'content_origin' 
  AND COLUMN_NAME = 'added_by_admin_id'
  AND REFERENCED_TABLE_NAME = 'district_admins'
  LIMIT 1
);

SET @sql = IF(@constraint_name IS NOT NULL AND @table_exists > 0,
  CONCAT('ALTER TABLE content_origin DROP FOREIGN KEY ', @constraint_name),
  'SELECT "No foreign key constraint found or table does not exist" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Clean up orphaned references first (if table exists)
SET @sql = IF(@table_exists > 0,
  'UPDATE content_origin co LEFT JOIN district_admins da ON co.added_by_admin_id = da.id SET co.added_by_admin_id = NULL WHERE co.added_by_admin_id IS NOT NULL AND da.id IS NULL',
  'SELECT "content_origin table does not exist" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add constraint with SET NULL for added_by_admin_id (if table exists)
SET @sql = IF(@table_exists > 0,
  'ALTER TABLE content_origin MODIFY COLUMN added_by_admin_id INT NULL, ADD CONSTRAINT fk_content_origin_admin FOREIGN KEY (added_by_admin_id) REFERENCES district_admins(id) ON DELETE SET NULL',
  'SELECT "content_origin table does not exist" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ==========================================
-- 4. FIX DEPARTMENT MEMBERS ASSIGNED_BY
-- ==========================================
-- Ensure department assignments remain when admin is deleted

-- Check if table exists
SET @table_exists = (
  SELECT COUNT(*) 
  FROM information_schema.TABLES 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'department_members'
);

-- Check if column exists and get its type
SET @column_exists = (
  SELECT COUNT(*) 
  FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'department_members'
  AND COLUMN_NAME = 'assigned_by'
);

-- First, ensure column exists and is nullable with correct type (must match district_admins.id which is INT, not INT UNSIGNED)
SET @sql = IF(@table_exists > 0 AND @column_exists > 0,
  'ALTER TABLE department_members MODIFY COLUMN assigned_by INT NULL',
  'SELECT "department_members table or assigned_by column does not exist" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Clean up orphaned references
SET @sql = IF(@table_exists > 0 AND @column_exists > 0,
  'UPDATE department_members dm LEFT JOIN district_admins da ON dm.assigned_by = da.id SET dm.assigned_by = NULL WHERE dm.assigned_by IS NOT NULL AND da.id IS NULL',
  'SELECT "department_members table or assigned_by column does not exist" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Drop ANY existing foreign key constraint on assigned_by column (regardless of what it references)
SET @constraint_name = (
  SELECT CONSTRAINT_NAME 
  FROM information_schema.KEY_COLUMN_USAGE 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'department_members' 
  AND COLUMN_NAME = 'assigned_by'
  AND REFERENCED_TABLE_NAME IS NOT NULL
  LIMIT 1
);

SET @sql = IF(@constraint_name IS NOT NULL AND @table_exists > 0,
  CONCAT('ALTER TABLE department_members DROP FOREIGN KEY ', @constraint_name),
  'SELECT "No existing constraint to drop" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check if constraint name already exists (might exist with different definition)
SET @constraint_exists = (
  SELECT COUNT(*) 
  FROM information_schema.TABLE_CONSTRAINTS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'department_members' 
  AND CONSTRAINT_NAME = 'fk_dept_members_assigned_by'
);

-- Drop constraint by name if it exists
SET @sql = IF(@constraint_exists > 0 AND @table_exists > 0,
  'ALTER TABLE department_members DROP FOREIGN KEY fk_dept_members_assigned_by',
  'SELECT "Constraint fk_dept_members_assigned_by does not exist" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verify district_admins.id exists and get its type
SET @ref_table_exists = (
  SELECT COUNT(*) 
  FROM information_schema.TABLES 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'district_admins'
);

SET @ref_column_type = (
  SELECT COLUMN_TYPE 
  FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'district_admins'
  AND COLUMN_NAME = 'id'
  LIMIT 1
);

-- Add new constraint only if everything is correct
-- NOTE: If this ALTER TABLE fails with error 150, it may be due to table structure issues.
-- The data cleanup above is already done, so data will persist even without this constraint.
-- You can manually add it later if needed: 
-- ALTER TABLE department_members ADD CONSTRAINT fk_dept_members_assigned_by FOREIGN KEY (assigned_by) REFERENCES district_admins(id) ON DELETE SET NULL;
SET @sql = IF(@table_exists > 0 AND @column_exists > 0 AND @ref_table_exists > 0,
  'ALTER TABLE department_members ADD CONSTRAINT fk_dept_members_assigned_by FOREIGN KEY (assigned_by) REFERENCES district_admins(id) ON DELETE SET NULL',
  CONCAT('SELECT "Skipping: table_exists=', @table_exists, ', column_exists=', @column_exists, ', ref_table_exists=', @ref_table_exists, '" as message')
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ==========================================
-- 5. FIX HERO IMAGES TABLES
-- ==========================================
-- Ensure hero images remain when admin is deleted

-- Fix hero_images table (has added_by with CASCADE)
SET @table_exists = (
  SELECT COUNT(*) 
  FROM information_schema.TABLES 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'hero_images'
);

SET @constraint_name = (
  SELECT CONSTRAINT_NAME 
  FROM information_schema.KEY_COLUMN_USAGE 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'hero_images' 
  AND COLUMN_NAME = 'added_by'
  AND REFERENCED_TABLE_NAME = 'district_admins'
  LIMIT 1
);

SET @sql = IF(@constraint_name IS NOT NULL AND @table_exists > 0,
  CONCAT('ALTER TABLE hero_images DROP FOREIGN KEY ', @constraint_name),
  'SELECT "No foreign key constraint found or table does not exist" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- First ensure column is nullable BEFORE trying to set values to NULL
SET @sql = IF(@table_exists > 0,
  'ALTER TABLE hero_images MODIFY COLUMN added_by INT NULL',
  'SELECT "hero_images table does not exist" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check how many orphaned records exist first
SET @orphaned_count = IF(@table_exists > 0,
  (SELECT COUNT(*) FROM hero_images hi LEFT JOIN district_admins da ON hi.added_by = da.id WHERE hi.added_by IS NOT NULL AND da.id IS NULL),
  0
);

-- Clean up orphaned references (now that column is nullable)
SET @sql = IF(@table_exists > 0,
  'UPDATE hero_images hi LEFT JOIN district_admins da ON hi.added_by = da.id SET hi.added_by = NULL WHERE hi.added_by IS NOT NULL AND da.id IS NULL',
  'SELECT "hero_images table does not exist, skipping cleanup" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Report cleanup results
SELECT IF(@table_exists > 0, CONCAT('Cleaned up ', @orphaned_count, ' orphaned hero_images.added_by references'), 'hero_images table does not exist') as cleanup_status;

-- Now add constraint with SET NULL for added_by (if table exists)
SET @sql = IF(@table_exists > 0,
  'ALTER TABLE hero_images ADD CONSTRAINT fk_hero_images_added_by FOREIGN KEY (added_by) REFERENCES district_admins(id) ON DELETE SET NULL',
  'SELECT "hero_images table does not exist" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ==========================================
-- 6. VERIFICATION QUERIES
-- ==========================================
-- Run these to verify the changes

SELECT 'Data Persistence Fix Applied Successfully!' as status;

-- Show all foreign key constraints related to district_admins
SELECT 
  TABLE_NAME,
  COLUMN_NAME,
  CONSTRAINT_NAME,
  REFERENCED_TABLE_NAME,
  REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
  AND REFERENCED_TABLE_NAME = 'district_admins'
ORDER BY TABLE_NAME, COLUMN_NAME;
