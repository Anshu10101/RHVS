# RHVS Portfolio - Database Setup Guide

## Prerequisites
- Hostinger MySQL database access
- Node.js and npm installed
- All required packages installed (`npm install`)

## Quick Setup

### 1. Environment Configuration
Create a `.env.local` file in your project root with your Hostinger MySQL credentials:

```env
# Database Configuration
DB_HOST=your_hostinger_mysql_host
DB_USER=your_hostinger_mysql_username
DB_PASSWORD=your_hostinger_mysql_password
DB_NAME=your_hostinger_mysql_database_name
DB_PORT=3306

# Email Configuration (for OTP sending)
EMAIL_HOST=smtp.hostinger.com
EMAIL_PORT=587
EMAIL_USER=your_email@yourdomain.com
EMAIL_PASS=your_email_password
EMAIL_FROM=your_email@yourdomain.com

# Application Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
```

### 2. Database Setup
Run the setup script to create all necessary tables:

```bash
node setup-database.js
```

### 3. Manual Database Setup (Alternative)
If the script doesn't work, manually run the SQL commands in `database-schema.sql` in your Hostinger MySQL database.

## Database Schema

### Tables Created:
- **members** - Stores member registration data
- **otp_verifications** - Stores OTP codes for verification
- **admin_users** - Admin user accounts
- **events** - Event management (for future use)

### Sample Admin User:
- Username: `admin`
- Password: `admin123`
- Email: `admin@rhvs.org`

## Features Implemented

### Member Registration Flow:
1. **Existing Member Verification**: New members need an existing member to verify their registration
2. **OTP System**: OTP sent to existing member's email for verification
3. **Form Validation**: Comprehensive client and server-side validation
4. **Profile Photo Upload**: Support for profile photo uploads
5. **Auto-generated Member Numbers**: Each member gets a unique registration number

### API Endpoints:
- `POST /api/register` with actions:
  - `send-otp` - Send OTP to existing member
  - `verify-otp` - Verify OTP code
  - `register-member` - Register new member

## Testing the Setup

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Visit `http://localhost:3000/members/register`

3. Test the registration flow:
   - Enter an existing member's registration number
   - Click "Send OTP"
   - Check the existing member's email for OTP
   - Enter OTP and fill the registration form
   - Submit the form

## Troubleshooting

### Common Issues:

1. **Database Connection Failed**
   - Check your Hostinger MySQL credentials
   - Ensure the database server is accessible
   - Verify the database name exists

2. **Email Not Sending**
   - Check your email credentials in `.env.local`
   - Verify SMTP settings with Hostinger
   - Check spam folder for OTP emails

3. **OTP Verification Fails**
   - Ensure OTP is entered within 10 minutes
   - Check if OTP was already used
   - Verify the existing member exists in database

### Getting Hostinger MySQL Credentials:

1. Log into your Hostinger control panel
2. Go to "Databases" section
3. Find your MySQL database
4. Note down:
   - Database host (usually something like `mysql.hostinger.com`)
   - Database name
   - Username
   - Password
   - Port (usually 3306)

## Security Notes

- Change the default admin password after setup
- Use strong passwords for database access
- Keep your `.env.local` file secure and never commit it to version control
- Consider using environment-specific configurations for production

## Support

If you encounter any issues:
1. Check the console logs for error messages
2. Verify all environment variables are set correctly
3. Test database connection independently
4. Check email configuration with a simple test
