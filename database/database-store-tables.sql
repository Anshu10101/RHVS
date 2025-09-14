-- Product Store Tables for RHVS Admin Dashboard

-- Product Categories Table
CREATE TABLE IF NOT EXISTS product_categories (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  isVisible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Products Table
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  original_price DECIMAL(10,2) DEFAULT NULL,
  category VARCHAR(255),
  image_path VARCHAR(500),
  isVisible BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  stock INT DEFAULT 0,
  tags JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by VARCHAR(255) DEFAULT 'admin',
  FOREIGN KEY (category) REFERENCES product_categories(id) ON DELETE SET NULL
);

-- Insert some default categories
INSERT INTO product_categories (id, name, description, isVisible) VALUES
('cat_1', 'Spiritual Items', 'Sacred and spiritual products for worship and devotion', TRUE),
('cat_2', 'Puja Items', 'Essential items for performing puja and religious ceremonies', TRUE),
('cat_3', 'Sacred Items', 'Holy and blessed items for spiritual practices', TRUE),
('cat_4', 'Jewelry', 'Spiritual and religious jewelry items', TRUE),
('cat_5', 'Books & Literature', 'Religious books, scriptures, and spiritual literature', TRUE);

-- Insert some sample products
INSERT INTO products (id, name, description, price, original_price, category, image_path, isVisible, is_featured, stock, tags) VALUES
('prod_1', 'Rudraksha Mala', 'Authentic 108 bead Rudraksha mala for meditation and spiritual practice', 1500.00, 2000.00, 'cat_1', '/product/p1.jpg', TRUE, TRUE, 25, '["rudraksha", "mala", "meditation", "spiritual"]'),
('prod_2', 'Sandalwood Incense Sticks', 'Pure sandalwood incense sticks for puja and meditation', 250.00, 300.00, 'cat_2', '/product/p2.jpg', TRUE, FALSE, 50, '["incense", "sandalwood", "puja", "fragrance"]'),
('prod_3', 'Ganesha Idol', 'Beautiful brass Ganesha idol for home worship', 800.00, 1000.00, 'cat_3', '/product/p3.jpg', TRUE, TRUE, 15, '["ganesha", "idol", "brass", "worship"]'),
('prod_4', 'Tulsi Mala', 'Sacred Tulsi mala with 108 beads for daily prayers', 600.00, 750.00, 'cat_1', '/product/p4.jpg', TRUE, FALSE, 30, '["tulsi", "mala", "prayer", "sacred"]'),
('prod_5', 'Copper Puja Thali', 'Traditional copper puja thali for religious ceremonies', 450.00, 550.00, 'cat_2', '/product/p5.jpg', TRUE, FALSE, 20, '["copper", "thali", "puja", "ceremony"]');
