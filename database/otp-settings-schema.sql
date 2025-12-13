-- OTP Settings Schema for Member Registration
-- This allows superadmin to enable/disable OTP verification for member registration

-- Table to store OTP settings
CREATE TABLE IF NOT EXISTS otp_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT NULL,
    updated_by INT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (updated_by) REFERENCES superadmin(id) ON DELETE SET NULL
);

-- Insert default OTP setting (enabled by default)
INSERT INTO otp_settings (setting_key, setting_value, description, updated_by) VALUES
('otp_verification_enabled', 'true', 'Enable/disable OTP verification for member registration. When disabled, members can register directly without OTP, and superadmin (RHVS000000) will be set as the default initiator.', NULL)
ON DUPLICATE KEY UPDATE setting_value = setting_value;

