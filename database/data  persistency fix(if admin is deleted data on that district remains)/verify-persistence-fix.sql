-- Verification Script for Data Persistence Fix
-- Run this AFTER implementing the fix to verify everything is correct

-- ==========================================
-- 1. CHECK ALL FOREIGN KEY CONSTRAINTS
-- ==========================================
SELECT 
  '=== FOREIGN KEY CONSTRAINTS ===' as section;

SELECT 
  kcu.TABLE_NAME,
  kcu.COLUMN_NAME,
  kcu.CONSTRAINT_NAME,
  kcu.REFERENCED_TABLE_NAME,
  rc.DELETE_RULE,
  CASE 
    WHEN rc.DELETE_RULE = 'SET NULL' THEN '✅ CORRECT'
    WHEN rc.DELETE_RULE = 'CASCADE' THEN '❌ WRONG - Will delete data!'
    ELSE '⚠️ CHECK'
  END as status
FROM information_schema.KEY_COLUMN_USAGE kcu
JOIN information_schema.REFERENTIAL_CONSTRAINTS rc
  ON kcu.CONSTRAINT_NAME = rc.CONSTRAINT_NAME
  AND kcu.CONSTRAINT_SCHEMA = rc.CONSTRAINT_SCHEMA
WHERE kcu.TABLE_SCHEMA = DATABASE()
  AND kcu.REFERENCED_TABLE_NAME = 'district_admins'
ORDER BY kcu.TABLE_NAME, kcu.COLUMN_NAME;

-- ==========================================
-- 2. CHECK FOR ORPHANED DATA
-- ==========================================
SELECT 
  '=== ORPHANED DATA CHECK ===' as section;

-- Sellers
SELECT 
  'sellers' as table_name,
  COUNT(*) as orphaned_count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ No orphaned data'
    ELSE CONCAT('⚠️ ', COUNT(*), ' orphaned records found')
  END as status
FROM sellers s
LEFT JOIN district_admins da ON s.added_by_admin_id = da.id
WHERE s.added_by_admin_id IS NOT NULL AND da.id IS NULL

UNION ALL

-- Products
SELECT 
  'products' as table_name,
  COUNT(*) as orphaned_count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ No orphaned data'
    ELSE CONCAT('⚠️ ', COUNT(*), ' orphaned records found')
  END as status
FROM products p
LEFT JOIN district_admins da ON p.owner_admin_id = da.id
WHERE p.owner_admin_id IS NOT NULL AND da.id IS NULL

UNION ALL

-- News
SELECT 
  'news' as table_name,
  COUNT(*) as orphaned_count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ No orphaned data'
    ELSE CONCAT('⚠️ ', COUNT(*), ' orphaned records found')
  END as status
FROM news n
LEFT JOIN district_admins da ON n.owner_admin_id = da.id
WHERE n.owner_admin_id IS NOT NULL AND da.id IS NULL

UNION ALL

-- Events
SELECT 
  'events' as table_name,
  COUNT(*) as orphaned_count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ No orphaned data'
    ELSE CONCAT('⚠️ ', COUNT(*), ' orphaned records found')
  END as status
FROM events e
LEFT JOIN district_admins da ON e.owner_admin_id = da.id
WHERE e.owner_admin_id IS NOT NULL AND da.id IS NULL

UNION ALL

-- Content Origin
SELECT 
  'content_origin' as table_name,
  COUNT(*) as orphaned_count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ No orphaned data'
    ELSE CONCAT('⚠️ ', COUNT(*), ' orphaned records found')
  END as status
FROM content_origin co
LEFT JOIN district_admins da ON co.added_by_admin_id = da.id
WHERE co.added_by_admin_id IS NOT NULL AND da.id IS NULL

UNION ALL

-- Department Members
SELECT 
  'department_members' as table_name,
  COUNT(*) as orphaned_count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ No orphaned data'
    ELSE CONCAT('⚠️ ', COUNT(*), ' orphaned records found')
  END as status
FROM department_members dm
LEFT JOIN district_admins da ON dm.assigned_by = da.id
WHERE dm.assigned_by IS NOT NULL AND da.id IS NULL

UNION ALL

