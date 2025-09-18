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
