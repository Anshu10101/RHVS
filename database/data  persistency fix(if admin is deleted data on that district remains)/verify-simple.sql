-- Simple Verification Queries for phpMyAdmin
-- Run these one at a time or all together

-- ==========================================
-- 1. Check Content Tables (Should all be SET NULL)
-- ==========================================
SELECT 
  kcu.TABLE_NAME,
  kcu.COLUMN_NAME,
  rc.DELETE_RULE,
  CASE 
    WHEN rc.DELETE_RULE = 'SET NULL' THEN '✅ CORRECT'
    WHEN rc.DELETE_RULE = 'CASCADE' THEN '❌ WRONG'
    ELSE '⚠️ CHECK'
  END as status
FROM information_schema.KEY_COLUMN_USAGE kcu
JOIN information_schema.REFERENTIAL_CONSTRAINTS rc
  ON kcu.CONSTRAINT_NAME = rc.CONSTRAINT_NAME
  AND kcu.CONSTRAINT_SCHEMA = rc.CONSTRAINT_SCHEMA
WHERE kcu.TABLE_SCHEMA = DATABASE()
  AND kcu.REFERENCED_TABLE_NAME = 'district_admins'
  AND kcu.TABLE_NAME IN (
    'sellers', 'products', 'news', 'events', 
    'photos', 'photo_events', 'photo_galleries',
    'content_origin', 'department_members', 'hero_images'
  )
ORDER BY kcu.TABLE_NAME;

-- ==========================================
-- 2. Check Permission Tables (Can be CASCADE or SET NULL)
-- ==========================================
SELECT 
  kcu.TABLE_NAME,
  kcu.COLUMN_NAME,
  rc.DELETE_RULE,
  CASE 
    WHEN rc.DELETE_RULE = 'SET NULL' THEN '✅ Preserves history'
    WHEN rc.DELETE_RULE = 'CASCADE' THEN '⚠️ Deletes with admin (OK for permissions)'
    ELSE '⚠️ CHECK'
  END as status
FROM information_schema.KEY_COLUMN_USAGE kcu
JOIN information_schema.REFERENTIAL_CONSTRAINTS rc
  ON kcu.CONSTRAINT_NAME = rc.CONSTRAINT_NAME
  AND kcu.CONSTRAINT_SCHEMA = rc.CONSTRAINT_SCHEMA
WHERE kcu.TABLE_SCHEMA = DATABASE()
  AND kcu.REFERENCED_TABLE_NAME = 'district_admins'
  AND kcu.TABLE_NAME IN (
    'district_admin_permissions',
    'district_admin_permission_assignments',
    'permission_assignment_history'
  )
ORDER BY kcu.TABLE_NAME, kcu.COLUMN_NAME;

-- ==========================================
-- 3. Check Column Nullability (Direct Check)
-- ==========================================
SELECT 
  'sellers' as table_name,
  'added_by_admin_id' as column_name,
  IS_NULLABLE,
  CASE WHEN IS_NULLABLE = 'YES' THEN '✅' ELSE '❌' END as status
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'sellers' 
  AND COLUMN_NAME = 'added_by_admin_id'

UNION ALL

SELECT 
  'products' as table_name,
  'owner_admin_id' as column_name,
  IS_NULLABLE,
  CASE WHEN IS_NULLABLE = 'YES' THEN '✅' ELSE '❌' END as status
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'products' 
  AND COLUMN_NAME = 'owner_admin_id'

UNION ALL

SELECT 
  'news' as table_name,
  'owner_admin_id' as column_name,
  IS_NULLABLE,
  CASE WHEN IS_NULLABLE = 'YES' THEN '✅' ELSE '❌' END as status
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'news' 
  AND COLUMN_NAME = 'owner_admin_id'

UNION ALL

SELECT 
  'events' as table_name,
  'owner_admin_id' as column_name,
  IS_NULLABLE,
  CASE WHEN IS_NULLABLE = 'YES' THEN '✅' ELSE '❌' END as status
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'events' 
  AND COLUMN_NAME = 'owner_admin_id'

UNION ALL

SELECT 
  'content_origin' as table_name,
  'added_by_admin_id' as column_name,
  IS_NULLABLE,
  CASE WHEN IS_NULLABLE = 'YES' THEN '✅' ELSE '❌' END as status
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'content_origin' 
  AND COLUMN_NAME = 'added_by_admin_id'

UNION ALL

SELECT 
  'department_members' as table_name,
  'assigned_by' as column_name,
  IS_NULLABLE,
  CASE WHEN IS_NULLABLE = 'YES' THEN '✅' ELSE '❌' END as status
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'department_members' 
  AND COLUMN_NAME = 'assigned_by'

