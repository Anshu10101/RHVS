-- System Settings Table
-- Stores global application settings that can be toggled by superadmin

CREATE TABLE IF NOT EXISTS system_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT,
  setting_type ENUM('boolean', 'string', 'number', 'json') DEFAULT 'string',
  description VARCHAR(500),
  updated_by_admin_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_setting_key (setting_key)
);

-- Insert default settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description) VALUES
('send_removal_email', 'true', 'boolean', 'Send email notification when a member is removed from a post'),
('send_appointment_email', 'true', 'boolean', 'Send email notification when a member is appointed to a post')
ON DUPLICATE KEY UPDATE setting_key = setting_key;
