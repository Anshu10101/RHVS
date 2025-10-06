// District Admins Setup Script
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

const DB_CONFIG = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

async function setupDatabase() {
  console.log('Starting district admins system setup...');
  
  let connection;
  try {
    // Connect to database
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('Connected to database successfully');
    
    // Read and execute SQL files
    const sqlFiles = [
      'database/district-admins-schema.sql',
      'database/activity-logs-schema.sql'
    ];
    
    for (const file of sqlFiles) {
      console.log(`Executing SQL from file: ${file}`);
      const sql = fs.readFileSync(path.join(__dirname, file), 'utf8');
      
      // Split SQL by semicolon to execute multiple statements
      const statements = sql
        .split(';')
        .filter(statement => statement.trim().length > 0);
      
      for (const statement of statements) {
        await connection.execute(statement);
      }
      
      console.log(`Successfully executed ${statements.length} statements from ${file}`);
    }
    
    console.log('District admins system setup completed successfully');
  } catch (error) {
    console.error('Error setting up district admins system:', error);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

setupDatabase();
