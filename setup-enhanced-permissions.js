const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function setupEnhancedPermissions() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'rhvs_portfolio',
  });

  try {
    console.log('Setting up enhanced permissions system...');

    // Read and execute SQL file
    const sqlPath = path.join(__dirname, 'database', 'update-permission-types.sql');
    const sqlContent = await fs.readFile(sqlPath, 'utf8');
    
    // Split SQL statements by semicolon
    const statements = sqlContent
      .split(';')
      .filter(statement => statement.trim() !== '');
    
    // Execute each statement with error handling
    for (const statement of statements) {
      try {
        await connection.execute(statement + ';');
        console.log('✓ Executed:', statement.substring(0, 50) + '...');
      } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME' || error.code === 'ER_DUP_KEYNAME') {
          console.log('⚠ Skipped (already exists):', statement.substring(0, 50) + '...');
        } else {
          console.error('❌ Error executing statement:', error.message);
          throw error;
        }
      }
    }

    // Update content tables to include district tracking
    await updateContentTables(connection);

    console.log('✅ Enhanced permissions system setup completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Restart your Next.js application');
    console.log('2. Login as superadmin');
    console.log('3. Go to Permissions > Assign to manage district admin permissions');
    
  } catch (error) {
    console.error('❌ Error setting up enhanced permissions system:', error);
  } finally {
    await connection.end();
  }
}

async function updateContentTables(connection) {
  console.log('Updating content tables to track district origin...');
  
  // Array of tables to update
  const contentTables = [
    { table: 'news', idField: 'id' },
    { table: 'events', idField: 'id' },
    { table: 'products', idField: 'id' },
    { table: 'gallery', idField: 'id' },
    { table: 'offices', idField: 'id' }
  ];
  
  for (const { table, idField } of contentTables) {
    // Check if table exists
    const [tables] = await connection.execute(`SHOW TABLES LIKE '${table}'`);
    
    if (tables.length > 0) {
      console.log(`Updating ${table} table...`);
      
      // Check if district_id column exists
      const [columns] = await connection.execute(`SHOW COLUMNS FROM ${table} LIKE 'district_id'`);
      
      if (columns.length === 0) {
        // Add district_id, state_id and added_by columns
        try {
          await connection.execute(`
            ALTER TABLE ${table} 
            ADD COLUMN district_id VARCHAR(100) AFTER ${idField},
            ADD COLUMN state_id VARCHAR(100) AFTER district_id,
            ADD COLUMN added_by INT AFTER state_id,
            ADD INDEX idx_district (district_id),
            ADD INDEX idx_state (state_id),
            ADD INDEX idx_added_by (added_by)
          `);
        } catch (error) {
          if (error.code === 'ER_DUP_KEYNAME') {
            // Try adding columns without indexes first
            await connection.execute(`
              ALTER TABLE ${table} 
              ADD COLUMN district_id VARCHAR(100) AFTER ${idField},
              ADD COLUMN state_id VARCHAR(100) AFTER district_id,
              ADD COLUMN added_by INT AFTER state_id
            `);
            
            // Then add indexes individually
            try {
              await connection.execute(`ALTER TABLE ${table} ADD INDEX idx_district (district_id)`);
            } catch (e) { /* ignore if exists */ }
            
            try {
              await connection.execute(`ALTER TABLE ${table} ADD INDEX idx_state (state_id)`);
            } catch (e) { /* ignore if exists */ }
            
            try {
              await connection.execute(`ALTER TABLE ${table} ADD INDEX idx_added_by (added_by)`);
            } catch (e) { /* ignore if exists */ }
          } else {
            throw error;
          }
        }
      }
    } else {
      console.log(`Table ${table} does not exist, skipping...`);
    }
  }
}

setupEnhancedPermissions();
