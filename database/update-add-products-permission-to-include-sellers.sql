-- Update add_products permission to include sellers management
-- This updates the permission name and description to reflect that it includes full seller management

UPDATE available_permissions
SET 
  permission_name = 'Add Products & Manage Sellers',
  description = 'Can add, edit, and delete products, and fully manage sellers (add, edit, delete, view) for their district'
WHERE permission_key = 'add_products';

-- Note: The code will automatically grant seller permissions when add_products is granted
-- This SQL just updates the display name and description

