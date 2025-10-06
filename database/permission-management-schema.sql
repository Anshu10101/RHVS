-- Enhanced Permission Management System
-- This schema allows superadmins to assign permissions to district admins with time-based expiration

-- Table to store permission assignments with time-based expiration
CREATE TABLE IF NOT EXISTS district_admin_permission_assignments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    district_admin_id INT NOT NULL,
    permission_key VARCHAR(100) NOT NULL,
    granted_by INT NOT NULL, -- superadmin who granted the permission
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL, -- NULL means permanent, otherwise expiration date
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT NULL, -- Optional notes about why this permission was granted
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (district_admin_id) REFERENCES district_admins(id) ON DELETE CASCADE,
    FOREIGN KEY (granted_by) REFERENCES district_admins(id) ON DELETE CASCADE,
    UNIQUE KEY unique_active_permission (district_admin_id, permission_key, is_active)
);

-- Table to store permission templates/presets for quick assignment
CREATE TABLE IF NOT EXISTS permission_templates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    permissions JSON NOT NULL, -- Array of permission keys
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT NOT NULL, -- superadmin who created the template
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (created_by) REFERENCES district_admins(id) ON DELETE CASCADE
);

-- Table to store permission assignment history for audit trail
CREATE TABLE IF NOT EXISTS permission_assignment_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    district_admin_id INT NOT NULL,
    permission_key VARCHAR(100) NOT NULL,
    action ENUM('granted', 'revoked', 'expired', 'extended') NOT NULL,
    granted_by INT NOT NULL,
    action_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    notes TEXT NULL,
    
    FOREIGN KEY (district_admin_id) REFERENCES district_admins(id) ON DELETE CASCADE,
    FOREIGN KEY (granted_by) REFERENCES district_admins(id) ON DELETE CASCADE
);

-- Insert default permission templates (will be inserted after superadmin is created)
-- Templates will be created programmatically to avoid foreign key issues

-- Create indexes for better performance (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_permission_assignments_admin ON district_admin_permission_assignments(district_admin_id);
CREATE INDEX IF NOT EXISTS idx_permission_assignments_expires ON district_admin_permission_assignments(expires_at);
CREATE INDEX IF NOT EXISTS idx_permission_assignments_active ON district_admin_permission_assignments(is_active);
CREATE INDEX IF NOT EXISTS idx_permission_history_admin ON permission_assignment_history(district_admin_id);
CREATE INDEX IF NOT EXISTS idx_permission_history_action ON permission_assignment_history(action);
