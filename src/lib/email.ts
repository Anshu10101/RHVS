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
export async function sendTokenEmail(to: string, token: string, memberName: string, type: 'otp' | 'registration' = 'otp') {
  try {
    const isRegistration = type === 'registration';
    const subject = isRegistration 
      ? 'RHVS Registration Token - Bring to Admin for Verification'
      : 'RHVS Member Registration - OTP Verification';
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #f97316, #ea580c); border-radius: 10px;">
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #ea580c; font-size: 28px; margin: 0;">राष्ट्रीय हिंदू वाहिनी संगठन</h1>
            <p style="color: #666; margin: 10px 0 0 0;">${isRegistration ? 'Registration Token' : 'Member Registration Verification'}</p>
          </div>
          
          <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #f59e0b;">
            <h2 style="color: #92400e; margin: 0 0 10px 0;">${isRegistration ? 'Registration Token Generated' : 'OTP Verification Required'}</h2>
            <p style="color: #92400e; margin: 0;">Hello ${memberName},</p>
            <p style="color: #92400e; margin: 10px 0 0 0;">
              ${isRegistration 
                ? 'Your registration token has been generated. Please bring this token to the RHVS admin office for verification and final membership approval.'
                : 'A new member registration requires your verification. Please use the OTP below to verify this registration:'
              }
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <div style="background: #ea580c; color: white; font-size: ${isRegistration ? '24px' : '32px'}; font-weight: bold; padding: 20px; border-radius: 8px; letter-spacing: ${isRegistration ? '2px' : '5px'}; display: inline-block; font-family: monospace; word-break: break-all;">
              ${token}
            </div>
            <p style="color: #666; margin: 10px 0 0 0; font-size: 14px;">
              ${isRegistration ? 'This token will expire in 7 days' : 'This OTP will expire in 10 minutes'}
            </p>
          </div>
          
          ${isRegistration ? `
          <div style="background: #dbeafe; padding: 15px; border-radius: 8px; margin-top: 20px; border-left: 4px solid #3b82f6;">
            <p style="color: #1e40af; margin: 0; font-size: 14px;">
              <strong>Next Steps:</strong> Visit your nearest RHVS office with this token and a valid ID proof. The admin will verify your details and complete your membership registration.
            </p>
          </div>
          ` : ''}
          
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <p style="color: #374151; margin: 0; font-size: 14px;">
              <strong>Important:</strong> If you did not request this ${isRegistration ? 'registration' : 'verification'}, please ignore this email. 
              Do not share this ${isRegistration ? 'token' : 'OTP'} with anyone.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
              © 2024 राष्ट्रीय हिंदू वाहिनी संगठन. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    `;

    const result = await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@example.com',
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

// Send welcome email to new member with certificate and ID card
export async function sendWelcomeEmail(to: string, memberName: string, memberRegNumber: string, certificatePath?: string, idCardPath?: string) {
  try {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin:0 auto; padding:24px; background:#fff7ed;">
        <div style="background:linear-gradient(135deg,#f97316,#ea580c); border-radius:12px 12px 0 0; color:#fff; text-align:center;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            <tr>
              <td style="padding:20px 16px 10px 16px;">
                <h1 style="margin:0; font-size:28px; letter-spacing:0.4px; font-weight:700;">राष्ट्रीय हिंदू वाहिनी संगठन</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:0 16px 14px 16px;">
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
          <p style="font-size:16px; color:#7c2d12;">प्रिय ${memberName} जी,</p>
          <p style="color:#7c2d12; line-height:1.6;">हार्दिक बधाई! आपकी सदस्यता सत्यापित कर ली गई है और अब आप राष्ट्रीय हिंदू वाहिनी संगठन के पंजीकृत सदस्य हैं।</p>
          <div style="background:#fff1e6; padding:16px; border-radius:10px; border:1px solid #fecba1; margin:16px 0;">
            <p style="margin:0; color:#9a3412;">
              <strong>सदस्यता पंजीकरण संख्या:</strong>
              <span style="font-family:monospace; font-size:18px; margin-left:8px;">${memberRegNumber}</span>
            </p>
          </div>
          ${certificatePath || idCardPath ? `
          <div style="background:#dcfce7; padding:16px; border-radius:10px; border:1px solid #86efac; margin:16px 0;">
            <p style="margin:0; color:#166534;">
              <strong>🎉 आपकी सदस्यता से सम्बंधित दस्तावेज तैयार हो गए हैं!</strong><br>
              <span style="font-size:14px;">
                ${certificatePath ? '• सदस्यता प्रमाणपत्र' : ''}
                ${certificatePath && idCardPath ? '<br>' : ''}
                ${idCardPath ? '• सदस्य पहचान पत्र' : ''}
                <br>दोनों दस्तावेज इस ईमेल में संलग्न हैं और एडमिन डैशबोर्ड से भी डाउनलोड किए जा सकते हैं।
              </span>
            </p>
          </div>
          ` : ''}
          <div style="background:#fff5f8; padding:20px; border-radius:12px; border:1px solid #fbcfe8; margin:24px 0;">
            <h3 style="margin:0; color:#b91c1c; font-size:18px; text-align:center;">🌺 हिन्दूत्व रक्षक संकल्प 🌺</h3>
            <p style="color:#7c2d12; line-height:1.7; margin:16px 0 0 0;">
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
          <p style="color:#7c2d12;">कृपया अपनी सदस्यता संख्या को भविष्य के लिए सुरक्षित रखें।</p>
          <p style="margin-top:24px; color:#9a3412; font-size:12px;">यह RHVS द्वारा भेजा गया स्वचालित संदेश है।</p>
        </div>
      </div>
    `;

    const mailOptions: { from: string; to: string; subject: string; html: string; attachments?: Array<{ filename: string; path: string; cid?: string }> } = {
      from: `"राष्ट्रीय हिन्दू वाहिनी संगठन" <${process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@example.com'}>`,
      to,
      subject: `सदस्यता पुष्टि पत्र - ${memberRegNumber} | राष्ट्रीय हिन्दू वाहिनी संगठन`,
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
