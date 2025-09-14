-- RHVS Content Management Database Tables
-- Run this SQL in your Hostinger MySQL database

-- 1. About Page Sections Table
CREATE TABLE IF NOT EXISTS about_sections (
  id VARCHAR(50) PRIMARY KEY,
  type ENUM('hero', 'card', 'quote', 'paragraph', 'heading') NOT NULL,
  title VARCHAR(500),
  content TEXT NOT NULL,
  `order` INT NOT NULL,
  isVisible BOOLEAN DEFAULT TRUE,
  styling JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by VARCHAR(100) NOT NULL,
  INDEX idx_order (`order`),
  INDEX idx_type (type),
  INDEX idx_visible (isVisible)
);

-- 2. Gallery Images Table
CREATE TABLE IF NOT EXISTS gallery_images (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_path VARCHAR(500) NOT NULL,
  thumbnail_path VARCHAR(500),
  album_id VARCHAR(50),
  `order` INT NOT NULL,
  isVisible BOOLEAN DEFAULT TRUE,
  tags JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  uploaded_by VARCHAR(100) NOT NULL,
  INDEX idx_album (album_id),
  INDEX idx_order (`order`),
  INDEX idx_visible (isVisible)
);

-- 3. Gallery Albums Table
CREATE TABLE IF NOT EXISTS gallery_albums (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  cover_image VARCHAR(500),
  `order` INT NOT NULL,
  isVisible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by VARCHAR(100) NOT NULL,
  INDEX idx_order (`order`),
  INDEX idx_visible (isVisible)
);

-- 4. Product Store Table
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  name_hindi VARCHAR(255),
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  category VARCHAR(100) NOT NULL,
  image_path VARCHAR(500) NOT NULL,
  images JSON,
  features JSON,
  tags JSON,
  in_stock BOOLEAN DEFAULT TRUE,
  rating DECIMAL(2,1) DEFAULT 0,
  reviews_count INT DEFAULT 0,
  discount_percentage INT DEFAULT 0,
  is_new BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  `order` INT NOT NULL,
  isVisible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by VARCHAR(100) NOT NULL,
  INDEX idx_category (category),
  INDEX idx_price (price),
  INDEX idx_order (`order`),
  INDEX idx_visible (isVisible),
  INDEX idx_featured (is_featured)
);

-- 5. News Table
CREATE TABLE IF NOT EXISTS news (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  title_hindi VARCHAR(255),
  content TEXT NOT NULL,
  excerpt TEXT,
  image_path VARCHAR(500),
  news_type ENUM('announcement', 'update', 'achievement', 'notice', 'general') DEFAULT 'general',
  priority ENUM('high', 'medium', 'low') DEFAULT 'medium',
  is_featured BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT TRUE,
  published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `order` INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by VARCHAR(100) NOT NULL,
  INDEX idx_news_type (news_type),
  INDEX idx_priority (priority),
  INDEX idx_featured (is_featured),
  INDEX idx_published (is_published),
  INDEX idx_published_at (published_at),
  INDEX idx_order (`order`)
);

-- 6. Events Table
CREATE TABLE IF NOT EXISTS events (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  title_hindi VARCHAR(255),
  description TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_time TIME,
  end_date DATE,
  end_time TIME,
  location VARCHAR(255),
  address TEXT,
  image_path VARCHAR(500),
  registration_required BOOLEAN DEFAULT FALSE,
  registration_url VARCHAR(500),
  max_participants INT,
  current_participants INT DEFAULT 0,
  event_type ENUM('festival', 'meeting', 'celebration', 'workshop', 'conference', 'other') DEFAULT 'other',
  `order` INT NOT NULL,
  isVisible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by VARCHAR(100) NOT NULL,
  INDEX idx_event_date (event_date),
  INDEX idx_event_type (event_type),
  INDEX idx_order (`order`),
  INDEX idx_visible (isVisible)
);

-- 6. Departments Table
CREATE TABLE IF NOT EXISTS departments (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  name_hindi VARCHAR(255),
  description TEXT,
  head_name VARCHAR(255),
  head_email VARCHAR(255),
  head_phone VARCHAR(20),
  department_type ENUM('administrative', 'technical', 'cultural', 'spiritual', 'other') DEFAULT 'other',
  `order` INT NOT NULL,
  isVisible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by VARCHAR(100) NOT NULL,
  INDEX idx_type (department_type),
  INDEX idx_order (`order`),
  INDEX idx_visible (isVisible)
);

-- 7. Offices Table
CREATE TABLE IF NOT EXISTS offices (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  name_hindi VARCHAR(255),
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  pincode VARCHAR(10),
  phone VARCHAR(20),
  email VARCHAR(255),
  office_type ENUM('head', 'regional', 'branch') DEFAULT 'branch',
  `order` INT NOT NULL,
  isVisible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by VARCHAR(100) NOT NULL,
  INDEX idx_city (city),
  INDEX idx_state (state),
  INDEX idx_type (office_type),
  INDEX idx_order (`order`),
  INDEX idx_visible (isVisible)
);

