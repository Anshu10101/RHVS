# RHVS Admin Dashboard

A comprehensive admin dashboard for the Rashtriya Hindu Vahini Sangathan (RHVS) website built with Next.js, Tailwind CSS, and shadcn/ui components.

## Features

### 🔐 Role-Based Access Control (RBAC)
- **Superadmin**: Full access to all features and settings
- **Admin**: District-specific access with delegated permissions
- **Verified Member**: Limited access to add new members

### 👥 Member Management
- Add new members with OTP verification
- Track member registration chain (who added whom)
- Searchable member list with filters (district, department, date)
- Member status management (pending, verified, rejected)
- Detailed member profiles and activity tracking

### 📊 Analytics Dashboard
- Real-time statistics and metrics
- Member growth charts and trends
- District-wise member distribution
- Department-wise analytics
- Activity summaries and insights

### 📝 Content Management System (CMS)
- **About Page**: Edit organization information and mission
- **Gallery**: Upload and manage images and albums
- **Product Store**: Manage spiritual products and inventory
- **Events**: Create and manage community events

### 🔍 Activity Logs & Audit Trail
- Complete activity tracking
- User action logs with timestamps
- IP address tracking
- Searchable and filterable logs
- Export functionality

### ⚡ Permission Management
- Grant temporary permissions to users
- Role-based access control
- Permission delegation system
- Time-limited access grants

## Tech Stack

- **Framework**: Next.js 15.5.2
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **State Management**: React Context API
- **TypeScript**: Full type safety

## Project Structure

```
src/
├── app/
│   └── admin/
│       ├── layout.tsx              # Admin layout wrapper
│       ├── page.tsx                # Dashboard home
│       ├── login/page.tsx          # Admin login
│       ├── members/page.tsx        # Member management
│       ├── content/page.tsx        # Content management
│       ├── analytics/page.tsx      # Analytics dashboard
│       ├── logs/page.tsx           # Activity logs
│       └── settings/page.tsx       # Settings & permissions
├── components/
│   └── Admin/
│       ├── AdminSidebar.tsx        # Navigation sidebar
│       ├── AdminHeader.tsx         # Top navigation
│       ├── MemberManagement.tsx    # Member CRUD operations
│       ├── ContentManagement.tsx   # CMS interface
│       ├── AnalyticsDashboard.tsx  # Analytics & charts
│       ├── ActivityLogs.tsx        # Audit trail
│       ├── PermissionManagement.tsx # Permission system
│       └── OTPVerification.tsx     # OTP verification modal
└── contexts/
    └── AdminContext.tsx            # Global admin state
```

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or pnpm

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   # or
   pnpm install
   ```

2. **Run development server**:
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

3. **Access admin dashboard**:
   Navigate to `http://localhost:3000/admin/login`

### Demo Credentials

- **Superadmin**: `admin@rhvs.com` / `password`
- **Admin**: `admin1@rhvs.com` / `password`  
- **Verified Member**: `member@rhvs.com` / `password`

## Key Components

### AdminContext
Central state management for:
- User authentication and roles
- Member data and operations
- Activity logging
- Permission management

### AdminSidebar
Role-based navigation with:
- Dynamic menu items based on permissions
- Collapsible sub-menus
- User profile display
- Role badges and status indicators

### MemberManagement
Complete member lifecycle management:
- Add new members with OTP verification
- Search and filter capabilities
- Status management (pending/verified/rejected)
- Member profile modals
- Registration chain tracking

### ContentManagement
Tabbed interface for:
- About page editing
- Gallery management
- Product store administration
- Event creation and management

### AnalyticsDashboard
Comprehensive analytics with:
- Key metrics cards
- Member status distribution
- District-wise statistics
- Monthly growth charts
- Department analytics

## Features in Detail

### Role-Based Access Control

The dashboard implements a sophisticated RBAC system:

```typescript
// Permission checking
const hasPermission = (permission: string): boolean => {
  if (currentUser.role === 'superadmin') return true;
  if (currentUser.permissions.includes('all')) return true;
  if (currentUser.permissions.includes(permission)) return true;
  
  // Check temporary permissions
  const tempPermission = currentUser.temporaryPermissions?.find(
    tp => tp.permission === permission && tp.expiresAt > new Date()
  );
  return !!tempPermission;
};
```

### Member Registration Flow

1. **OTP Verification**: New members require phone number verification
2. **Registration Tracking**: System tracks who added each member
3. **Status Management**: Members go through pending → verified workflow
4. **District Assignment**: Members are assigned to specific districts

### Temporary Permission System

Admins can grant time-limited permissions:
- Set expiration dates (1-30 days)
- Track permission grants and revocations
- Automatic expiration handling
- Audit trail for all permission changes

### Search and Filtering

Advanced search capabilities across:
- Member names, emails, registration numbers
- Activity logs by user, action, date range
- Content by type and modification date
- Analytics by district, department, time period

## Customization

### Adding New Roles
1. Update `UserRole` type in `AdminContext.tsx`
2. Add role-specific permissions
3. Update navigation items in `AdminSidebar.tsx`
4. Implement role-based UI logic

### Adding New Content Types
1. Add new tab in `ContentManagement.tsx`
2. Create corresponding management component
3. Update permission system
4. Add to navigation menu

### Custom Analytics
1. Add new metrics to `AnalyticsDashboard.tsx`
2. Implement data fetching logic
3. Create visualization components
4. Update dashboard layout

## Security Features

- **Authentication**: Secure login with role validation
- **Authorization**: Granular permission checking
- **Audit Trail**: Complete activity logging
- **Session Management**: Secure session handling
- **Input Validation**: Form validation and sanitization

## Performance Optimizations

- **Lazy Loading**: Components loaded on demand
- **Memoization**: Optimized re-renders
- **Efficient Filtering**: Client-side filtering with debouncing
- **Responsive Design**: Mobile-first approach
- **Code Splitting**: Route-based code splitting

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is proprietary software for Rashtriya Hindu Vahini Sangathan.

## Support

For technical support or questions, contact the development team.

---

**Built with ❤️ for the RHVS community**
