# Department Management - Quick Start Guide

## Setup (One-Time)

```bash
# Install dependency
npm install @hello-pangea/dnd

# Setup database
node setup-department-management.js

# Restart dev server
npm run dev
```

## Access

Navigate to: `/admin/departments` (Superadmin only)

## Quick Workflow

### 1. Create a Department

1. Go to **Create Department**
2. Enter English name (e.g., "Cultural Department")
3. Enter Hindi name (e.g., "सांस्कृतिक विभाग")
4. Select level (National/State/District)
5. If State/District: Select location
6. Click **Create Department**

### 2. Add Posts to Department

1. Go to **Manage Departments**
2. Select department level and location (if needed)
3. Click on the department you want to manage
4. Switch to **Manage Posts** tab
5. Click **Add Post**
6. Enter English name (e.g., "Secretary")
7. Enter Hindi name (e.g., "सचिव")
8. Click **Add Post**

**Note:** The first post you create will automatically be the President post.

### 3. Reorder Posts

1. In **Manage Posts** tab
2. Drag and drop posts to reorder
3. President post (position 1) cannot be moved

### 4. Assign Members to Posts

1. Go to **Assign Members**
2. Select department level and location
3. Click on the department
4. Switch to **Assign Members** tab
5. For each vacant post, click **Assign Member**
6. Search for member (by name, email, or reg number)
7. Click on member to select
8. Click **Assign Member**

## Key Rules

✅ **Can Do:**
- Create unlimited departments
- Create unlimited posts per department
- Edit post names
- Delete any post except President
- Reorder posts except President
- Assign/remove members

❌ **Cannot Do:**
- Delete or move President post (position 1)
- Assign same member to multiple posts in same department
- Assign multiple members to same post

## Navigation

```
Admin Dashboard
  └── Departments
       ├── Create Department
       ├── Manage Departments
       │    ├── Select Department (Tab)
       │    └── Manage Posts (Tab)
       └── Assign Members
            ├── Select Department (Tab)
            └── Assign Members (Tab)
```

## Tips

💡 **Best Practices:**
- Always create President post first
- Use descriptive names in both languages
- Verify member details before assignment
- Use search to quickly find members
- Check activity logs for audit trail

🔍 **Finding Members:**
- National: All verified members
- State: Members from selected state only
- District: Members from selected district only

🎨 **Visual Cues:**
- Orange badge = President post
- Filled posts show member with photo
- Drag handle icon for reorderable posts

## Troubleshooting

**Q: Can't see departments?**
- Check you selected the correct level
- For State/District, ensure you selected location

**Q: Can't assign member?**
- Verify member is not already in this department
- Check member's state/district matches department level

**Q: Can't delete/move President post?**
- This is by design - President is always position 1

**Q: Drag and drop not working?**
- Ensure @hello-pangea/dnd is installed
- Restart dev server

## Support

Check these files for more details:
- `DEPARTMENT-SYSTEM-SETUP.md` - Complete technical guide
- `DEPARTMENT-MANAGEMENT-README.md` - System overview

---

**Quick Reference Card**

| Action | Steps |
|--------|-------|
| Create Dept | Departments → Create → Fill form → Submit |
| Add Post | Manage → Select dept → Add Post → Fill → Submit |
| Reorder | Manage → Posts tab → Drag & drop |
| Assign Member | Assign → Select dept → Click Assign → Select member |
| Remove Member | Assign → Posts tab → Click trash icon |

**Keyboard Shortcuts** (in Manage Posts)
- Drag = Click + Hold + Move
- Scroll = Mouse wheel in long lists