-- 8. Karya Samiti (Committee) Table
CREATE TABLE IF NOT EXISTS karya_samiti (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  name_hindi VARCHAR(255),
  position VARCHAR(255) NOT NULL,
  position_hindi VARCHAR(255),
  description TEXT,
  image_path VARCHAR(500),
  email VARCHAR(255),
  phone VARCHAR(20),
  committee_type ENUM('executive', 'advisory', 'working') DEFAULT 'working',
  `order` INT NOT NULL,
  isVisible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by VARCHAR(100) NOT NULL,
  INDEX idx_type (committee_type),
  INDEX idx_order (`order`),
  INDEX idx_visible (isVisible)
);

-- 9. Contact Information Table
CREATE TABLE IF NOT EXISTS contact_info (
  id VARCHAR(50) PRIMARY KEY,
  contact_type ENUM('phone', 'email', 'address', 'social', 'emergency') NOT NULL,
  title VARCHAR(255) NOT NULL,
  value VARCHAR(500) NOT NULL,
  description TEXT,
  `order` INT NOT NULL,
  isVisible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by VARCHAR(100) NOT NULL,
  INDEX idx_type (contact_type),
  INDEX idx_order (`order`),
  INDEX idx_visible (isVisible)
);

-- 10. Navigation Links Table
CREATE TABLE IF NOT EXISTS navigation_links (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  title_hindi VARCHAR(255),
  url VARCHAR(500) NOT NULL,
  link_type ENUM('main', 'footer', 'sidebar') NOT NULL,
  parent_id VARCHAR(50),
  icon VARCHAR(100),
  `order` INT NOT NULL,
  isVisible BOOLEAN DEFAULT TRUE,
  open_in_new_tab BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by VARCHAR(100) NOT NULL,
  INDEX idx_type (link_type),
  INDEX idx_parent (parent_id),
  INDEX idx_order (`order`),
  INDEX idx_visible (isVisible)
);

-- 11. SEO Meta Tags Table
CREATE TABLE IF NOT EXISTS seo_meta (
  id VARCHAR(50) PRIMARY KEY,
  page_path VARCHAR(255) NOT NULL,
  title VARCHAR(255),
  description TEXT,
  keywords TEXT,
  og_title VARCHAR(255),
  og_description TEXT,
  og_image VARCHAR(500),
  twitter_title VARCHAR(255),
  twitter_description TEXT,
  twitter_image VARCHAR(500),
  canonical_url VARCHAR(500),
  robots VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by VARCHAR(100) NOT NULL,
  UNIQUE KEY unique_page (page_path)
);

-- 12. Content Versions Table (for history tracking)
CREATE TABLE IF NOT EXISTS content_versions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  content_type ENUM('about', 'gallery', 'store', 'events', 'departments', 'offices', 'karya_samiti', 'contact', 'navigation', 'seo') NOT NULL,
  content_id VARCHAR(50) NOT NULL,
  content_data JSON NOT NULL,
  version_number INT NOT NULL,
  change_description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(100) NOT NULL,
  INDEX idx_content_type (content_type),
  INDEX idx_content_id (content_id),
  INDEX idx_created_at (created_at)
);

-- 13. Activity Logs Table (for admin tracking)
CREATE TABLE IF NOT EXISTS activity_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  action VARCHAR(100) NOT NULL,
  content_type VARCHAR(50),
  content_id VARCHAR(50),
  details TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user (user_id),
  INDEX idx_action (action),
  INDEX idx_content (content_type, content_id),
  INDEX idx_created_at (created_at)
);

-- Insert sample data for about page
INSERT INTO about_sections (id, type, title, content, `order`, isVisible, styling, updated_by) VALUES
('hero-1', 'hero', 'सनातन धर्म', 'सनातन धर्म शाश्वत है — जिसका न आदि है न अंत। यही सनातन परम्परा हिंदू धर्म का मूल स्वरूप है और भारतीय संस्कृति की आत्मा है।', 1, TRUE, '{"textAlign": "center", "fontSize": "5xl", "fontWeight": "extrabold", "color": "orange"}', 'system'),
('intro-1', 'card', 'परिचय', 'सनातन धर्म हिंदू धर्म का ही वैकल्पिक नाम है जिसका उपयोग संस्कृत और अन्य भारतीय भाषाओं में भी किया जाता है। वैदिक काल में भारतीय उपमहाद्वीप के धर्म के लिए \'सनातन धर्म\' नाम मिलता है।', 2, TRUE, '{"textAlign": "left", "fontSize": "base", "fontWeight": "normal", "color": "gray"}', 'system'),
('quote-1', 'quote', 'ऋग्वेद 3.18.1', 'यह पथ सनातन है। समस्त देवता और मनुष्य इसी मार्ग से पैदा हुए हैं तथा प्रगति की है। हे मनुष्यों आप अपने उत्पन्न होने की आधाररूपा अपनी माता को विनष्ट न करें।', 3, TRUE, '{"textAlign": "left", "fontSize": "lg", "fontWeight": "medium", "color": "orange"}', 'system'),
('history-1', 'card', 'इतिहास', 'सनातन धर्म जिसे हिन्दू धर्म अथवा वैदिक धर्म भी कहा जाता है। भारत की सिन्धु घाटी सभ्यता में हिन्दू धर्म के कई चिह्न मिलते हैं।', 4, TRUE, '{"textAlign": "left", "fontSize": "base", "fontWeight": "normal", "color": "gray"}', 'system'),
('nature-1', 'card', 'स्वरूप', 'सनातन में समय के साथ समसामयिक चुनौतियों का समाधान हुआ। यह अनादि से प्रवाहमान, बहु-आयामी और समन्वयी परम्परा है।', 5, TRUE, '{"textAlign": "left", "fontSize": "base", "fontWeight": "normal", "color": "gray"}', 'system')
ON DUPLICATE KEY UPDATE content = VALUES(content);

