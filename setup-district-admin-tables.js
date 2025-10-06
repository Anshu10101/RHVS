const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupDistrictAdminTables() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    console.log('Setting up district admin tables...');

    // Create district_admins table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS district_admins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        member_id INT NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        district VARCHAR(100) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('admin') DEFAULT 'admin',
        is_active BOOLEAN DEFAULT TRUE,
        appointed_by INT NOT NULL,
        appointment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expiry_date TIMESTAMP NULL,
        last_login TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
        FOREIGN KEY (appointed_by) REFERENCES superadmin(id) ON DELETE CASCADE,
        INDEX idx_district (district),
        INDEX idx_email (email),
        INDEX idx_member (member_id)
      )
    `);

    // Create district_admin_permissions table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS district_admin_permissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        district_admin_id INT NOT NULL,
        permission VARCHAR(50) NOT NULL,
        granted_by INT NOT NULL,
        granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NULL,
        is_active BOOLEAN DEFAULT TRUE,
        FOREIGN KEY (district_admin_id) REFERENCES district_admins(id) ON DELETE CASCADE,
        FOREIGN KEY (granted_by) REFERENCES superadmin(id) ON DELETE CASCADE,
        INDEX idx_admin_permission (district_admin_id, permission),
        INDEX idx_expires (expires_at)
      )
    `);

    // Create available_permissions table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS available_permissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        permission_key VARCHAR(50) UNIQUE NOT NULL,
        permission_name VARCHAR(100) NOT NULL,
        description TEXT,
        category VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert default permissions
    await connection.execute(`
      INSERT INTO available_permissions (permission_key, permission_name, description, category) VALUES
      ('view_members', 'View Members', 'Can view member listings for their district', 'members'),
      ('add_members', 'Add Members', 'Can add new members to their district', 'members'),
      ('edit_members', 'Edit Members', 'Can edit member details in their district', 'members'),
      ('edit_gallery', 'Edit Gallery', 'Can manage gallery images for their district', 'content'),
      ('edit_news_events', 'Edit News & Events', 'Can manage news and events for their district', 'content'),
      ('edit_about', 'Edit About', 'Can edit about page content for their district', 'content'),
      ('edit_store', 'Edit Store', 'Can manage store products for their district', 'store'),
      ('view_analytics', 'View Analytics', 'Can view analytics data for their district', 'analytics')
      ON DUPLICATE KEY UPDATE permission_name = VALUES(permission_name), description = VALUES(description), category = VALUES(category)
    `);

    // Create activity_logs table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        user_type ENUM('superadmin', 'district_admin') NOT NULL,
        action VARCHAR(50) NOT NULL,
        details TEXT,
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user (user_id, user_type),
        INDEX idx_action (action),
        INDEX idx_created_at (created_at)
      )
    `);

    console.log('District admin tables created successfully!');
  } catch (error) {
    console.error('Error setting up tables:', error);
  } finally {
    await connection.end();
  }
}

setupDistrictAdminTables();
