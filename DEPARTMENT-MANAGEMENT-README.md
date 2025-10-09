# Department Management System

This document provides an overview of the Department Management System implemented for RHVS.

## Overview

The Department Management System allows superadmins to create and manage organizational departments at national, state, and district levels. Each department can have multiple posts (positions) with the first post always being the president. Members can be assigned to these posts to create a complete organizational structure.

## Features

1. **Create Departments**
   - Create departments at national, state, or district level
   - Provide names in both English and Hindi
   - Automatic tracking of creation details

2. **Manage Department Posts**
   - Create multiple posts within each department
   - First post is automatically designated as President
   - Reorder posts (except President position)
   - Delete posts (except President position)
   - Edit post names in both languages

3. **Assign Members**
   - Assign registered members to department posts
   - Filter members by level (national/state/district)
   - Search functionality to find members
   - Remove members from posts

## Database Schema

The system uses three main tables:

1. **departments**
   - Stores department information
   - Tracks level (national/state/district)
   - Includes both English and Hindi names

2. **department_posts**
   - Stores posts within departments
   - Maintains position order
   - Includes both English and Hindi names

3. **department_members**
   - Links members to department posts
   - Tracks assignment details

## Setup

To set up the Department Management System:

```bash
# Run the setup script
node setup-department-management.js
```

This will create the necessary database tables.

## User Interface

The Department Management System is accessible through the Admin Dashboard under the "Departments" section. It includes three main pages:

1. **Create Department**
   - Form to create new departments
   - Select level and provide names

2. **Manage Departments**
   - Filter departments by level
   - Create, edit, and delete posts
   - Reorder posts using drag-and-drop

3. **Assign Members**
   - Select department and view posts
   - Assign members to vacant posts
   - Remove members from posts

## API Endpoints

### Departments

- `GET /api/departments` - List departments with optional filters
- `POST /api/departments` - Create a new department

### Department Posts

- `GET /api/departments/:id/posts` - List posts for a department
- `POST /api/departments/:id/posts` - Create a new post
- `PUT /api/departments/:id/posts` - Update post order
- `PATCH /api/departments/:id/posts/:postId` - Update a post
- `DELETE /api/departments/:id/posts/:postId` - Delete a post

### Department Members

- `GET /api/departments/:id/members` - List members assigned to a department
- `POST /api/departments/:id/members` - Assign a member to a post
- `DELETE /api/departments/:id/members/:assignmentId` - Remove a member assignment

### Eligible Members

- `GET /api/departments/eligible-members` - List members eligible for assignment

## Permissions

Only superadmins have access to the Department Management System. This ensures that organizational structure is managed centrally with proper oversight.

## Best Practices

1. Always create the President post first when setting up a new department
2. Use meaningful names for departments and posts in both languages
3. Consider the hierarchical structure when ordering posts
4. Verify member details before assignment to ensure proper placement

---

For technical support or questions about the Department Management System, please contact the system administrator.
