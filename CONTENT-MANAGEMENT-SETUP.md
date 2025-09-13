# RHVS Content Management Database Setup

## 🗄️ **Database Tables Required**

You need to add **13 tables** to your Hostinger MySQL database for complete content management functionality.

## 📋 **Step-by-Step Setup**

### **1. Access Your Hostinger Database**
1. Login to your Hostinger control panel
2. Go to **Databases** → **MySQL Databases**
3. Click on **phpMyAdmin** for your database
4. Select your database from the left sidebar

### **2. Run the SQL Script**
1. Click on **SQL** tab in phpMyAdmin
2. Copy and paste the entire content from `database-content-tables.sql`
3. Click **Go** to execute the script

### **3. Verify Tables Created**
You should see these tables in your database:
- ✅ `about_sections` - About page content
- ✅ `gallery_images` - Gallery photos
- ✅ `gallery_albums` - Photo albums
- ✅ `products` - Product store items
- ✅ `events` - Community events
- ✅ `departments` - Organization departments
- ✅ `offices` - Office locations
- ✅ `karya_samiti` - Committee members
- ✅ `contact_info` - Contact information
- ✅ `navigation_links` - Website navigation
- ✅ `seo_meta` - SEO and meta tags
- ✅ `content_versions` - Content history
- ✅ `activity_logs` - Admin activity tracking

## 🎯 **Content Management Features**

### **✅ About Page Editor**
- **Route**: `/admin/content/about`
- **Features**: Hero sections, cards, quotes, headings, paragraphs
- **Styling**: Font sizes, colors, alignment, weights
- **Real-time**: Changes reflect on `/about` page immediately

### **✅ Gallery Management**
- **Route**: `/admin/content/gallery`
- **Features**: Upload images, create albums, organize photos
- **Types**: Festival photos, community events, spiritual activities

### **✅ Product Store**
- **Route**: `/admin/content/store`
- **Features**: Add products, manage inventory, pricing, categories
- **Types**: Spiritual items, puja items, sacred items, jewelry

### **✅ Events Management**
- **Route**: `/admin/content/events`
- **Features**: Create events, manage dates, locations, registration
- **Types**: Festivals, meetings, celebrations, workshops

### **✅ Departments**
- **Route**: `/admin/content/departments`
- **Features**: Manage organization departments and teams
- **Types**: IT, Finance, Event Management, Media & Communications

### **✅ Offices**
- **Route**: `/admin/content/offices`
- **Features**: Manage office locations and contact details
- **Types**: Head office, regional offices, branch offices

### **✅ Karya Samiti**
- **Route**: `/admin/content/karya-samiti`
- **Features**: Manage committee members and leadership
- **Types**: Executive committee, advisory board, working committees

### **✅ Contact Information**
- **Route**: `/admin/content/contact`
- **Features**: Manage contact details and office hours
- **Types**: Phone numbers, emails, addresses, emergency contacts

### **✅ Navigation**
- **Route**: `/admin/content/navigation`
- **Features**: Manage website navigation and links
- **Types**: Main menu, footer links, sidebar links

### **✅ SEO & Meta**
- **Route**: `/admin/content/seo`
- **Features**: Manage SEO tags and meta information
- **Types**: Title tags, descriptions, keywords, social media

## 🔧 **API Endpoints Created**

### **Content APIs**
- `GET/POST /api/content/about` - About page sections
- `GET/POST /api/content/gallery` - Gallery images
- `GET/POST /api/content/store` - Product store
- `GET/POST /api/content/events` - Events management
- `GET/POST /api/content/departments` - Departments
- `GET/POST /api/content/offices` - Offices
- `GET/POST /api/content/karya-samiti` - Committee
- `GET/POST /api/content/contact` - Contact info
- `GET/POST /api/content/navigation` - Navigation
- `GET/POST /api/content/seo` - SEO meta

## 🚀 **How It Works**

### **1. Admin Edits Content**
- Superadmin logs into `/admin/login`
- Navigates to Content Management
- Selects any content section (About, Gallery, etc.)
- Makes changes using the editor

### **2. Changes Are Saved**
- Content is saved to MySQL database
- Version history is maintained
- Activity logs are recorded

### **3. Live Website Updates**
- Public pages load content from database
- Changes appear immediately on live site
- No need to rebuild or redeploy

## 📊 **Sample Data Included**

The setup script includes sample data for:
- ✅ About page sections (Hindi content)
- ✅ Contact information
- ✅ Navigation links
- ✅ SEO meta tags for all pages

## 🔐 **Security Features**

- **Role-based access** - Only superadmin can edit
- **Activity logging** - All changes are tracked
- **Version control** - Content history maintained
- **Input validation** - All data is validated
- **SQL injection protection** - Prepared statements used

## 🎨 **Styling Options**

Each content section supports:
- **Text Alignment**: Left, Center, Right
- **Font Sizes**: 8 different sizes (sm to 5xl)
- **Font Weights**: 5 different weights
- **Text Colors**: 5 color themes
- **Ordering**: Drag and drop reordering
- **Visibility**: Show/hide sections

## 📱 **Responsive Design**

- **Mobile-first** approach
- **Tablet optimized** layouts
- **Desktop enhanced** features
- **Touch-friendly** interfaces

## ⚡ **Performance Features**

- **Database indexing** for fast queries
- **Image optimization** for gallery
- **Lazy loading** for large content
- **Caching** for better performance

## 🔄 **Backup & Recovery**

- **Content versions** - Full history tracking
- **Database backups** - Regular backups recommended
- **Export functionality** - Download content as JSON
- **Import functionality** - Restore from backups

---

**🎉 Once you run the SQL script, all content management features will be fully functional!**

**Next Steps:**
1. Run the SQL script in Hostinger
2. Test the admin dashboard at `/admin/login`
3. Edit content and see changes on live pages
4. Customize content to match your needs
