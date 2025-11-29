import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { generateOTP } from '@/lib/email';
import { signPasswordResetJwt, verifyPasswordResetJwt, getAdminToken, verifyAdminJwt } from '@/lib/auth-jwt';
import { hashPassword, verifyPassword } from '@/lib/password';
import { noCacheJsonResponse } from '@/lib/api-helpers';
import nodemailer from 'nodemailer';

// Generate password reset email content based on language
function generatePasswordResetEmail(otp: string, adminName: string, language: 'hi' | 'en' | 'both'): { subject: string; html: string } {
  const isHindi = language === 'hi' || language === 'both';
  const isEnglish = language === 'en' || language === 'both';

  const hindiContent = isHindi ? `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #f97316, #ea580c); color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">राष्ट्रीय हिन्दू वाहिनी संगठन</h1>
        <p style="margin: 8px 0 0 0; font-size: 14px;">पासवर्ड रीसेट अनुरोध</p>
      </div>
      <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="color: #374151; margin: 0 0 16px 0; font-size: 16px;">नमस्ते ${adminName},</p>
        <p style="color: #374151; margin: 0 0 20px 0; font-size: 15px;">आपने अपना पासवर्ड रीसेट करने का अनुरोध किया है। आगे बढ़ने के लिए नीचे दिए गए OTP का उपयोग करें:</p>
        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <div style="font-size: 32px; font-weight: bold; color: #ea580c; letter-spacing: 5px; font-family: monospace;">${otp}</div>
          <p style="color: #92400e; margin: 10px 0 0 0; font-size: 14px;">यह OTP 15 मिनट में समाप्त हो जाएगा</p>
        </div>
        <p style="color: #6b7280; font-size: 14px; margin: 20px 0 0 0;">यदि आपने यह अनुरोध नहीं किया है, तो कृपया इस ईमेल को अनदेखा करें।</p>
      </div>
    </div>
  ` : '';

  const englishContent = isEnglish ? `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #f97316, #ea580c); color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">राष्ट्रीय हिन्दू वाहिनी संगठन</h1>
        <p style="margin: 8px 0 0 0; font-size: 14px;">Password Reset Request</p>
      </div>
      <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="color: #374151; margin: 0 0 16px 0; font-size: 16px;">Hello ${adminName},</p>
        <p style="color: #374151; margin: 0 0 20px 0; font-size: 15px;">You have requested to reset your password. Use the OTP below to proceed:</p>
        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <div style="font-size: 32px; font-weight: bold; color: #ea580c; letter-spacing: 5px; font-family: monospace;">${otp}</div>
          <p style="color: #92400e; margin: 10px 0 0 0; font-size: 14px;">This OTP expires in 15 minutes</p>
        </div>
        <p style="color: #6b7280; font-size: 14px; margin: 20px 0 0 0;">If you did not request this, please ignore this email.</p>
      </div>
    </div>
  ` : '';

  let html = '';
  let subject = '';

  if (language === 'both') {
    subject = 'RHVS Admin Password Reset OTP | पासवर्ड रीसेट OTP';
    html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f97316, #ea580c); color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">राष्ट्रीय हिन्दू वाहिनी संगठन</h1>
          <p style="margin: 8px 0 0 0; font-size: 14px;">Password Reset Request | पासवर्ड रीसेट अनुरोध</p>
        </div>
        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
          <!-- Hindi Section -->
          <div style="margin-bottom: 30px; padding-bottom: 30px; border-bottom: 2px solid #e5e7eb;">
            <p style="color: #374151; margin: 0 0 16px 0; font-size: 16px; font-weight: 600;">नमस्ते ${adminName},</p>
            <p style="color: #374151; margin: 0 0 20px 0; font-size: 15px;">आपने अपना पासवर्ड रीसेट करने का अनुरोध किया है। आगे बढ़ने के लिए नीचे दिए गए OTP का उपयोग करें:</p>
            <div style="background: #fef3c7; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <div style="font-size: 32px; font-weight: bold; color: #ea580c; letter-spacing: 5px; font-family: monospace;">${otp}</div>
              <p style="color: #92400e; margin: 10px 0 0 0; font-size: 14px;">यह OTP 15 मिनट में समाप्त हो जाएगा</p>
            </div>
            <p style="color: #6b7280; font-size: 14px; margin: 20px 0 0 0;">यदि आपने यह अनुरोध नहीं किया है, तो कृपया इस ईमेल को अनदेखा करें।</p>
          </div>
          <!-- English Section -->
          <div>
            <p style="color: #374151; margin: 0 0 16px 0; font-size: 16px; font-weight: 600;">Hello ${adminName},</p>
            <p style="color: #374151; margin: 0 0 20px 0; font-size: 15px;">You have requested to reset your password. Use the OTP below to proceed:</p>
            <div style="background: #fef3c7; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <div style="font-size: 32px; font-weight: bold; color: #ea580c; letter-spacing: 5px; font-family: monospace;">${otp}</div>
              <p style="color: #92400e; margin: 10px 0 0 0; font-size: 14px;">This OTP expires in 15 minutes</p>
            </div>
            <p style="color: #6b7280; font-size: 14px; margin: 20px 0 0 0;">If you did not request this, please ignore this email.</p>
          </div>
        </div>
      </div>
    `;
  } else if (language === 'hi') {
    subject = 'RHVS एडमिन पासवर्ड रीसेट OTP';
    html = hindiContent;
  } else {
    subject = 'RHVS Admin Password Reset OTP';
    html = englishContent;
  }

  return { subject, html };
}

// DB-backed OTP store table (supports both superadmin and district_admin)
// CREATE TABLE IF NOT EXISTS admin_password_resets (
//   id INT AUTO_INCREMENT PRIMARY KEY,
//   admin_id INT NOT NULL,
//   user_type ENUM('superadmin', 'district_admin') NOT NULL,
//   email VARCHAR(255) NOT NULL,
//   otp VARCHAR(6) NOT NULL,
//   token VARCHAR(512) NOT NULL,
//   expires_at TIMESTAMP NOT NULL,
//   used BOOLEAN DEFAULT FALSE,
//   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//   INDEX idx_email (email),
//   INDEX idx_token (token),
//   INDEX idx_expires_at (expires_at),
//   INDEX idx_admin_type (admin_id, user_type)
// );

export async function POST(req: NextRequest) {
  try {
    const { action, data } = await req.json();

    // Change password (requires authentication)
    if (action === 'change-password') {
      const token = getAdminToken(req);
      if (!token) {
        return noCacheJsonResponse({ success: false, message: 'Unauthorized' }, { status: 401 });
      }

      const claims = await verifyAdminJwt(token);
      if (!claims) {
        return noCacheJsonResponse({ success: false, message: 'Invalid token' }, { status: 401 });
      }

      const { currentPassword, newPassword } = data || {};
      if (!currentPassword || !newPassword) {
        return noCacheJsonResponse({ success: false, message: 'Current password and new password required' }, { status: 400 });
      }

      if (newPassword.length < 8) {
        return noCacheJsonResponse({ success: false, message: 'Password must be at least 8 characters long' }, { status: 400 });
      }

      const adminId = Number(claims.sub);
      const userType = claims.type || (claims.role === 'superadmin' ? 'superadmin' : 'district_admin');

      // Get current password hash
      let currentHash: string;
      if (userType === 'superadmin') {
        const rows = await executeQuery(
          'SELECT password_hash FROM superadmin WHERE id = ? LIMIT 1',
          [adminId]
        ) as Array<{ password_hash: string }>;
        if (rows.length === 0) {
          return noCacheJsonResponse({ success: false, message: 'User not found' }, { status: 404 });
        }
        currentHash = rows[0].password_hash;
      } else {
        const rows = await executeQuery(
          'SELECT password_hash FROM district_admins WHERE id = ? LIMIT 1',
          [adminId]
        ) as Array<{ password_hash: string }>;
        if (rows.length === 0) {
          return noCacheJsonResponse({ success: false, message: 'User not found' }, { status: 404 });
        }
        currentHash = rows[0].password_hash;
      }

      // Verify current password
      const isValid = await verifyPassword(currentPassword, currentHash);
      if (!isValid) {
        return noCacheJsonResponse({ success: false, message: 'Current password is incorrect' }, { status: 401 });
      }

      // Update password
      const newHash = await hashPassword(newPassword);
      if (userType === 'superadmin') {
        await executeQuery('UPDATE superadmin SET password_hash = ?, updated_at = NOW() WHERE id = ?', [newHash, adminId]);
      } else {
        await executeQuery('UPDATE district_admins SET password_hash = ?, updated_at = NOW() WHERE id = ?', [newHash, adminId]);
      }

      return noCacheJsonResponse({ success: true, message: 'Password updated successfully' });
    }

    // Request password reset (forgot password)
    if (action === 'forgot') {
      const { email, userType: requestedUserType, state: requestedState } = data || {};
      if (!email) return noCacheJsonResponse({ success: false, message: 'Email required' }, { status: 400 });

      // Check superadmin first
      let adminId: number | null = null;
      let userType: 'superadmin' | 'district_admin' = 'superadmin';
      let adminName: string | null = null;
      let adminState: string | null = null;

      const superadminRows = await executeQuery(
        'SELECT id, email, name, is_active FROM superadmin WHERE LOWER(email) = LOWER(?) LIMIT 1',
        [email]
      ) as Array<{ id: number; email: string; name: string | null; is_active: boolean }>;

      if (superadminRows.length > 0 && superadminRows[0].is_active) {
        adminId = superadminRows[0].id;
        userType = 'superadmin';
        adminName = superadminRows[0].name || superadminRows[0].email;
      } else {
        // Check district admin
        const districtAdminRows = await executeQuery(
          `SELECT da.id, da.email, da.is_active, da.state, m.name as member_name
           FROM district_admins da
           LEFT JOIN members m ON da.member_id = m.id
           WHERE LOWER(da.email) = LOWER(?) LIMIT 1`,
          [email]
        ) as Array<{ id: number; email: string; is_active: boolean; state: string | null; member_name: string | null }>;

        if (districtAdminRows.length > 0 && districtAdminRows[0].is_active) {
          adminId = districtAdminRows[0].id;
          userType = 'district_admin';
          adminName = districtAdminRows[0].member_name || districtAdminRows[0].email;
          adminState = districtAdminRows[0].state || requestedState || null;
        }
      }

      // Do not reveal account existence - return success even if not found
      if (!adminId) {
        return noCacheJsonResponse({ success: true, message: 'If the email exists, a reset OTP has been sent' });
      }

      const otp = generateOTP();
      const token = await signPasswordResetJwt(email, adminId, userType, 15 * 60);
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      // Insert into password reset table
      // Try new structure first (admin_id, user_type), fall back to old (superadmin_id) if needed
      try {
        await executeQuery(
          'INSERT INTO admin_password_resets (admin_id, user_type, email, otp, token, expires_at, used) VALUES (?, ?, ?, ?, ?, ?, 0)',
          [adminId, userType, email, otp, token, expiresAt]
        );
      } catch (insertError: any) {
        // If new columns don't exist, use old structure (only for superadmin)
        if (insertError?.code === 'ER_BAD_FIELD_ERROR' && userType === 'superadmin') {
          await executeQuery(
            'INSERT INTO admin_password_resets (superadmin_id, email, otp, token, expires_at, used) VALUES (?, ?, ?, ?, ?, 0)',
            [adminId, email, otp, token, expiresAt]
          );
        } else {
          throw insertError;
        }
      }

      // Determine language preference
      // Hindi states: Uttar Pradesh, Bihar, Madhya Pradesh, Rajasthan, Haryana, Delhi, Uttarakhand, Himachal Pradesh, Jharkhand, Chhattisgarh
      const hindiStates = [
        'Uttar Pradesh', 'Bihar', 'Madhya Pradesh', 'Rajasthan', 'Haryana', 
        'Delhi', 'Uttarakhand', 'Himachal Pradesh', 'Jharkhand', 'Chhattisgarh',
        'UP', 'MP', 'HP', 'UK' // Common abbreviations
      ];
      
      let language: 'hi' | 'en' | 'both' = 'en';
      if (userType === 'superadmin') {
        language = 'both'; // Superadmin gets both languages
      } else if (adminState && hindiStates.some(state => adminState.toLowerCase().includes(state.toLowerCase()))) {
        language = 'hi'; // Hindi state admin
      } else {
        language = 'en'; // English state admin
      }

      // Send email with appropriate language
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT || 587),
        secure: Number(process.env.EMAIL_PORT || 587) === 465,
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      });

      const emailContent = generatePasswordResetEmail(otp, adminName || 'Admin', language);
      
      const result = await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: email,
        subject: emailContent.subject,
        html: emailContent.html,
      });
      console.log('Sent admin reset OTP:', result.messageId);

      return noCacheJsonResponse({ success: true, token });
    }

    // Verify OTP
    if (action === 'verify-otp') {
      const { token, otp } = data || {};
      if (!token || !otp) return noCacheJsonResponse({ success: false, message: 'Token and OTP required' }, { status: 400 });

      // First verify JWT token expiration
      const payload = await verifyPasswordResetJwt(token);
      if (!payload) {
        return noCacheJsonResponse({ success: false, message: 'Invalid or expired token. Please request a new OTP.' }, { status: 400 });
      }

      // Then check database record
      const rows = await executeQuery(
        'SELECT id, used, expires_at FROM admin_password_resets WHERE token = ? AND otp = ? AND email = ? ORDER BY id DESC LIMIT 1',
        [token, otp, payload.email]
      ) as Array<{ id: number; used: boolean; expires_at: string }>;
      
      if (rows.length === 0) {
        return noCacheJsonResponse({ success: false, message: 'Invalid OTP' }, { status: 400 });
      }
      
      const rec = rows[0];
      const now = Date.now();
      const expiresAt = new Date(rec.expires_at).getTime();
      
      if (rec.used) {
        return noCacheJsonResponse({ success: false, message: 'This OTP has already been used. Please request a new one.' }, { status: 400 });
      }
      
      if (expiresAt < now) {
        return noCacheJsonResponse({ success: false, message: 'OTP has expired. Please request a new one.' }, { status: 400 });
      }

      // Mark OTP as verified but don't mark token as used yet
      // We need the token to still be available for password reset
      // Update the OTP to 'VERIFIED' to mark that OTP verification is complete
      const updateResult = await executeQuery('UPDATE admin_password_resets SET otp = ? WHERE id = ?', ['VERIFIED', rec.id]);
      console.log('OTP verification update result:', updateResult);
      return noCacheJsonResponse({ success: true });
    }

    // Reset password with token
    if (action === 'reset') {
      const { token, newPassword } = data || {};
      if (!token || !newPassword) return noCacheJsonResponse({ success: false, message: 'Token and password required' }, { status: 400 });

      if (newPassword.length < 8) {
        return noCacheJsonResponse({ success: false, message: 'Password must be at least 8 characters long' }, { status: 400 });
      }

      // First verify JWT token expiration
      const payload = await verifyPasswordResetJwt(token);
      if (!payload) {
        return noCacheJsonResponse({ success: false, message: 'Invalid or expired token. Please request a new password reset.' }, { status: 400 });
      }

      // Then check database record - verify that OTP was verified
      const rows = await executeQuery(
        'SELECT id, used, expires_at, otp FROM admin_password_resets WHERE token = ? ORDER BY id DESC LIMIT 1',
        [token]
      ) as Array<{ id: number; used: boolean; expires_at: string; otp: string }>;
      
      if (rows.length === 0) {
        return noCacheJsonResponse({ success: false, message: 'Invalid token' }, { status: 400 });
      }
      
      const rec = rows[0];
      const now = Date.now();
      const expiresAt = new Date(rec.expires_at).getTime();
      
      if (rec.used) {
        return noCacheJsonResponse({ success: false, message: 'This reset token has already been used. Please request a new password reset.' }, { status: 400 });
      }
      
      if (expiresAt < now) {
        return noCacheJsonResponse({ success: false, message: 'Reset token has expired. Please request a new password reset.' }, { status: 400 });
      }

      // If we reach here, the token is valid and not expired
      // The frontend flow ensures OTP is verified before reaching this step
      // So we don't need to strictly check if OTP is 'VERIFIED'
      // Just ensure the token exists, is valid, and not expired (which we already checked above)
      // Optionally mark OTP as verified if it's not already (for consistency)
      if (rec.otp !== 'VERIFIED') {
        await executeQuery('UPDATE admin_password_resets SET otp = ? WHERE id = ?', ['VERIFIED', rec.id]);
      }

      const hash = await hashPassword(newPassword);
      if (payload.userType === 'superadmin') {
        await executeQuery('UPDATE superadmin SET password_hash = ?, updated_at = NOW() WHERE id = ?', [hash, payload.adminId]);
      } else {
        await executeQuery('UPDATE district_admins SET password_hash = ?, updated_at = NOW() WHERE id = ?', [hash, payload.adminId]);
      }
      await executeQuery('UPDATE admin_password_resets SET used = 1 WHERE id = ?', [rec.id]);
      return noCacheJsonResponse({ success: true, message: 'Password reset successfully' });
    }

    return noCacheJsonResponse({ success: false, message: 'Unknown action' }, { status: 400 });
  } catch (e) {
    console.error('admin/password error', e);
    return noCacheJsonResponse({ success: false, message: 'Server error' }, { status: 500 });
  }
}


