import nodemailer from 'nodemailer';

// Email configuration (Hostinger-friendly)
const resolvedPort = parseInt(process.env.EMAIL_PORT || '587');
const resolvedSecure = resolvedPort === 465; // SSL on 465, STARTTLS on 587

const emailConfig = {
  host: process.env.EMAIL_HOST || 'smtp.hostinger.com',
  port: resolvedPort,
  secure: resolvedSecure,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  // For 587 ensure STARTTLS; for some hosts, verify may fail with strict certs
  requireTLS: !resolvedSecure,
  tls: resolvedSecure ? undefined : { rejectUnauthorized: false },
};

// Create transporter
const transporter = nodemailer.createTransport(emailConfig);

// Generate 6-digit OTP
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP email for member registration
export async function sendOTPEmail(to: string, otp: string, memberName: string) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: to,
      subject: 'RHVS Member Registration - OTP Verification',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #f97316, #ea580c); border-radius: 10px;">
          <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #ea580c; font-size: 28px; margin: 0;">राष्ट्रीय हिंदू वाहिनी संगठन</h1>
              <p style="color: #666; margin: 10px 0 0 0;">Member Registration Verification</p>
            </div>
            
            <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #f59e0b;">
              <h2 style="color: #92400e; margin: 0 0 10px 0;">OTP Verification Required</h2>
              <p style="color: #92400e; margin: 0;">Hello ${memberName},</p>
              <p style="color: #92400e; margin: 10px 0 0 0;">A new member registration requires your verification. Please use the OTP below to verify this registration:</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <div style="background: #ea580c; color: white; font-size: 32px; font-weight: bold; padding: 20px; border-radius: 8px; letter-spacing: 5px; display: inline-block; font-family: monospace;">
                ${otp}
              </div>
              <p style="color: #666; margin: 10px 0 0 0; font-size: 14px;">This OTP will expire in 10 minutes</p>
            </div>
            
            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin-top: 20px;">
              <p style="color: #374151; margin: 0; font-size: 14px;">
                <strong>Important:</strong> If you did not request this verification, please ignore this email. 
                Do not share this OTP with anyone.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 12px; margin: 0;">
                © 2024 राष्ट्रीय हिंदू वाहिनी संगठन. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ OTP email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Failed to send OTP email:', error);
    return { success: false, error: error };
  }
}

// Test email configuration
export async function testEmailConfig() {
  try {
    await transporter.verify();
    console.log('✅ Email configuration is valid');
    return true;
  } catch (error) {
    console.error('❌ Email configuration failed:', error);
    return false;
  }
}

// Send OTP email for admin verification
export async function sendAdminOTPEmail(to: string, otp: string, adminName: string) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: to,
      subject: 'RHVS District Admin - Account Verification',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #3b82f6, #1d4ed8); border-radius: 10px;">
          <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1d4ed8; font-size: 28px; margin: 0;">राष्ट्रीय हिंदू वाहिनी संगठन</h1>
              <p style="color: #666; margin: 10px 0 0 0;">District Admin Account Verification</p>
            </div>
            
            <div style="background: #dbeafe; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #3b82f6;">
              <h2 style="color: #1e40af; margin: 0 0 10px 0;">Admin Account Verification</h2>
              <p style="color: #1e40af; margin: 0;">Hello ${adminName},</p>
              <p style="color: #1e40af; margin: 10px 0 0 0;">You have been invited to become a district admin for RHVS. Please use the OTP below to verify your account:</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <div style="background: #1d4ed8; color: white; font-size: 32px; font-weight: bold; padding: 20px; border-radius: 8px; letter-spacing: 5px; display: inline-block; font-family: monospace;">
                ${otp}
              </div>
              <p style="color: #666; margin: 10px 0 0 0; font-size: 14px;">This OTP will expire in 24 hours</p>
            </div>
            
            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin-top: 20px;">
              <p style="color: #374151; margin: 0; font-size: 14px;">
                <strong>Next Steps:</strong> After verifying with this OTP, you'll be able to set your password and access the admin dashboard.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 12px; margin: 0;">
                © 2025 राष्ट्रीय हिंदू वाहिनी संगठन. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Admin OTP email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Failed to send admin OTP email:', error);
    return { success: false, error: error };
  }
}

export default transporter;

// Send welcome email to new member
export async function sendWelcomeEmail(to: string, memberName: string, memberRegNumber: string) {
  try {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin:0 auto; padding:24px; background:#fff7ed;">
        <div style="background:linear-gradient(135deg,#f97316,#ea580c); padding:20px; border-radius:12px 12px 0 0; color:#fff; text-align:center;">
          <h1 style="margin:0; font-size:22px;">राष्ट्रीय हिंदू वाहिनी संगठन</h1>
          <p style="margin:6px 0 0 0; font-size:14px; opacity:.95;">Welcome to RHVS</p>
        </div>
        <div style="background:#ffffff; border:1px solid #fed7aa; border-top:none; padding:24px; border-radius:0 0 12px 12px;">
          <p style="font-size:16px; color:#7c2d12;">Dear ${memberName},</p>
          <p style="color:#7c2d12; line-height:1.6;">Your membership has been registered successfully.</p>
          <div style="background:#fff1e6; padding:16px; border-radius:10px; border:1px solid #fecba1; margin:16px 0;">
            <p style="margin:0; color:#9a3412;">
              <strong>Member Registration Number:</strong>
              <span style="font-family:monospace; font-size:18px; margin-left:8px;">${memberRegNumber}</span>
            </p>
          </div>
          <p style="color:#7c2d12;">Keep this number safe for future reference.</p>
          <p style="margin-top:24px; color:#9a3412; font-size:12px;">This is an automated message from RHVS.</p>
        </div>
      </div>
    `;

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject: `Welcome to RHVS - ${memberRegNumber}`,
      html,
    });
    console.log('✅ Welcome email sent:', info.messageId);
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to send welcome email:', error);
    return { success: false, error };
  }
}
