# 🕉️ राष्ट्रीय हिंदू वाहिनी संगठन (RHVS) - Digital Platform

A comprehensive digital platform for the Rashtriya Hindu Vahini Sangathan (RHVS) organization, built with Next.js 15, featuring member management, content management, e-commerce, and administrative capabilities.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [Database Setup](#database-setup)
- [API Endpoints](#api-endpoints)
- [User Roles & Permissions](#user-roles--permissions)
- [Key Functionalities](#key-functionalities)
- [Deployment](#deployment)
- [Contributing](#contributing)

## 🎯 Overview

RHVS Digital Platform is a modern web application designed to serve the Rashtriya Hindu Vahini Sangathan community. It provides a complete ecosystem for member management, content publishing, e-commerce, and administrative operations.

### Core Purpose
- **Member Management**: Secure registration with OTP verification system
- **Content Management**: Dynamic website content editing and publishing
- **E-commerce**: Spiritual product store with cart functionality
- **Administration**: Role-based admin dashboard with analytics
- **Community**: Events, gallery, and news management

## ✨ Features

### 🏠 **Public Website**
- **Hero Section**: Bilingual (Hindi/English) with organization branding
- **Core Values**: Interactive cards showcasing organizational principles
- **Activities**: Comprehensive activity showcase with descriptions
- **Gallery**: Photo gallery with album management
- **Product Store**: E-commerce functionality for spiritual products
- **Events**: Event listings and management
- **News**: News and announcements section
- **Member Registration**: Secure member onboarding process

### 👥 **Member Management System**
- **OTP Verification**: Existing member verification for new registrations
- **Profile Management**: Complete member profile with photo upload
- **Registration Chain**: Track who registered whom
- **PDF Certificates**: Auto-generated membership certificates
- **Search & Filter**: Advanced member search capabilities

### 🛠️ **Admin Dashboard**
- **Role-Based Access**: Superadmin, Admin, and Verified Member roles
- **Analytics**: Comprehensive statistics and reporting
- **Content Management**: Dynamic website content editing
- **Member Management**: Complete member lifecycle management
- **Activity Logs**: Detailed audit trail
- **Permission System**: Granular permission management

### 🛒 **E-commerce Features**
- **Product Catalog**: Spiritual and religious products
- **Shopping Cart**: Full cart functionality with context
- **Favorites**: Product wishlist system
- **Categories**: Organized product categorization
- **Inventory Management**: Stock tracking and management

### 📱 **Content Management System (CMS)**
- **About Page Editor**: Dynamic content editing with rich text
- **Gallery Management**: Image upload and album organization
- **Event Management**: Create and manage community events
- **Product Store**: E-commerce product management
- **SEO Management**: Meta tags and SEO optimization

## 🛠️ Tech Stack

### **Frontend**
- **Framework**: Next.js 15.5.2 with App Router
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui + Radix UI
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Forms**: React Hook Form + Zod validation

### **Backend**
- **Runtime**: Node.js 18+
- **Database**: MySQL 8.0
- **ORM**: Native MySQL2 driver
- **Email**: Nodemailer
- **PDF Generation**: jsPDF
- **Authentication**: Custom JWT-based system

### **Development Tools**
- **Package Manager**: pnpm
- **Linting**: ESLint
- **Build Tool**: Turbopack
- **Version Control**: Git

## 📁 Project Structure

```
rhvs/
├── 📁 public/                          # Static assets
│   ├── 📁 gallery/                     # Gallery images
│   ├── 📁 product/                     # Product images
│   ├── 📁 uploads/                     # User uploads
│   ├── rhvs_logo.png                   # Organization logo
│   └── hero-img.jpg                    # Hero section image
│
├── 📁 src/
│   ├── 📁 app/                         # Next.js App Router
│   │   ├── 📁 admin/                   # Admin dashboard routes
│   │   │   ├── 📁 analytics/           # Analytics dashboard
│   │   │   ├── 📁 content/             # Content management
│   │   │   ├── 📁 dashboard/           # Main admin dashboard
│   │   │   ├── 📁 logs/                # Activity logs
│   │   │   ├── 📁 members/             # Member management
│   │   │   ├── 📁 settings/            # Admin settings
│   │   │   └── layout.tsx              # Admin layout
│   │   ├── 📁 api/                     # API routes
│   │   │   ├── 📁 admin/               # Admin API endpoints
│   │   │   ├── 📁 content/             # Content API endpoints
│   │   │   ├── 📁 register/            # Registration API
│   │   │   └── 📁 upload/              # File upload API
│   │   ├── 📁 members/                 # Member registration
│   │   │   └── 📁 register/            # Registration page
│   │   ├── globals.css                 # Global styles
│   │   ├── layout.tsx                  # Root layout
│   │   └── page.tsx                    # Home page
│   │
│   ├── 📁 components/                  # React components
│   │   ├── 📁 Admin/                   # Admin dashboard components
│   │   │   ├── 📁 Analytics/           # Analytics components
│   │   │   ├── 📁 Content/             # Content management components
│   │   │   ├── 📁 Events/              # Event management components
│   │   │   ├── 📁 Gallery/             # Gallery management components
│   │   │   ├── 📁 Layout/              # Admin layout components
│   │   │   ├── 📁 Members/             # Member management components
│   │   │   ├── 📁 Security/            # Security components
│   │   │   ├── 📁 Store/               # Store management components
│   │   │   └── index.ts                # Component exports
│   │   ├── 📁 Home/                    # Public website components
│   │   │   ├── 📁 Product/             # Product-related components
│   │   │   ├── 📁 events/              # Events page components
│   │   │   ├── 📁 gallery/             # Gallery page components
│   │   │   ├── ActivitiesSection.tsx   # Activities showcase
│   │   │   ├── CoreValuesSection.tsx   # Core values section
│   │   │   ├── Footer.tsx              # Website footer
│   │   │   ├── HeroSection.tsx         # Hero section
│   │   │   └── Navbar.tsx              # Navigation bar
│   │   └── 📁 ui/                      # Reusable UI components
│   │       ├── avatar.tsx              # Avatar component
│   │       ├── button.tsx              # Button component
│   │       ├── card.tsx                # Card component
│   │       ├── form.tsx                # Form components
│   │       ├── input.tsx               # Input component
│   │       └── ...                     # Other UI components
│   │
│   ├── 📁 contexts/                    # React contexts
│   │   ├── AdminContext.tsx            # Admin state management
│   │   └── CartContext.tsx             # Shopping cart state
│   │
│   └── 📁 lib/                         # Utility libraries
│       ├── content.ts                  # Content management utilities
│       ├── database.ts                 # Database connection
│       ├── email.ts                    # Email utilities
│       └── utils.ts                    # General utilities
│
├── 📁 database/                        # Database files
│   ├── database-schema.sql             # Main database schema
│   ├── database-content-tables.sql     # Content management tables
│   ├── database-store-tables.sql       # E-commerce tables
│   └── fix-*.sql                       # Database fixes
│
├── 📄 package.json                     # Dependencies and scripts
├── 📄 next.config.ts                   # Next.js configuration
├── 📄 tailwind.config.js               # Tailwind CSS configuration
├── 📄 tsconfig.json                    # TypeScript configuration
└── 📄 README.md                        # This file
```

## 🚀 Installation & Setup

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm
- MySQL 8.0+ database
- SMTP email service

### 1. Clone Repository
```bash
git clone https://github.com/Anshu10101/RHVS.git
cd RHVS
```

### 2. Install Dependencies
```bash
# Using pnpm (recommended)
pnpm install

# Or using npm
npm install
```

### 3. Environment Configuration
Create `.env.local` file in project root:

```env
# Database Configuration
DB_HOST=your_mysql_host
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=your_mysql_database
DB_PORT=3306

# Email Configuration (for OTP sending)
EMAIL_HOST=smtp.hostinger.com
EMAIL_PORT=587
EMAIL_USER=your_email@yourdomain.com
EMAIL_PASS=your_email_password
EMAIL_FROM=your_email@yourdomain.com

# Application Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
```

### 4. Database Setup
```bash
# Run database setup script
node setup-database.js

# Or manually run SQL files in order:
# 1. database-schema.sql
# 2. database-content-tables.sql
# 3. database-store-tables.sql
```

### 5. Start Development Server
```bash
# Using pnpm
pnpm dev

# Or using npm
npm run dev
```

### 6. Access Application
- **Public Website**: http://localhost:3000
- **Admin Dashboard**: http://localhost:3000/admin
- **Member Registration**: http://localhost:3000/members/register

## 🗄️ Database Setup

### Required Tables

#### **Core Tables**
- `members` - Member registration data
- `otp_verifications` - OTP verification system
- `admin_users` - Admin user accounts
- `activity_logs` - System activity tracking

#### **Content Management Tables**
- `about_sections` - About page content
- `gallery_images` - Gallery photos
- `gallery_albums` - Photo albums
- `products` - E-commerce products
- `events` - Community events
- `departments` - Organization departments
- `offices` - Office locations
- `karya_samiti` - Committee members
- `contact_info` - Contact information
- `navigation_links` - Website navigation
- `seo_meta` - SEO metadata
- `content_versions` - Content history

### Sample Data
```sql
-- Default admin user
INSERT INTO admin_users (username, email, password, role, is_active) 
VALUES ('admin', 'admin@rhvs.org', 'hashed_password', 'superadmin', 1);
```

## 🔌 API Endpoints

### **Authentication**
- `POST /api/admin/login` - Admin login
- `POST /api/admin/logout` - Admin logout

### **Member Management**
- `POST /api/register` - Member registration with OTP
  - Action: `send-otp` - Send OTP to existing member
  - Action: `verify-otp` - Verify OTP code
  - Action: `register-member` - Complete member registration

### **Content Management**
- `GET /api/content/about` - Get about page content
- `POST /api/content/about` - Update about page content
- `GET /api/content/gallery` - Get gallery images
- `POST /api/content/gallery` - Upload gallery images
- `GET /api/content/events` - Get events
- `POST /api/content/events` - Create/update events
- `GET /api/content/store` - Get products
- `POST /api/content/store` - Manage products

### **File Upload**
- `POST /api/upload/gallery` - Upload gallery images
- `POST /api/upload/store` - Upload product images

## 👥 User Roles & Permissions

### **Superadmin** 🔑
- Full system access
- User management
- System settings
- All content management
- Analytics and reporting

### **Admin** 👨‍💼
- District-specific access
- Member management
- Content editing
- Limited analytics
- Event management

### **Verified Member** 👤
- Add new members (with OTP verification)
- View member list
- Limited content access
- Basic profile management

### **Public User** 🌐
- Browse website
- View gallery and events
- Shop products
- Register as member

## 🎯 Key Functionalities

### **Member Registration Flow**
1. **Existing Member Verification**: New members need existing member verification
2. **OTP System**: OTP sent to existing member's email
3. **Form Validation**: Comprehensive client and server-side validation
4. **Profile Photo Upload**: Support for profile photo uploads
5. **PDF Certificate**: Auto-generated membership certificate
6. **Registration Chain**: Track member registration hierarchy

### **Content Management System**
1. **Dynamic Editing**: Real-time content editing
2. **Rich Text Support**: Formatting and styling options
3. **Image Management**: Upload and organize images
4. **Version Control**: Content history tracking
5. **SEO Optimization**: Meta tags and descriptions

### **E-commerce System**
1. **Product Catalog**: Categorized product listings
2. **Shopping Cart**: Full cart functionality
3. **Favorites**: Wishlist system
4. **Inventory Management**: Stock tracking
5. **Order Management**: Order processing

### **Admin Dashboard**
1. **Analytics**: Real-time statistics and charts
2. **Member Management**: Complete member lifecycle
3. **Content Management**: Website content editing
4. **Activity Logs**: Detailed audit trail
5. **Permission Management**: Role-based access control

## 🚀 Deployment

### **Production Build**
```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

### **Environment Variables (Production)**
```env
# Update these for production
NEXTAUTH_URL=https://yourdomain.com
DB_HOST=your_production_db_host
EMAIL_HOST=your_production_smtp_host
```

### **Database Migration**
1. Export development database
2. Import to production database
3. Update environment variables
4. Deploy application

## 🤝 Contributing

### **Development Workflow**
1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Make changes and test thoroughly
4. Commit changes: `git commit -m 'Add amazing feature'`
5. Push to branch: `git push origin feature/amazing-feature`
6. Create Pull Request

### **Code Standards**
- Use TypeScript for type safety
- Follow ESLint configuration
- Write meaningful commit messages
- Add comments for complex logic
- Test all new features

### **Pull Request Process**
1. Update README.md if needed
2. Add tests for new features
3. Ensure all tests pass
4. Request review from maintainers
5. Address feedback and merge

## 📞 Support

For technical support or questions:
- **Email**: admin@rhvs.org
- **GitHub Issues**: Create an issue in the repository
- **Documentation**: Check this README and inline code comments

## 📄 License

This project is proprietary software for Rashtriya Hindu Vahini Sangathan (RHVS). All rights reserved.

---

## 🏆 Acknowledgments

Built with ❤️ for the RHVS community, dedicated to preserving and promoting Hindu dharma and culture through modern technology.

**॥ जय श्री राम ॥**