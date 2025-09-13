// Fix events visibility script
// Run this with: node fix-events.js

const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function fixEventsVisibility() {
  let connection;
  
  try {
    console.log('🔧 Fixing events visibility...\n');
    
    // Connect to MySQL server
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: parseInt(process.env.DB_PORT || '3306'),
      database: process.env.DB_NAME || 'rhvs_portfolio',
    });

    console.log('✅ Connected to database');

    // Update events to set isVisible = TRUE
    const [result] = await connection.execute(
      'UPDATE events SET isVisible = TRUE WHERE isVisible IS NULL OR isVisible = FALSE'
    );
    
    console.log(`✅ Updated ${result.affectedRows} events to be visible`);

    // Verify the update
    const [events] = await connection.execute('SELECT id, title, isVisible FROM events');
    console.log('\n📋 Current events:');
    events.forEach(event => {
      console.log(`- ${event.id}: ${event.title} (Visible: ${event.isVisible})`);
    });
    
    console.log('\n🎉 Events visibility fixed successfully!');

  } catch (error) {
    console.error('❌ Fix failed:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run fix
fixEventsVisibility();