-- Insert sample contact information
INSERT INTO contact_info (id, contact_type, title, value, description, `order`, isVisible, created_by) VALUES
('phone-1', 'phone', 'Main Office', '+91-11-12345678', 'Primary contact number', 1, TRUE, 'system'),
('email-1', 'email', 'General Inquiry', 'info@rhvs.org', 'General information and inquiries', 2, TRUE, 'system'),
('address-1', 'address', 'Head Office', '123 Temple Road, Delhi - 110001', 'Main administrative office', 3, TRUE, 'system'),
('emergency-1', 'emergency', 'Emergency Contact', '+91-9876543210', '24/7 emergency helpline', 4, TRUE, 'system')
ON DUPLICATE KEY UPDATE value = VALUES(value);

-- Insert sample navigation links
INSERT INTO navigation_links (id, title, title_hindi, url, link_type, `order`, isVisible, created_by) VALUES
('nav-1', 'Home', 'होम', '/', 'main', 1, TRUE, 'system'),
('nav-2', 'About', 'हमारे बारे में', '/about', 'main', 2, TRUE, 'system'),
('nav-3', 'Gallery', 'गैलरी', '/gallery', 'main', 3, TRUE, 'system'),
('nav-4', 'Products', 'उत्पाद', '/products', 'main', 4, TRUE, 'system'),
('nav-5', 'Events', 'कार्यक्रम', '/events', 'main', 5, TRUE, 'system'),
('nav-6', 'Contact', 'संपर्क', '/contact', 'main', 6, TRUE, 'system')
ON DUPLICATE KEY UPDATE url = VALUES(url);

-- Insert sample SEO meta for main pages
INSERT INTO seo_meta (id, page_path, title, description, keywords, updated_by) VALUES
('seo-home', '/', 'Rashtriya Hindu Vahini Sangathan - Hindu Community Organization', 'Official website of Rashtriya Hindu Vahini Sangathan dedicated to serving and uniting the Hindu community', 'Hindu, community, organization, RHVS, Sanatan Dharma', 'system'),
('seo-about', '/about', 'About • सनातन धर्म | Rashtriya Hindu Vahini Sangathan', 'सनातन धर्म के इतिहास, स्वरूप और मूल भावों का संक्षिप्त परिचय | About Sanatan Dharma by Rashtriya Hindu Vahini Sangathan', 'Sanatan Dharma, Hindu religion, about us, RHVS', 'system'),
('seo-gallery', '/gallery', 'Gallery • Photos | Rashtriya Hindu Vahini Sangathan', 'View our photo gallery featuring community events, festivals, and spiritual activities', 'gallery, photos, events, festivals, RHVS', 'system'),
('seo-products', '/products', 'Products • Spiritual Items | Rashtriya Hindu Vahini Sangathan', 'Browse our collection of authentic spiritual products, blessed by our gurus and crafted with devotion', 'spiritual products, religious items, puja items, RHVS', 'system'),
('seo-events', '/events', 'Events • Community Activities | Rashtriya Hindu Vahini Sangathan', 'Join our community events, festivals, and spiritual gatherings', 'events, community, festivals, activities, RHVS', 'system'),
('seo-contact', '/contact', 'Contact Us | Rashtriya Hindu Vahini Sangathan', 'Get in touch with Rashtriya Hindu Vahini Sangathan for inquiries and support', 'contact, support, inquiry, RHVS', 'system')
ON DUPLICATE KEY UPDATE title = VALUES(title);

-- Create indexes for better performance
CREATE INDEX idx_about_sections_updated_at ON about_sections(updated_at);
CREATE INDEX idx_gallery_images_album_order ON gallery_images(album_id, `order`);
CREATE INDEX idx_products_category_featured ON products(category, is_featured);
CREATE INDEX idx_events_date_visible ON events(event_date, isVisible);
CREATE INDEX idx_activity_logs_user_action ON activity_logs(user_id, action);
