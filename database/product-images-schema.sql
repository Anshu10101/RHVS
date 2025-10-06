-- Create product_images table for multiple images per product
CREATE TABLE IF NOT EXISTS product_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id VARCHAR(255) NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  sort_order INT DEFAULT 0,
  alt_text VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_product_id (product_id),
  INDEX idx_is_primary (is_primary),
  INDEX idx_sort_order (sort_order),
  
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Add features and specifications columns to products table if they don't exist
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS features JSON,
ADD COLUMN IF NOT EXISTS specifications JSON,
ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS reviews_count INT DEFAULT 0;
