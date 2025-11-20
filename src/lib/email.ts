import fs from 'fs';
import fsPromises from 'fs/promises';
import nodemailer from 'nodemailer';
import path from 'path';

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

const retainCertificateFiles = process.env.RETAIN_CERTIFICATE_FILES !== 'false';

async function cleanupAttachment(pathToFile: string | undefined) {
  if (
    retainCertificateFiles ||
    !pathToFile ||
    /^https?:\/\//i.test(pathToFile)
  ) {
    return;
  }
  try {
    await fsPromises.unlink(pathToFile);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.warn('Failed to cleanup attachment file:', error);
    }
  }
}

function resolveAttachmentPath(rawPath?: string | null): string | null {
  if (!rawPath) return null;
  const trimmed = rawPath.trim();
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (/^[a-zA-Z]:[\\/]/.test(trimmed)) {
    return path.normalize(trimmed);
  }

  if (trimmed.startsWith('/') || trimmed.startsWith('\\')) {
    const relativePart = trimmed.replace(/^[/\\]+/, '');
    return path.join(process.cwd(), 'public', relativePart);
  }

  if (path.isAbsolute(trimmed)) {
    return path.normalize(trimmed);
  }

  return path.join(process.cwd(), 'public', trimmed.replace(/^[/\\]+/, ''));
}

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

