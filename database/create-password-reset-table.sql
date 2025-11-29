-- Create admin_password_resets table to support both superadmin and district_admin
-- Run this script to create the table with the new structure

CREATE TABLE IF NOT EXISTS admin_password_resets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT NOT NULL,
  user_type ENUM('superadmin', 'district_admin') DEFAULT 'superadmin',
  email VARCHAR(255) NOT NULL,
  otp VARCHAR(20) NOT NULL,
  token VARCHAR(512) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_token (token),
  INDEX idx_expires_at (expires_at),
  INDEX idx_admin_type (admin_id, user_type)
);

