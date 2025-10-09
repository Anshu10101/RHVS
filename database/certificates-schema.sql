-- Create certificates table for storing appointment certificates
CREATE TABLE IF NOT EXISTS certificates (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  member_id INT UNSIGNED NOT NULL,
  department_id INT UNSIGNED NOT NULL,
  post_id INT UNSIGNED NOT NULL,
  level ENUM('national', 'state', 'district') NOT NULL,
  state VARCHAR(100) NULL,
  district VARCHAR(100) NULL,
  certificate_number VARCHAR(50) NOT NULL UNIQUE,
  appointment_date DATE NOT NULL,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  generated_by INT UNSIGNED NULL COMMENT 'Admin who generated the certificate',
  certificate_path VARCHAR(500) NULL COMMENT 'Path to the generated certificate file',
  status ENUM('generated', 'downloaded', 'emailed') DEFAULT 'generated',
  email_sent_at TIMESTAMP NULL COMMENT 'When email was sent to member',
  email_status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
  
  -- Foreign key constraints
  CONSTRAINT fk_certificates_member FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
  CONSTRAINT fk_certificates_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
  CONSTRAINT fk_certificates_post FOREIGN KEY (post_id) REFERENCES department_posts(id) ON DELETE CASCADE,
  
  -- Indexes
  INDEX idx_member (member_id),
  INDEX idx_department (department_id),
  INDEX idx_certificate_number (certificate_number),
  INDEX idx_generated_at (generated_at),
  INDEX idx_level (level),
  INDEX idx_state (state),
  INDEX idx_district (district)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create certificate templates table
CREATE TABLE IF NOT EXISTS certificate_templates (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  template_type ENUM('appointment', 'achievement', 'recognition') DEFAULT 'appointment',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Template configuration (JSON)
  template_config JSON COMMENT 'Template configuration including colors, fonts, positions',
  
  INDEX idx_template_type (template_type),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default certificate template
INSERT INTO certificate_templates (name, description, template_type, template_config) VALUES 
('Default Appointment Certificate', 'Default template for department appointment certificates', 'appointment', 
JSON_OBJECT(
  'header_color', '#DC2626',
  'footer_color', '#DC2626', 
  'border_color', '#FCD34D',
  'text_color', '#1F2937',
  'accent_color', '#F59E0B',
  'organization_name', 'राष्ट्रीय हिन्दू वाहिनी संगठन',
  'slogan1', '।। गर्व से कहो हम हिन्दू हैं ।।',
  'slogan2', '।। हिन्दुस्तान हमारा है ।।',
  'font_family', 'Arial, sans-serif',
  'hindi_font', 'Noto Sans Devanagari, sans-serif'
));

-- Create certificate generation log table
CREATE TABLE IF NOT EXISTS certificate_generation_logs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  certificate_id INT UNSIGNED NOT NULL,
  action ENUM('generated', 'downloaded', 'regenerated', 'email_sent', 'email_failed') NOT NULL,
  performed_by INT UNSIGNED NULL,
  performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT NULL,
  
  CONSTRAINT fk_cert_logs_certificate FOREIGN KEY (certificate_id) REFERENCES certificates(id) ON DELETE CASCADE,
  INDEX idx_certificate_id (certificate_id),
  INDEX idx_action (action),
  INDEX idx_performed_at (performed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
