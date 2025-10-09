# Department Management System - Complete Setup Guide

## Overview

A comprehensive department management system for RHVS that allows superadmins to create and manage organizational departments at national, state, and district levels with dynamic post creation and member assignment.

## Features Implemented

### 1. Create Department
- Create departments at national, state, or district level
- Bilingual support (English and Hindi) for department names
- Automatic validation based on level selection
- State and district filtering for state/district level departments

### 2. Manage Department Posts
- Create unlimited posts within each department
- First post is automatically designated as President
- Drag-and-drop post reordering (except President post)
- Edit post names in both languages
- Delete posts (except President post)
- President post cannot be moved or deleted

### 3. Assign Members
- Assign registered members to department posts
- Filter members by level (national/state/district)
- Search functionality by name, email, or registration number
- Visual member cards with profile photos
- Remove member assignments
- Prevent duplicate assignments

## Database Schema

### Tables Created

1. **departments**
   ```sql
   - id (INT, Primary Key)
   - name_en (VARCHAR, English name)
   - name_hi (VARCHAR, Hindi name)
   - level (ENUM: national, state, district)
   - state (VARCHAR, NULL for national)
   - district (VARCHAR, NULL for national/state)
   - created_by (INT, Foreign Key to superadmin)
   - created_at, updated_at (TIMESTAMP)
   ```

2. **department_posts**
   ```sql
   - id (INT, Primary Key)
   - department_id (INT, Foreign Key)
   - name_en (VARCHAR, English name)
   - name_hi (VARCHAR, Hindi name)
   - position_order (INT, 1 is President)
   - created_at, updated_at (TIMESTAMP)
   ```

3. **department_members**
   ```sql
   - id (INT, Primary Key)
   - department_id (INT, Foreign Key)
   - post_id (INT, Foreign Key)
   - member_id (INT, Foreign Key to members)
   - assigned_by (INT, Foreign Key to superadmin)
   - assigned_at, updated_at (TIMESTAMP)
   ```

## Installation Steps

### 1. Install Dependencies

```bash
npm install @hello-pangea/dnd
```

### 2. Run Database Setup

```bash
node setup-department-management.js
```

Or manually run the SQL file:

```bash
mysql -u your_username -p your_database < database/department-management-schema.sql
```

### 3. Verify Installation

Navigate to `/admin/departments` as a superadmin to access the department management system.

## API Endpoints

### Departments
- `GET /api/departments` - List all departments (with filters)
- `POST /api/departments` - Create new department

### Department Posts
- `GET /api/departments/:id/posts` - List posts for a department
- `POST /api/departments/:id/posts` - Create new post
- `PUT /api/departments/:id/posts` - Update post order
- `PATCH /api/departments/:id/posts/:postId` - Update post details
- `DELETE /api/departments/:id/posts/:postId` - Delete post

### Department Members
- `GET /api/departments/:id/members` - List members in department
- `POST /api/departments/:id/members` - Assign member to post
- `DELETE /api/departments/:id/members/:assignmentId` - Remove assignment

### Helper Endpoints
- `GET /api/departments/eligible-members` - Get eligible members for assignment
- `GET /api/locations` - Get states and districts

## User Interface

### Pages Created

1. **Main Dashboard** (`/admin/departments`)
   - Three card layout with quick access to:
     - Create Department
     - Manage Departments
     - Assign Members

2. **Create Department** (`/admin/departments/create`)
   - Form with bilingual input fields
   - Level selection (national/state/district)
   - Dynamic state/district dropdowns
   - Validation and error handling

3. **Manage Departments** (`/admin/departments/manage`)
   - Two-tab interface: Department Selection and Post Management
   - Filter departments by level, state, district
   - Drag-and-drop post reordering
   - Create, edit, and delete posts
   - Special handling for President post

4. **Assign Members** (`/admin/departments/assign`)
   - Two-tab interface: Department Selection and Member Assignment
   - Search and filter members
   - Visual member selection with profile photos
   - Post status (filled/vacant)
   - Remove member assignments

