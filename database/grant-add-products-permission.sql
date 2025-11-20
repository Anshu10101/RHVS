-- Grant add_products permission to a specific district admin without expiry
-- This will allow them to manage products indefinitely

-- STEP 1: First, find the correct admin ID by running this:
-- SELECT id, name, email, district, state, is_active FROM district_admins WHERE is_active = 1 ORDER BY id;

-- STEP 2: Replace [ADMIN_ID] below with the actual admin ID from step 1

-- First, deactivate all expired add_products permissions for the admin
UPDATE district_admin_permissions 
SET is_active = 0 
WHERE district_admin_id = [ADMIN_ID]  -- Replace [ADMIN_ID] with actual ID
AND permission = 'add_products'
AND (expires_at < NOW() OR expires_at IS NOT NULL);

-- Then insert a new active permission without expiry (permanent)
INSERT INTO district_admin_permissions (district_admin_id, permission, granted_by, is_active, expires_at, granted_at)
VALUES ([ADMIN_ID], 'add_products', 1, 1, NULL, NOW());  -- Replace [ADMIN_ID] with actual ID

-- ============================================
-- For admin ID 10 (if needed):
-- ============================================
-- UPDATE district_admin_permissions 
-- SET is_active = 0 
-- WHERE district_admin_id = 10 
-- AND permission = 'add_products'
-- AND (expires_at < NOW() OR expires_at IS NOT NULL);
-- 
-- INSERT INTO district_admin_permissions (district_admin_id, permission, granted_by, is_active, expires_at, granted_at)
-- VALUES (10, 'add_products', 1, 1, NULL, NOW());

-- Or if you want to grant it to all active district admins:
-- INSERT INTO district_admin_permissions (district_admin_id, permission, granted_by, is_active, expires_at)
-- SELECT 
--   da.id, 
--   'add_products', 
--   1, -- Change to your superadmin ID
--   1,
--   NULL -- No expiry
-- FROM district_admins da
-- WHERE da.is_active = 1
-- AND NOT EXISTS (
--   SELECT 1 
--   FROM district_admin_permissions dap 
--   WHERE dap.district_admin_id = da.id 
--   AND dap.permission = 'add_products'
--   AND dap.is_active = 1
--   AND (dap.expires_at IS NULL OR dap.expires_at > NOW())
-- );

