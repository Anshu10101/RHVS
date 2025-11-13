-- Certificate Signatures Table
-- Stores signatures for both membership and appointment certificates
-- Note: Foreign keys are not included to avoid dependency issues
-- Referential integrity is maintained at the application level

CREATE TABLE IF NOT EXISTS certificate_signatures (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  certificate_type ENUM('membership', 'appointment') NOT NULL COMMENT 'Type of certificate this signature is for',
  name_en VARCHAR(255) NOT NULL COMMENT 'Name in English',
  name_hi VARCHAR(255) COMMENT 'Name in Hindi',
  designation_en VARCHAR(255) NOT NULL COMMENT 'Designation/Title in English',
  designation_hi VARCHAR(255) COMMENT 'Designation/Title in Hindi',
  signature_blob LONGBLOB COMMENT 'Signature image as blob',
  signature_path VARCHAR(500) COMMENT 'Path to signature file if stored on disk',
  signature_mime VARCHAR(50) COMMENT 'MIME type of signature image',
  signature_size INT UNSIGNED COMMENT 'Size of signature file in bytes',
  signature_hash VARCHAR(64) COMMENT 'SHA-256 hash of signature file',
  signature_original_name VARCHAR(255) COMMENT 'Original filename of uploaded signature',
  
  -- For member-based signatures
  member_id INT UNSIGNED NULL COMMENT 'If signature is from a member, reference to members table',
  department_id VARCHAR(50) NULL COMMENT 'Department ID if signature is from a member with appointment',
  post_id INT UNSIGNED NULL COMMENT 'Post ID if signature is from a member with appointment',
  
  -- Metadata
  display_order INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Order in which signature appears (1-4)',
  is_active BOOLEAN DEFAULT TRUE COMMENT 'Whether this signature is currently active',
  created_by INT UNSIGNED NULL COMMENT 'Admin who created this signature',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_cert_type (certificate_type),
  INDEX idx_display_order (display_order),
  INDEX idx_is_active (is_active),
  INDEX idx_member_id (member_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Note: Max 4 signatures per certificate type is enforced at application level
-- Foreign key constraints can be added later if needed using:
-- ALTER TABLE certificate_signatures ADD CONSTRAINT fk_cert_sig_member FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE SET NULL;