## Business Rules

### Department Creation
- National level: No state/district required
- State level: State required
- District level: Both state and district required
- Unique department names per level/location combination

### Post Management
- First post created is automatically the President (position_order = 1)
- President post cannot be deleted
- President post cannot be reordered
- Other posts can be freely reordered via drag-and-drop
- Deleting a post automatically reorders remaining posts

### Member Assignment
- Members can only be assigned to one post per department
- One member per post
- Members filtered by department level:
  - National: All verified members
  - State: Members from that state
  - District: Members from that district
- Search by name, email, or registration number

## Security

- Only superadmins can access the department management system
- All API endpoints check for superadmin authorization
- Activity logging for all department operations
- Foreign key constraints ensure data integrity

## UI/UX Features

- Responsive design for all screen sizes
- Loading states for all async operations
- Toast notifications for success/error feedback
- Confirmation dialogs for destructive actions
- Drag-and-drop with visual feedback
- Bilingual support throughout
- Profile photo display in member selection
- Color-coded President post
- Tab navigation for complex workflows

## Files Created/Modified

### New Files
1. `database/department-management-schema.sql` - Database schema
2. `setup-department-management.js` - Setup script
3. `src/app/api/departments/route.ts` - Department CRUD
4. `src/app/api/departments/[id]/posts/route.ts` - Posts CRUD
5. `src/app/api/departments/[id]/posts/[postId]/route.ts` - Individual post operations
6. `src/app/api/departments/[id]/members/route.ts` - Member assignments
7. `src/app/api/departments/[id]/members/[assignmentId]/route.ts` - Remove assignments
8. `src/app/api/departments/eligible-members/route.ts` - Get eligible members
9. `src/app/api/locations/route.ts` - Get states and districts
10. `src/app/admin/departments/page.tsx` - Main dashboard
11. `src/app/admin/departments/create/page.tsx` - Create department
12. `src/app/admin/departments/manage/page.tsx` - Manage departments
13. `src/app/admin/departments/assign/page.tsx` - Assign members
14. `DEPARTMENT-MANAGEMENT-README.md` - Documentation
15. `DEPARTMENT-SYSTEM-SETUP.md` - This file

### Modified Files
1. `src/components/Admin/Layout/AdminSidebar.tsx` - Added department links
2. `README.md` - Updated with department management info
3. `package.json` - Added @hello-pangea/dnd dependency

## Testing Checklist

- [ ] Create national level department
- [ ] Create state level department
- [ ] Create district level department
- [ ] Create first post (should be President)
- [ ] Create additional posts
- [ ] Reorder posts via drag-and-drop
- [ ] Try to delete President post (should fail)
- [ ] Delete non-President post
- [ ] Edit post names
- [ ] Assign member to post
- [ ] Try to assign same member to another post in same department (should fail)
- [ ] Remove member assignment
- [ ] Search for members
- [ ] Filter departments by level
- [ ] Check activity logs for all operations

## Troubleshooting

### Common Issues

1. **"Module not found" errors**
   - Solution: Restart the dev server after installing dependencies

2. **State/District dropdowns empty**
   - Solution: Ensure members table has state and district data

3. **Cannot drag posts**
   - Solution: Verify @hello-pangea/dnd is installed

4. **President post can be deleted/moved**
   - Solution: Check API validation logic

## Future Enhancements

- Export department structure to PDF
- Department hierarchy visualization
- Bulk member assignment
- Department templates
- Member role descriptions
- Department-specific permissions
- Email notifications for assignments

## Support

For issues or questions:
- Check the DEPARTMENT-MANAGEMENT-README.md
- Review API endpoint documentation
- Check browser console for errors
- Verify database schema is correctly set up

---

**Implementation Date**: 2025-01-09
**Version**: 1.0.0
**Status**: Production Ready
