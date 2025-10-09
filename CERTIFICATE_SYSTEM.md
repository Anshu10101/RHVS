# Certificate Generation System

## Overview
This system automatically generates appointment certificates for department members when they are assigned to posts. It also provides manual certificate generation capabilities.

## Features

### 1. Automatic Certificate Generation
- Certificates are automatically generated when members are assigned to department posts
- Includes member photo, department details, post information, and level (national/state/district)
- Certificates are stored in `/public/certificates/` directory

### 2. Manual Certificate Generation
- Admin can manually generate certificates for any member
- Select member, department, post, and assignment level
- Choose appointment date
- Download certificates immediately

### 3. Certificate Management
- View all generated certificates
- Filter by department, level, status
- Download certificates
- Track certificate status (generated/downloaded)

## Database Schema

### Tables Created:
1. **certificates** - Stores certificate information
2. **certificate_templates** - Stores certificate templates
3. **certificate_generation_logs** - Tracks certificate generation history

## API Endpoints

### Certificate Generation
- `POST /api/certificates/generate` - Generate new certificate
- `GET /api/certificates` - List all certificates
- `GET /api/certificates/[id]/download` - Download certificate

### Test Endpoint
- `GET /api/test-certificate` - Generate test certificate

## Certificate Design

The certificate follows the design from the provided image:
- Red header with organization name and slogans
- White main body with appointment details
- Member photo (if available)
- Motivational text
- Four signature blocks
- Red footer with office addresses
- Yellow border

## Usage

### For Admins:
1. Go to `/admin/certificates`
2. Click "Generate Certificate" for manual generation
3. Select member, department, post, and level
4. Download the generated certificate

### Automatic Generation:
- When assigning members to department posts via `/admin/departments/assign`
- Certificates are generated automatically
- No additional action required

## File Structure
```
src/
├── app/
│   ├── api/
│   │   ├── certificates/
│   │   │   ├── generate/route.ts
│   │   │   └── [id]/download/route.ts
│   │   └── test-certificate/route.ts
│   └── admin/
│       └── certificates/page.tsx
├── lib/
│   └── certificate-generator.ts
└── public/
    └── certificates/ (generated certificates)
```

## Dependencies
- `canvas` - For certificate generation
- `fs` - For file operations
- `path` - For file path handling

## Setup Instructions

1. Run the database schema:
   ```sql
   -- Run database/certificates-schema.sql
   ```

2. Install dependencies:
   ```bash
   npm install canvas
   ```

3. The system is ready to use!

## Notes
- Certificates are generated as PNG files
- Member photos are automatically included if available
- Certificate numbers are auto-generated with format: `CERT-{timestamp}-{random}`
- All certificates are stored in `/public/certificates/` directory
