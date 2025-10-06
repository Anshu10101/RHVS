-- Registration Tokens Table for Double Verification System
CREATE TABLE IF NOT EXISTS registration_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  token VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address TEXT NOT NULL,
  state VARCHAR(100),
  district VARCHAR(100),
  aadhar_card_number VARCHAR(12),
  father_husband_name VARCHAR(255) NOT NULL,
  mother_wife_name VARCHAR(255) NOT NULL,
  registration_date DATE NOT NULL,
  existing_member_reg_number VARCHAR(50) NOT NULL,
  profile_photo_path VARCHAR(500),
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
  INDEX idx_created_at (created_at),
  INDEX idx_state (state),
  INDEX idx_aadhar_card_number (aadhar_card_number)
);

-- Member Certificates Table
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

-- Add verified_by_admin_id to members table if not exists
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS verified_by_admin_id INT,
ADD COLUMN IF NOT EXISTS verification_date TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS registration_token_id INT;

-- Add foreign key constraint
ALTER TABLE members 
ADD CONSTRAINT fk_verified_by_admin 
FOREIGN KEY (verified_by_admin_id) REFERENCES superadmin(id) 
ON DELETE SET NULL;

-- Add foreign key for registration token
ALTER TABLE members 
ADD CONSTRAINT fk_registration_token 
FOREIGN KEY (registration_token_id) REFERENCES registration_tokens(id) 
ON DELETE SET NULL;
