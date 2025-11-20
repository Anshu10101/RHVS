-- Fix Permission Tables to Use SET NULL Instead of CASCADE
-- These tables track permission assignments and history
-- Optionally change to SET NULL to preserve history when admin is deleted

-- ==========================================
-- 1. district_admin_permissions
-- ==========================================
-- This table links admins to their permissions
-- CASCADE is probably fine here (permissions should be deleted with admin)
-- But if you want to preserve history, change to SET NULL

-- Check current constraint
SELECT CONSTRAINT_NAME 
FROM information_schema.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'district_admin_permissions' 
  AND COLUMN_NAME = 'district_admin_id'
  AND REFERENCED_TABLE_NAME = 'district_admins';

-- Drop existing constraint (replace CONSTRAINT_NAME from above)
-- ALTER TABLE district_admin_permissions DROP FOREIGN KEY [CONSTRAINT_NAME];

-- Add with SET NULL (optional - only if you want to preserve permission history)
-- ALTER TABLE district_admin_permissions 
-- MODIFY COLUMN district_admin_id INT NULL,
-- ADD CONSTRAINT fk_district_admin_permissions_admin 
--   FOREIGN KEY (district_admin_id) 
--   REFERENCES district_admins(id) 
--   ON DELETE SET NULL;

-- ==========================================
-- 2. district_admin_permission_assignments
-- ==========================================
-- This tracks who granted permissions to whom

-- Clean up orphaned references
UPDATE district_admin_permission_assignments dapa
LEFT JOIN district_admins da1 ON dapa.district_admin_id = da1.id
SET dapa.district_admin_id = NULL 
WHERE dapa.district_admin_id IS NOT NULL 
  AND da1.id IS NULL;

UPDATE district_admin_permission_assignments dapa
LEFT JOIN district_admins da2 ON dapa.granted_by = da2.id
SET dapa.granted_by = NULL 
WHERE dapa.granted_by IS NOT NULL 
  AND da2.id IS NULL;

-- Check current constraints
SELECT CONSTRAINT_NAME, COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'district_admin_permission_assignments' 
  AND REFERENCED_TABLE_NAME = 'district_admins';

-- Drop existing constraints (replace CONSTRAINT_NAME from above)
-- ALTER TABLE district_admin_permission_assignments DROP FOREIGN KEY [CONSTRAINT_NAME_1];
-- ALTER TABLE district_admin_permission_assignments DROP FOREIGN KEY [CONSTRAINT_NAME_2];

-- Add with SET NULL (optional - preserves assignment history)
-- ALTER TABLE district_admin_permission_assignments 
-- MODIFY COLUMN district_admin_id INT NULL,
-- MODIFY COLUMN granted_by INT NULL,
-- ADD CONSTRAINT fk_permission_assignments_admin 
--   FOREIGN KEY (district_admin_id) 
--   REFERENCES district_admins(id) 
--   ON DELETE SET NULL,
-- ADD CONSTRAINT fk_permission_assignments_granted_by 
--   FOREIGN KEY (granted_by) 
--   REFERENCES district_admins(id) 
--   ON DELETE SET NULL;

-- ==========================================
-- 3. permission_assignment_history
-- ==========================================
-- This is a history/audit log - should probably preserve it

-- Clean up orphaned references
UPDATE permission_assignment_history pah
LEFT JOIN district_admins da1 ON pah.district_admin_id = da1.id
SET pah.district_admin_id = NULL 
WHERE pah.district_admin_id IS NOT NULL 
  AND da1.id IS NULL;

UPDATE permission_assignment_history pah
LEFT JOIN district_admins da2 ON pah.granted_by = da2.id
SET pah.granted_by = NULL 
WHERE pah.granted_by IS NOT NULL 
  AND da2.id IS NULL;

-- Check current constraints
SELECT CONSTRAINT_NAME, COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'permission_assignment_history' 
  AND REFERENCED_TABLE_NAME = 'district_admins';

-- Drop existing constraints (replace CONSTRAINT_NAME from above)
-- ALTER TABLE permission_assignment_history DROP FOREIGN KEY [CONSTRAINT_NAME_1];
-- ALTER TABLE permission_assignment_history DROP FOREIGN KEY [CONSTRAINT_NAME_2];

-- Add with SET NULL (recommended - preserves audit history)
-- ALTER TABLE permission_assignment_history 
-- MODIFY COLUMN district_admin_id INT NULL,
-- MODIFY COLUMN granted_by INT NULL,
-- ADD CONSTRAINT fk_permission_history_admin 
--   FOREIGN KEY (district_admin_id) 
--   REFERENCES district_admins(id) 
--   ON DELETE SET NULL,
-- ADD CONSTRAINT fk_permission_history_granted_by 
--   FOREIGN KEY (granted_by) 
--   REFERENCES district_admins(id) 
--   ON DELETE SET NULL;