UNION ALL

SELECT 
  'hero_images' as table_name,
  'added_by' as column_name,
  IS_NULLABLE,
  CASE WHEN IS_NULLABLE = 'YES' THEN '✅' ELSE '❌' END as status
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'hero_images' 
  AND COLUMN_NAME = 'added_by';

-- ==========================================
-- 4. Quick Status Summary (OPTIONAL - Run separately if needed)
-- ==========================================
-- NOTE: Run these queries separately, not together, to avoid MySQL parsing issues
-- Or just skip this section - queries 1, 2, and 3 above already show everything!

-- 4a. Count SET NULL constraints
SELECT 
  'Content tables with SET NULL' as check_type,
  COUNT(*) as count,
  '✅ All good' as status
FROM information_schema.KEY_COLUMN_USAGE kcu
JOIN information_schema.REFERENTIAL_CONSTRAINTS rc
  ON kcu.CONSTRAINT_NAME = rc.CONSTRAINT_NAME
  AND kcu.CONSTRAINT_SCHEMA = rc.CONSTRAINT_SCHEMA
WHERE kcu.TABLE_SCHEMA = 'u394238866_rhvs_db'
  AND kcu.REFERENCED_TABLE_NAME = 'district_admins'
  AND kcu.TABLE_NAME IN (
    'sellers', 'products', 'news', 'events', 
    'photos', 'photo_events', 'photo_galleries',
    'content_origin', 'department_members', 'hero_images'
  )
  AND rc.DELETE_RULE = 'SET NULL';

-- 4b. Count CASCADE constraints (should be 0)
SELECT 
  'Content tables with CASCADE (WRONG!)' as check_type,
  COUNT(*) as count,
  CASE WHEN COUNT(*) = 0 THEN '✅ None found' ELSE '❌ Need to fix!' END as status
FROM information_schema.KEY_COLUMN_USAGE kcu
JOIN information_schema.REFERENTIAL_CONSTRAINTS rc
  ON kcu.CONSTRAINT_NAME = rc.CONSTRAINT_NAME
  AND kcu.CONSTRAINT_SCHEMA = rc.CONSTRAINT_SCHEMA
WHERE kcu.TABLE_SCHEMA = 'u394238866_rhvs_db'
  AND kcu.REFERENCED_TABLE_NAME = 'district_admins'
  AND kcu.TABLE_NAME IN (
    'sellers', 'products', 'news', 'events', 
    'photos', 'photo_events', 'photo_galleries',
    'content_origin', 'department_members', 'hero_images'
  )
  AND rc.DELETE_RULE = 'CASCADE';

-- 4c. Check for orphaned data
SELECT 
  'Orphaned data in content tables' as check_type,
  (
    (SELECT COUNT(*) FROM sellers s LEFT JOIN district_admins da ON s.added_by_admin_id = da.id WHERE s.added_by_admin_id IS NOT NULL AND da.id IS NULL)
    + (SELECT COUNT(*) FROM products p LEFT JOIN district_admins da ON p.owner_admin_id = da.id WHERE p.owner_admin_id IS NOT NULL AND da.id IS NULL)
    + (SELECT COUNT(*) FROM news n LEFT JOIN district_admins da ON n.owner_admin_id = da.id WHERE n.owner_admin_id IS NOT NULL AND da.id IS NULL)
    + (SELECT COUNT(*) FROM events e LEFT JOIN district_admins da ON e.owner_admin_id = da.id WHERE e.owner_admin_id IS NOT NULL AND da.id IS NULL)
  ) as count,
  CASE WHEN (
    (SELECT COUNT(*) FROM sellers s LEFT JOIN district_admins da ON s.added_by_admin_id = da.id WHERE s.added_by_admin_id IS NOT NULL AND da.id IS NULL)
    + (SELECT COUNT(*) FROM products p LEFT JOIN district_admins da ON p.owner_admin_id = da.id WHERE p.owner_admin_id IS NOT NULL AND da.id IS NULL)
    + (SELECT COUNT(*) FROM news n LEFT JOIN district_admins da ON n.owner_admin_id = da.id WHERE n.owner_admin_id IS NOT NULL AND da.id IS NULL)
    + (SELECT COUNT(*) FROM events e LEFT JOIN district_admins da ON e.owner_admin_id = da.id WHERE e.owner_admin_id IS NOT NULL AND da.id IS NULL)
  ) = 0 THEN '✅ No orphaned data' ELSE '⚠️ Found orphaned data' END as status;