-- Hero Images (if table exists)
SELECT 
  'hero_images' as table_name,
  COUNT(*) as orphaned_count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ No orphaned data'
    ELSE CONCAT('⚠️ ', COUNT(*), ' orphaned records found')
  END as status
FROM hero_images hi
LEFT JOIN district_admins da ON hi.added_by = da.id
WHERE hi.added_by IS NOT NULL AND da.id IS NULL;

-- ==========================================
-- 3. CHECK COLUMN NULLABILITY
-- ==========================================
SELECT 
  '=== COLUMN NULLABILITY CHECK ===' as section;

SELECT 
  TABLE_NAME,
  COLUMN_NAME,
  IS_NULLABLE,
  CASE 
    WHEN IS_NULLABLE = 'YES' THEN '✅ Nullable'
    ELSE '❌ NOT Nullable - May cause issues!'
  END as status
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND (
    (TABLE_NAME = 'sellers' AND COLUMN_NAME = 'added_by_admin_id') OR
    (TABLE_NAME = 'products' AND COLUMN_NAME = 'owner_admin_id') OR
    (TABLE_NAME = 'news' AND COLUMN_NAME = 'owner_admin_id') OR
    (TABLE_NAME = 'events' AND COLUMN_NAME = 'owner_admin_id') OR
    (TABLE_NAME = 'content_origin' AND COLUMN_NAME = 'added_by_admin_id') OR
    (TABLE_NAME = 'department_members' AND COLUMN_NAME = 'assigned_by') OR
    (TABLE_NAME = 'hero_images' AND COLUMN_NAME = 'added_by')
  )
ORDER BY TABLE_NAME, COLUMN_NAME;

-- ==========================================
-- 4. SUMMARY
-- ==========================================
SELECT 
  '=== SUMMARY ===' as section;

SELECT 
  'Total tables with district_admin foreign keys' as metric,
  COUNT(DISTINCT kcu.TABLE_NAME) as value
FROM information_schema.KEY_COLUMN_USAGE kcu
WHERE kcu.TABLE_SCHEMA = DATABASE()
  AND kcu.REFERENCED_TABLE_NAME = 'district_admins'

UNION ALL

SELECT 
  'Tables with SET NULL constraint' as metric,
  COUNT(DISTINCT kcu.TABLE_NAME) as value
FROM information_schema.KEY_COLUMN_USAGE kcu
JOIN information_schema.REFERENTIAL_CONSTRAINTS rc
  ON kcu.CONSTRAINT_NAME = rc.CONSTRAINT_NAME
  AND kcu.CONSTRAINT_SCHEMA = rc.CONSTRAINT_SCHEMA
WHERE kcu.TABLE_SCHEMA = DATABASE()
  AND kcu.REFERENCED_TABLE_NAME = 'district_admins'
  AND rc.DELETE_RULE = 'SET NULL'

UNION ALL

SELECT 
  'Tables with CASCADE constraint (WRONG!)' as metric,
  COUNT(DISTINCT kcu.TABLE_NAME) as value
FROM information_schema.KEY_COLUMN_USAGE kcu
JOIN information_schema.REFERENTIAL_CONSTRAINTS rc
  ON kcu.CONSTRAINT_NAME = rc.CONSTRAINT_NAME
  AND kcu.CONSTRAINT_SCHEMA = rc.CONSTRAINT_SCHEMA
WHERE kcu.TABLE_SCHEMA = DATABASE()
  AND kcu.REFERENCED_TABLE_NAME = 'district_admins'
  AND rc.DELETE_RULE = 'CASCADE';

-- ==========================================
-- 5. FINAL STATUS
-- ==========================================
SELECT 
  '=== FINAL STATUS ===' as section;

SELECT 
  CASE 
    WHEN (
      SELECT COUNT(*) 
      FROM information_schema.REFERENTIAL_CONSTRAINTS rc
      JOIN information_schema.KEY_COLUMN_USAGE kcu
        ON rc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
      WHERE kcu.TABLE_SCHEMA = DATABASE()
        AND kcu.REFERENCED_TABLE_NAME = 'district_admins'
        AND rc.DELETE_RULE = 'CASCADE'
    ) = 0 
    THEN '✅ SUCCESS - All constraints use SET NULL'
    ELSE '❌ WARNING - Some constraints still use CASCADE'
  END as overall_status;

