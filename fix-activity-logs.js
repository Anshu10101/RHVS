const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function fixActivityLogs() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'rhvs_portfolio',
  });

  try {
    console.log('Fixing activity_logs table...');
    
    // Add user_type column if it doesn't exist
    await connection.execute(`
      ALTER TABLE activity_logs 
      ADD COLUMN IF NOT EXISTS user_type ENUM('superadmin', 'district_admin') NOT NULL AFTER user_id
    `);
    
    console.log('✅ activity_logs table fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing activity_logs table:', error);
  } finally {
    await connection.end();
  }
}

fixActivityLogs();
