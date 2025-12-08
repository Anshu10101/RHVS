-- Custom Marquee Schema
-- This table stores custom marquee text that appears below hero section
CREATE TABLE IF NOT EXISTS marquee (
  id INT AUTO_INCREMENT PRIMARY KEY,
  text VARCHAR(1000) NOT NULL,
  text_color VARCHAR(7) DEFAULT '#92400e', -- Hex color code
  background_color VARCHAR(7) DEFAULT '#fef3c7', -- Hex color code
  speed INT DEFAULT 40, -- Pixels per second
  is_active BOOLEAN DEFAULT TRUE,
  is_global BOOLEAN DEFAULT TRUE, -- If true, shows for all districts/states
  district VARCHAR(255) NULL, -- If set, only shows for this district
  state VARCHAR(255) NULL, -- If set, only shows for this state
  created_by INT NULL, -- Admin ID who created it
  created_by_type ENUM('superadmin', 'district_admin', 'news_editor') NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_is_active (is_active),
  INDEX idx_is_global (is_global),
  INDEX idx_district_state (district, state),
  INDEX idx_created_by (created_by)
);

