// Database setup script
// Run this with: node setup-database.js

const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function setupDatabase() {
  let connection;
  
  try {
    console.log('🔧 Setting up RHVS Portfolio Database...\n');
    
    // Connect to MySQL server
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: parseInt(process.env.DB_PORT || '3306'),
    });

    console.log('✅ Connected to MySQL server');

    // Create database if it doesn't exist
    const dbName = process.env.DB_NAME || 'rhvs_portfolio';
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`✅ Database '${dbName}' created/verified`);

    // Use the database
    await connection.execute(`USE \`${dbName}\``);

    // Read and execute schema
    const fs = require('fs');
    const schema = fs.readFileSync('./database-schema.sql', 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = schema.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const statement of statements) {
      if (statement.trim()) {
        await connection.execute(statement);
      }
    }

    console.log('✅ Database schema created successfully');
    console.log('✅ Tables created: members, otp_verifications, admin_users, events');
    console.log('✅ Sample admin user created (username: admin, password: admin123)');
    
    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Update your .env.local file with your Hostinger MySQL credentials');
    console.log('2. Test the connection by running: npm run dev');
    console.log('3. Visit /members/register to test the registration form');

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure your MySQL server is running');
    console.log('2. Check your database credentials in .env.local');
    console.log('3. Ensure you have CREATE DATABASE privileges');
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run setup
setupDatabase();
