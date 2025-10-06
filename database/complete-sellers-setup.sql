-- Complete Sellers System Setup
-- Run this entire script to set up the sellers management system

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

-- 2. Add seller_id to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS seller_id VARCHAR(50) NULL AFTER category,
ADD INDEX IF NOT EXISTS idx_seller (seller_id);

-- 3. Add foreign key constraint (check if exists first)
SET @constraint_exists = (
  SELECT COUNT(*) 
  FROM information_schema.KEY_COLUMN_USAGE 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'products' 
  AND COLUMN_NAME = 'seller_id'
  AND CONSTRAINT_NAME = 'fk_products_seller'
);

-- Only add constraint if it doesn't exist
SET @sql = IF(@constraint_exists = 0, 
  'ALTER TABLE products ADD CONSTRAINT fk_products_seller FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE SET NULL',
  'SELECT "Foreign key constraint already exists" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. Add seller permissions to available_permissions table
INSERT IGNORE INTO available_permissions (permission_key, permission_name, description, category) VALUES
('manage_sellers', 'Manage Sellers', 'Can add, edit, and delete sellers for their district', 'sellers'),
('add_sellers', 'Add Sellers', 'Can add new sellers to their district', 'sellers'),
('edit_sellers', 'Edit Sellers', 'Can edit seller details in their district', 'sellers'),
('delete_sellers', 'Delete Sellers', 'Can delete sellers from their district', 'sellers'),
('view_sellers', 'View Sellers', 'Can view seller listings for their district', 'sellers');

-- 5. Sample seller data (optional - for testing)
INSERT IGNORE INTO sellers (
  id, name, business_name, contact_phone, whatsapp_number, email, 
  address, district, state, delivery_info, is_active, added_by_admin_id
) VALUES (
  'seller_sample_1',
  'Sample Seller',
  'Spiritual Store',
  '9876543210',
  '9876543210',
  'sample@spiritualstore.com',
  'Main Market, Sample District',
  'Sample District',
  'Sample State',
  'Free delivery within 10km, ₹50 beyond',
  TRUE,
  1
);

-- 6. Verification queries
SELECT 'Sellers table created successfully' as status;
SELECT COUNT(*) as seller_count FROM sellers;
SELECT COUNT(*) as permission_count FROM available_permissions WHERE category = 'sellers';

-- 7. Show table structure
DESCRIBE sellers;
DESCRIBE products;
