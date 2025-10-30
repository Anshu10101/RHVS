# Hero Images Marquee System Setup

This document outlines the complete hero images marquee system implementation for the RHVS website.

## Overview

The hero images system allows:
1. **Moving image marquee** in the hero section with customizable settings
2. **Admin management** through the content management dashboard
3. **District admin permissions** for controlled access
4. **Dynamic image rotation** with smooth transitions
5. **Responsive design** that works on all devices

## Features Implemented

### 🎨 Hero Section Features
- **Main hero image** with smooth transitions
- **Image indicators** for manual navigation
- **Auto-play functionality** with customizable timing
- **Image marquee** showing all images in a scrolling row
- **Responsive design** with different sizes for mobile/desktop
- **Fallback to default image** when no images are available

### 🔧 Admin Management Features
- **Add/Edit/Delete** hero images
- **Image ordering** with drag-and-drop style controls
- **Settings management** for marquee behavior
- **Permission-based access** for district admins
- **Image preview** and validation
- **Bulk operations** for efficient management

### 🛡️ Permission System
- **Superadmin**: Full access to all hero images and settings
- **District Admin**: Can manage images with proper permissions
- **Permission-based filtering** shows only relevant images
- **Audit trail** tracks who added/modified images

## Database Schema

### Tables Created

#### 1. `hero_images` Table
```sql
CREATE TABLE hero_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    image_path VARCHAR(500) NOT NULL,
    alt_text VARCHAR(255) NOT NULL,
    title VARCHAR(255) NULL,
    description TEXT NULL,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    added_by INT NOT NULL,
    district_id INT NULL,
    state_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### 2. `hero_image_settings` Table
```sql
CREATE TABLE hero_image_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT NULL,
    updated_by INT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Permissions Added
- `manage_hero_images`: Can add, edit, and delete hero images
- `manage_hero_settings`: Can modify hero section display settings

## Setup Instructions

### 1. Database Setup
```bash
# Run the setup script
node setup-hero-images-permissions.js
```

### 2. File Structure
```
src/
├── components/
│   ├── Home/
│   │   └── HeroSection.tsx          # Updated with marquee functionality
│   └── Admin/
│       └── Content/
│           └── HeroImagesManagement.tsx  # New admin component
├── app/
│   └── api/
│       └── hero-images/
│           ├── route.ts             # Main CRUD operations
│           ├── settings/route.ts    # Settings management
│           └── [id]/route.ts        # Individual image operations
└── database/
    └── hero-images-schema.sql       # Database schema
```

### 3. Admin Dashboard Integration
- Added "Hero Images" tab to Content Management
- Integrated with existing permission system
- Added to admin sidebar navigation

## API Endpoints

### GET `/api/hero-images`
- Fetches all active hero images
- Respects district admin scope
- Returns images ordered by display_order

### POST `/api/hero-images`
- Adds new hero image
- Requires `manage_hero_images` permission
- Validates required fields

### PUT `/api/hero-images/[id]`
- Updates existing hero image
- Permission checks for district admins
- Supports partial updates

### DELETE `/api/hero-images/[id]`
- Soft deletes hero image (sets is_active = false)
- Permission checks for district admins

### GET `/api/hero-images/settings`
- Fetches hero section settings
- Returns parsed values (booleans, numbers)

### PUT `/api/hero-images/settings`
- Updates hero section settings
- Requires `manage_hero_settings` permission

## Configuration Options

### Hero Settings
- **marquee_speed**: Animation speed in seconds (5-120)
- **image_display_duration**: How long each image shows (1-10 seconds)
- **auto_play**: Whether images auto-rotate
- **show_indicators**: Whether to show navigation dots
- **transition_effect**: Animation type (currently 'slide')

### Image Properties
- **image_path**: URL to the image file
- **alt_text**: Accessibility description (required)
- **title**: Optional image title
- **description**: Optional image description
- **display_order**: Order in the marquee (0-based)

## Usage Guide

### For Superadmins
1. Navigate to **Content Management > Hero Images**
2. Click **"Add Image"** to upload new images
3. Use **Settings** to configure marquee behavior
4. Reorder images using up/down arrows
5. Grant permissions to district admins as needed

### For District Admins
1. Ensure you have `manage_hero_images` permission
2. Navigate to **Content Management > Hero Images**
3. Add images specific to your district
4. Edit/delete only your own images (unless granted global access)

### For Website Visitors
- Images automatically rotate based on settings
- Click indicators to manually navigate
- Responsive design adapts to screen size
- Smooth transitions between images

## Technical Details

### Frontend Implementation
- **React hooks** for state management
- **Next.js Image** component for optimization
- **CSS animations** for smooth transitions
- **Responsive design** with Tailwind CSS
- **TypeScript** for type safety

### Backend Implementation
- **MySQL** database with proper indexing
- **Permission-based access control**
- **District/state scoping** for multi-tenant support
- **Soft delete** for data integrity
- **Transaction support** for data consistency

### Security Features
- **Permission validation** on all operations
- **District scoping** prevents cross-district access
- **Input validation** and sanitization
- **File type validation** for uploads
- **SQL injection protection** with prepared statements

## Troubleshooting

### Common Issues
1. **Images not loading**: Check file paths and permissions
2. **Marquee not working**: Verify settings are properly saved
3. **Permission denied**: Ensure user has correct permissions
4. **Images not ordering**: Check display_order values

### Debug Steps
1. Check browser console for errors
2. Verify API endpoints are responding
3. Check database permissions
4. Validate image file formats and sizes

## Future Enhancements

### Planned Features
- **Image cropping/resizing** tools
- **Bulk upload** functionality
- **Image categories** and filtering
- **Advanced animations** (fade, zoom, etc.)
- **Video support** for hero section
- **A/B testing** for different image sets

### Performance Optimizations
- **Image lazy loading** for better performance
- **WebP format** support for smaller files
- **CDN integration** for faster loading
- **Caching strategies** for settings and images

## Support

For technical support or questions about the hero images system:
1. Check this documentation first
2. Review the database schema and API endpoints
3. Test with different permission levels
4. Contact the development team for advanced issues

---

**Last Updated**: December 2024
**Version**: 1.0.0
**Status**: Production Ready
