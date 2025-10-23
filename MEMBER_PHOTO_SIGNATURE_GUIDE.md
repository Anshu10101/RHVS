# Member Photo and Signature Guidelines

This document outlines the requirements and implementation details for member profile photos and signatures in the RHVS system.

## File Size Requirements

### Profile Photos
- **Maximum Size**: 500KB
- **Recommended Format**: Passport size photo on white background
- **Supported Formats**: JPG, PNG, WebP

### Signatures
- **Maximum Size**: 100KB
- **Recommended Format**: Clear signature on white background
- **Supported Formats**: JPG, PNG, WebP

## Implementation Details

### Database Changes
The following database changes have been implemented:

1. Added `signature_path` column to `members` table
2. Added `signature_path` column to `registration_tokens` table
3. Updated activity logs to track signature uploads

### API Endpoints

#### Signature Upload Endpoint
- **Path**: `/api/upload/signature`
- **Method**: POST
- **Body**: FormData with `file` field
- **Response**: JSON with `success`, `url`, and `message` fields
- **Validation**: Enforces 100KB size limit and image file type

### User Interface

#### Member Registration Form
- Added signature upload component with preview
- Added file size validation (500KB for photos, 100KB for signatures)
- Updated UI to show clear instructions about size limits
- Both profile photo and signature are required fields

#### Admin Member Add Form
- Added signature upload component with preview
- Added file size validation (500KB for photos, 100KB for signatures)
- Updated UI to show clear instructions about size limits
- Both profile photo and signature are required fields

## SQL Scripts

The following SQL scripts should be executed to update the database schema:

```sql
-- Add signature field to members table
ALTER TABLE members ADD COLUMN signature_path VARCHAR(500) AFTER profile_photo_path;

-- Create index for faster lookups
CREATE INDEX idx_signature_path ON members(signature_path);

-- Update activity logs to track signature uploads
ALTER TABLE activity_logs MODIFY COLUMN action ENUM(
  'login', 'logout', 'password_change', 'member_verification', 
  'member_added', 'member_updated', 'member_deleted', 
  'profile_photo_upload', 'signature_upload', 'member_added_direct'
) NOT NULL;

-- Add signature_path column to registration_tokens table
ALTER TABLE registration_tokens ADD COLUMN signature_path VARCHAR(500) AFTER profile_photo_path;

-- Update the registration_tokens table to handle signature uploads
CREATE INDEX idx_registration_tokens_signature ON registration_tokens(signature_path);
```

## Validation Rules

1. **Profile Photo**:
   - Required field
   - Maximum size: 500KB
   - Must be an image file (JPG, PNG, WebP)

2. **Signature**:
   - Required field
   - Maximum size: 100KB
   - Must be an image file (JPG, PNG, WebP)

## Error Messages

- "Profile photo must be less than 500KB"
- "Signature image must be less than 100KB"
- "Please select an image file"
- "Profile photo is required for registration"
- "Signature image is required for registration"

## Future Enhancements

- Add image compression for oversized uploads
- Add image cropping tools for better photo and signature formatting
- Implement signature pad for direct digital signatures
- Add OCR verification for Aadhar card number from uploaded ID
