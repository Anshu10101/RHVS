-- Remove seller permissions from database
-- These permissions should NOT be stored - they are automatically implied by add_products
-- This script removes any existing seller permission records

-- Deactivate all seller permission records
UPDATE district_admin_permissions 
SET is_active = 0 
WHERE permission IN ('manage_sellers', 'add_sellers', 'edit_sellers', 'delete_sellers', 'view_sellers')
AND is_active = 1;

-- Also remove from permission assignments table if it exists
UPDATE district_admin_permission_assignments 
SET is_active = false 
WHERE permission_key IN ('manage_sellers', 'add_sellers', 'edit_sellers', 'delete_sellers', 'view_sellers')
AND is_active = true;

-- Note: Seller permissions will still work because they are automatically granted
-- when add_products permission is present (handled in admin-scope.ts)