// Send token email for registration verification
export async function sendTokenEmail(
  to: string,
  token: string,
  memberName: string,
  type: 'otp' | 'registration' = 'otp',
  language: 'hi' | 'en' = 'hi'
) {
  try {
    const isRegistration = type === 'registration';
    const isHindi = language === 'hi';
    const currentYear = new Date().getFullYear();
    const validityDays = isRegistration ? 10 : 0;
    const tokenParts = isRegistration ? token.split('-') : [token];

    const subject = isRegistration 
      ? (isHindi
          ? 'आरएचवीएस पंजीकरण टोकन – 10 दिन में सत्यापन पूरा करें'
          : 'RHVS Registration Token – Complete verification within 10 days')
      : (isHindi
          ? 'आरएचवीएस सदस्यता ओटीपी सत्यापन'
          : 'RHVS Member Registration – OTP Verification');

    const greeting = isHindi ? `प्रिय ${memberName} जी,` : `Dear ${memberName},`;
    const introText = isRegistration
      ? isHindi
        ? 'आपका सदस्यता पंजीकरण टोकन तैयार है। कृपया 10 दिनों के भीतर संगठन कार्यालय जाकर सत्यापन प्रक्रिया पूरी करें।'
        : 'Your membership registration token is ready. Please visit the nearest RHVS office within 10 days to complete verification.'
      : isHindi
        ? 'नए सदस्य पंजीकरण को सत्यापित करने हेतु यह ओटीपी जारी किया गया है।'
        : 'A new membership registration needs your approval. Use the OTP below to verify it.';

    const expiryText = isRegistration
      ? (isHindi
          ? `यह टोकन ${validityDays} दिनों तक मान्य है (${validityDays}वें दिन के अंत तक)।`
          : `This token remains valid for ${validityDays} days (until the end of day ${validityDays}).`)
      : (isHindi
          ? 'यह ओटीपी 10 मिनट में समाप्त हो जाएगा।'
          : 'This OTP expires in 10 minutes.');

    const stepsBlock = isRegistration
      ? (isHindi
          ? `
            <ol style="margin:0; padding-left:20px; color:#1e1b4b; line-height:1.6; font-size:14px;">
              <li>इस ईमेल या टोकन को प्रिंट कर सुरक्षित रखें।</li>
              <li>मान्य पहचान पत्र और आवेदन दस्तावेज़ों के साथ RHVS कार्यालय पहुँचे।</li>
              <li>एडमिन सत्यापन के दौरान यह टोकन साझा करें और प्रक्रिया 10 दिनों के अंदर पूरी करें।</li>
            </ol>
          `
          : `
            <ol style="margin:0; padding-left:20px; color:#1e1b4b; line-height:1.6; font-size:14px;">
              <li>Print or save this email containing your token.</li>
              <li>Visit the nearest RHVS office with a valid ID and your application documents.</li>
              <li>Present this token during verification and complete the process within 10 days.</li>
            </ol>
          `)
      : '';

    const confidentialityNote = isHindi
      ? 'यदि आपने यह अनुरोध नहीं किया है तो इस ईमेल को अनदेखा करें। इस टोकन/ओटीपी को किसी के साथ साझा न करें।'
      : 'If you did not request this, please ignore the email. Do not share this token/OTP with anyone.';

    const footerText = isHindi
      ? 'यह RHVS द्वारा भेजा गया स्वचालित संदेश है; कृपया इसका प्रत्यक्ष उत्तर न दें।'
      : 'This is an automated message from RHVS; please do not reply directly.';

    const heroLabel = isRegistration
      ? (isHindi ? 'पंजीकरण टोकन' : 'Registration Token')
      : (isHindi ? 'सदस्यता सत्यापन ओटीपी' : 'Verification OTP');
    
    const html = `
      <div style="font-family:'Segoe UI',Helvetica,Arial,sans-serif; max-width:640px; margin:0 auto; background:#f8fafc; padding:24px;">
        <div style="background:linear-gradient(135deg,#f97316,#ea580c); border-radius:16px 16px 0 0; color:#fff; text-align:center; padding:24px 16px;">
          <h1 style="margin:0; font-size:28px; letter-spacing:0.4px;">राष्ट्रीय हिन्दू वाहिनी संगठन</h1>
          <p style="margin:8px 0 0; font-size:16px; color:#fde68a; font-weight:600;">।। गर्व से कहो हम हिन्दू हैं ।।</p>
          </div>
        <div style="background:#ffffff; border:1px solid #ffe0c4; border-top:none; padding:28px 24px; border-radius:0 0 16px 16px; box-shadow:0 15px 35px rgba(16,24,40,0.08);">
          <p style="margin:0 0 12px; color:#111827; font-weight:600;">${greeting}</p>
          <p style="margin:0 0 20px; color:#374151; line-height:1.6;">${introText}</p>
          
          <div style="max-width:100%; border-radius:14px; padding:18px; text-align:center; background:#ffffff; border:1px solid #ffe8d1; overflow:hidden;">
            <p style="margin:0; color:#ea580c; font-weight:600; letter-spacing:1.1px; text-transform:uppercase;">${heroLabel}</p>
            <div style="margin:12px auto; display:inline-flex; align-items:center; justify-content:center; gap:${isRegistration ? '8px' : '4px'}; padding:${isRegistration ? '12px 16px' : '14px 18px'}; color:#7c2d12; font-size:${isRegistration ? '18px' : '24px'}; font-weight:700; border-radius:12px; font-family:'SFMono-Regular','Consolas',monospace; letter-spacing:${isRegistration ? '0.8px' : '3px'}; white-space:nowrap; max-width:100%; box-sizing:border-box; border:1px solid #fde68a; background:#fff;">
              ${tokenParts.map((segment, idx) => `
                <span style="display:block;">${segment}</span>
                ${idx < tokenParts.length - 1 ? '<span style="color:#b45309; font-weight:700;">-</span>' : ''}
              `).join('')}
            </div>
            <p style="margin:0; color:#4b5563; font-size:14px;">${expiryText}</p>
          </div>
          
          ${isRegistration ? `
            <div style="margin:24px 0 12px; background:#eef2ff; border-radius:12px; padding:18px; border-left:4px solid #4f46e5;">
              <p style="margin:0 0 10px; color:#312e81; font-weight:600;">${isHindi ? 'आगे की प्रक्रिया:' : 'Next Steps:'}</p>
              ${stepsBlock}
            </div>
          ` : `
            <div style="margin:24px 0 12px; background:#dcfce7; border-radius:12px; padding:18px; border-left:4px solid #16a34a;">
              <p style="margin:0; color:#065f46; font-size:14px; line-height:1.6;">
                ${isHindi
                  ? 'यह ओटीपी केवल पंजीकरण सत्यापन हेतु है। कृपया इसे दर्ज करके प्रक्रिया पूर्ण करें।'
                  : 'Use this OTP only for approving the registration request. Enter it promptly to complete the verification.'}
            </p>
          </div>
          `}
          
          <div style="margin-top:20px; background:#f3f4f6; border-radius:12px; padding:16px;">
            <p style="margin:0; color:#374151; font-size:14px; line-height:1.6;">${confidentialityNote}</p>
          </div>
          
          <p style="margin:20px 0 0; color:#9ca3af; font-size:12px;">${footerText}</p>
          <p style="margin:6px 0 0; color:#9ca3af; font-size:12px;">© ${currentYear} राष्ट्रीय हिन्दू वाहिनी संगठन • All Rights Reserved</p>
        </div>
      </div>
    `;

    const result = await transporter.sendMail({
      from: `"राष्ट्रीय हिन्दू वाहिनी संगठन" <${
        process.env.EMAIL_FROM || process.env.EMAIL_USER || 'admin@rashtriyahinduvahinisangathan.org'
      }>`,
      to,
      subject,
      html,
    });
    
    console.log(`✅ ${isRegistration ? 'Token' : 'OTP'} email sent successfully:`, result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error(`❌ Failed to send email:`, error);
    return { success: false, error: error };
  }
}

// Send admin assignment email to district admin
export async function sendAdminAssignmentEmail(
  to: string,
  adminName: string,
  districtName: string,
  temporaryPassword: string,
  loginUrl: string,
  language: 'hi' | 'en' = 'hi'
) {
  try {
    console.log('📧 sendAdminAssignmentEmail called with:', {
      to,
      adminName,
      districtName,
      language,
      hasPassword: !!temporaryPassword,
      loginUrl
    });

    // Validate email configuration
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('❌ Email configuration missing: EMAIL_USER or EMAIL_PASS not set');
      return { success: false, error: 'Email configuration missing' };
    }

    const isHindi = language === 'hi';
    const currentYear = new Date().getFullYear();

    const subject = isHindi
      ? `जिला प्रशासक नियुक्ति - ${districtName} | राष्ट्रीय हिन्दू वाहिनी संगठन`
      : `District Admin Appointment - ${districtName} | Rashtriya Hindu Vahini Sangathan`;

    const greeting = isHindi ? `प्रिय ${adminName} जी,` : `Dear ${adminName},`;

    const mainMessage = isHindi
      ? `
        <p style="color:#7c2d12; line-height:1.7; margin:16px 0 0 0; text-align:left; font-size:15px;">
          हार्दिक बधाई! आपको <strong>${districtName}</strong> जिले का प्रशासक (Admin) नियुक्त किया गया है। 
          आपको अब RHVS के जिला प्रशासक पैनल तक पहुंच प्राप्त हो गई है।
        </p>
        <p style="color:#7c2d12; line-height:1.7; margin:16px 0 0 0; text-align:left; font-size:15px;">
          आप अपने जिले के सदस्यों, सामग्री, और गतिविधियों का प्रबंधन कर सकते हैं। 
          हम आपसे अपेक्षा करते हैं कि आप अपने जिम्मेदारियों का निर्वहन करेंगे और संगठन के उद्देश्यों को आगे बढ़ाएंगे।
        </p>
      `
      : `
        <p style="color:#7c2d12; line-height:1.7; margin:16px 0 0 0; text-align:left; font-size:15px;">
          Congratulations! You have been appointed as the Administrator (Admin) for <strong>${districtName}</strong> district. 
          You now have access to the RHVS District Admin Panel.
        </p>
        <p style="color:#7c2d12; line-height:1.7; margin:16px 0 0 0; text-align:left; font-size:15px;">
          You can manage members, content, and activities for your district. 
          We expect you to fulfill your responsibilities and advance the organization's objectives.
        </p>
      `;

    const credentialsBlock = isHindi
      ? `
        <div style="background:#fff1e6; padding:20px; border-radius:12px; border-left:4px solid #f97316; margin:24px 0;">
          <h3 style="margin:0 0 16px 0; color:#9a3412; font-size:18px;">🔐 लॉगिन क्रेडेंशियल्स</h3>
          <div style="background:#ffffff; padding:16px; border-radius:8px; margin-bottom:12px;">
            <p style="margin:0 0 8px 0; color:#9a3412; font-size:14px; font-weight:600;">ईमेल (Email):</p>
            <p style="margin:0; color:#7c2d12; font-size:16px; font-family:monospace; word-break:break-all;">${to}</p>
          </div>
          <div style="background:#ffffff; padding:16px; border-radius:8px;">
            <p style="margin:0 0 8px 0; color:#9a3412; font-size:14px; font-weight:600;">अस्थायी पासवर्ड (Temporary Password):</p>
            <p style="margin:0; color:#7c2d12; font-size:18px; font-family:monospace; font-weight:700; letter-spacing:2px;">${temporaryPassword}</p>
          </div>
          <p style="margin:16px 0 0 0; color:#9a3412; font-size:13px; line-height:1.6;">
            ⚠️ <strong>सुरक्षा सुझाव:</strong> कृपया पहली बार लॉगिन करने के बाद अपना पासवर्ड बदलें।
          </p>
        </div>
      `
      : `
        <div style="background:#fff1e6; padding:20px; border-radius:12px; border-left:4px solid #f97316; margin:24px 0;">
          <h3 style="margin:0 0 16px 0; color:#9a3412; font-size:18px;">🔐 Login Credentials</h3>
          <div style="background:#ffffff; padding:16px; border-radius:8px; margin-bottom:12px;">
            <p style="margin:0 0 8px 0; color:#9a3412; font-size:14px; font-weight:600;">Email:</p>
            <p style="margin:0; color:#7c2d12; font-size:16px; font-family:monospace; word-break:break-all;">${to}</p>
          </div>
          <div style="background:#ffffff; padding:16px; border-radius:8px;">
            <p style="margin:0 0 8px 0; color:#9a3412; font-size:14px; font-weight:600;">Temporary Password:</p>
            <p style="margin:0; color:#7c2d12; font-size:18px; font-family:monospace; font-weight:700; letter-spacing:2px;">${temporaryPassword}</p>
          </div>
          <p style="margin:16px 0 0 0; color:#9a3412; font-size:13px; line-height:1.6;">
            ⚠️ <strong>Security Tip:</strong> Please change your password after your first login.
          </p>
        </div>
      `;

    const permissionsNote = isHindi
      ? `
        <div style="background:#eef2ff; padding:16px; border-radius:10px; border:1px solid #c7d2fe; margin:20px 0;">
          <p style="margin:0; color:#4338ca; font-size:14px; line-height:1.6;">
            <strong>📋 अनुमति प्रबंधन:</strong> कृपया ध्यान दें कि सामग्री प्रबंधन (Content Management) जैसी कुछ सुविधाओं तक पहुंच के लिए विशिष्ट अनुमतियों की आवश्यकता होती है। 
            यदि आपको किसी विशेष सुविधा तक पहुंच नहीं मिल रही है, तो कृपया सुपरएडमिन से संपर्क करें।
          </p>
        </div>
      `
      : `
        <div style="background:#eef2ff; padding:16px; border-radius:10px; border:1px solid #c7d2fe; margin:20px 0;">
          <p style="margin:0; color:#4338ca; font-size:14px; line-height:1.6;">
            <strong>📋 Permission Management:</strong> Please note that access to certain features like Content Management requires specific permissions. 
            If you don't have access to a particular feature, please contact the superadmin.
          </p>
        </div>
      `;

    const loginButton = isHindi
      ? `
        <div style="text-align:center; margin:28px 0;">
          <a href="${loginUrl}" style="display:inline-block; background:linear-gradient(135deg,#f97316,#ea580c); color:#ffffff; padding:16px 32px; text-decoration:none; border-radius:10px; font-weight:600; font-size:16px; box-shadow:0 4px 12px rgba(249,115,22,0.4);">
            🚀 एडमिन पैनल में लॉगिन करें
          </a>
        </div>
      `
      : `
        <div style="text-align:center; margin:28px 0;">
          <a href="${loginUrl}" style="display:inline-block; background:linear-gradient(135deg,#f97316,#ea580c); color:#ffffff; padding:16px 32px; text-decoration:none; border-radius:10px; font-weight:600; font-size:16px; box-shadow:0 4px 12px rgba(249,115,22,0.4);">
            🚀 Login to Admin Panel
          </a>
        </div>
      `;

    const passwordResetNote = isHindi
      ? `
        <div style="background:#fef3c7; padding:16px; border-radius:10px; border:1px solid #fbbf24; margin:20px 0;">
          <p style="margin:0; color:#92400e; font-size:14px; line-height:1.6;">
            <strong>💡 पासवर्ड रीसेट:</strong> आप अपने एडमिन पैनल के प्रोफाइल सेक्शन से कभी भी अपना पासवर्ड बदल सकते हैं। 
            लॉगिन करने के बाद, प्रोफाइल सेटिंग्स में जाकर "पासवर्ड बदलें" विकल्प का उपयोग करें।
          </p>
        </div>
      `
      : `
        <div style="background:#fef3c7; padding:16px; border-radius:10px; border:1px solid #fbbf24; margin:20px 0;">
          <p style="margin:0; color:#92400e; font-size:14px; line-height:1.6;">
            <strong>💡 Password Reset:</strong> You can change your password anytime from your admin panel's profile section. 
            After logging in, go to profile settings and use the "Change Password" option.
          </p>
        </div>
      `;

    const footerText = isHindi
      ? 'यह RHVS द्वारा भेजा गया स्वचालित संदेश है; कृपया इसका प्रत्यक्ष उत्तर न दें।'
      : 'This is an automated message from RHVS; please do not reply directly.';

    const html = `
      <div style="font-family:'Segoe UI',Helvetica,Arial,sans-serif; max-width:640px; margin:0 auto; background:#fff7ed; padding:24px;">
        <div style="background:linear-gradient(135deg,#f97316,#ea580c); border-radius:16px 16px 0 0; color:#fff; text-align:center; padding:24px 16px;">
          <h1 style="margin:0; font-size:28px; letter-spacing:0.4px;">राष्ट्रीय हिन्दू वाहिनी संगठन</h1>
          <p style="margin:8px 0 0; font-size:16px; color:#fde68a; font-weight:600;">।। गर्व से कहो हम हिन्दू हैं ।।</p>
        </div>
        <div style="background:#ffffff; border:1px solid #fed7aa; border-top:none; padding:28px 24px; border-radius:0 0 16px 16px; box-shadow:0 15px 35px rgba(16,24,40,0.08);">
          <p style="margin:0 0 12px; color:#111827; font-weight:600; font-size:16px;">${greeting}</p>
          ${mainMessage}
          ${credentialsBlock}
          ${permissionsNote}
          ${loginButton}
          ${passwordResetNote}
          <div style="margin-top:24px; background:#f3f4f6; border-radius:12px; padding:16px;">
            <p style="margin:0; color:#374151; font-size:13px; line-height:1.6;">
              ${isHindi 
                ? 'यदि आपने यह अनुरोध नहीं किया है या आपको लगता है कि यह एक गलती है, तो कृपया तुरंत सुपरएडमिन से संपर्क करें।'
                : 'If you did not request this or believe this is an error, please contact the superadmin immediately.'}
            </p>
          </div>
          <p style="margin:20px 0 0; color:#9ca3af; font-size:12px;">${footerText}</p>
          <p style="margin:6px 0 0; color:#9ca3af; font-size:12px;">© ${currentYear} राष्ट्रीय हिन्दू वाहिनी संगठन • All Rights Reserved</p>
        </div>
      </div>
    `;

    const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'admin@rashtriyahinduvahinisangathan.org';
    
    // Create plain text version for better deliverability
    const plainText = isHindi
      ? `
राष्ट्रीय हिन्दू वाहिनी संगठन

${greeting}

हार्दिक बधाई! आपको ${districtName} जिले का प्रशासक (Admin) नियुक्त किया गया है। 
आपको अब RHVS के जिला प्रशासक पैनल तक पहुंच प्राप्त हो गई है।

🔐 लॉगिन क्रेडेंशियल्स:
ईमेल: ${to}
अस्थायी पासवर्ड: ${temporaryPassword}

⚠️ सुरक्षा सुझाव: कृपया पहली बार लॉगिन करने के बाद अपना पासवर्ड बदलें।

लॉगिन करें: ${loginUrl}

© ${currentYear} राष्ट्रीय हिन्दू वाहिनी संगठन
      `
      : `
Rashtriya Hindu Vahini Sangathan

${greeting}

Congratulations! You have been appointed as the Administrator (Admin) for ${districtName} district. 
You now have access to the RHVS District Admin Panel.

🔐 Login Credentials:
Email: ${to}
Temporary Password: ${temporaryPassword}

⚠️ Security Tip: Please change your password after your first login.

Login here: ${loginUrl}

© ${currentYear} Rashtriya Hindu Vahini Sangathan
      `;
    
    console.log('📧 Sending email via transporter:', {
      from: fromEmail,
      to,
      subject,
      hasHtml: !!html,
      hasPlainText: !!plainText,
      passwordIncluded: temporaryPassword ? 'Yes' : 'No'
    });

    const result = await transporter.sendMail({
      from: `"राष्ट्रीय हिन्दू वाहिनी संगठन" <${fromEmail}>`,
      to,
      subject,
      text: plainText.trim(),
      html,
    });
    
    console.log('✅ Admin assignment email sent successfully:', {
      messageId: result.messageId,
      response: result.response,
      accepted: result.accepted,
      rejected: result.rejected,
      pending: result.pending
    });
    
    if (result.rejected && result.rejected.length > 0) {
      console.error('❌ Email was rejected by server:', result.rejected);
    }
    
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Failed to send admin assignment email:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

// Send welcome email to new member with certificate and ID card
export async function sendWelcomeEmail(
  to: string,
  memberName: string,
  memberRegNumber: string,
  certificatePath?: string,
  idCardPath?: string,
  language: 'hi' | 'en' = 'hi'
) {
  try {
    const isHindi = language === 'hi';

    const documentsBlock = certificatePath || idCardPath
      ? isHindi
        ? `
          <div style="background:#dcfce7; padding:16px; border-radius:10px; border:1px solid #86efac; margin:16px 0;">
            <p style="margin:0; color:#166534; font-size:14px; line-height:1.6;">
              <strong>🎉 आपकी सदस्यता से सम्बंधित दस्तावेज तैयार हो गए हैं!</strong><br>
              ${certificatePath ? '• सदस्यता प्रमाणपत्र<br>' : ''}
              ${idCardPath ? '• सदस्य पहचान पत्र<br>' : ''}
              दोनों दस्तावेज इस ईमेल में संलग्न हैं और एडमिन डैशबोर्ड से भी डाउनलोड किए जा सकते हैं।
            </p>
          </div>
        `
        : `
          <div style="background:#dcfce7; padding:16px; border-radius:10px; border:1px solid #86efac; margin:16px 0;">
            <p style="margin:0; color:#166534; font-size:14px; line-height:1.6;">
              <strong>🎉 Your membership documents are ready!</strong><br>
              ${certificatePath ? '• Membership Certificate<br>' : ''}
              ${idCardPath ? '• Membership ID Card<br>' : ''}
              Both documents are attached to this email and can also be downloaded from the admin dashboard.
            </p>
          </div>
        `
      : '';

    const pledgeBlock = isHindi
      ? `
        <div style="background:#fff5f8; padding:20px; border-radius:12px; border:1px solid #fbcfe8; margin:24px 0;">
          <h3 style="margin:0; color:#b91c1c; font-size:18px; text-align:center;">🌺 हिन्दूत्व रक्षक संकल्प 🌺</h3>
          <p style="color:#7c2d12; line-height:1.7; margin:16px 0 0 0; text-align:left;">
            “धर्मो रक्षति रक्षितः” – धर्म की रक्षा वही कर सकता है जो स्वयं धर्म की शरण में रहे।
            आपके जुड़ने से संगठन को एक और दृढ़ संकल्पी हिन्दू योद्धा मिला है।
            भगवान श्री राम और माँ भारती की कृपा से आप संगठन, समाज और राष्ट्र सेवा के इस पवित्र मार्ग पर निरंतर अग्रसर रहें।
          </p>
          <ul style="margin:16px 0 0 20px; padding:0; color:#7c2d12; line-height:1.7;">
            <li>सनातन परम्पराओं का सम्मान और संरक्षण</li>
            <li>समाज में राष्ट्रवादी चेतना एवं एकात्म भाव का प्रसार</li>
            <li>धर्म, गौ और मातृभूमि रक्षा के लिए सदैव तत्पर रहना</li>
          </ul>
          <p style="margin:18px 0 0 0; text-align:center; font-weight:600; color:#b91c1c;">जय श्री राम! वंदे मातरम्!!</p>
        </div>
      `
      : `
        <div style="background:#fff5f8; padding:20px; border-radius:12px; border:1px solid #fbcfe8; margin:24px 0;">
          <h3 style="margin:0; color:#b91c1c; font-size:18px; text-align:center;">🌺 Commitment to Dharmic Service 🌺</h3>
          <p style="color:#7c2d12; line-height:1.7; margin:16px 0 0 0; text-align:left;">
            “Dharmo Rakshati Rakshitah” – those who protect Dharma are protected by Dharma.
            Your association adds another devoted guardian to our organization.
            May Lord Shri Ram and Mother Bharati guide you on this sacred path of service to Dharma, society, and the nation.
          </p>
          <ul style="margin:16px 0 0 20px; padding:0; color:#7c2d12; line-height:1.7;">
            <li>Honor and preserve Sanatan traditions</li>
            <li>Spread nationalist consciousness and unity in society</li>
            <li>Remain ever-ready to protect Dharma, Gau Mata, and our Motherland</li>
          </ul>
          <p style="margin:18px 0 0 0; text-align:center; font-weight:600; color:#b91c1c;">Jai Shri Ram! Vande Mataram!!</p>
        </div>
      `;

    const bodyContent = isHindi
      ? `
        <p style="font-size:16px; color:#7c2d12; text-align:left;">प्रिय ${memberName} जी,</p>
        <p style="color:#7c2d12; line-height:1.6; text-align:left;">
          हार्दिक बधाई! आपकी सदस्यता सत्यापित कर ली गई है और अब आप राष्ट्रीय हिन्दू वाहिनी संगठन के पंजीकृत सदस्य हैं।
        </p>
        <div style="background:#fff1e6; padding:16px; border-radius:10px; border:1px solid #fecba1; margin:16px 0;">
          <p style="margin:0; color:#9a3412; font-size:15px; text-align:left;">
            <strong>सदस्यता पंजीकरण संख्या:</strong>
            <span style="font-family:monospace; font-size:18px; margin-left:8px;">${memberRegNumber}</span>
          </p>
        </div>
        ${documentsBlock}
        ${pledgeBlock}
        <p style="color:#7c2d12; text-align:left;">कृपया अपनी सदस्यता संख्या को भविष्य के लिए सुरक्षित रखें।</p>
        <p style="margin-top:24px; color:#9a3412; font-size:12px; text-align:left;">यह RHVS द्वारा भेजा गया स्वचालित संदेश है।</p>
      `
      : `
        <p style="font-size:16px; color:#7c2d12; text-align:left;">Dear ${memberName},</p>
        <p style="color:#7c2d12; line-height:1.6; text-align:left;">
          Congratulations! Your membership has been verified and you are now an official member of Rashtriya Hindu Vahini Sangathan.
        </p>
        <div style="background:#fff1e6; padding:16px; border-radius:10px; border:1px solid #fecba1; margin:16px 0;">
          <p style="margin:0; color:#9a3412; font-size:15px; text-align:left;">
            <strong>Membership Registration Number:</strong>
            <span style="font-family:monospace; font-size:18px; margin-left:8px;">${memberRegNumber}</span>
          </p>
        </div>
        ${documentsBlock}
        ${pledgeBlock}
        <p style="color:#7c2d12; text-align:left;">Please keep your membership number safe for future reference.</p>
        <p style="margin-top:24px; color:#9a3412; font-size:12px; text-align:left;">This is an automated message from RHVS.</p>
      `;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin:0 auto; padding:24px; background:#fff7ed;">
        <div style="background:linear-gradient(135deg,#f97316,#ea580c); border-radius:12px 12px 0 0; color:#fff; text-align:center;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            <tr>
              <td style="padding:20px 16px 8px 16px;">
                <h1 style="margin:0; font-size:28px; letter-spacing:0.4px; font-weight:700;">राष्ट्रीय हिन्दू वाहिनी संगठन</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:0 16px 4px 16px;">
                <p style="margin:0; font-size:16px; color:#fde68a; font-weight:600;">।। गर्व से कहो हम हिन्दू हैं ।।</p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 16px 24px 16px;">
                <img src="cid:rhvs-logo" alt="RHVS Logo" width="120" height="120" style="display:inline-block; width:120px; height:120px; max-width:44vw; object-fit:contain; background:#fff7ed; border-radius:50%; box-shadow:0 6px 16px rgba(0,0,0,0.2); padding:10px;" />
              </td>
            </tr>
          </table>
        </div>
        <div style="background:#ffffff; border:1px solid #fed7aa; border-top:none; padding:24px; border-radius:0 0 12px 12px;">
          ${bodyContent}
        </div>
      </div>
    `;

    const subject = isHindi
      ? `सदस्यता पुष्टि पत्र - ${memberRegNumber} | राष्ट्रीय हिन्दू वाहिनी संगठन`
      : `Membership Confirmation - ${memberRegNumber} | Rashtriya Hindu Vahini Sangathan`;

    const mailOptions: { from: string; to: string; subject: string; html: string; attachments?: Array<{ filename: string; path: string; cid?: string }> } = {
      from: `"राष्ट्रीय हिन्दू वाहिनी संगठन" <${process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@example.com'}>`,
      to,
      subject,
      html,
    };

    // Attach certificate and ID card if provided
    const attachments: Array<{ filename: string; path: string; cid?: string }> = [];
    const filesToCleanup: string[] = [];

    const headerLogoPath = path.join(process.cwd(), 'public', 'certificates', 'rhvs_logo.png');
    if (fs.existsSync(headerLogoPath)) {
      attachments.push({
        filename: 'rhvs_logo.png',
        path: headerLogoPath,
        cid: 'rhvs-logo',
      });
    }

    const certificateAttachmentPath = resolveAttachmentPath(certificatePath);
    if (certificateAttachmentPath && !/^https?:\/\//i.test(certificateAttachmentPath)) {
      if (fs.existsSync(certificateAttachmentPath)) {
        attachments.push({
          filename: `RHVS_Membership_Certificate_${memberRegNumber}.pdf`,
          path: certificateAttachmentPath
        });
        filesToCleanup.push(certificateAttachmentPath);
      } else {
        console.warn('Certificate attachment missing:', certificateAttachmentPath);
      }
    }

    const idCardAttachmentPath = resolveAttachmentPath(idCardPath);
    if (idCardAttachmentPath && !/^https?:\/\//i.test(idCardAttachmentPath)) {
      if (fs.existsSync(idCardAttachmentPath)) {
        attachments.push({
          filename: `RHVS_ID_Card_${memberRegNumber}.pdf`,
          path: idCardAttachmentPath
        });
        filesToCleanup.push(idCardAttachmentPath);
      } else {
        console.warn('ID card attachment missing:', idCardAttachmentPath);
      }
    }
    
    if (attachments.length > 0) {
      mailOptions.attachments = attachments;
    }

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Welcome email sent:', info.messageId);
    
    if (!retainCertificateFiles && filesToCleanup.length > 0) {
      await Promise.all(
        filesToCleanup.map(filePath => cleanupAttachment(filePath))
      );
    }
    
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to send welcome email:', error);
    return { success: false, error };
  }
}
