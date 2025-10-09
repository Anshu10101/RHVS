// Setup script for Department Management System
const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

async function setupDepartmentManagement() {
  console.log('Setting up Department Management System...');

  try {
    // Create database connection
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      multipleStatements: true
    });

    console.log('Connected to database');

    // Read and execute the SQL file
    const sqlFilePath = path.join(__dirname, 'database', 'department-management-schema.sql');
    const sqlContent = await fs.readFile(sqlFilePath, 'utf8');
    
    console.log('Executing SQL script...');
    await connection.query(sqlContent);
    
    console.log('Department Management tables created successfully');

    // Close the connection
    await connection.end();
    
    console.log('Department Management System setup completed successfully');
  } catch (error) {
    console.error('Error setting up Department Management System:', error);
    process.exit(1);
  }
}

setupDepartmentManagement();
