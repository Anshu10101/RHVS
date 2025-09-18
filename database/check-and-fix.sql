-- First, let's check what tables exist
SHOW TABLES;

-- Check the structure of the members table if it exists
DESCRIBE members;

-- Check if superadmin table exists
DESCRIBE superadmin;

-- If members table doesn't exist, let's create it first
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

-- If superadmin table doesn't exist, create it
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

-- Now create the registration_tokens table
CREATE TABLE IF NOT EXISTS registration_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  token VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address TEXT NOT NULL,
  father_husband_name VARCHAR(255) NOT NULL,
  mother_wife_name VARCHAR(255) NOT NULL,
  registration_date DATE NOT NULL,
  existing_member_reg_number VARCHAR(50) NOT NULL,
  profile_photo_path VARCHAR(500),
  district VARCHAR(100),
  department VARCHAR(100),
  status ENUM('pending', 'verified', 'expired', 'rejected') DEFAULT 'pending',
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  verified_by_admin_id INT,
  verified_at TIMESTAMP NULL,
  INDEX idx_token (token),
  INDEX idx_email (email),
  INDEX idx_status (status),
  INDEX idx_expires_at (expires_at),
  INDEX idx_created_at (created_at)
);

-- Now create member_certificates table with proper foreign key
CREATE TABLE IF NOT EXISTS member_certificates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  member_id INT NOT NULL,
  certificate_number VARCHAR(50) UNIQUE NOT NULL,
  certificate_path VARCHAR(500),
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  generated_by_admin_id INT,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
  INDEX idx_member_id (member_id),
  INDEX idx_certificate_number (certificate_number)
);

-- Add new columns to members table
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS verified_by_admin_id INT,
ADD COLUMN IF NOT EXISTS verification_date TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS registration_token_id INT;

-- Add foreign key constraints to members table
ALTER TABLE members 
ADD CONSTRAINT fk_verified_by_admin 
FOREIGN KEY (verified_by_admin_id) REFERENCES superadmin(id) 
ON DELETE SET NULL;

ALTER TABLE members 
ADD CONSTRAINT fk_registration_token 
FOREIGN KEY (registration_token_id) REFERENCES registration_tokens(id) 
ON DELETE SET NULL;
