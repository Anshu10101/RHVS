-- Simple Sellers Setup (MariaDB Compatible)
-- Run this SQL in your database

-- 1. Create sellers table
CREATE TABLE IF NOT EXISTS sellers (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  business_name VARCHAR(255),
  contact_phone VARCHAR(20) NOT NULL,
  whatsapp_number VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  district VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  delivery_info TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  added_by_admin_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (added_by_admin_id) REFERENCES district_admins(id) ON DELETE CASCADE,
  INDEX idx_district (district),
  INDEX idx_state (state),
  INDEX idx_phone (contact_phone),
  INDEX idx_active (is_active)
);

-- 2. Add seller_id column to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS seller_id VARCHAR(50) NULL AFTER category;

-- 3. Add index for seller_id
ALTER TABLE products 
ADD INDEX IF NOT EXISTS idx_seller (seller_id);

-- 4. Add foreign key constraint (only if it doesn't exist)
-- First check if constraint exists
SET @constraint_count = (
  SELECT COUNT(*) 
  FROM information_schema.KEY_COLUMN_USAGE 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'products' 
  AND COLUMN_NAME = 'seller_id'
  AND CONSTRAINT_NAME = 'fk_products_seller'
);

-- Add constraint only if it doesn't exist
SET @sql = IF(@constraint_count = 0, 
  'ALTER TABLE products ADD CONSTRAINT fk_products_seller FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE SET NULL',
  'SELECT "Foreign key constraint already exists" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 5. Add seller permissions
INSERT IGNORE INTO available_permissions (permission_key, permission_name, description, category) VALUES
('manage_sellers', 'Manage Sellers', 'Can add, edit, and delete sellers for their district', 'sellers'),
('add_sellers', 'Add Sellers', 'Can add new sellers to their district', 'sellers'),
('edit_sellers', 'Edit Sellers', 'Can edit seller details in their district', 'sellers'),
('delete_sellers', 'Delete Sellers', 'Can delete sellers from their district', 'sellers'),
('view_sellers', 'View Sellers', 'Can view seller listings for their district', 'sellers');

-- 6. Verification
SELECT 'Sellers table created successfully' as status;
SELECT COUNT(*) as seller_count FROM sellers;
SELECT COUNT(*) as permission_count FROM available_permissions WHERE category = 'sellers';
