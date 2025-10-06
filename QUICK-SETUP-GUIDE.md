# Quick Setup Guide - Sellers System

## 🚨 Current Issue: Database Setup Required

The "Failed to fetch sellers: Server error" occurs because the database tables haven't been created yet.

## ✅ Solution: Run Database Setup

### Option 1: Using MySQL Command Line
```sql
-- Connect to your MySQL database
mysql -u your_username -p your_database_name

-- Then run:
source database/complete-sellers-setup.sql
```

### Option 2: Using phpMyAdmin or MySQL Workbench
1. Open your database management tool
2. Select your database
3. Go to "Import" or "SQL" tab
4. Copy and paste the contents of `database/complete-sellers-setup.sql`
5. Execute the SQL

### Option 3: Manual Setup
Copy and paste this SQL into your database:

```sql
-- Create sellers table
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
);

-- Add seller_id to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS seller_id VARCHAR(50) NULL AFTER category,
ADD INDEX IF NOT EXISTS idx_seller (seller_id);

-- Add foreign key constraint
ALTER TABLE products 
ADD CONSTRAINT IF NOT EXISTS fk_products_seller 
FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE SET NULL;

-- Add seller permissions
INSERT IGNORE INTO available_permissions (permission_key, permission_name, description, category) VALUES
('manage_sellers', 'Manage Sellers', 'Can add, edit, and delete sellers for their district', 'sellers'),
('add_sellers', 'Add Sellers', 'Can add new sellers to their district', 'sellers'),
('edit_sellers', 'Edit Sellers', 'Can edit seller details in their district', 'sellers'),
('delete_sellers', 'Delete Sellers', 'Can delete sellers from their district', 'sellers'),
('view_sellers', 'View Sellers', 'Can view seller listings for their district', 'sellers');
```

## 🔧 After Setup

1. **Refresh the page** - The error should be gone
2. **Assign permissions** - Give district admins the `manage_sellers` permission
3. **Start adding sellers** - Click "Manage Sellers" button on store page

## 🎯 What You'll See After Setup

- ✅ No more "Server error" 
- ✅ Empty sellers list (ready to add sellers)
- ✅ "Add Seller" button works
- ✅ Full sellers management interface

## 🆘 Still Having Issues?

1. **Check database connection** - Make sure your app can connect to MySQL
2. **Verify table creation** - Check if `sellers` table exists in your database
3. **Check permissions** - Ensure district admins have seller management permissions

The system is ready to use once the database setup is complete! 🚀
