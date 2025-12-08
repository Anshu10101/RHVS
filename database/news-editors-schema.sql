-- News Editors Schema
-- This table stores news editor/reporter accounts for the organization
CREATE TABLE IF NOT EXISTS news_editors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('news_editor', 'news_reporter') DEFAULT 'news_editor',
  profile_photo_path VARCHAR(500) NULL,
  profile_photo_blob LONGBLOB NULL,
  is_active BOOLEAN DEFAULT TRUE,
  appointed_by INT NOT NULL,
  appointed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NULL,
  last_login TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (appointed_by) REFERENCES superadmin(id) ON DELETE CASCADE,
  INDEX idx_email (email),
  INDEX idx_is_active (is_active),
  INDEX idx_profile_photo (profile_photo_path)
);

