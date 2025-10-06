# District Admin System Setup

This document outlines the enhanced district admin system with role-based access control (RBAC) and district-specific content tracking.

## Overview

The district admin system allows:

1. **Superadmins** to appoint district admins and assign specific permissions
2. **District admins** to manage content and members for their specific district
3. **Permanent permissions** for member management tasks
4. **Time-based permissions** for content management tasks
5. **District-specific content tracking** to identify content origin

## Setup Instructions

### 1. Database Setup

Run the following scripts in order:

```bash
# Setup district admin tables and base permissions
node setup-district-admin-system.js

# Setup enhanced permissions with permanent/temporary types
node setup-enhanced-permissions.js
```

### 2. Permission Types

The system distinguishes between two types of permissions:

- **Permanent permissions**: Never expire, used for member management tasks
- **Time-based permissions**: Can be set to expire, used for content management tasks

### 3. Content Tracking

Content items (news, events, products, gallery items, offices) are tracked by:

- District ID
- State ID
- Admin who added the content
- Timestamp

## Superadmin Workflow

1. Login as superadmin
2. Navigate to Members > District Admins to appoint district admins
3. Navigate to Permissions > Assign to grant specific permissions to district admins
4. Member management permissions will be permanent
5. Content management permissions can be set with expiration dates

## District Admin Workflow

1. Login as district admin
2. Access only permitted sections based on assigned permissions
3. Member management features are always available (if permission granted)
4. Content management features are available based on time-based permissions
5. All content added by district admins is automatically tagged with district information

## API Usage

### Tracking Content Origin

```typescript
import { trackContentOrigin } from '@/lib/content-tracking';

// When creating new content
await trackContentOrigin(
  'news',           // Content type: 'news', 'event', 'product', 'gallery', 'office'
  newsItemId,       // Content ID
  districtId,       // District ID
  stateId,          // State ID
  districtAdminId   // Admin ID who created the content
);
```

### Enriching Content with District Info

```typescript
import { enrichContentWithDistrictInfo } from '@/lib/content-tracking';

// After fetching content items
const newsItems = await executeQuery('SELECT * FROM news');
const enrichedNews = await enrichContentWithDistrictInfo(newsItems, 'news');

// enrichedNews now contains district_id, state_id, added_by_name, added_at
```

### Filtering Content by District

```typescript
import { getContentByDistrict } from '@/lib/content-tracking';

// Get all news from a specific district
const districtNews = await getContentByDistrict('news', districtId, stateId);
```

## Frontend Components

### District Filter

Use the `DistrictFilter` component to allow users to filter content by district:

```tsx
import DistrictFilter from '@/components/Home/DistrictFilter';

export default function NewsPage() {
  const [district, setDistrict] = useState(null);
  const [state, setState] = useState(null);
  
  const handleFilterChange = (districtId, stateId) => {
    setDistrict(districtId);
    setState(stateId);
    // Fetch filtered content
  };
  
  return (
    <div>
      <DistrictFilter onFilterChange={handleFilterChange} />
      {/* Content list */}
    </div>
  );
}
```

### Content Cards with District Info

Use the `NewsCard` component to display content with district information:

```tsx
import NewsCard from '@/components/Home/NewsCard';

// In your component
return (
  <div className="grid grid-cols-3 gap-4">
    {newsItems.map(item => (
      <NewsCard
        key={item.id}
        {...item}
        showDistrictInfo={true}
      />
    ))}
  </div>
);
```

## Maintenance

- Regular database maintenance is recommended to clean up expired permissions
- Monitor the content_origin table growth as it will contain an entry for each content item
