const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupSellersSystem() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    console.log('Setting up sellers system...');

    // Create sellers table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS sellers (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        business_name VARCHAR(255),
        contact_phone VARCHAR(20) NOT NULL,
        whatsapp_number VARCHAR(20),
        email VARCHAR(255),
        address TEXT,
        district VARCHAR(100) NOT NULL,
        state VARCHAR(100) NOT NULL,
        delivery_info TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        added_by_admin_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (added_by_admin_id) REFERENCES district_admins(id) ON DELETE CASCADE,
        INDEX idx_district (district),
        INDEX idx_state (state),
        INDEX idx_phone (contact_phone),
        INDEX idx_active (is_active)
      )
    `);

    // Add seller_id column to products table if it doesn't exist
    await connection.execute(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS seller_id VARCHAR(50) NULL AFTER category
    `);

    // Add index for seller_id if it doesn't exist
    await connection.execute(`
      ALTER TABLE products 
      ADD INDEX IF NOT EXISTS idx_seller (seller_id)
    `);

    // Check if foreign key constraint exists
    const [constraints] = await connection.execute(`
      SELECT CONSTRAINT_NAME 
      FROM information_schema.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'products' 
      AND COLUMN_NAME = 'seller_id'
      AND CONSTRAINT_NAME != 'PRIMARY'
    `);

    if (constraints.length === 0) {
      console.log('Adding foreign key constraint for seller_id...');
      await connection.execute(`
        ALTER TABLE products 
        ADD CONSTRAINT fk_products_seller 
        FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE SET NULL
      `);
    }

    console.log('✅ Sellers system setup completed successfully!');
    console.log('📋 Next steps:');
    console.log('   1. District admins can now manage sellers');
    console.log('   2. Products can be linked to sellers');
    console.log('   3. Use the seller management interface in admin panel');

  } catch (error) {
    console.error('❌ Error setting up sellers system:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run the setup
setupSellersSystem().catch(console.error);
