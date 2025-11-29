-- RHVS Portfolio Database Schema
-- Run this SQL in your Hostinger MySQL database

-- Create members table
CREATE TABLE IF NOT EXISTS members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address TEXT NOT NULL,
  father_husband_name VARCHAR(255) NOT NULL,
  mother_wife_name VARCHAR(255) NOT NULL,
  registration_date DATE NOT NULL,
  existing_member_reg_number VARCHAR(50) NOT NULL,
  profile_photo_path VARCHAR(500),
  member_reg_number VARCHAR(20) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_phone (phone),
  INDEX idx_member_reg_number (member_reg_number)
);

-- Create OTP verifications table
CREATE TABLE IF NOT EXISTS otp_verifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  existing_member_reg_number VARCHAR(50) NOT NULL,
  otp VARCHAR(6) NOT NULL,
  email VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_existing_member (existing_member_reg_number),
  INDEX idx_otp (otp),
  INDEX idx_expires_at (expires_at)
);

-- Create superadmin table (single or few accounts with full access)
CREATE TABLE IF NOT EXISTS superadmin (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('superadmin') DEFAULT 'superadmin',
  last_login TIMESTAMP NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Admin password reset tokens (OTP + JWT token)
CREATE TABLE IF NOT EXISTS admin_password_resets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  superadmin_id INT NOT NULL,
  email VARCHAR(255) NOT NULL,
  otp VARCHAR(20) NOT NULL,
  token VARCHAR(512) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_token (token),
  INDEX idx_expires_at (expires_at)
);

-- Create events table (for future use)
CREATE TABLE IF NOT EXISTS events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME,
  location VARCHAR(255),
  image_path VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create about_sections table for dynamic about page content
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

-- Create content_versions table for content history
CREATE TABLE IF NOT EXISTS content_versions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  content_type ENUM('about', 'gallery', 'store', 'events') NOT NULL,
  content_data JSON NOT NULL,
  version_number INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(100) NOT NULL,
  INDEX idx_content_type (content_type),
  INDEX idx_created_at (created_at)
);

-- Optional sample superadmin (password: admin123)
INSERT INTO superadmin (email, password_hash, role, is_active)
VALUES ('admin@rhvs.org', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'superadmin', 1)
ON DUPLICATE KEY UPDATE email = email;

-- Create indexes for better performance
CREATE INDEX idx_members_created_at ON members(created_at);
CREATE INDEX idx_otp_verifications_created_at ON otp_verifications(created_at);
CREATE INDEX idx_events_event_date ON events(event_date);
