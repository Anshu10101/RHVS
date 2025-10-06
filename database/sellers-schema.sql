-- Sellers Management Schema for RHVS
-- This schema adds seller management to the existing district admin system

-- Sellers table (one per seller across all districts)
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

-- Add seller_id to products table (if column doesn't exist)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS seller_id VARCHAR(50) NULL AFTER category,
ADD INDEX IF NOT EXISTS idx_seller (seller_id);

-- Add foreign key constraint if it doesn't exist
-- Note: We'll add this constraint after ensuring all data is clean
-- ALTER TABLE products ADD CONSTRAINT fk_products_seller 
-- FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE SET NULL;
