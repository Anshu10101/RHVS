-- Add permission for assigning members to departments
-- This permission is permanent by default, meaning district admins have it by default
-- Superadmin can revoke it temporarily and grant it back permanently

INSERT INTO available_permissions (permission_key, permission_name, description, category, default_type, created_at)
VALUES (
  'assign_members_to_departments',
  'Assign Members to Departments',
  'Can assign members to department posts at district, state, or national level (excluding National Executive)',
  'members',
  'permanent',
  NOW()
);

-- Grant this permission to all existing district admins (since it's permanent by default)
INSERT INTO district_admin_permissions (district_admin_id, permission, granted_by, is_active, expires_at, granted_at)
SELECT 
  da.id,
  'assign_members_to_departments',
  1, -- granted by superadmin (ID 1)
  1, -- is_active
  NULL, -- expires_at (permanent)
  NOW() -- granted_at
FROM district_admins da
WHERE da.is_active = 1
AND NOT EXISTS (
  SELECT 1 FROM district_admin_permissions dap
  WHERE dap.district_admin_id = da.id
  AND dap.permission = 'assign_members_to_departments'
  AND dap.is_active = 1
);

