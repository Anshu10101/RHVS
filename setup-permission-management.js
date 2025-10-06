const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function setupPermissionManagement() {
  let connection;
  
  try {
    console.log('🔧 Setting up Permission Management System...');
    
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'rhvs',
      port: process.env.DB_PORT || 3306
    });

    console.log('✅ Connected to database');

    // Read and execute the schema
    const fs = require('fs');
    const schema = fs.readFileSync('./database/permission-management-schema.sql', 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = schema.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const statement of statements) {
      if (statement.trim()) {
        await connection.execute(statement);
        console.log('✅ Executed SQL statement');
      }
    }

    // Create default permission templates
    console.log('📋 Creating default permission templates...');
    
    // First, check if there's a superadmin, if not create one
    const superadminCheck = await connection.execute(
      'SELECT id FROM district_admins WHERE role = "superadmin" LIMIT 1'
    );
    
    console.log('Superadmin check result:', superadminCheck);
    
    let superadminId = 1;
    if (superadminCheck[0].length === 0) {
      console.log('🔧 Creating default superadmin...');
      // Create a default superadmin entry
      const insertResult = await connection.execute(`
        INSERT INTO district_admins 
        (member_id, email, password_hash, district, role, is_active, appointed_by, appointed_at)
        VALUES (1, 'superadmin@rhvs.com', '$2b$10$dummy', 'System', 'superadmin', true, 1, NOW())
      `);
      superadminId = insertResult[0].insertId;
      console.log(`✅ Created superadmin with ID: ${superadminId}`);
    } else {
      superadminId = superadminCheck[0][0].id;
      console.log(`✅ Found existing superadmin with ID: ${superadminId}`);
    }

    // Insert default permission templates
    const templates = [
      {
        name: 'Basic Content Management',
        description: 'Basic content management permissions for district admins',
        permissions: JSON.stringify(['manage_about', 'manage_contact', 'view_members'])
      },
      {
        name: 'Full Content Management',
        description: 'Full content management permissions including news and gallery',
        permissions: JSON.stringify(['manage_about', 'manage_contact', 'manage_news_events', 'manage_gallery', 'view_members'])
      },
      {
        name: 'Members Only',
        description: 'Only member management permissions',
        permissions: JSON.stringify(['view_members', 'add_members'])
      },
      {
        name: 'Analytics Access',
        description: 'Analytics and reporting permissions',
        permissions: JSON.stringify(['view_analytics', 'view_members'])
      }
    ];

    for (const template of templates) {
      await connection.execute(`
        INSERT INTO permission_templates 
        (name, description, permissions, created_by, is_active)
        VALUES (?, ?, ?, ?, true)
      `, [template.name, template.description, template.permissions, superadminId || 1]);
      console.log(`✅ Created template: ${template.name}`);
    }

    console.log('🎉 Permission Management System setup completed successfully!');
    console.log('\n📋 Created tables:');
    console.log('  - district_admin_permission_assignments');
    console.log('  - permission_templates');
    console.log('  - permission_assignment_history');
    console.log('\n🔑 Default permission templates created:');
    console.log('  - Basic Content Management');
    console.log('  - Full Content Management');
    console.log('  - Members Only');
    console.log('  - Analytics Access');

  } catch (error) {
    console.error('❌ Error setting up Permission Management System:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the setup
setupPermissionManagement()
  .then(() => {
    console.log('\n✅ Setup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
  });
