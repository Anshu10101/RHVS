import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { generateOTP } from '@/lib/email';
import { signPasswordResetJwt, verifyPasswordResetJwt } from '@/lib/auth-jwt';
import { hashPassword } from '@/lib/password';
import nodemailer from 'nodemailer';

// Optional: DB-backed OTP store table
// CREATE TABLE IF NOT EXISTS admin_password_resets (
//   id INT AUTO_INCREMENT PRIMARY KEY,
//   superadmin_id INT NOT NULL,
//   email VARCHAR(255) NOT NULL,
//   otp VARCHAR(6) NOT NULL,
//   token VARCHAR(512) NOT NULL,
//   expires_at TIMESTAMP NOT NULL,
//   used BOOLEAN DEFAULT FALSE,
//   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//   INDEX idx_email (email),
//   INDEX idx_token (token),
//   INDEX idx_expires_at (expires_at)
// );

export async function POST(req: NextRequest) {
  try {
    const { action, data } = await req.json();

    if (action === 'forgot') {
      const { email } = data || {};
      if (!email) return NextResponse.json({ success: false, message: 'Email required' }, { status: 400 });

      const rows = await executeQuery('SELECT id, email, is_active FROM superadmin WHERE email = ? LIMIT 1', [email]) as Array<{ id: number; email: string; is_active: boolean }>;
      if (rows.length === 0 || !rows[0].is_active) {
        // Do not reveal account existence
        return NextResponse.json({ success: true });
      }

      const superadmin = rows[0];
      const otp = generateOTP();
      const token = await signPasswordResetJwt(email, superadmin.id, 15 * 60);
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      await executeQuery(
        'INSERT INTO admin_password_resets (superadmin_id, email, otp, token, expires_at, used) VALUES (?, ?, ?, ?, ?, 0)',
        [superadmin.id, email, otp, token, expiresAt]
      );

      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT || 587),
        secure: Number(process.env.EMAIL_PORT || 587) === 465,
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      });

      const result = await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: email,
        subject: 'RHVS Admin Password Reset OTP',
        html: `<p>Your OTP is <b>${otp}</b> and expires in 15 minutes.</p>`,
      });
      console.log('Sent admin reset OTP:', result.messageId);

      return NextResponse.json({ success: true, token });
    }

    if (action === 'verify-otp') {
      const { token, otp } = data || {};
      if (!token || !otp) return NextResponse.json({ success: false, message: 'Token and OTP required' }, { status: 400 });

      const payload = await verifyPasswordResetJwt(token);
      if (!payload) return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 400 });

      const rows = await executeQuery(
        'SELECT id, used, expires_at FROM admin_password_resets WHERE token = ? AND otp = ? AND email = ? ORDER BY id DESC LIMIT 1',
        [token, otp, payload.email]
      ) as Array<{ id: number; used: boolean; expires_at: string }>;
      if (rows.length === 0) return NextResponse.json({ success: false, message: 'Invalid OTP' }, { status: 400 });
      const rec = rows[0];
      if (rec.used || new Date(rec.expires_at).getTime() < Date.now()) {
        return NextResponse.json({ success: false, message: 'Expired OTP' }, { status: 400 });
      }

      await executeQuery('UPDATE admin_password_resets SET used = 1 WHERE id = ?', [rec.id]);
      return NextResponse.json({ success: true });
    }

    if (action === 'reset') {
      const { token, newPassword } = data || {};
      if (!token || !newPassword) return NextResponse.json({ success: false, message: 'Token and password required' }, { status: 400 });

      const payload = await verifyPasswordResetJwt(token);
      if (!payload) return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 400 });

      const rows = await executeQuery('SELECT id, used, expires_at FROM admin_password_resets WHERE token = ? ORDER BY id DESC LIMIT 1', [token]) as Array<{ id: number; used: boolean; expires_at: string }>;
      if (rows.length === 0) return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 400 });
      const rec = rows[0];
      if (rec.used || new Date(rec.expires_at).getTime() < Date.now()) {
        return NextResponse.json({ success: false, message: 'Expired token' }, { status: 400 });
      }

      const hash = await hashPassword(newPassword);
      await executeQuery('UPDATE superadmin SET password_hash = ?, updated_at = NOW() WHERE id = ?', [hash, payload.superadminId]);
      await executeQuery('UPDATE admin_password_resets SET used = 1 WHERE id = ?', [rec.id]);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, message: 'Unknown action' }, { status: 400 });
  } catch (e) {
    console.error('admin/password error', e);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}


