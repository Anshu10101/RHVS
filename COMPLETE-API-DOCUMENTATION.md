# RHVS PROJECT - COMPLETE API DOCUMENTATION

## All API Endpoints with HOW, WHAT, and WHY

This document covers every API endpoint in the RHVS project with detailed explanations of what it does, how it works, and why it exists.

---

## Table of Contents

1. [Authentication APIs](#1-authentication-apis)
2. [Member Management APIs](#2-member-management-apis)
3. [Content Management APIs](#3-content-management-apis)
4. [Department APIs](#4-department-apis)
5. [Permission Management APIs](#5-permission-management-apis)
6. [File Upload APIs](#6-file-upload-apis)
7. [District Admin APIs](#7-district-admin-apis)
8. [Certificate APIs](#8-certificate-apis)
9. [Location APIs](#9-location-apis)
10. [Hero Images APIs](#10-hero-images-apis)
11. [Photo & Gallery APIs](#11-photo--gallery-apis)
12. [Public APIs](#12-public-apis)
13. [Debug & Test APIs](#13-debug--test-apis)

---

## 1. AUTHENTICATION APIs

### 1.1 `POST /api/admin/login`

**WHAT:** Admin login endpoint for both superadmins and district admins.

**HOW:**
1. Accepts email and password in JSON body
2. First checks `superadmin` table
3. If not found, checks `district_admins` table
4. Verifies password using bcrypt
5. For district admins, loads active permissions from database
6. Generates JWT token with user claims
7. Sets `admin_session` cookie (HttpOnly, 8-hour expiry)
8. Logs login activity in `activity_logs`
9. Returns success response

**WHY:** Central authentication point for all admin users with role-based token generation.

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
// Sets HTTP-only cookie: admin_session
```

**Permissions Required:** None (public login)

**Code Location:** `src/app/api/admin/login/route.ts`

---

### 1.2 `POST /api/admin/logout`

**WHAT:** Logout endpoint that clears admin session.

**HOW:**
1. Clears `admin_session` cookie by setting it to empty with Max-Age: 0
2. Optionally logs logout activity
3. Returns success response

**WHY:** Properly terminate admin session and clear authentication cookie.

**Response:**
```json
{
  "success": true,
  "message": "Logged out"
}
```

**Permissions Required:** Authenticated admin

**Code Location:** `src/app/api/admin/logout/route.ts`

---

### 1.3 `GET /api/admin/me`

**WHAT:** Get current authenticated admin's information and permissions.

**HOW:**
1. Verifies JWT from cookie
2. For superadmin: fetches from `superadmin` table, returns with `permissions: ['all']`
3. For district admin: 
   - Fetches from `district_admins` with member info via JOIN
   - Loads active permissions from `district_admin_permissions`
   - Checks for temporary permissions with expiry dates
   - Returns permissions array and temporary permissions array
4. Checks account status (is_active, expires_at)
5. Returns formatted user object

**WHY:** Frontend needs this to initialize admin state, show user info, and check permissions for UI rendering.

**Response:**
```json
{
  "authenticated": true,
  "user": {
    "id": 1,
    "email": "admin@rhvs.org",
    "name": "Admin User",
    "role": "superadmin",
    "type": "superadmin",
    "permissions": ["all"],
    "district": null,
    "state": null,
    "profile_photo": "/uploads/profiles/photo.jpg",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

**Permissions Required:** Authenticated admin

**Code Location:** `src/app/api/admin/me/route.ts`

---

## 2. MEMBER MANAGEMENT APIs

### 2.1 `GET /api/admin/members`

**WHAT:** Paginated list of members with advanced filtering, searching, and sorting.

**HOW:**
1. Verifies admin authentication via `getAdminScope()`
2. Builds WHERE clause dynamically based on filters:
   - **District scoping:** District admins only see their district's members
   - **Search:** Searches name, email, phone, Aadhaar
   - **Registration number:** Exact match
   - **Status:** pending/verified/rejected
   - **State/District:** ID to name conversion
   - **Department:** Filter by department assignment
3. Joins with `department_members`, `departments`, `department_posts` tables
4. Aggregates departments into comma-separated string
5. Applies pagination (LIMIT/OFFSET)
6. Gets total count for pagination metadata
7. Returns members with department info and pagination data

**WHY:** Admin dashboard needs comprehensive member listing with filters to manage large member database.

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `search` - Search in name/email/phone/Aadhaar
- `regNumber` - Filter by member reg number
- `status` - pending/verified/rejected
- `state` - Filter by state ID
- `district` - Filter by district ID
- `department` - Filter by department
- `sortBy` - Sort column (created_at, name, etc.)
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
        "member_reg_number": "RHVS0000001",
        "status": "verified",
        "state": "Delhi",
        "district": "New Delhi",
        "departments": "Administration (President - national) | IT (Member - state)",
        "created_at": "2024-01-01T00:00:00Z",
        "verified_by_member_id": 5,
        "verified_by_name": "Jane Smith"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 150,
      "totalPages": 15,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

**Permissions Required:** Authenticated admin (filtered by district for district admins)

**Code Location:** `src/app/api/admin/members/route.ts`

---

### 2.2 `POST /api/admin/members/add`

**WHAT:** Directly add member by admin (bypasses OTP verification).

**HOW:**
1. Verifies admin authentication and `add_members` permission
2. Validates all required fields including signature
3. **District scoping:** District admins can only add to their district
4. Resolves state/district names from IDs
5. Generates sequential member registration number
6. Determines verifier:
   - Superadmin: `RHVS000000`
   - District admin: Their own member registration number
7. Inserts into `members` table with verified status
8. **Async:** Generates membership certificate
9. **Async:** Generates ID card
10. **Async:** Sends welcome email with attachments
11. Logs activity in `activity_logs`
12. Returns member ID and registration number

**WHY:** Admins need to bulk-register members or register members who can't complete online registration.

**Request:**
```json
{
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
  "profilePhotoPath": "/uploads/profiles/photo.jpg",
  "signaturePath": "/uploads/signatures/sig.jpg",
  "feePaid": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Member registered successfully",
  "memberId": 15,
  "memberRegNumber": "RHVS0000015",
  "certificatePath": "/certificates/CERT-RHVS0000015-1234567890.pdf",
  "certificateNumber": "CERT-RHVS0000015-1234567890",
  "idCardPath": "/id-cards/id-card-RHVS0000015.pdf"
}
```

**Permissions Required:** `add_members` or `manage_members`

**Code Location:** `src/app/api/admin/members/add/route.ts`

---

### 2.3 `GET /api/admin/members/[id]`

**WHAT:** Get specific member details.

**HOW:**
1. Verifies admin authentication
2. Applies district scoping (district admins only see their district)
3. Fetches member with all details
4. Includes department assignments
5. Returns member object

**WHY:** Member details page needs complete member information.

**Response:**
```json
{
  "success": true,
  "member": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "1234567890",
    "address": "123 Street",
    "state": "Delhi",
    "district": "New Delhi",
    "aadhar_card_number": "123456789012",
    "father_husband_name": "Father Name",
    "mother_wife_name": "Mother Name",
    "registration_date": "2024-01-15",
    "existing_member_reg_number": "RHVS0000013",
    "profile_photo_path": "/uploads/profiles/photo.jpg",
    "signature_path": "/uploads/signatures/sig.jpg",
    "member_reg_number": "RHVS0000001",
    "status": "verified",
    "verified_by_member_id": 5,
    "verified_by_name": "Jane Smith",
    "departments": [
      {
        "department_id": 1,
        "department_name": "Administration",
        "post_id": 1,
        "post_name": "President",
        "level": "national",
        "appointment_date": "2024-01-15"
      }
    ],
    "certificates": [
      {
        "certificate_number": "CERT-123",
        "certificate_path": "/certificates/CERT-123.pdf",
        "generated_at": "2024-01-15T00:00:00Z"
      }
    ]
  }
}
```

**Permissions Required:** Authenticated admin (district scoped)

**Code Location:** `src/app/api/admin/members/[id]/route.ts`

---

### 2.4 `GET /api/admin/members/stats`

**WHAT:** Get member statistics for dashboard.

**HOW:**
1. Verifies admin authentication
2. If district admin, adds district filter
3. Queries:
   - Total members
   - Verified members
   - Pending members
   - Rejected members
   - Members by state (top 5)
   - Members by district (top 10)
   - Members by month (last 12 months)
   - Department assignment counts
4. Returns statistics object

**WHY:** Dashboard needs real-time stats for visualization.

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 1000,
    "verified": 950,
    "pending": 30,
    "rejected": 20,
    "byState": [
      { "state": "Delhi", "count": 200 },
      { "state": "Haryana", "count": 150 }
    ],
    "byDistrict": [
      { "district": "New Delhi", "count": 100 },
      { "district": "Gurgaon", "count": 80 }
    ],
    "byMonth": [
      { "month": "Jan 2024", "count": 50 },
      { "month": "Feb 2024", "count": 60 }
    ]
  }
}
```

**Permissions Required:** Authenticated admin (district filtered)

**Code Location:** `src/app/api/admin/members/stats/route.ts`

---

### 2.5 `POST /api/register`

**WHAT:** Public member registration with OTP verification.

**HOW:**
**Action 1: `send-otp`**
1. Finds existing member by registration number
2. Generates 6-digit OTP
3. Stores in memory (not database) for 10 minutes
4. Sends OTP email (non-blocking)
5. Returns success

**Action 2: `verify-otp`**
1. Retrieves OTP from memory
2. Validates not expired (10 min) and not used
3. Checks OTP matches
4. Marks as used
5. Returns success

**Action 3: `register-member`**
1. Validates all fields
2. Checks email uniqueness
3. Resolves state/district names from IDs
4. Generates sequential member registration number
5. Gets verifier's ID from existing member
6. Inserts into `members` table
7. **Async:** Generates membership certificate
8. **Async:** Generates ID card
9. **Async:** Sends welcome email with attachments
10. Returns member ID and registration number

**WHY:** Secure member registration with existing member verification prevents fake registrations.

**Request (send-otp):**
```json
{
  "action": "send-otp",
  "data": {
    "existingMemberRegNumber": "RHVS0000013"
  }
}
```

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

**Response:**
```json
{
  "success": true,
  "message": "Member registered successfully",
  "memberId": 15,
  "memberRegNumber": "RHVS0000015"
}
```

**Permissions Required:** None (public)

**Code Location:** `src/app/api/register/route.ts`

---

### 2.6 `GET /api/admin/members/departments`

**WHAT:** Get unique departments from department system.

**HOW:**
1. Queries `departments` table
2. Returns list of unique department names
3. Used for filtering members by department

**WHY:** Member filter dropdown needs department list.

**Response:**
```json
{
  "success": true,
  "data": [
    "Administration",
    "IT",
    "Finance",
    "Cultural"
  ]
}
```

**Permissions Required:** Authenticated admin

**Code Location:** `src/app/api/admin/members/departments/route.ts`

---

## 3. CONTENT MANAGEMENT APIs

### 3.1 `GET /api/content/news` & `POST /api/content/news`

**WHAT:** Public news fetching (no auth required).

**HOW (GET):**
1. Reads query parameters (type, priority, featured, published, limit, offset)
2. Builds SQL query with filters
3. Fetches news articles from `news` table
4. Returns sorted by `published_at` DESC

**HOW (POST):**
1. Verifies admin authentication
2. Checks `manage_content` permission
3. Validates request body
4. Inserts into `news` table
5. Tags with district/state (if district admin)
6. Returns created article

**WHY:** Public website needs to display news, and admins need to manage it.

**Query Parameters (GET):**
- `type` - news/announcement/other
- `priority` - high/medium/low
- `featured` - true/false
- `published` - true/false
- `limit` - number of items
- `offset` - pagination offset

**Request (POST):**
```json
{
  "title": "News Title",
  "content": "News content...",
  "image_path": "/uploads/content/news/image.jpg",
  "news_type": "news",
  "priority": "high",
  "is_featured": true,
  "is_published": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "news_123",
    "title": "News Title",
    "content": "News content...",
    "image_path": "/uploads/content/news/image.jpg",
    "published_at": "2024-01-15T00:00:00Z"
  }
}
```

**Permissions Required:**
- GET: None (public)
- POST: `manage_content`

**Code Location:** `src/app/api/content/news/route.ts`

---

### 3.2 `GET /api/admin/news` & `POST /api/admin/news`

**WHAT:** Admin-specific news management with district scoping.

**HOW:**
1. Verifies admin authentication
2. For superadmin: Shows all news
3. For district admin: Shows only their district's news
4. Paginates results
5. Returns news list with pagination

**WHY:** Admin dashboard needs district-scoped news management.

**Query Parameters:**
- `page` - page number
- `limit` - items per page
- `district` - filter by district
- `state` - filter by state

**Response:**
```json
{
  "success": true,
  "news": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

**Permissions Required:** `manage_content` or superadmin

**Code Location:** `src/app/api/admin/news/route.ts`

---

### 3.3 `GET /api/content/events` & `POST /api/content/events`

**WHAT:** Public events fetching and admin events management.

**HOW:**
1. Fetches from `events` table
2. Filters by visibility and date
3. Returns upcoming/past events
4. Admins can create/update events

**WHY:** Public website displays events, admins manage them.

**Query Parameters:**
- `upcoming` - true/false
- `category` - festival/meeting/celebration
- `limit` - number of items

**Request (POST):**
```json
{
  "title": "Event Title",
  "description": "Event description...",
  "event_date": "2024-02-15",
  "event_time": "10:00:00",
  "location": "Venue Name",
  "address": "123 Street",
  "event_type": "festival",
  "is_visible": true
}
```

**Permissions Required:**
- GET: None (public)
- POST: `manage_content`

**Code Location:** `src/app/api/content/events/route.ts`

---

### 3.4 `GET /api/content/store` & `POST /api/content/store`

**WHAT:** Product store for public browsing and admin management.

**HOW (GET):**
1. Fetches all visible products from `products` table
2. Gets product categories
3. Returns products and categories

**HOW (POST):**
1. Verifies admin authentication
2. Checks `manage_products` permission
3. Bulk updates products
4. Updates categories
5. Returns success

**WHY:** E-commerce needs public product browsing, admins need product management.

**Response (GET):**
```json
{
  "success": true,
  "products": [
    {
      "id": "prod_123",
      "name": "Product Name",
      "description": "Product description...",
      "price": 299.00,
      "stock": 10,
      "category": "books",
      "image_path": "/uploads/store/product.jpg",
      "is_visible": true
    }
  ],
  "categories": ["books", "accessories", "spiritual"]
}
```

**Permissions Required:**
- GET: None (public)
- POST: `manage_products`

**Code Location:** `src/app/api/content/store/route.ts`

---

## 4. DEPARTMENT APIs

### 4.1 `GET /api/departments` & `POST /api/departments`

**WHAT:** Department listing and creation.

**HOW (GET):**
1. Reads level filter (national/state/district)
2. Joins with state/district if applicable
3. Returns departments with post counts
4. Orders by level and name

**HOW (POST):**
1. Verifies superadmin (only superadmins can create departments)
2. Validates all fields
3. Inserts into `departments` table
4. Auto-creates President post (post_order = 0)
5. Returns created department

**WHY:** Organizational structure needs departments at different levels.

**Request (POST):**
```json
{
  "name_en": "Administration",
  "name_hi": "प्रशासन",
  "description": "Admin department",
  "level": "national",
  "state": null,
  "district": null
}
```

**Response:**
```json
{
  "success": true,
  "department": {
    "id": 1,
    "name_en": "Administration",
    "name_hi": "प्रशासन",
    "level": "national",
    "posts": [
      {
        "id": 1,
        "name_en": "President",
        "name_hi": "अध्यक्ष",
        "post_order": 0
      }
    ]
  }
}
```

**Permissions Required:** Superadmin only

**Code Location:** `src/app/api/departments/route.ts`

---

### 4.2 `GET /api/departments/[id]/posts` & `POST /api/departments/[id]/posts`

**WHAT:** Department posts management.

**HOW (GET):**
1. Fetches all posts for department
2. Orders by `post_order`
3. Returns posts array

**HOW (POST):**
1. Validates post name and order
2. Cannot create post with order 0 (reserved for President)
3. Inserts into `department_posts` table
4. Returns created post

**WHY:** Departments need multiple posts (President, Secretary, etc.).

**Request (POST):**
```json
{
  "name_en": "Secretary",
  "name_hi": "सचिव",
  "post_order": 1
}
```

**Permissions Required:** Superadmin only

**Code Location:** `src/app/api/departments/[id]/posts/route.ts`

---

### 4.3 `GET /api/departments/[id]/members` & `POST /api/departments/[id]/members`

**WHAT:** Member assignments to department posts.

**HOW (GET):**
1. Fetches all members assigned to department
2. Includes post information
3. Shows level (national/state/district)
4. Returns assignments array

**HOW (POST):**
1. Validates member exists
2. Checks member not already assigned to this post
3. Inserts into `department_members` table
4. **Auto-generates appointment certificate**
5. Returns assignment

**WHY:** Need to assign members to department posts with automatic certificate generation.

**Request (POST):**
```json
{
  "memberId": 15,
  "postId": 3,
  "level": "national",
  "appointmentDate": "2024-01-15"
}
```

**Response:**
```json
{
  "success": true,
  "assignment": {
    "id": 1,
    "member_id": 15,
    "member_name": "John Doe",
    "department_id": 1,
    "department_name": "Administration",
    "post_id": 3,
    "post_name": "Secretary",
    "level": "national",
    "appointment_date": "2024-01-15"
  },
  "certificatePath": "/certificates/appointment_CERT-15-1-3.pdf"
}
```

**Permissions Required:** Superadmin only

**Code Location:** `src/app/api/departments/[id]/members/route.ts`

---

### 4.4 `DELETE /api/departments/[id]/members/[assignmentId]`

**WHAT:** Remove member from department post.

**HOW:**
1. Verifies superadmin
2. Soft deletes assignment (sets is_active = false)
3. Returns success

**WHY:** Members need to be removed from posts when they leave.

**Permissions Required:** Superadmin only

**Code Location:** `src/app/api/departments/[id]/members/[assignmentId]/route.ts`

---

### 4.5 `GET /api/departments/eligible-members`

**WHAT:** Get members eligible for department assignment.

**HOW:**
1. Fetches verified members
2. Shows existing department assignments
3. Filters by level if specified
4. Returns members with their existing departments

**WHY:** Admin needs to see which members are available for assignment.

**Query Parameters:**
- `level` - national/state/district
- `departmentId` - filter by specific department

**Response:**
```json
{
  "success": true,
  "members": [
    {
      "id": 15,
      "name": "John Doe",
      "member_reg_number": "RHVS0000015",
      "existing_departments": "Administration (President - national)"
    }
  ]
}
```

**Permissions Required:** Superadmin only

**Code Location:** `src/app/api/departments/eligible-members/route.ts`

---

## 5. PERMISSION MANAGEMENT APIs

### 5.1 `GET /api/admin/permissions/my`

**WHAT:** Get current admin's active permissions.

**HOW:**
1. Verifies admin authentication
2. For superadmin: returns empty array (has all permissions)
3. For district admin:
   - Queries `district_admin_permissions` table
   - Filters by is_active = 1
   - Filters by expires_at > NOW() (or NULL)
4. Returns permissions array

**WHY:** Frontend needs to know what permissions current user has for UI rendering.

**Response:**
```json
{
  "success": true,
  "permissions": [
    "manage_members",
    "add_members",
    "edit_members",
    "manage_content"
  ],
  "total": 4
}
```

**Permissions Required:** Authenticated admin

**Code Location:** `src/app/api/admin/permissions/my/route.ts`

---

### 5.2 `POST /api/admin/permissions/assign`

**WHAT:** Assign permission to district admin.

**HOW:**
1. Verifies superadmin only
2. Validates all fields
3. Checks if permission already exists and active
4. Inserts into `district_admin_permissions` table
5. Sets expires_at if temporary permission
6. Returns success

**WHY:** Superadmin needs to grant specific permissions to district admins.

**Request:**
```json
{
  "district_admin_id": 5,
  "permission": "manage_content",
  "permission_type": "temporary",
  "days": 30,
  "granted_by": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Permission assigned successfully",
  "permission": {
    "id": 10,
    "district_admin_id": 5,
    "permission": "manage_content",
    "permission_type": "temporary",
    "expires_at": "2024-02-15T00:00:00Z",
    "is_active": true
  }
}
```

**Permissions Required:** Superadmin only

**Code Location:** `src/app/api/admin/permissions/assign/route.ts`

---

### 5.3 `POST /api/admin/permissions/check-expiry`

**WHAT:** Check and remove expired permissions.

**HOW:**
1. Verifies admin authentication
2. Queries for expired permissions (expires_at < NOW())
3. Sets is_active = 0 for expired permissions
4. Returns expired permissions list

**WHY:** Permissions need to expire automatically, this is called periodically (every 5 min).

**Response:**
```json
{
  "success": true,
  "expired_permissions": [
    "manage_content"
  ],
  "total": 1
}
```

**Permissions Required:** Authenticated admin

**Code Location:** `src/app/api/admin/permissions/check-expiry/route.ts`

---

## 6. FILE UPLOAD APIs

### 6.1 `POST /api/upload/profile`

**WHAT:** Upload profile photo for members.

**HOW:**
1. Receives FormData with file
2. Validates file type (image/jpeg, image/png, image/webp)
3. Validates file size (< 10MB)
4. Generates unique filename: `photo_{timestamp}.{ext}`
5. Saves to `/public/uploads/profiles/`
6. Returns public URL

**WHY:** Members need to upload profile photos during registration.

**Request:**
```
FormData:
- file: File (image)
```

**Response:**
```json
{
  "success": true,
  "url": "/uploads/profiles/photo_1705123456789.jpg",
  "path": "/uploads/profiles/photo_1705123456789.jpg"
}
```

**Permissions Required:** None (public) or authenticated admin

**Code Location:** `src/app/api/upload/profile/route.ts`

---

### 6.2 `POST /api/upload/content`

**WHAT:** Upload content images (news/events/articles).

**HOW:**
1. Receives file from FormData
2. Validates type and size
3. Extracts content type (news/events)
4. Saves to `/public/uploads/content/{type}/`
5. Returns public URL

**WHY:** Content needs images for articles and events.

**Request:**
```
FormData:
- file: File (image)
- type: "news" | "events"
```

**Response:**
```json
{
  "success": true,
  "url": "/uploads/content/news/image_1705123456789.jpg"
}
```

**Permissions Required:** Authenticated admin with `manage_content`

**Code Location:** `src/app/api/upload/content/route.ts`

---

### 6.3 `POST /api/upload/store`

**WHAT:** Upload product images.

**HOW:**
1. Validates image file
2. Saves to `/public/uploads/store/`
3. Returns public URL

**WHY:** Products need images for store.

**Permissions Required:** Authenticated admin with `manage_products`

**Code Location:** `src/app/api/upload/store/route.ts`

---

### 6.4 `POST /api/upload/signature`

**WHAT:** Upload signature file.

**HOW:**
1. Receives signature image
2. Validates type and size
3. Saves to `/public/uploads/signatures/`
4. Returns public URL

**WHY:** ID cards and certificates need signatures.

**Response:**
```json
{
  "success": true,
  "url": "/uploads/signatures/signature_1705123456789.png"
}
```

**Permissions Required:** Authenticated admin or public (during registration)

**Code Location:** `src/app/api/upload/signature/route.ts`

---

## 7. DISTRICT ADMIN APIs

### 7.1 `GET /api/admin/members/admins` & `POST /api/admin/members/admins`

**WHAT:** Manage district admin accounts.

**HOW (GET):**
1. Verifies superadmin only
2. Joins `district_admins` with `members` table
3. Shows admin info with member details
4. Returns admins list

**HOW (POST):**
1. Verifies superadmin only
2. Validates member exists
3. Checks member not already an admin
4. Hashes password with bcrypt
5. Inserts into `district_admins` table
6. Returns created admin

**WHY:** Superadmin needs to create district admin accounts.

**Request (POST):**
```json
{
  "memberId": 15,
  "email": "admin.district1@rhvs.org",
  "password": "secure_password",
  "district": "New Delhi",
  "state": "Delhi",
  "expiresAt": "2024-12-31"
}
```

**Permissions Required:** Superadmin only

**Code Location:** `src/app/api/admin/members/admins/route.ts`

---

### 7.2 `GET /api/admin/members/admins/[id]/permissions`

**WHAT:** Get permissions for specific district admin.

**HOW:**
1. Verifies superadmin only
2. Queries `district_admin_permissions` table
3. Returns permissions with expiry dates
4. Separates permanent and temporary permissions

**WHY:** Superadmin needs to see what permissions district admin has.

**Response:**
```json
{
  "success": true,
  "permissions": [
    {
      "id": 10,
      "permission": "manage_members",
      "permission_type": "permanent",
      "expires_at": null,
      "is_active": true
    },
    {
      "id": 11,
      "permission": "manage_content",
      "permission_type": "temporary",
      "expires_at": "2024-02-15T00:00:00Z",
      "is_active": true
    }
  ]
}
```

**Permissions Required:** Superadmin only

**Code Location:** `src/app/api/admin/members/admins/[id]/permissions/route.ts`

---

## 8. CERTIFICATE APIs

### 8.1 `GET /api/certificates` & `POST /api/certificates/generate`

**WHAT:** List and generate certificates.

**HOW (GET):**
1. Verifies admin authentication
2. Fetches from `member_certificates` table
3. Applies pagination
4. Returns certificates list

**HOW (POST):**
1. Verifies admin authentication
2. Fetches member details
3. Calls `generateCertificate()` from lib
4. Saves PDF to `/public/certificates/`
5. Inserts record into `member_certificates` table
6. Returns certificate path

**WHY:** Need to generate and download certificates for members.

**Request (POST):**
```json
{
  "memberId": 15,
  "memberName": "John Doe",
  "memberRegNumber": "RHVS0000015",
  "registrationDate": "2024-01-15",
  "profilePhotoPath": "/uploads/profiles/photo.jpg"
}
```

**Response:**
```json
{
  "success": true,
  "certificate": {
    "certificate_number": "CERT-RHVS0000015-1705123456",
    "certificate_path": "/certificates/CERT-RHVS0000015-1705123456.pdf"
  }
}
```

**Permissions Required:** Authenticated admin

**Code Location:** `src/app/api/certificates/route.ts`

---

### 8.2 `GET /api/certificates/[id]/download`

**WHAT:** Download certificate PDF.

**HOW:**
1. Verifies admin authentication
2. Finds certificate by ID
3. Reads file from disk
4. Returns PDF with download headers

**WHY:** Users need to download certificates.

**Response Headers:**
```
Content-Type: application/pdf
Content-Disposition: attachment; filename=certificate.pdf
```

**Permissions Required:** Authenticated admin

**Code Location:** `src/app/api/certificates/[id]/download/route.ts`

---

### 8.3 `GET /api/admin/certificates/[memberId]`

**WHAT:** Get all certificates for a member.

**HOW:**
1. Queries `member_certificates` table filtered by member_id
2. Returns certificates list

**WHY:** View all certificates issued to a member.

**Response:**
```json
{
  "success": true,
  "certificates": [
    {
      "id": 1,
      "certificate_number": "CERT-123",
      "certificate_path": "/certificates/CERT-123.pdf",
      "generated_at": "2024-01-15T00:00:00Z",
      "generated_by_admin_id": 1
    }
  ]
}
```

**Permissions Required:** Authenticated admin

**Code Location:** `src/app/api/admin/certificates/[memberId]/route.ts`

---

## 9. LOCATION APIs

### 9.1 `GET /api/states`

**WHAT:** Get all Indian states.

**HOW:**
1. Queries `states` table
2. Returns id, code, and name
3. Orders by state name

**WHY:** Dropdown needs state list for member registration and filtering.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "code": "DL",
      "name": "Delhi"
    },
    {
      "id": "2",
      "code": "HR",
      "name": "Haryana"
    }
  ]
}
```

**Permissions Required:** None (public)

**Code Location:** `src/app/api/states/route.ts`

---

### 9.2 `GET /api/districts`

**WHAT:** Get districts for a state.

**HOW:**
1. Reads stateId query parameter
2. Queries `districts` table filtered by state
3. Returns districts list

**WHY:** Dependent dropdown for district selection.

**Query Parameters:**
- `stateId` - State ID to filter districts

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "code": "001",
      "name": "New Delhi",
      "state": "Delhi"
    },
    {
      "id": "2",
      "code": "002",
      "name": "Central Delhi",
      "state": "Delhi"
    }
  ]
}
```

**Permissions Required:** None (public)

**Code Location:** `src/app/api/districts/route.ts`

---

## 10. HERO IMAGES APIs

### 10.1 `GET /api/hero-images` & `POST /api/hero-images`

**WHAT:** Get and create hero images.

**HOW (GET):**
1. Verifies admin authentication
2. Applies district scoping for district admins
3. Fetches active images ordered by display_order
4. Returns images array

**HOW (POST):**
1. Verifies `manage_hero_images` permission
2. Validates all fields
3. Receives image via upload
4. Saves to `/public/uploads/hero-images/`
5. Inserts into `hero_images` table
6. Returns created image

**WHY:** Hero section needs dynamic images, admins manage them.

**Request (POST):**
```json
{
  "image_path": "/uploads/hero-images/hero_123.jpg",
  "alt_text": "Hero image",
  "title": "Hero Title",
  "description": "Hero description",
  "display_order": 0
}
```

**Response:**
```json
{
  "success": true,
  "image": {
    "id": 1,
    "image_path": "/uploads/hero-images/hero_123.jpg",
    "alt_text": "Hero image",
    "title": "Hero Title",
    "display_order": 0,
    "is_active": true
  }
}
```

**Permissions Required:**
- GET: Authenticated admin (district scoped)
- POST: `manage_hero_images`

**Code Location:** `src/app/api/hero-images/route.ts`

---

### 10.2 `PUT /api/hero-images/[id]` & `DELETE /api/hero-images/[id]`

**WHAT:** Update and delete hero images.

**HOW:**
1. Verifies admin authentication
2. For district admin: checks ownership
3. Updates or soft deletes image
4. Returns success

**WHY:** Admins need to edit/delete hero images.

**Permissions Required:** `manage_hero_images`

**Code Location:** `src/app/api/hero-images/[id]/route.ts`

---

### 10.3 `GET /api/hero-images/settings` & `PUT /api/hero-images/settings`

**WHAT:** Get and update hero section settings.

**HOW:**
1. Fetches from `hero_image_settings` table
2. Parses JSON settings (marquee_speed, auto_play, etc.)
3. Returns settings object
4. Update: saves settings to database

**WHY:** Hero section behavior needs configuration.

**Response:**
```json
{
  "success": true,
  "settings": {
    "marquee_speed": 30,
    "image_display_duration": 3,
    "auto_play": true,
    "show_indicators": true,
    "transition_effect": "slide"
  }
}
```

**Permissions Required:** `manage_hero_settings`

**Code Location:** `src/app/api/hero-images/settings/route.ts`

---

## 11. PHOTO & GALLERY APIs

### 11.1 `GET /api/photos` & `POST /api/photos`

**WHAT:** Get and upload photos.

**HOW (GET):**
1. Verifies admin authentication
2. Applies district scoping
3. Fetches photos with event information
4. Returns photos array

**HOW (POST):**
1. Verifies admin authentication
2. Checks `manage_gallery` permission
3. Receives file via FormData
4. Saves to `/public/uploads/photos/{eventId}/`
5. Inserts into `photos` table with metadata
6. Returns created photo

**WHY:** Gallery system needs photo management with event associations.

**Request (POST - FormData):**
```
file: File (image)
eventId: "event_123"
caption: "Photo caption"
tags: ["tag1", "tag2"]
```

**Response:**
```json
{
  "success": true,
  "photo": {
    "id": "photo_123",
    "filename": "photo_1705123456.jpg",
    "file_path": "/uploads/photos/event_123/photo_1705123456.jpg",
    "event_id": "event_123",
    "caption": "Photo caption",
    "tags": ["tag1", "tag2"],
    "is_visible": true
  }
}
```

**Permissions Required:** `manage_gallery`

**Code Location:** `src/app/api/photos/route.ts`

---

### 11.2 `GET /api/photos/events` & `POST /api/photos/events`

**WHAT:** Get and create photo events.

**HOW:**
1. Fetches all photo events
2. Creates new event with title, date, location
3. Returns events list or created event

**WHY:** Photos need to be organized by events.

**Request (POST):**
```json
{
  "title": "Republic Day 2024",
  "description": "Event description",
  "event_date": "2024-01-26",
  "location": "Delhi"
}
```

**Permissions Required:** `manage_gallery`

**Code Location:** `src/app/api/photos/events/route.ts`

---

### 11.3 `GET /api/public/photos`

**WHAT:** Public photo gallery with filters.

**HOW:**
1. No authentication required
2. Reads filters: eventType, state, district, event, tags, limit, featured
3. Queries `photos` table with `is_visible = true`
4. Applies filters
5. Returns photos array

**WHY:** Public website needs to display photos.

**Query Parameters:**
- `eventType` - event type filter
- `state` - state filter
- `district` - district filter
- `event` - specific event
- `tags` - tag filter (comma-separated)
- `limit` - number of results
- `featured` - true/false

**Response:**
```json
{
  "success": true,
  "photos": [
    {
      "id": "photo_123",
      "file_path": "/uploads/photos/event_123/photo.jpg",
      "caption": "Photo caption",
      "eventName": "Republic Day 2024",
      "photographer": "Admin User",
      "tags": ["ceremony", "celebration"]
    }
  ]
}
```

**Permissions Required:** None (public)

**Code Location:** `src/app/api/public/photos/route.ts`

---

## 12. PUBLIC APIs

### 12.1 `GET /api/content/about`

**WHAT:** Get about page content.

**HOW:**
1. Queries `about_sections` table
2. Orders by `order` field
3. Filters by `isVisible = true`
4. Returns sections array

**WHY:** Public website needs about page content.

**Response:**
```json
{
  "success": true,
  "sections": [
    {
      "id": "section_1",
      "type": "hero",
      "title": "Welcome",
      "content": "Content...",
      "order": 0
    }
  ]
}
```

**Permissions Required:** None (public)

**Code Location:** `src/app/api/content/about/route.ts`

---

### 12.2 `GET /api/public/departments`

**WHAT:** Get public departments list.

**HOW:**
1. Queries `departments` table
2. Joins with `department_members` and `members`
3. Shows members assigned to each department
4. Returns departments with members

**WHY:** Public website displays organizational structure.

**Response:**
```json
{
  "success": true,
  "departments": [
    {
      "id": 1,
      "name_en": "Administration",
      "name_hi": "प्रशासन",
      "level": "national",
      "posts": [
        {
          "post_name": "President",
          "member_name": "John Doe",
          "member_reg_number": "RHVS0000015"
        }
      ]
    }
  ]
}
```

**Permissions Required:** None (public)

**Code Location:** `src/app/api/public/departments/route.ts`

---

## 13. DEBUG & TEST APIs

These APIs exist for development/testing purposes:

- `/api/test-db` - Test database connection
- `/api/test-email` - Test email sending
- `/api/test-certificate` - Test certificate generation
- `/api/debug/*` - Various debug endpoints
- `/api/check-*` - Database check endpoints

**Permissions Required:** Varies, typically requires authentication

---

## API SUMMARY

### Total API Endpoints: 100+

**Breakdown:**
- Authentication APIs: 3
- Member Management APIs: 6
- Content Management APIs: 12
- Department APIs: 8
- Permission APIs: 6
- File Upload APIs: 8
- District Admin APIs: 6
- Certificate APIs: 6
- Location APIs: 4
- Hero Images APIs: 6
- Photo & Gallery APIs: 8
- Public APIs: 6
- Debug/Test APIs: 25+

### Security Patterns Used

1. **JWT Authentication** - All admin APIs
2. **Permission-Based Access** - RBAC for features
3. **District Scoping** - District admins see only their district
4. **Input Validation** - Zod schemas
5. **SQL Injection Protection** - Prepared statements
6. **File Upload Validation** - Type and size checks
7. **HTTPS Cookies** - Secure, HttpOnly cookies

### Common Response Patterns

**Success:**
```json
{
  "success": true,
  "data": {...},
  "message": "Operation successful"
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error message",
  "message": "Detailed error message"
}
```

**Pagination:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

**End of API Documentation**

**Last Updated:** January 2025
**Total API Endpoints Documented:** 100+
**Coverage:** Complete

