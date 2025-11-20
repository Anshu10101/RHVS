-- Grant seller permissions to all district admins who already have add_products permission
-- This fixes existing admins who have add_products but are missing seller permissions

-- Seller permissions to grant
SET @seller_permissions = 'manage_sellers,add_sellers,edit_sellers,delete_sellers,view_sellers';

-- For each district admin who has add_products permission, grant all seller permissions
INSERT INTO district_admin_permissions (district_admin_id, permission, granted_by, is_active, expires_at, granted_at)
SELECT DISTINCT
  dap.district_admin_id,
  seller_perm.permission,
  1, -- granted by superadmin (ID 1)
  1, -- is_active
  dap.expires_at, -- Use same expiry as add_products permission
  NOW() -- granted_at
FROM district_admin_permissions dap
CROSS JOIN (
  SELECT 'manage_sellers' as permission
  UNION ALL SELECT 'add_sellers'
  UNION ALL SELECT 'edit_sellers'
  UNION ALL SELECT 'delete_sellers'
  UNION ALL SELECT 'view_sellers'
) seller_perm
WHERE dap.permission = 'add_products'
  AND dap.is_active = 1
  AND (dap.expires_at IS NULL OR dap.expires_at > NOW())
  -- Only insert if the seller permission doesn't already exist for this admin
  AND NOT EXISTS (
    SELECT 1 FROM district_admin_permissions dap2
    WHERE dap2.district_admin_id = dap.district_admin_id
      AND dap2.permission = seller_perm.permission
      AND dap2.is_active = 1
      AND (dap2.expires_at IS NULL OR dap2.expires_at > NOW())
  );

-- Show summary
SELECT 
  'Summary: Seller permissions granted to district admins with add_products' as message,
  COUNT(DISTINCT district_admin_id) as admins_updated,
  COUNT(*) as total_permissions_granted
FROM district_admin_permissions
WHERE permission IN ('manage_sellers', 'add_sellers', 'edit_sellers', 'delete_sellers', 'view_sellers')
  AND granted_at >= NOW() - INTERVAL 1 MINUTE; -- Only count permissions just granted

