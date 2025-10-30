const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function setupHeroImagesPermissions() {
  let connection;
  
  try {
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'rhvs_portfolio',
      port: process.env.DB_PORT || 3306
    });

    console.log('Connected to database successfully');

    // Run the hero images schema
    console.log('Setting up hero images schema...');
    const fs = require('fs');
    
    // Use the simple schema that avoids foreign key constraint issues
    console.log('Using simplified schema without complex foreign key constraints...');
    const schema = fs.readFileSync('./database/simple-hero-images-setup.sql', 'utf8');
    const statements = schema.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const statement of statements) {
      if (statement.trim()) {
        await connection.execute(statement);
        console.log('✓ Executed statement');
      }
    }

    console.log('Hero images schema setup completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Grant hero image permissions to district admins as needed');
    console.log('2. Add some hero images through the admin dashboard');
    console.log('3. Configure hero section settings');

  } catch (error) {
    console.error('Error setting up hero images permissions:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setupHeroImagesPermissions();
