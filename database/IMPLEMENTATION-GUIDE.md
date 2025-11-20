# Data Persistence Fix - Implementation Guide for Live Database

## Overview
This guide helps you implement the data persistence fixes on your live/production database safely.

## Pre-Implementation Checklist

### 1. Backup Your Database
**CRITICAL - DO THIS FIRST!**
```sql
-- Export entire database backup
mysqldump -u username -p database_name > backup_before_persistence_fix.sql
```

Or via phpMyAdmin:
- Go to Export tab
- Select "Custom" method
- Choose all tables
- Export and save the file

### 2. Verify Current State
Run these queries to see what needs fixing:

```sql
-- Check current foreign key constraints on district_admins
SELECT 
  TABLE_NAME,
  COLUMN_NAME,
  CONSTRAINT_NAME,
  REFERENCED_TABLE_NAME,
  DELETE_RULE
FROM information_schema.REFERENTIAL_CONSTRAINTS rc
JOIN information_schema.KEY_COLUMN_USAGE kcu 
  ON rc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
WHERE kcu.TABLE_SCHEMA = DATABASE()
  AND kcu.REFERENCED_TABLE_NAME = 'district_admins'
ORDER BY TABLE_NAME, COLUMN_NAME;
```

## Step-by-Step Implementation

### Step 1: Fix Sellers Table
```sql
-- Check current constraint
SHOW CREATE TABLE sellers;

-- Drop existing constraint (if exists)
-- Find constraint name first:
SELECT CONSTRAINT_NAME 
FROM information_schema.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'sellers' 
  AND COLUMN_NAME = 'added_by_admin_id'
  AND REFERENCED_TABLE_NAME = 'district_admins';

-- Then drop it (replace CONSTRAINT_NAME):
-- ALTER TABLE sellers DROP FOREIGN KEY CONSTRAINT_NAME;

-- Clean up orphaned references
UPDATE sellers s
LEFT JOIN district_admins da ON s.added_by_admin_id = da.id
SET s.added_by_admin_id = NULL 
WHERE s.added_by_admin_id IS NOT NULL 
  AND da.id IS NULL;

-- Add new constraint
ALTER TABLE sellers 
  MODIFY COLUMN added_by_admin_id INT NULL,
  ADD CONSTRAINT fk_sellers_admin 
    FOREIGN KEY (added_by_admin_id) 
    REFERENCES district_admins(id) 
    ON DELETE SET NULL;
```

### Step 2: Fix Content Tables (News, Events, Products, etc.)

For each table (news, events, products, photo_events, photo_galleries, photos):

```sql
-- Example for 'news' table - repeat for others
-- 1. Clean up orphaned references
UPDATE news n
LEFT JOIN district_admins da ON n.owner_admin_id = da.id
SET n.owner_admin_id = NULL 
WHERE n.owner_admin_id IS NOT NULL 
  AND da.id IS NULL;

-- 2. Check if constraint exists
SELECT CONSTRAINT_NAME 
FROM information_schema.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'news' 
  AND COLUMN_NAME = 'owner_admin_id'
  AND REFERENCED_TABLE_NAME = 'district_admins';

-- 3. Add constraint (if doesn't exist)
ALTER TABLE news 
ADD CONSTRAINT fk_news_owner 
FOREIGN KEY (owner_admin_id) 
REFERENCES district_admins(id) 
ON DELETE SET NULL;
```

**Tables to fix:**
- `news` → `owner_admin_id`
- `events` → `owner_admin_id`
- `products` → `owner_admin_id`
- `photo_events` → `owner_admin_id`
- `photo_galleries` → `owner_admin_id`
- `photos` → `owner_admin_id`
- `gallery_images` → `owner_admin_id` (if exists)
- `gallery_albums` → `owner_admin_id` (if exists)

### Step 3: Fix Content Origin Table
```sql
-- Clean up orphaned references
UPDATE content_origin co
LEFT JOIN district_admins da ON co.added_by_admin_id = da.id
SET co.added_by_admin_id = NULL 
WHERE co.added_by_admin_id IS NOT NULL 
  AND da.id IS NULL;

-- Drop existing constraint if exists
SELECT CONSTRAINT_NAME 
FROM information_schema.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'content_origin' 
  AND COLUMN_NAME = 'added_by_admin_id'
  AND REFERENCED_TABLE_NAME = 'district_admins';

-- Add constraint
ALTER TABLE content_origin 
MODIFY COLUMN added_by_admin_id INT NULL,
ADD CONSTRAINT fk_content_origin_admin 
FOREIGN KEY (added_by_admin_id) 
REFERENCES district_admins(id) 
ON DELETE SET NULL;
```

### Step 4: Fix Department Members
```sql
-- Clean up orphaned references
UPDATE department_members dm
LEFT JOIN district_admins da ON dm.assigned_by = da.id
SET dm.assigned_by = NULL 
WHERE dm.assigned_by IS NOT NULL 
  AND da.id IS NULL;

-- Ensure column is correct type
ALTER TABLE department_members 
MODIFY COLUMN assigned_by INT NULL;

-- Drop existing constraint if exists
SELECT CONSTRAINT_NAME 
FROM information_schema.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'department_members' 
  AND COLUMN_NAME = 'assigned_by'
  AND REFERENCED_TABLE_NAME IS NOT NULL;

-- Add constraint (may fail - that's okay, data is already cleaned)
ALTER TABLE department_members 
ADD CONSTRAINT fk_dept_members_assigned_by 
FOREIGN KEY (assigned_by) 
REFERENCES district_admins(id) 
ON DELETE SET NULL;
```

