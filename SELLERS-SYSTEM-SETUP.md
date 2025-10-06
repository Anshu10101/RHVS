# Sellers Management System Setup Guide

## Overview
This system allows district admins to manage sellers and link them to products, enabling a decentralized product management approach across 700+ districts.

## Database Setup

### 1. Run the SQL Script
Execute the following SQL in your MySQL database:

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
```

### 2. Add Seller Permissions
Add these permissions to your `available_permissions` table:

```sql
INSERT INTO available_permissions (permission_key, permission_name, description, category) VALUES
('manage_sellers', 'Manage Sellers', 'Can add, edit, and delete sellers for their district', 'sellers'),
('add_sellers', 'Add Sellers', 'Can add new sellers to their district', 'sellers'),
('edit_sellers', 'Edit Sellers', 'Can edit seller details in their district', 'sellers'),
('delete_sellers', 'Delete Sellers', 'Can delete sellers from their district', 'sellers'),
('view_sellers', 'View Sellers', 'Can view seller listings for their district', 'sellers');
```

## Features Implemented

### ✅ Database Schema
- `sellers` table with district-scoped data
- Product-seller relationship via `seller_id` foreign key
- Proper indexing for performance

### ✅ API Endpoints
- `GET /api/admin/sellers` - List sellers (district-scoped)
- `POST /api/admin/sellers` - Create new seller
- `GET /api/admin/sellers/[id]` - Get seller details
- `PUT /api/admin/sellers/[id]` - Update seller
- `DELETE /api/admin/sellers/[id]` - Delete seller

### ✅ Admin Interface
- `/admin/sellers` - Complete seller management interface
- Add/Edit/Delete sellers with full contact information
- Search and filter functionality
- District-scoped access control

### ✅ Product Integration
- Updated product APIs to include seller information
- Product creation/editing now supports seller selection
- Seller contact info displayed with products

### ✅ Navigation
- Added "Sellers" menu item in admin sidebar
- Permission-based access control

## How It Works

### 1. District Admin Workflow
1. **Login** as district admin
2. **Navigate** to Content Management → Sellers
3. **Add Sellers** with contact details:
   - Name, business name, phone, WhatsApp, email
   - Address and delivery information
   - Active/inactive status
4. **Create Products** and link to sellers
5. **Manage** seller information as needed

### 2. Customer Experience
1. **Browse Products** on website
2. **See Seller Information**:
   - Seller name and business
   - Contact phone and WhatsApp
   - Email for inquiries
   - Delivery information
3. **Contact Seller Directly** for purchase
4. **No Payment Integration** - direct seller contact

### 3. Scalability
- **700 Districts** × **30 Sellers** = 21,000 potential sellers
- **District Isolation** - each admin manages only their sellers
- **Simple Contact Flow** - no complex payment processing
- **Easy Management** - add sellers once, use for multiple products

## Key Benefits

1. **Simple & Scalable**: Handles thousands of sellers across districts
2. **District-Scoped**: Each admin manages only their district's sellers
3. **No Payment Complexity**: Direct seller-customer communication
4. **Flexible**: Sellers can have multiple products
5. **Future-Proof**: Easy to add features like seller ratings, etc.

## Usage Examples

### Adding a Seller
```javascript
// District admin adds seller via UI
{
  name: "Rajesh Kumar",
  business_name: "Spiritual Store",
  contact_phone: "9876543210",
  whatsapp_number: "9876543210",
  email: "rajesh@spiritualstore.com",
  address: "Main Market, District Center",
  delivery_info: "Free delivery within 10km, ₹50 beyond"
}
```

### Linking Product to Seller
```javascript
// When creating product
{
  name: "Rudraksha Mala",
  price: 1500,
  category: "spiritual_items",
  seller_id: "seller_1759015274047_123", // Links to seller
  // ... other product details
}
```

### Customer Sees
- Product: "Rudraksha Mala - ₹1,500"
- Seller: "Rajesh Kumar (Spiritual Store)"
- Contact: "Call: 9876543210 | WhatsApp: 9876543210"
- Delivery: "Free delivery within 10km, ₹50 beyond"

## Next Steps

1. **Run Database Setup** - Execute the SQL scripts above
2. **Assign Permissions** - Give district admins seller management permissions
3. **Test the System** - Add sellers and create products
4. **Train District Admins** - Show them how to use the seller management interface

## Troubleshooting

### Database Issues
- Ensure `district_admins` table exists
- Check foreign key constraints
- Verify permissions table has seller permissions

### Permission Issues
- District admins need `manage_sellers` permission
- Check admin scope and district assignment

### API Issues
- Verify database connection
- Check admin authentication
- Ensure proper district scoping

## Support

The system is designed to be simple and maintainable. All code follows existing patterns in your RHVS codebase and integrates seamlessly with your current district admin system.
