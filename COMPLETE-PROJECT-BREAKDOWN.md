# RHVS PROJECT - COMPLETE TECHNICAL BREAKDOWN

## Executive Summary

**RHVS (Rashtriya Hindu Vahini Sangathan) Digital Platform** is a comprehensive web application built with Next.js 15, TypeScript, MySQL, and Tailwind CSS. It serves as a complete digital ecosystem for managing a Hindu organization with features spanning member registration, content management, e-commerce, district administration, department management, certificate generation, and multi-level authorization.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture & Tech Stack](#2-architecture--tech-stack)
3. [Database Schema & Structure](#3-database-schema--structure)
4. [Authentication & Authorization System](#4-authentication--authorization-system)
5. [Frontend Architecture](#5-frontend-architecture)
6. [Backend API System](#6-backend-api-system)
7. [Member Registration & Management Flow](#7-member-registration--management-flow)
8. [Content Management System](#8-content-management-system)
9. [District Admin & Permission System](#9-district-admin--permission-system)
10. [Department Management System](#10-department-management-system)
11. [Certificate & ID Card Generation](#11-certificate--id-card-generation)
12. [Hero Images & Gallery System](#12-hero-images--gallery-system)
13. [E-commerce & Store Management](#13-e-commerce--store-management)
14. [Email & Notification System](#14-email--notification-system)
15. [File Upload & Media Management](#15-file-upload--media-management)
16. [Middleware & Security](#16-middleware--security)

---

## 1. PROJECT OVERVIEW

### What Is This Project?

RHVS is a full-stack digital platform for managing a Hindu organization with the following core capabilities:

1. **Member Management** - Registration, verification, tracking
2. **Content Management** - News, events, gallery, images
3. **Administration** - Multi-level admin dashboard with role-based access
4. **E-commerce** - Product store with cart functionality
5. **Department Management** - Organizational structure with posts and assignments
6. **Certificate Generation** - Automated PDF certificates and ID cards
7. **District Management** - Multi-district, multi-state operations
8. **Gallery & Media** - Photo management with event associations

### Core Features

- **OTP-based member verification** for secure registration
- **Multi-level admin system** (Superadmin, District Admin, Verified Members)
- **District-scoped operations** with permission-based access
- **Certificate & ID card auto-generation** on member registration
- **Hierarchical department structure** (National/State/District levels)
- **Event-based photo galleries** with tagging and filtering
- **Hero image marquee** with auto-rotation
- **Shopping cart** with favorites system
- **Activity logging** for audit trails
- **Email notifications** for registrations and OTPs

---

## 2. ARCHITECTURE & TECH STACK

### Technology Stack

#### Frontend
- **Framework**: Next.js 15.5.2 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui + Radix UI primitives
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Forms**: React Hook Form + Zod validation
- **Drag & Drop**: @hello-pangea/dnd
- **Toast Notifications**: Sonner
- **PDF Generation**: jsPDF, pdf-lib
- **Canvas**: node-canvas
- **Date Handling**: date-fns, date-fns-tz

#### Backend
- **Runtime**: Node.js 18+
- **Database**: MySQL 8.0
- **Database Driver**: mysql2/promise
- **Authentication**: JWT (jose library)
- **Password Hashing**: bcryptjs
- **Email**: Nodemailer
- **File System**: fs (Node.js built-in)
- **Image Processing**: canvas (for certificates/ID cards)

#### Development Tools
- **Package Manager**: pnpm
- **Linting**: ESLint
- **Build Tool**: Turbopack
- **Version Control**: Git

### Architecture Pattern

**Server-Side Rendered (SSR) + Client-Side Rendering (CSR) Hybrid**

- **Server Components**: For SEO, data fetching, authentication
- **Client Components**: For interactivity, forms, UI state
- **API Routes**: RESTful API endpoints in `/api` directory
- **Middleware**: Authentication, route protection, request validation

### Project Structure

```
rhvs/
├── public/                    # Static assets
│   ├── uploads/              # User-generated content
│   │   ├── profiles/         # Member profile photos
│   │   ├── photos/           # Gallery photos
│   │   ├── content/          # Content uploads
│   │   └── signatures/       # Signature files
│   ├── certificates/         # Generated certificates
│   ├── id-cards/             # Generated ID cards
│   └── fonts/                # Custom fonts (Hindi)
│
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── admin/            # Admin dashboard pages
│   │   ├── members/          # Member pages
│   │   ├── api/              # API routes
│   │   │   ├── admin/        # Admin operations
│   │   │   ├── register/     # Member registration
│   │   │   ├── upload/       # File uploads
│   │   │   └── content/      # Content APIs
│   │   └── page.tsx           # Home page
│   │
│   ├── components/           # React components
│   │   ├── Admin/            # Admin dashboard components
│   │   ├── Home/             # Public website components
│   │   └── ui/               # Reusable UI components
│   │
│   ├── contexts/             # React contexts
│   │   ├── AdminContext.tsx  # Admin state management
│   │   └── CartContext.tsx   # Shopping cart state
│   │
│   ├── lib/                  # Utility libraries
│   │   ├── database.ts       # DB connection & queries
│   │   ├── auth-jwt.ts       # JWT auth
│   │   ├── admin-scope.ts    # Permission checking
│   │   ├── email.ts          # Email sending
│   │   ├── certificate.ts    # Certificate generation
│   │   └── content.ts        # Content management
│   │
│   └── middleware.ts         # Route protection
│
├── database/                 # SQL schemas & migrations
├── setup-*.js                # Setup scripts
└── package.json              # Dependencies
```

---

## 3. DATABASE SCHEMA & STRUCTURE

### Core Tables

#### 1. **members**
Stores all registered members with personal and organizational information.

```sql
CREATE TABLE members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  member_reg_number VARCHAR(20) UNIQUE,           # Unique member ID
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address TEXT NOT NULL,
  state VARCHAR(100),                              # State name
  district VARCHAR(100),                           # District name
  aadhar_card_number VARCHAR(12),                  # Aadhaar number
  father_husband_name VARCHAR(255),
  mother_wife_name VARCHAR(255),
  registration_date DATE NOT NULL,
  existing_member_reg_number VARCHAR(50),          # Who registered them
  profile_photo_path VARCHAR(500) NOT NULL,        # Photo path (required)
  signature_path VARCHAR(500),                     # Signature file path
  verified_by_member_id INT,                       # FK to members
  status ENUM('pending', 'verified', 'rejected'),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Key Relationships:**
- `verified_by_member_id` → `members.id` (self-referencing, tracks who registered whom)

**Key Features:**
- **Profile photo is mandatory** - defaults to `/uploads/default-avatar.svg`
- **Registration chain tracking** - Can trace who registered whom
- **Status management** - pending/verified/rejected workflow

#### 2. **superadmin**
Single table for superadmin accounts with full system access.

```sql
CREATE TABLE superadmin (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('superadmin') DEFAULT 'superadmin',
  last_login TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Default Admin:**
- Email: `admin@rhvs.org`
- Password: `admin123` (bcrypt hashed)

#### 3. **district_admins**
District-level administrators with limited permissions.

```sql
CREATE TABLE district_admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  member_id INT NOT NULL,                          # FK to members
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  district VARCHAR(255) NOT NULL,
  state VARCHAR(255),
  role VARCHAR(50) DEFAULT 'district_admin',
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP,                             # Account expiration
  last_login TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(id)
);
```

**Key Features:**
- **Linked to member account** - District admin must be a registered member
- **Expiration support** - Accounts can have expiry dates
- **District-scoped** - Limited to their district

#### 4. **district_admin_permissions**
Time-based and permanent permissions for district admins.

```sql
CREATE TABLE district_admin_permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  district_admin_id INT NOT NULL,
  permission VARCHAR(100) NOT NULL,
  permission_type ENUM('permanent', 'temporary') DEFAULT 'permanent',
  expires_at TIMESTAMP,                             # NULL for permanent
  is_active BOOLEAN DEFAULT TRUE,
  granted_by INT,                                   # Admin who granted it
  granted_at TIMESTAMP,
  FOREIGN KEY (district_admin_id) REFERENCES district_admins(id),
  INDEX idx_district_admin (district_admin_id),
  INDEX idx_expires_at (expires_at)
);
```

**Permission Types:**
- **Permanent**: Never expire (e.g., member management)
- **Temporary**: Expires after set time (e.g., content management)

**Common Permissions:**
- `all` - All permissions
- `manage_members` - Add/edit/delete members
- `manage_content` - Manage news, events, gallery
- `manage_products` - Manage store products
- `manage_hero_images` - Manage hero section images
- `view_analytics` - Access analytics dashboard

#### 5. **departments**
Organizational departments at national/state/district levels.

```sql
CREATE TABLE departments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name_en VARCHAR(255) NOT NULL,                   # English name
  name_hi VARCHAR(255),                             # Hindi name
  description TEXT,
  level ENUM('national', 'state', 'district') NOT NULL,
  state VARCHAR(100),                               # For state-level depts
  district VARCHAR(100),                            # For district-level depts
  created_by INT,                                   # FK to superadmin
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### 6. **department_posts**
Positions within departments (e.g., President, Secretary).

```sql
CREATE TABLE department_posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  department_id INT NOT NULL,
  name_en VARCHAR(255) NOT NULL,
  name_hi VARCHAR(255),
  post_order INT DEFAULT 0,                         # Display order
  FOREIGN KEY (department_id) REFERENCES departments(id),
  UNIQUE KEY unique_post_order (department_id, post_order)
);
```

**Key Rules:**
- **First post is always President** (post_order = 0)
- Cannot delete or reorder President post
- Ordering determines hierarchy

#### 7. **department_members**
Links members to department posts (many-to-many).

```sql
CREATE TABLE department_members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  member_id INT NOT NULL,
  department_id INT NOT NULL,
  post_id INT NOT NULL,
  level VARCHAR(50),                                # national/state/district
  state VARCHAR(100),
  district VARCHAR(100),
  appointment_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (member_id) REFERENCES members(id),
  FOREIGN KEY (department_id) REFERENCES departments(id),
  FOREIGN KEY (post_id) REFERENCES department_posts(id)
);
```

**Key Features:**
- Tracks which members hold which posts
- Supports national, state, district level assignments
- Stores appointment dates

#### 8. **hero_images**
Hero section images with marquee functionality.

```sql
CREATE TABLE hero_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  image_path VARCHAR(500) NOT NULL,
  alt_text VARCHAR(255) NOT NULL,
  title VARCHAR(255),
  description TEXT,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  added_by INT NOT NULL,                           # Admin ID
  district_id INT,
  state_id INT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### 9. **hero_image_settings**
Configuration for hero section behavior.

```sql
CREATE TABLE hero_image_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  description TEXT,
  updated_by INT NOT NULL,
  updated_at TIMESTAMP
);
```

**Settings:**
- `marquee_speed` - Animation speed (5-120 seconds)
- `image_display_duration` - Time per image (1-10 seconds)
- `auto_play` - Auto-rotation enabled
- `show_indicators` - Navigation dots visible
- `transition_effect` - Animation type (slide/fade)

#### 10. **registration_tokens**
Temporary tokens for approved registrations.

```sql
CREATE TABLE registration_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  token VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  # ... all member fields ...
  status ENUM('pending', 'verified', 'expired', 'rejected'),
  expires_at TIMESTAMP NOT NULL,
  verified_by_admin_id INT,
  verified_at TIMESTAMP,
  created_at TIMESTAMP
);
```

**Workflow:**
1. Superadmin creates token
2. Token sent to applicant via email
3. Applicant completes registration via token
4. Status updated to 'verified'

#### 11. **photos & photo_events**
Advanced photo gallery with event associations.

```sql
CREATE TABLE photo_events (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_date DATE,
  location VARCHAR(255),
  state VARCHAR(100),
  district VARCHAR(100),
  tags JSON,
  is_visible BOOLEAN DEFAULT TRUE,
  created_by VARCHAR(100),
  created_at TIMESTAMP
);

CREATE TABLE photos (
  id VARCHAR(50) PRIMARY KEY,
  event_id VARCHAR(50),
  filename VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  thumbnail_path VARCHAR(500),
  file_size BIGINT,
  dimensions VARCHAR(20),
  file_type VARCHAR(50),
  tags JSON,
  caption TEXT,
  photographer VARCHAR(100),
  is_featured BOOLEAN DEFAULT FALSE,
  is_approved BOOLEAN DEFAULT TRUE,
  is_visible BOOLEAN DEFAULT TRUE,
  district VARCHAR(100),
  state VARCHAR(100),
  owner_admin_id INT,
  created_by VARCHAR(100),
  created_at TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES photo_events(id)
);
```

#### 12. **products**
E-commerce product catalog.

```sql
CREATE TABLE products (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  stock INT DEFAULT 0,
  category VARCHAR(100),
  image_path VARCHAR(500),
  is_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### 13. **member_certificates**
Generated certificates for members.

```sql
CREATE TABLE member_certificates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  member_id INT NOT NULL,
  certificate_number VARCHAR(50) UNIQUE NOT NULL,
  certificate_path VARCHAR(500),
  generated_at TIMESTAMP,
  generated_by_admin_id INT,
  FOREIGN KEY (member_id) REFERENCES members(id)
);
```

#### 14. **activity_logs**
Audit trail for admin actions.

```sql
CREATE TABLE activity_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  user_type ENUM('superadmin', 'district_admin', 'member'),
  action VARCHAR(100) NOT NULL,
  details TEXT,
  ip_address VARCHAR(50),
  created_at TIMESTAMP,
  INDEX idx_user (user_id, user_type),
  INDEX idx_action (action),
  INDEX idx_created (created_at)
);
```

**Logged Actions:**
- Login/logout
- Member additions/deletions
- Permission grants/revokes
- Content modifications
- Certificate generations

### Additional Tables

- **states** - Indian states reference
- **districts** - District codes and names
- **news** - News articles
- **events** - Upcoming events
- **about_sections** - About page content
- **contact_info** - Contact information
- **seo_meta** - SEO metadata

---

## 4. AUTHENTICATION & AUTHORIZATION SYSTEM

### Authentication Flow

#### 1. **Admin Login** (`POST /api/admin/login`)

**Process:**
1. User submits email + password
2. Check `superadmin` table first
3. If not found, check `district_admins` table
4. Verify password with bcrypt
5. Generate JWT token
6. Set `admin_session` cookie (HttpOnly, Secure in production)
7. Log activity in `activity_logs`
8. Return success response

**JWT Token Structure:**
```typescript
{
  sub: string;           // User ID
  email: string;
  role: 'superadmin' | 'admin';
  type: 'superadmin' | 'district_admin';
  district?: string;     // For district admins
  permissions?: string[]; // Permission array
}
```

**Token Duration:** 8 hours (28,800 seconds)

**Cookie Setup:**
- Name: `admin_session`
- Path: `/`
- HttpOnly: true
- SameSite: Strict
- Secure: true (production only)
- Max-Age: 8 hours

#### 2. **JWT Verification** (`src/lib/auth-jwt.ts`)

**Process:**
- Extract token from cookie
- Verify signature with secret key
- Check issuer (`rhvs-admin`)
- Check audience (`rhvs-admin-app`)
- Validate expiration time
- Return decoded claims or null

#### 3. **Middleware Protection** (`src/middleware.ts`)

**Routes Protected:**
- `/admin/*` - All admin routes

**Exceptions:**
- `/admin/login` - Public access
- `/admin/superadmin/login` - Public access
- `/admin/verify/*` - Verification routes

**Process:**
1. Extract `admin_session` cookie
2. Verify JWT token
3. Check user type and permissions
4. Superadmin-only routes check
5. Redirect to `/admin/unauthorized` if insufficient permissions
6. Allow access if authorized

**Superadmin-Only Routes:**
```typescript
const superAdminOnlyRoutes = [
  '/admin/members/admins',
  '/admin/members/tokens',
  '/admin/members/pending',
  '/admin/departments',
  '/admin/logs',
  '/admin/settings',
  '/admin/permissions'
];
```

#### 4. **Admin Scope** (`src/lib/admin-scope.ts`)

**Function:** `getAdminScope(request)`

**Returns:**
```typescript
{
  isSuperAdmin: boolean;
  isDistrictAdmin: boolean;
  adminId: number | null;
  districtName: string | null;
  stateName: string | null;
  permissions: string[];
}
```

**Process:**
1. Extract and verify JWT token
2. Determine user type (superadmin/district_admin)
3. For district admins:
   - Query DB for current district/state
   - Load active permissions from `district_admin_permissions`
   - Filter expired permissions
   - Return district-scoped permissions
4. Return scope object

**Permission Implication:**
```typescript
// If user has 'add_products' permission, they also get:
- 'edit_products'
- 'delete_products'
- 'edit_store'
```

#### 5. **Permission Checking**

**Function:** `ensurePermission(scope, requiredPermission)`

**Logic:**
```typescript
if (scope.isSuperAdmin) return true;
if (scope.permissions.includes('all')) return true;
return scope.permissions.includes(requiredPermission);
```

---

## 5. FRONTEND ARCHITECTURE

### Component Hierarchy

#### **Public Website** (`src/app/page.tsx`)

```
App Layout
├── Navbar
├── HeroSection (with marquee)
├── CoreValuesSection
├── ActivitiesSection
├── GalleryGrid
├── ProductStore
├── EventsList
├── NewsSection
└── Footer
```

#### **Admin Dashboard** (`src/app/admin/layout.tsx`)

```
Admin Layout
├── AdminSidebar
│   ├── Dashboard Link
│   ├── Members
│   │   ├── All Members
│   │   ├── District Admins
│   │   └── Registration Tokens
│   ├── Content
│   │   ├── News
│   │   ├── Events
│   │   ├── Gallery
│   │   ├── Hero Images
│   │   └── Products
│   ├── Departments
│   ├── Certificates
│   ├── Analytics
│   └── Logs
└── AdminContentArea
    └── [Dynamic Page Content]
```

### Key React Contexts

#### 1. **AdminContext** (`src/contexts/AdminContext.tsx`)

**Purpose:** Global admin state management

**State:**
```typescript
{
  currentUser: User | null;
  members: Member[];
  activityLogs: ActivityLog[];
  loading: boolean;
  error: string | null;
}
```

**Methods:**
- `login(email, password)` - Authenticate user
- `logout()` - Clear session
- `addMember()` - Add new member
- `updateMember()` - Update member
- `deleteMember()` - Delete member
- `grantTemporaryPermission()` - Grant time-based permission
- `revokeTemporaryPermission()` - Revoke permission
- `hasPermission(permission)` - Check if user has permission
- `canManageDistrict(district)` - Check district access
- `refreshData()` - Refresh admin data
- `checkPermissionExpiry()` - Check expired permissions

**Auto-Load Session:**
```typescript
useEffect(() => {
  // On mount, fetch /api/admin/me
  // Populate currentUser if authenticated
}, []);
```

**Permission Expiry Check:**
```typescript
// Runs every 5 minutes for district admins
useEffect(() => {
  if (currentUser?.type === 'district_admin') {
    const interval = setInterval(
      () => checkPermissionExpiry(),
      5 * 60 * 1000
    );
    return () => clearInterval(interval);
  }
}, [currentUser]);
```

#### 2. **CartContext** (`src/contexts/CartContext.tsx`)

**Purpose:** Shopping cart state management

**State:**
```typescript
{
  items: CartItem[];
  favorites: string[];
  addToCart: (product) => void;
  removeFromCart: (productId) => void;
  addToFavorites: (productId) => void;
  removeFromFavorites: (productId) => void;
}
```

**Persistence:**
- Uses `localStorage` for cart/favorites
- Syncs on mount

### UI Component Library

**shadcn/ui Components Used:**
- `Button` - Styled buttons
- `Card` - Content cards
- `Dialog` - Modal dialogs
- `Input` - Form inputs
- `Select` - Dropdown selects
- `Table` - Data tables
- `Tabs` - Tab navigation
- `Toast` - Notification toasts
- `Alert` - Alert dialogs
- `Avatar` - User avatars
- `Form` - Form wrapper with validation

**Styling:**
- **Tailwind CSS 4** - Utility classes
- **Framer Motion** - Smooth animations
- **Lucide Icons** - Icon set
- **Custom Fonts** - Noto Sans Devanagari (Hindi support)

---

## 6. BACKEND API SYSTEM

### API Architecture

All API routes are in `src/app/api/`

**Structure:**
```
api/
├── admin/              # Admin operations
│   ├── login/          # POST - Admin login
│   ├── logout/         # POST - Admin logout
│   ├── me/             # GET - Current admin info
│   ├── members/        # Member management
│   ├── permissions/    # Permission management
│   └── ...
├── register/           # POST - Member registration
├── content/            # Content APIs
├── upload/             # File uploads
└── public/             # Public APIs
```

### Key API Endpoints

#### **Authentication APIs**

##### 1. `POST /api/admin/login`
**Purpose:** Admin authentication

**Request:**
```json
{
  "email": "admin@rhvs.org",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Logged in"
}
// Sets admin_session cookie
```

**Process:**
1. Find user in `superadmin` or `district_admins`
2. Verify password with bcrypt
3. Load permissions (for district admin)
4. Generate JWT token
5. Set cookie
6. Log activity
7. Return success

##### 2. `POST /api/admin/logout`
**Purpose:** Clear admin session

**Response:**
```json
{
  "success": true,
  "message": "Logged out"
}
// Clears admin_session cookie
```

##### 3. `GET /api/admin/me`
**Purpose:** Get current admin info

**Response:**
```json
{
  "authenticated": true,
  "user": {
    "id": 1,
    "email": "admin@rhvs.org",
    "role": "superadmin",
    "type": "superadmin",
    "permissions": []
  }
}
```

#### **Member Management APIs**

##### 1. `POST /api/register`
**Purpose:** Member registration with OTP

**Actions:**
- `send-otp` - Send OTP to existing member
- `verify-otp` - Verify OTP code
- `register-member` - Complete registration

**Request (send-otp):**
```json
{
  "action": "send-otp",
  "data": {
    "existingMemberRegNumber": "RHVS0000013"
  }
}
```

**Process:**
1. Find existing member by reg number
2. Generate 6-digit OTP
3. Store in memory (10 min expiry)
4. Send OTP email (non-blocking)
5. Return success

**Request (verify-otp):**
```json
{
  "action": "verify-otp",
  "data": {
    "existingMemberRegNumber": "RHVS0000013",
    "otp": "123456"
  }
}
```

**Request (register-member):**
```json
{
  "action": "register-member",
  "data": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "1234567890",
    "address": "123 Street",
    "stateId": "1",
    "districtId": "5",
    "aadharCardNumber": "123456789012",
    "fatherHusbandName": "Father Name",
    "motherWifeName": "Mother Name",
    "registrationDate": "2024-01-15",
    "existingMemberRegNumber": "RHVS0000013",
    "profilePhotoPath": "/uploads/profiles/photo.jpg"
  }
}
```

**Registration Process:**
1. Check email uniqueness
2. Resolve state/district names from IDs
3. Generate new member reg number (sequential)
4. Get verifier's ID
5. Insert member into `members` table
6. **Generate certificate** (async)
7. **Generate ID card** (async)
8. **Send welcome email** with documents (async)
9. Return success with member ID and reg number

##### 2. `GET /api/admin/members`
**Purpose:** List members with filters

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `search` - Search in name/email/phone
- `regNumber` - Filter by reg number
- `status` - pending/verified/rejected
- `state` - Filter by state
- `district` - Filter by district
- `department` - Filter by department
- `sortBy` - Sort field
- `sortOrder` - ASC/DESC

**Response:**
```json
{
  "success": true,
  "data": {
    "members": [
      {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "1234567890",
        "member_reg_number": "RHVS0000014",
        "status": "verified",
        "district": "Delhi",
        "state": "Delhi",
        "departments": "Admin (President - national)"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

**Features:**
- **District scoping** - District admins only see their district's members
- **Department aggregation** - Shows all departments per member
- **Search across multiple fields** (name, email, phone, Aadhaar)
- **State/district ID resolution** - Converts IDs to names

#### **Content Management APIs**

##### 1. `GET /api/content/news`
Fetch news articles

##### 2. `POST /api/content/news`
Create news article

##### 3. `GET /api/content/events`
Fetch events

##### 4. `POST /api/content/events`
Create/update event

##### 5. `GET /api/hero-images`
Fetch hero images

##### 6. `POST /api/hero-images`
Upload hero image

**Process:**
1. Check `manage_hero_images` permission
2. Save file to `/public/uploads/hero-images/`
3. Insert record into `hero_images` table
4. Return success

#### **File Upload APIs**

##### 1. `POST /api/upload/profile`
Upload profile photo

**Process:**
1. Extract file from FormData
2. Validate file type (image/*)
3. Validate file size (< 10MB)
4. Generate unique filename with timestamp
5. Save to `/public/uploads/profiles/`
6. Return public URL

##### 2. `POST /api/upload/content`
Upload content images (news/events)

##### 3. `POST /api/upload/gallery`
Upload gallery photos

**With Event Association:**
```typescript
// Get event ID from form
const eventId = formData.get('eventId');

// Create photo record
await executeQuery(`
  INSERT INTO photos (id, event_id, filename, file_path, ...)
  VALUES (?, ?, ?, ?, ...)
`, [...]);
```

#### **Permission APIs**

##### 1. `GET /api/admin/permissions/my`
Get current admin's permissions

##### 2. `POST /api/admin/permissions/assign`
Assign permission to district admin

**Request:**
```json
{
  "district_admin_id": 5,
  "permission": "manage_content",
  "permission_type": "temporary",
  "days": 30
}
```

##### 3. `POST /api/admin/permissions/check-expiry`
Check and remove expired permissions

**Runs automatically** via cron or manual trigger

#### **Department APIs**

##### 1. `GET /api/departments`
List departments

**Query Params:**
- `level` - national/state/district
- `state` - Filter by state
- `district` - Filter by district

##### 2. `POST /api/departments`
Create department

**Request:**
```json
{
  "name_en": "Administration",
  "name_hi": "प्रशासन",
  "level": "national",
  "description": "Admin department"
}
```

##### 3. `POST /api/departments/[id]/posts`
Create post in department

##### 4. `POST /api/departments/[id]/members`
Assign member to post

**Request:**
```json
{
  "memberId": 15,
  "postId": 3,
  "level": "national"
}
```

**Process:**
1. Validate member exists
2. Check if member already assigned to this post
3. Insert into `department_members`
4. **Auto-generate appointment certificate** (async)
5. Return success

#### **Certificate APIs**

##### 1. `POST /api/certificates/generate`
Generate certificate

**Request:**
```json
{
  "memberId": 15,
  "departmentId": 2,
  "postId": 3,
  "level": "national",
  "appointmentDate": "2024-01-15"
}
```

##### 2. `GET /api/certificates/[id]/download`
Download certificate PDF

##### 3. `GET /api/admin/certificates/[memberId]`
List certificates for a member

---

## 7. MEMBER REGISTRATION & MANAGEMENT FLOW

### Registration Flow

#### **Step 1: Existing Member Verification**

1. New member provides existing member's registration number
2. System sends OTP to existing member's email
3. Existing member provides OTP to new member
4. System verifies OTP

**Implementation:**
```typescript
// In-memory OTP store (single server, resets on restart)
const otpStore = new Map();

// Generate OTP
const otp = generateOTP(); // 6-digit number
const expiresAt = Date.now() + 10 * 60 * 1000; // 10 min

// Store in memory
otpStore.set(existingMemberRegNumber, {
  otp,
  email: member.email,
  expiresAt,
  used: false
});

// Send email
await sendOTPEmail(member.email, otp, member.name);
```

#### **Step 2: Member Details Collection**

Form fields:
- Personal: name, email, phone, address
- Family: father/husband name, mother/wife name
- Location: state, district (IDs resolved to names)
- Identity: Aadhaar card number
- Registration: registration date, existing member ref
- Photo: profile photo upload (required)

**Photo Upload Process:**
```typescript
// Upload to /public/uploads/profiles/
// Generate unique filename: photo_timestamp.jpg
// Return path: /uploads/profiles/photo_1234567890.jpg
```

#### **Step 3: Registration Number Generation**

```typescript
async function generateMemberRegistrationNumber(): Promise<string> {
  // Get last member
  const result = await executeQuery(
    'SELECT member_reg_number FROM members ORDER BY id DESC LIMIT 1'
  );
  
  if (!result || result.length === 0) {
    return 'RHVS0000001';
  }
  
  const lastReg = result[0].member_reg_number;
  const num = parseInt(lastReg.replace('RHVS', ''));
  const nextNum = num + 1;
  
  return `RHVS${String(nextNum).padStart(7, '0')}`;
}
```

#### **Step 4: Database Insertion**

```sql
INSERT INTO members (
  member_reg_number, name, email, phone, address,
  state, district, aadhar_card_number,
  father_husband_name, mother_wife_name,
  registration_date, existing_member_reg_number,
  profile_photo_path, verified_by_member_id
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
```

#### **Step 5: Certificate Generation** (Async)

```typescript
generateCertificate({
  memberId: result.insertId,
  memberName: name,
  memberRegNumber: newMemberRegNumber,
  registrationDate: registrationDate,
  profilePhotoPath: profilePhotoPath
}).then(async (certResult) => {
  // Store certificate in DB
  await executeQuery(
    'INSERT INTO member_certificates (member_id, certificate_number, certificate_path) VALUES (?, ?, ?)',
    [memberId, certResult.certificateNumber, certResult.certificatePath]
  );
});
```

**Certificate Features:**
- **Royal gold border** around member photo
- **Organization logo** and header
- **Bilingual text** (Hindi + English)
- **Member photo** in ornate frame
- **Registration number** and date
- **PDF format** for download

#### **Step 6: ID Card Generation** (Async)

```typescript
generateIDCard({
  memberId: result.insertId,
  memberName: name,
  memberRegNumber: newMemberRegNumber,
  profilePhotoPath: profilePhotoPath,
  address: address,
  designation: 'Member'
});
```

#### **Step 7: Welcome Email** (Async)

```typescript
sendWelcomeEmail(
  email,
  name,
  newMemberRegNumber,
  certificatePath,
  idCardPath
);
```

### Member Management (Admin)

#### **Viewing Members**

- **Paginated list** with filters
- **Search** across name/email/phone/Aadhaar
- **Filter by** state/district/department/status
- **Sort by** any column
- **Export** capabilities (future)

#### **Editing Members**

- Update personal information
- Change status (pending/verified/rejected)
- Add/remove department assignments
- Update profile photo

#### **Department Assignment**

Process:
1. Select member
2. Choose department
3. Select post (position)
4. Choose level (national/state/district)
5. Set appointment date
6. Auto-generate appointment certificate

Database:
```sql
INSERT INTO department_members (member_id, department_id, post_id, level, appointment_date)
VALUES (?, ?, ?, ?, ?)
```

#### **District Scoping (District Admins)**

Query modification:
```sql
SELECT * FROM members m
WHERE m.district = ? OR m.district LIKE ?
-- Where ? = district admin's district
```

Only see members from their district.

---

## 8. CONTENT MANAGEMENT SYSTEM

### News Management

**Tables:**
- `news` - News articles

**Fields:**
- `title`, `content`, `image_path`, `author`, `published_at`, `is_visible`

**Features:**
- Rich text editor
- Image upload
- Draft/publish status
- SEO metadata

**API:**
- `GET /api/content/news` - List news
- `POST /api/content/news` - Create news
- `PUT /api/content/news/[id]` - Update news
- `DELETE /api/content/news/[id]` - Delete news

### Events Management

**Table:**
- `events`

**Fields:**
- `title`, `description`, `event_date`, `event_time`, `location`, `image_path`

**Features:**
- Calendar view
- Registration tracking
- Category (festival/meeting/celebration)

**API:**
- `GET /api/content/events` - List events
- `POST /api/content/events` - Create event

### Gallery Management

**Tables:**
- `photo_events` - Event groupings
- `photos` - Individual photos

**Features:**
- Event-based organization
- Tagging system
- Featured photos
- District/state tracking
- Batch upload support

**Workflow:**
1. Create photo event (or use existing)
2. Upload photos
3. Associate photos with event
4. Set featured/visible status
5. Add tags and captions

**API:**
- `GET /api/photos?eventId=123` - List photos
- `POST /api/photos/upload` - Upload photo
- `GET /api/public/photos` - Public gallery

**Photo Storage:**
```
public/uploads/photos/
├── event_123/
│   ├── photo_1234567890.jpg
│   ├── photo_1234567891.jpg
│   └── ...
└── misc/
    └── ...
```

### Hero Images System

**Tables:**
- `hero_images` - Images
- `hero_image_settings` - Configuration

**Features:**
- Marquee scrolling display
- Auto-rotation
- Manual navigation
- Responsive design
- Permission-based management

**Settings:**
```typescript
{
  marquee_speed: 30,                // Scroll speed
  image_display_duration: 3,       // Seconds per image
  auto_play: true,                  // Auto-rotate
  show_indicators: true,            // Navigation dots
  transition_effect: 'slide'        // Animation type
}
```

**Implementation:**
```typescript
// HeroSection.tsx
const [currentImageIndex, setCurrentImageIndex] = useState(0);

useEffect(() => {
  if (heroImages.length > 1 && autoPlay) {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, imageDisplayDuration * 1000);
    return () => clearInterval(interval);
  }
}, [heroImages.length, autoPlay, imageDisplayDuration]);
```

### About Page Content

**Table:**
- `about_sections`

**Types:**
- `hero` - Hero sections
- `card` - Content cards
- `quote` - Quote sections
- `paragraph` - Text blocks
- `heading` - Headings

**Features:**
- Reorderable sections
- Show/hide toggle
- Rich content with styling JSON
- Version history tracking

---

## 9. DISTRICT ADMIN & PERMISSION SYSTEM

### District Admin Creation

**Process:**
1. Member must be registered first
2. Superadmin creates district admin account
3. Link to member via `member_id`
4. Set district and state
5. Set password
6. Optionally set expiration date

**Tables:**
- `district_admins` - Admin accounts
- `district_admin_permissions` - Granted permissions

### Permission Types

#### **Permanent Permissions**
Never expire. Used for core member management.

**Examples:**
- `view_members` - View member list
- `add_members` - Add new members
- `edit_members` - Edit member info
- `delete_members` - Remove members

#### **Temporary Permissions**
Expire after set time. Used for content management.

**Examples:**
- `manage_content` - Manage news/events
- `manage_products` - Manage store
- `manage_hero_images` - Manage hero section
- `manage_gallery` - Manage photo gallery

### Permission Assignment

**By Superadmin:**
```typescript
await executeQuery(`
  INSERT INTO district_admin_permissions (
    district_admin_id, permission, permission_type, expires_at,
    granted_by, is_active
  ) VALUES (?, ?, ?, ?, ?, 1)
`, [
  districtAdminId,
  'manage_content',
  'temporary',
  expiresDate,  // or NULL for permanent
  superadminId
]);
```

### Permission Checking

**In API Routes:**
```typescript
export async function POST(req: NextRequest) {
  // Get admin scope
  const scope = await getAdminScope(req);
  
  // Check specific permission
  if (!ensurePermission(scope, 'manage_content')) {
    return NextResponse.json(
      { error: 'Permission denied' },
      { status: 403 }
    );
  }
  
  // Continue with operation
}
```

**In Frontend:**
```typescript
const { hasPermission } = useAdmin();

if (!hasPermission('manage_content')) {
  // Hide or disable UI
}
```

### Permission Expiry Check

**Automatic:**
```typescript
// Runs every 5 minutes
setInterval(async () => {
  await fetch('/api/admin/permissions/check-expiry', {
    method: 'POST'
  });
}, 5 * 60 * 1000);
```

**Manual:**
```sql
-- Remove expired permissions
UPDATE district_admin_permissions 
SET is_active = 0 
WHERE expires_at < NOW() AND expires_at IS NOT NULL;
```

### District Scoping

**All content is tagged with:**
- `district_id`
- `state_id`
- `owner_admin_id` (who created it)

**District admins:**
- See only content from their district
- Can edit/delete only their content
- Cannot access other district's content

**Query example:**
```sql
SELECT * FROM photos p
WHERE p.district = ? AND p.state = ?
-- Filtered by district admin's district/state
```

---

## 10. DEPARTMENT MANAGEMENT SYSTEM

### Overview

Organizational structure with departments, posts, and member assignments.

### Database Schema

**Departments Table:**
```sql
CREATE TABLE departments (
  id INT PRIMARY KEY,
  name_en VARCHAR(255),
  name_hi VARCHAR(255),
  level ENUM('national', 'state', 'district'),
  state VARCHAR(100),      -- For state-level depts
  district VARCHAR(100),   -- For district-level depts
  created_by INT,
  created_at TIMESTAMP
);
```

**Department Posts:**
```sql
CREATE TABLE department_posts (
  id INT PRIMARY KEY,
  department_id INT,
  name_en VARCHAR(255),
  name_hi VARCHAR(255),
  post_order INT,           -- 0 = President, 1+ = other posts
  FOREIGN KEY (department_id) REFERENCES departments(id)
);
```

**Department Members:**
```sql
CREATE TABLE department_members (
  id INT PRIMARY KEY,
  member_id INT,
  department_id INT,
  post_id INT,
  level VARCHAR(50),        -- national/state/district
  state VARCHAR(100),
  district VARCHAR(100),
  appointment_date DATE,
  is_active BOOLEAN,
  FOREIGN KEY (member_id) REFERENCES members(id),
  FOREIGN KEY (department_id) REFERENCES departments(id),
  FOREIGN KEY (post_id) REFERENCES department_posts(id)
);
```

### Workflow

#### 1. **Create Department**

```typescript
POST /api/departments
{
  "name_en": "Administration",
  "name_hi": "प्रशासन",
  "level": "national",
  "description": "Admin department"
}
```

**Process:**
1. Create department record
2. Auto-create President post (post_order = 0)
3. Return department with posts

#### 2. **Add Posts to Department**

```typescript
POST /api/departments/[id]/posts
{
  "name_en": "Secretary",
  "name_hi": "सचिव",
  "post_order": 1
}
```

**Rules:**
- President (order 0) is auto-created, cannot delete
- Can add/edit/delete other posts
- Can reorder posts (except President)

#### 3. **Assign Members to Posts**

```typescript
POST /api/departments/[id]/members
{
  "memberId": 15,
  "postId": 3,
  "level": "national",
  "appointmentDate": "2024-01-15"
}
```

**Process:**
1. Validate member exists
2. Check if already assigned (prevent duplicates)
3. Insert into `department_members`
4. **Auto-generate appointment certificate** (async)
5. Return success

**Certificate Generation:**
- Member photo
- Department name
- Post name
- Level (national/state/district)
- Appointment date
- Four signature blocks

### Department Views

#### **List Departments**
- Filter by level (national/state/district)
- Filter by state/district
- Show member count per department

#### **Department Details**
- List all posts
- Show assigned members per post
- Show vacant posts
- Reorder posts (except President)

#### **Member Assignment**
- Search eligible members
- Assign to vacant posts
- Remove from posts
- Filter by department/post

**Eligible Members Query:**
```sql
SELECT m.*, 
  GROUP_CONCAT(d.name_en) as existing_departments
FROM members m
LEFT JOIN department_members dm ON m.id = dm.member_id
LEFT JOIN departments d ON dm.department_id = d.id
WHERE m.status = 'verified'
GROUP BY m.id
-- Shows existing departments per member
```

### Certificate Generation on Assignment

**Trigger:**
When member is assigned to department post

**Certificate Details:**
- **Member:** Photo, name, member reg number
- **Department:** Name (English + Hindi)
- **Post:** Name (English + Hindi)
- **Level:** National/State/District
- **Appointment Date:** From form
- **Organization:** RHVS logo, header, footer
- **Signatures:** 4 blocks for officials

**File Output:**
- Path: `/public/certificates/appointment_CERT-MemberId-DeptId-PostId.pdf`
- Format: PDF
- Auto-generated on assignment
- Downloadable from admin panel

---

## 11. CERTIFICATE & ID CARD GENERATION

### Certificate Generation

#### **Technology Stack**
- **Canvas API** - For drawing
- **PDF Generation** - Using canvas-to-pdf conversion
- **Image Loading** - Canvas image loading
- **Font Registration** - Hindi font support (Noto Sans Devanagari, Mangal)

#### **Certificate Design**

**Layout:**
```
┌─────────────────────────────────┐
│  RED HEADER SECTION              │
│  ├─ Organization Name (Hindi)   │
│  ├─ Organization Slogan          │
│  └─ Certificate Title            │
├─────────────────────────────────┤
│  WHITE BODY SECTION              │
│  ├─ Certificate Text (Hindi)     │
│  ├─ Member Photo (Royal Frame)   │
│  ├─ Member Details               │
│  ├─ Member Registration Number   │
│  ├─ Registration Date            │
│  └─ Motivational Text             │
├─────────────────────────────────┤
│  RED FOOTER SECTION              │
│  ├─ Office Addresses (4)         │
│  └─ Contact Information          │
└─────────────────────────────────┘
   (Yellow Border)
```

**Implementation:**

```typescript
import { createCanvas, loadImage, registerFont } from 'canvas';
import fs from 'fs';
import path from 'path';

// Register Hindi fonts
registerFont('public/fonts/Noto-Sans-Devanagari.ttf', {
  family: 'Noto Sans Devanagari'
});

export async function generateCertificate(data: {
  memberId: number;
  memberName: string;
  memberRegNumber: string;
  registrationDate: string;
  profilePhotoPath?: string;
}) {
  // Create canvas: 3508 x 2480 (A4 @ 300 DPI)
  const canvas = createCanvas(3508, 2480);
  const ctx = canvas.getContext('2d');
  
  // 1. Draw yellow border
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 40;
  ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
  
  // 2. Draw red header
  ctx.fillStyle = '#B22222';
  ctx.fillRect(60, 60, canvas.width - 120, 300);
  
  // 3. Add organization logo
  const logo = await loadImage('public/rhvs_logo.png');
  ctx.drawImage(logo, 1800, 90, 200, 200);
  
  // 4. Add organization name (Hindi)
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 80pt Noto Sans Devanagari';
  ctx.textAlign = 'center';
  ctx.fillText('राष्ट्रीय हिंदू वाहिनी संगठन', canvas.width / 2, 150);
  
  // 5. Add member photo (if available)
  if (data.profilePhotoPath) {
    const photo = await loadImage(`public${data.profilePhotoPath}`);
    
    // Draw royal gold frame
    const framePadding = 20;
    const photoSize = 400;
    const frameSize = photoSize + (framePadding * 2);
    const photoX = 1700;
    const photoY = 800;
    
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(photoX - framePadding + 8, photoY - framePadding + 8, frameSize, frameSize);
    
    // White background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(photoX - framePadding, photoY - framePadding, frameSize, frameSize);
    
    // Gold border (thick)
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 8;
    ctx.strokeRect(photoX - framePadding, photoY - framePadding, frameSize, frameSize);
    
    // Inner gold accent
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 3;
    ctx.strokeRect(photoX - framePadding + 4, photoY - framePadding + 4, frameSize - 8, frameSize - 8);
    
    // Draw photo
    ctx.drawImage(photo, photoX, photoY, photoSize, photoSize);
  }
  
  // 6. Add member details
  ctx.fillStyle = '#1a1a1a';
  ctx.font = '48pt Noto Sans Devanagari';
  ctx.textAlign = 'center';
  ctx.fillText(data.memberName, canvas.width / 2, 1050);
  ctx.fillText(data.memberRegNumber, canvas.width / 2, 1150);
  ctx.fillText(data.registrationDate, canvas.width / 2, 1250);
  
  // 7. Draw red footer
  ctx.fillStyle = '#B22222';
  ctx.fillRect(60, 2100, canvas.width - 120, 280);
  
  // 8. Add office addresses
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 40pt Arial';
  // Address 1, Address 2, Address 3, Address 4
  
  // Convert to PDF and save
  const buffer = canvas.toBuffer('image/png');
  const outputPath = `public/certificates/${certificateNumber}.png`;
  fs.writeFileSync(outputPath, buffer);
  
  return {
    certificateNumber,
    certificatePath: outputPath
  };
}
```

#### **Certificate Generation Triggers**

1. **Member Registration**
   - Auto-generated when member registers
   - Uses registration date
   - Sent via welcome email

2. **Department Assignment**
   - Auto-generated when member assigned to post
   - Uses appointment date
   - Different design (appointment certificate)
   - Download from admin panel

3. **Manual Generation**
   - Admin can generate anytime
   - Select member, department, post
   - Custom appointment date

### ID Card Generation

**Layout:**
```
┌────────────────────┐
│ RHVS LOGO          │
│                    │
│ ┌───────────────┐  │
│ │ Member Photo  │  │
│ │               │  │
│ └───────────────┘  │
│                    │
│ Name: [Name]      │
│ Reg No: [Number]  │
│ Designation:      │
│ Address:           │
│                    │
│ Signature         │
└────────────────────┘
```

**Features:**
- Member photo
- QR code (member ID)
- Organization branding
- Laminated design (simulated)

**Storage:**
- Path: `/public/id-cards/id-card-{memberRegNumber}.pdf`
- Auto-generated on registration

### Certificate Download

**API:**
```typescript
GET /api/certificates/[id]/download
```

**Process:**
1. Find certificate by ID
2. Read file from disk
3. Return as PDF response
4. Set headers for download

**Headers:**
```typescript
headers: {
  'Content-Type': 'application/pdf',
  'Content-Disposition': `attachment; filename=${certificateNumber}.pdf`
}
```

---

## 12. HERO IMAGES & GALLERY SYSTEM

### Hero Images System

#### **Database Schema**

```sql
CREATE TABLE hero_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  image_path VARCHAR(500) NOT NULL,
  alt_text VARCHAR(255) NOT NULL,
  title VARCHAR(255),
  description TEXT,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  added_by INT NOT NULL,           -- Admin ID
  district_id INT,
  state_id INT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE hero_image_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  description TEXT,
  updated_by INT NOT NULL,
  updated_at TIMESTAMP
);
```

#### **Features**

1. **Dynamic Image Rotation**
   - Auto-plays through images
   - Configurable duration per image
   - Manual navigation with indicators

2. **Marquee Display**
   - Shows all images in scrolling row
   - Smooth animation
   - Responsive design

3. **Settings Management**
   - Marquee speed (5-120 seconds)
   - Image display duration (1-10 seconds)
   - Auto-play toggle
   - Show/hide indicators
   - Transition effects (slide/fade)

4. **Permission-Based Management**
   - Superadmin: Full access
   - District Admin: Add/edit own images (with permission)
   - Permission: `manage_hero_images`

#### **Frontend Implementation**

```typescript
// HeroSection.tsx
'use client';

export default function HeroSection() {
  const [heroImages, setHeroImages] = useState<HeroImage[]>([]);
  const [settings, setSettings] = useState<HeroSettings>({
    marquee_speed: 30,
    image_display_duration: 3,
    auto_play: true,
    show_indicators: true,
    transition_effect: 'slide'
  });
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Fetch images
  useEffect(() => {
    fetchHeroImages();
    fetchHeroSettings();
  }, []);
  
  // Auto-rotate
  useEffect(() => {
    if (heroImages.length > 1 && settings.auto_play) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
      }, settings.image_display_duration * 1000);
      return () => clearInterval(interval);
    }
  }, [heroImages.length, settings]);
  
  return (
    <div className="relative h-screen">
      {/* Main image */}
      <Image
        src={heroImages[currentImageIndex]?.image_path || '/hero-img.jpg'}
        alt={heroImages[currentImageIndex]?.alt_text || 'Hero'}
        fill
        priority
        className="object-cover"
      />
      
      {/* Indicators */}
      {settings.show_indicators && (
        <div className="absolute bottom-4 left-1/2 flex gap-2">
          {heroImages.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentImageIndex(i)}
              className={`h-3 rounded-full ${
                i === currentImageIndex ? 'w-8 bg-white' : 'w-3 bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
      
      {/* Marquee */}
      <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex gap-4 overflow-hidden whitespace-nowrap">
          {heroImages.map((img, i) => (
            <Image
              key={i}
              src={img.image_path}
              alt={img.alt_text}
              width={150}
              height={100}
              className="object-cover rounded"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
```

#### **Admin Management**

**Component:** `HeroImagesManagement.tsx`

**Features:**
- List all hero images
- Add new image (upload)
- Edit existing image (metadata)
- Delete image (soft delete)
- Reorder images (change `display_order`)
- Manage settings

**API Endpoints:**
- `GET /api/hero-images` - List images
- `POST /api/hero-images` - Add image
- `PUT /api/hero-images/[id]` - Update image
- `DELETE /api/hero-images/[id]` - Delete image
- `GET /api/hero-images/settings` - Get settings
- `PUT /api/hero-images/settings` - Update settings

### Gallery System

#### **Photo Events**

Organize photos by events (e.g., "Republic Day 2024", "Independence Day").

**Table:** `photo_events`
```sql
CREATE TABLE photo_events (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_date DATE,
  location VARCHAR(255),
  state VARCHAR(100),
  district VARCHAR(100),
  tags JSON,
  is_visible BOOLEAN DEFAULT TRUE,
  created_by VARCHAR(100),
  created_at TIMESTAMP
);
```

#### **Photos**

Individual photos with metadata.

**Table:** `photos`
```sql
CREATE TABLE photos (
  id VARCHAR(50) PRIMARY KEY,
  event_id VARCHAR(50),            -- FK to photo_events
  filename VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  thumbnail_path VARCHAR(500),
  medium_path VARCHAR(500),        -- Medium resolution
  file_size BIGINT,
  dimensions VARCHAR(20),          -- "1920x1080"
  file_type VARCHAR(50),            -- "image/jpeg"
  camera_info JSON,                -- EXIF data
  tags JSON,
  caption TEXT,
  photographer VARCHAR(100),
  is_featured BOOLEAN DEFAULT FALSE,
  is_approved BOOLEAN DEFAULT TRUE,
  is_visible BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  view_count INT DEFAULT 0,
  download_count INT DEFAULT 0,
  district VARCHAR(100),
  state VARCHAR(100),
  owner_admin_id INT,
  created_by VARCHAR(100),
  created_at TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES photo_events(id)
);
```

#### **Photo Upload**

**API:** `POST /api/photos/upload`

**Process:**
1. Receive FormData with file
2. Validate file type (image/*)
3. Validate file size (< 10MB)
4. Generate unique filename (`photo_{timestamp}.jpg`)
5. Save to `/public/uploads/photos/{eventId}/`
6. Generate thumbnail (optional)
7. Insert record into `photos` table
8. Return public URL

**File Storage:**
```
public/uploads/photos/
├── event_123/
│   ├── photo_1234567890.jpg
│   └── photo_1234567891.jpg
└── misc/
    └── photo_1234567892.jpg
```

#### **Gallery Display**

**Public API:** `GET /api/public/photos`

**Filters:**
- `eventType` - Filter by event type
- `state` - Filter by state
- `district` - Filter by district
- `event` - Filter by specific event
- `tags` - Filter by tags
- `featured` - Show only featured
- `limit` - Limit results

**Response:**
```json
{
  "success": true,
  "photos": [
    {
      "id": "photo123",
      "filename": "photo_1234567890.jpg",
      "file_path": "/uploads/photos/event_123/photo_1234567890.jpg",
      "thumbnail_path": "/uploads/photos/event_123/thumbs/photo_1234567890.jpg",
      "caption": "Republic Day celebration",
      "photographer": "Admin User",
      "tags": ["ceremony", "celebration"],
      "eventName": "Republic Day 2024",
      "isFeatured": true
    }
  ]
}
```

#### **Gallery Features**

1. **Event-Based Organization**
   - Group photos by event
   - Event cards with photo count
   - Filter by event

2. **Featured Photos**
   - Highlight important photos
   - Featured section on homepage

3. **Tagging System**
   - Add tags to photos
   - Filter by tags
   - Multiple tags per photo

4. **District/State Filtering**
   - Filter by location
   - District-specific galleries

5. **Thumbnail Generation**
   - Auto-generate thumbnails
   - Different sizes (thumb, medium, full)

6. **Statistics**
   - View count
   - Download count
   - Most viewed photos

#### **Admin Management**

**Component:** `GalleryManagement.tsx`

**Features:**
- Create photo events
- Upload photos (single/batch)
- Edit photo metadata
- Delete photos
- Set featured photos
- Manage tags
- Approve photos

---

## 13. E-COMMERCE & STORE MANAGEMENT

### Product Store

#### **Database Schema**

```sql
CREATE TABLE products (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  stock INT DEFAULT 0,
  category VARCHAR(100),
  image_path VARCHAR(500),
  is_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Categories:**
- Spiritual products
- Religious items
- Books
- Accessories

#### **Product Management**

**API Endpoints:**
- `GET /api/content/store` - List products
- `POST /api/content/store` - Add product
- `PUT /api/content/store/[id]` - Update product
- `DELETE /api/content/store/[id]` - Delete product

**Required Permissions:**
- `manage_products` - Add/edit/delete products
- `manage_store` - Store management access

#### **Shopping Cart**

**Context:** `CartContext.tsx`

**State:**
```typescript
{
  items: CartItem[];      // Products in cart
  favorites: string[];    // Favorited products
}
```

**Methods:**
- `addToCart(product)` - Add product
- `removeFromCart(productId)` - Remove product
- `updateQuantity(productId, quantity)` - Update quantity
- `clearCart()` - Empty cart
- `addToFavorites(productId)` - Add to favorites
- `removeFromFavorites(productId)` - Remove from favorites

**Persistence:**
- Uses `localStorage`
- Syncs on mount
- Auto-save on changes

**CartItem:**
```typescript
{
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_path: string;
}
```

#### **Store Display**

**Components:**
- `ProductGrid` - Product cards
- `ProductCard` - Individual product
- `CartButton` - Cart icon with count
- `FavoritesButton` - Heart icon

**Features:**
- Product cards with images
- Add to cart button
- Add to favorites button
- Product details modal
- Quantity selector
- Price display
- Stock status

#### **Inventory Management**

**Stock Tracking:**
```sql
UPDATE products 
SET stock = stock - ? 
WHERE id = ? AND stock >= ?
```

**Low Stock Alerts:**
```typescript
// In admin dashboard
const lowStockProducts = products.filter(p => p.stock < 10);
```

### Order Management (Future)

**Planned Tables:**
- `orders` - Orders
- `order_items` - Order items
- `order_status` - Order status tracking
- `payments` - Payment records

---

## 14. EMAIL & NOTIFICATION SYSTEM

### Email Setup

**Technology:** Nodemailer

**Configuration:**
```env
EMAIL_HOST=smtp.hostinger.com
EMAIL_PORT=587
EMAIL_USER=your_email@yourdomain.com
EMAIL_PASS=your_email_password
EMAIL_FROM=your_email@yourdomain.com
```

### Email Functions

#### **1. Send OTP Email**

```typescript
export async function sendOTPEmail(
  to: string,
  otp: string,
  memberName: string
) {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject: 'RHVS - OTP Verification',
    html: `
      <div style="font-family: Arial, sans-serif;">
        <h2>OTP Verification</h2>
        <p>Dear ${memberName},</p>
        <p>Your OTP for RHVS member registration is:</p>
        <h1 style="color: #B22222;">${otp}</h1>
        <p>This OTP will expire in 10 minutes.</p>
        <p>Thank you!</p>
      </div>
    `,
  };

  return await transporter.sendMail(mailOptions);
}
```

#### **2. Welcome Email**

```typescript
export async function sendWelcomeEmail(
  to: string,
  memberName: string,
  memberRegNumber: string,
  certificatePath?: string,
  idCardPath?: string
) {
  // ... transporter setup ...

  const attachments = [];
  
  if (certificatePath) {
    attachments.push({
      filename: 'membership_certificate.pdf',
      path: `public${certificatePath}`,
    });
  }
  
  if (idCardPath) {
    attachments.push({
      filename: 'id_card.pdf',
      path: `public${idCardPath}`,
    });
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject: 'Welcome to RHVS!',
    html: `
      <div>
        <h2>Welcome to RHVS!</h2>
        <p>Dear ${memberName},</p>
        <p>Congratulations! You have been successfully registered.</p>
        <p><strong>Member Registration Number: ${memberRegNumber}</strong></p>
        <p>Your membership certificate and ID card are attached.</p>
      </div>
    `,
    attachments,
  };

  return await transporter.sendMail(mailOptions);
}
```

#### **3. Token Email** (for approved registrations)

Sent when superadmin approves a registration application via token.

```typescript
export async function sendTokenEmail(
  to: string,
  token: string,
  memberName: string
) {
  // ... email with registration link ...
}
```

### Email Use Cases

1. **OTP Verification** - Sent during member registration
2. **Welcome Email** - Sent after successful registration (with attachments)
3. **Registration Token** - Sent for approved registrations
4. **Password Reset** - For admin password recovery (future)

### Email Error Handling

**Non-Blocking:**
```typescript
try {
  await sendOTPEmail(email, otp, name);
} catch (error) {
  console.error('Email send failed (non-blocking):', error);
  // Don't fail registration if email fails
}
```

Registration succeeds even if email fails (OTP shown in console for development).

---

## 15. FILE UPLOAD & MEDIA MANAGEMENT

### Upload System

**API Base:** `/api/upload/*`

**Supported Uploads:**
- Profile photos
- Content images (news/events)
- Gallery photos
- Product images
- Signatures
- Hero images

### Upload Process

#### **1. Receive File**

```typescript
POST /api/upload/profile

const formData = await req.formData();
const file = formData.get('file') as File;

if (!file) {
  return NextResponse.json({ error: 'No file' }, { status: 400 });
}
```

#### **2. Validate File**

```typescript
// Validate file type
const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
if (!allowedTypes.includes(file.type)) {
  return NextResponse.json(
    { error: 'Invalid file type' },
    { status: 400 }
  );
}

// Validate file size
const maxSize = 10 * 1024 * 1024; // 10MB
if (file.size > maxSize) {
  return NextResponse.json(
    { error: 'File too large' },
    { status: 400 }
  );
}
```

#### **3. Generate Path**

```typescript
const uploadDir = join(process.cwd(), 'public', 'uploads', 'profiles');

if (!existsSync(uploadDir)) {
  await mkdir(uploadDir, { recursive: true });
}

const timestamp = Date.now();
const fileExtension = file.name.split('.').pop()?.toLowerCase();
const filename = `photo_${timestamp}.${fileExtension}`;
const filePath = join(uploadDir, filename);
```

#### **4. Save File**

```typescript
const bytes = await file.arrayBuffer();
const buffer = Buffer.from(bytes);
await writeFile(filePath, buffer);
```

#### **5. Return Public URL**

```typescript
const publicUrl = `/uploads/profiles/${filename}`;

return NextResponse.json({
  success: true,
  url: publicUrl,
  path: publicUrl
});
```

### Upload Endpoints

#### **1. Profile Photos** (`POST /api/upload/profile`)

**Storage:** `/public/uploads/profiles/`

**Use Cases:**
- Member registration
- Profile updates

**Validation:**
- Type: `image/*`
- Size: < 10MB
- Required for members

#### **2. Content Images** (`POST /api/upload/content`)

**Storage:** `/public/uploads/content/{type}/`

**Types:**
- `news` - News article images
- `events` - Event images
- `gallery` - Gallery photos

**Validation:**
- Type: `image/*`
- Size: < 10MB

#### **3. Gallery Photos** (`POST /api/upload/gallery`)

**Storage:** `/public/uploads/photos/{eventId}/`

**Features:**
- Event association
- Batch upload support
- Thumbnail generation (future)

**Form Data:**
```
file: File
eventId: string (optional)
caption: string
tags: string[] (JSON stringified)
```

#### **4. Product Images** (`POST /api/upload/store`)

**Storage:** `/public/uploads/store/`

**Validation:**
- Type: `image/*`
- Size: < 10MB

#### **5. Signatures** (`POST /api/upload/signature`)

**Storage:** `/public/uploads/signatures/`

**Use Cases:**
- Member signatures for ID cards
- Official signatures for certificates

### File Organization

```
public/uploads/
├── profiles/              # Member profile photos
│   ├── photo_1234567890.jpg
│   └── ...
├── content/
│   ├── news/
│   ├── events/
│   └── gallery/
├── photos/
│   ├── event_123/
│   │   ├── photo_1234567890.jpg
│   │   └── ...
│   └── misc/
├── store/                  # Product images
├── signatures/             # Signature files
├── hero-images/           # Hero section images
└── default-avatar.svg     # Default avatar
```

### File Serving

**Static File Serving:**
- All files in `/public` are served statically by Next.js
- URLs: `/uploads/profiles/photo_1234567890.jpg`
- No authentication required (public assets)

**Security:**
- Upload validation on server
- File type restrictions
- Size limits
- Sanitized filenames

---

## 16. MIDDLEWARE & SECURITY

### Middleware

**File:** `src/middleware.ts`

**Purpose:**
- Route protection
- Authentication verification
- Permission checking
- Redirects

**Implementation:**

```typescript
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect /admin/* routes
  if (pathname.startsWith('/admin')) {
    // Allow login pages
    if (pathname === '/admin/login' || pathname.startsWith('/admin/verify')) {
      return NextResponse.next();
    }

    // Get token from cookie
    const token = req.cookies.get('admin_session')?.value;
    if (!token) {
      return NextResponse.redirect(new URL('/admin', req.url));
    }

    // Verify JWT
    const claims = await verifyAdminJwt(token);
    if (!claims) {
      return NextResponse.redirect(new URL('/admin', req.url));
    }

    // Check superadmin-only routes
    const isSuperAdmin = claims.type === 'superadmin';
    const superAdminOnlyRoutes = [
      '/admin/members/admins',
      '/admin/members/tokens',
      '/admin/departments',
      '/admin/logs',
      '/admin/settings'
    ];

    if (superAdminOnlyRoutes.some(route => pathname.startsWith(route)) && !isSuperAdmin) {
      return NextResponse.redirect(new URL('/admin/unauthorized', req.url));
    }
  }

  return NextResponse.next();
}
```

**Matches:**
- `/admin/:path*` - All admin routes

### Security Features

#### **1. Password Hashing**

**Technology:** bcrypt

```typescript
import bcrypt from 'bcryptjs';

// Hash password
const hashedPassword = await bcrypt.hash(password, 10);

// Verify password
const isValid = await bcrypt.compare(password, hashedPassword);
```

**Salt Rounds:** 10

#### **2. JWT Tokens**

**Signing:**
```typescript
import { SignJWT } from 'jose';

const token = await new SignJWT({ ...claims })
  .setProtectedHeader({ alg: 'HS256' })
  .setIssuedAt()
  .setIssuer('rhvs-admin')
  .setAudience('rhvs-admin-app')
  .setExpirationTime('8h')
  .sign(secretKey);
```

**Verification:**
```typescript
import { jwtVerify } from 'jose';

const { payload } = await jwtVerify(token, secretKey, {
  issuer: 'rhvs-admin',
  audience: 'rhvs-admin-app'
});
```

#### **3. SQL Injection Protection**

**Prepared Statements:**
```typescript
// SAFE
await executeQuery(
  'SELECT * FROM members WHERE email = ?',
  [email]
);

// UNSAFE (don't do this)
await executeQuery(
  `SELECT * FROM members WHERE email = '${email}'`
);
```

#### **4. Input Validation**

**Zod Schemas:**
```typescript
import { z } from 'zod';

const memberSchema = z.object({
  name: z.string().min(3).max(255),
  email: z.string().email(),
  phone: z.string().regex(/^[0-9]{10}$/),
  aadhar_card_number: z.string().length(12)
});

const validatedData = memberSchema.parse(reqData);
```

#### **5. File Upload Security**

**Validation:**
```typescript
// Check file type
if (!allowedTypes.includes(file.type)) {
  throw new Error('Invalid file type');
}

// Check file size
if (file.size > maxSize) {
  throw new Error('File too large');
}

// Sanitize filename
const safeFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
```

#### **6. HTTPS in Production**

**Cookie Security:**
```typescript
const isProd = process.env.NODE_ENV === 'production';

const cookieAttrs = [
  'admin_session=TOKEN',
  'Path=/',
  'HttpOnly',              // Prevents JavaScript access
  'SameSite=Strict',       // CSRF protection
  isProd ? 'Secure' : ''   // HTTPS only in production
].filter(Boolean);

headers.append('Set-Cookie', cookieAttrs.join('; '));
```

#### **7. CORS (Future)**

```typescript
// In next.config.ts
headers() {
  return [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Access-Control-Allow-Credentials', value: 'true' },
        { key: 'Access-Control-Allow-Origin', value: '*' }, // Configure appropriately
        { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
        { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' }
      ]
    }
  ];
}
```

### Activity Logging

**Purpose:**
- Audit trail
- Security monitoring
- Compliance

**Table:** `activity_logs`

**Logged Actions:**
- Admin login/logout
- Member additions/deletions
- Permission grants/revokes
- Content modifications
- Certificate generations
- File uploads

**Example:**
```typescript
await executeQuery(`
  INSERT INTO activity_logs (
    user_id, user_type, action, details, ip_address
  ) VALUES (?, ?, ?, ?, ?)
`, [
  adminId,
  'superadmin',
  'member_added',
  `Added member: ${memberName} (${memberRegNumber})`,
  req.headers.get('x-forwarded-for') || 'unknown'
]);
```

**View Logs:**
- Admin dashboard → Logs
- Filter by user/action/date
- Export logs (future)

---

## SUMMARY

### Project Components

1. **Frontend (Next.js + TypeScript + Tailwind)**
   - Public website with hero, gallery, products
   - Admin dashboard with multi-level access
   - React contexts for state management
   - shadcn/ui component library

2. **Backend (Node.js + MySQL)**
   - RESTful API routes
   - Database connection pooling
   - JWT authentication
   - Email sending (Nodemailer)

3. **Database (MySQL)**
   - 40+ tables
   - Complex relationships
   - Hierarchical structures
   - District/state scoping

4. **Authentication & Authorization**
   - JWT-based sessions
   - Role-based access control (RBAC)
   - Permission-based features
   - District scoping

5. **Special Features**
   - Certificate generation (Canvas)
   - ID card generation (PDF)
   - Photo gallery with events
   - Department management
   - District admin system
   - Hero image marquee
   - Shopping cart

### Data Flow Example

**Member Registration:**

1. User fills registration form
2. System finds existing member
3. Sends OTP email
4. User verifies OTP
5. Uploads profile photo
6. System generates member reg number
7. Inserts into `members` table
8. **Async:** Generates certificate (Canvas → PNG)
9. **Async:** Generates ID card (PDF)
10. **Async:** Sends welcome email with attachments
11. Returns success with member ID

**Admin Viewing Members:**

1. Admin requests `/api/admin/members`
2. Middleware verifies JWT token
3. Load admin scope (permissions, district)
4. Build SQL query with district filter (if district admin)
5. Execute query with pagination
6. Aggregate department assignments
7. Return JSON response
8. Frontend renders table

### Interview Preparation

**Areas to Focus:**

1. **Architecture:** Server/client components, API routes, middleware
2. **Authentication:** JWT, bcrypt, cookie security, session management
3. **Database:** Schema design, relationships, queries, indexing
4. **State Management:** React contexts, global state, local storage
5. **File Uploads:** Validation, storage, serving, security
6. **Email System:** Nodemailer, templates, attachments
7. **PDF Generation:** Canvas API, image loading, font registration
8. **Permission System:** RBAC, district scoping, expiry checking
9. **Image Processing:** Hero images, gallery, photo events
10. **Department Management:** Hierarchical structure, assignments

**Common Interview Questions:**

1. "Explain the authentication flow"
2. "How do you handle district-scoped access?"
3. "Describe the member registration process"
4. "How does the permission system work?"
5. "Explain the certificate generation process"
6. "How is the database schema designed?"
7. "What security measures are implemented?"
8. "How do you handle file uploads?"
9. "Explain the department management system"
10. "How does the hero image marquee work?"

---

**End of Document**

**Last Updated:** January 2025
**Version:** 2.0
**Status:** Production Ready