### Step 5: Fix Hero Images
```sql
-- Check for orphaned references
SELECT COUNT(*) as orphaned_count
FROM hero_images hi 
LEFT JOIN district_admins da ON hi.added_by = da.id 
WHERE hi.added_by IS NOT NULL 
  AND da.id IS NULL;

-- Clean them up
UPDATE hero_images hi 
LEFT JOIN district_admins da ON hi.added_by = da.id 
SET hi.added_by = NULL 
WHERE hi.added_by IS NOT NULL 
  AND da.id IS NULL;

-- Drop existing constraint if exists
SELECT CONSTRAINT_NAME 
FROM information_schema.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'hero_images' 
  AND COLUMN_NAME = 'added_by'
  AND REFERENCED_TABLE_NAME = 'district_admins';

-- Ensure column is nullable
ALTER TABLE hero_images 
MODIFY COLUMN added_by INT NULL;

-- Add constraint
ALTER TABLE hero_images 
ADD CONSTRAINT fk_hero_images_added_by 
FOREIGN KEY (added_by) 
REFERENCES district_admins(id) 
ON DELETE SET NULL;
```

## Verification Queries

After implementation, run these to verify everything is correct:

### 1. Check All Foreign Key Constraints
```sql
SELECT 
  kcu.TABLE_NAME,
  kcu.COLUMN_NAME,
  kcu.CONSTRAINT_NAME,
  kcu.REFERENCED_TABLE_NAME,
  rc.DELETE_RULE
FROM information_schema.KEY_COLUMN_USAGE kcu
JOIN information_schema.REFERENTIAL_CONSTRAINTS rc
  ON kcu.CONSTRAINT_NAME = rc.CONSTRAINT_NAME
WHERE kcu.TABLE_SCHEMA = DATABASE()
  AND kcu.REFERENCED_TABLE_NAME = 'district_admins'
ORDER BY kcu.TABLE_NAME, kcu.COLUMN_NAME;
```

**Expected Result:** All content tables should show `DELETE_RULE = 'SET NULL'`

### 2. Check for Orphaned Data
```sql
-- Check sellers
SELECT COUNT(*) as orphaned_sellers
FROM sellers s
LEFT JOIN district_admins da ON s.added_by_admin_id = da.id
WHERE s.added_by_admin_id IS NOT NULL AND da.id IS NULL;

-- Check products
SELECT COUNT(*) as orphaned_products
FROM products p
LEFT JOIN district_admins da ON p.owner_admin_id = da.id
WHERE p.owner_admin_id IS NOT NULL AND da.id IS NULL;

-- Check news
SELECT COUNT(*) as orphaned_news
FROM news n
LEFT JOIN district_admins da ON n.owner_admin_id = da.id
WHERE n.owner_admin_id IS NOT NULL AND da.id IS NULL;

-- Check events
SELECT COUNT(*) as orphaned_events
FROM events e
LEFT JOIN district_admins da ON e.owner_admin_id = da.id
WHERE e.owner_admin_id IS NOT NULL AND da.id IS NULL;
```

**Expected Result:** All should return `0` (no orphaned data)

### 3. Test Data Persistence
```sql
-- Create a test scenario (DO THIS ON TEST DATA ONLY!)
-- 1. Note a district admin ID and their content
SELECT id, email, district FROM district_admins LIMIT 1;

-- 2. Check their content
SELECT COUNT(*) as product_count FROM products WHERE owner_admin_id = [ADMIN_ID];
SELECT COUNT(*) as news_count FROM news WHERE owner_admin_id = [ADMIN_ID];

-- 3. Delete the admin (TEST ONLY!)
-- DELETE FROM district_admins WHERE id = [ADMIN_ID];

-- 4. Verify content still exists with NULL admin_id
SELECT COUNT(*) as products_with_null FROM products WHERE owner_admin_id IS NULL;
SELECT COUNT(*) as news_with_null FROM news WHERE owner_admin_id IS NULL;

-- 5. Restore the admin (if testing)
-- Re-insert the admin record
```

## Quick Implementation Option

If you want to use the automated script:

1. **Backup first!**
2. Run `fix-district-admin-data-persistence.sql` in sections:
   - Run up to sellers table, verify
   - Run content tables section, verify
   - Run content_origin, verify
   - Run department_members, verify (may fail - that's okay)
   - Run hero_images, verify

3. After each section, run the verification queries above

## Post-Implementation

1. **Test the application:**
   - Log in as district admin
   - Verify you can see all content (products, news, events, etc.)
   - Create new content
   - Verify it saves correctly

2. **Monitor for errors:**
   - Check application logs
   - Check database error logs
   - Verify no foreign key constraint errors

3. **Document changes:**
   - Note which constraints were added
   - Note any that failed (like department_members if it fails)
   - Keep backup for at least 30 days

## Troubleshooting

### If a constraint fails to add:
- **Not critical** - The data cleanup is more important
- Data will still persist when admin is deleted
- You can try adding it manually later
- Document which ones failed

### If you see orphaned data after cleanup:
- Run the cleanup queries again
- Check if there are admins that were deleted before the fix
- This is expected for old data

### If application breaks:
- Restore from backup immediately
- Check error logs
- Verify all constraints are correct
- Contact support if needed

## Success Criteria

✅ All foreign key constraints show `ON DELETE SET NULL`  
✅ No orphaned data (all cleanup queries return 0)  
✅ Application works normally  
✅ Can create/edit/delete content  
✅ No database errors in logs  

