# Email Setup Guide for Certificate System

## Overview
The certificate system automatically sends appointment certificates to members via email with beautiful Hindi and English messages.

## Email Configuration

### 1. Environment Variables
Add these variables to your `.env.local` file:

```bash
# SMTP Configuration (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Alternative email configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Base URL for the application
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 2. Gmail Setup (Recommended)

#### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account settings
2. Enable 2-Factor Authentication

#### Step 2: Generate App Password
1. Go to Google Account → Security
2. Click "App passwords"
3. Generate a new app password for "Mail"
4. Use this password in `SMTP_PASS` and `EMAIL_PASS`

#### Step 3: Configure Environment Variables
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-16-character-app-password
```

### 3. Other Email Providers

#### Outlook/Hotmail
```bash
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

#### Yahoo
```bash
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_USER=your-email@yahoo.com
SMTP_PASS=your-app-password
```

## Email Features

### 1. Automatic Email Sending
- Certificates are automatically sent when members are assigned to department posts
- Emails include the certificate as an attachment
- Beautiful HTML email with Hindi and English content

### 2. Email Content
- **Subject**: "🎉 Appointment Certificate - [Member Name] | राष्ट्रीय हिन्दू वाहिनी संगठन"
- **Language**: Both Hindi and English
- **Design**: Professional with organization branding
- **Attachment**: PNG certificate file
- **Content**: 
  - Congratulatory message
  - Appointment details
  - Inspirational quotes
  - Organization information

### 3. Email Tracking
- Email status tracking (pending, sent, failed)
- Email sending logs
- Retry mechanism for failed emails

## Testing Email System

### 1. Test Email API
Use the test endpoint to verify email configuration:

```bash
POST /api/test-email
{
  "email": "test@example.com"
}
```

### 2. Manual Testing
1. Go to `/admin/certificates`
2. Generate a certificate manually
3. Check if email is sent to the member

## Email Templates

### Hindi Message
```
🎉 हार्दिक बधाई! 🎉

प्रिय [Member Name] जी,

आपको राष्ट्रीय हिन्दू वाहिनी संगठन में [Department] के [Post] पद पर [Level] नियुक्त किया गया है।

"जब तक सूरज चाँद रहेगा, तब तक हिन्दू धर्म रहेगा।"
- स्वामी विवेकानंद

आपकी यह नियुक्ति संगठन के लिए गर्व की बात है। हम आशा करते हैं कि आप अपने पद की जिम्मेदारियों का निर्वहन पूरी निष्ठा और ईमानदारी से करेंगे।
```

### English Message
```
🎉 Heartfelt Congratulations! 🎉

Dear [Member Name],

We are delighted to inform you that you have been appointed as [Post] in the [Department] department of Rashtriya Hindu Vahini Sangathan at [Level].

"As long as the sun and moon exist, Hindu Dharma will exist."
- Swami Vivekananda

This appointment is a matter of pride for our organization. We expect you to fulfill your responsibilities with complete dedication and honesty in the interest of the organization, the nation, and the protection of Sanatan Dharma.
```

## Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Check if 2FA is enabled
   - Use app password instead of regular password
   - Verify email credentials

2. **Connection Timeout**
   - Check SMTP host and port
   - Verify firewall settings
   - Try different SMTP server

3. **Email Not Sent**
   - Check email logs in certificate generation logs
   - Verify member's email address
   - Check spam folder

### Debug Mode
Enable debug logging by checking the console logs when generating certificates.

## Security Notes

1. **Never commit email passwords to version control**
2. **Use environment variables for sensitive data**
3. **Use app passwords instead of main passwords**
4. **Regularly rotate email credentials**

## Support

If you encounter issues with email setup:
1. Check the certificate generation logs
2. Test with the test email API
3. Verify SMTP configuration
4. Check member email addresses are valid
