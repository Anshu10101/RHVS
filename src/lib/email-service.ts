import nodemailer from 'nodemailer';
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';

interface EmailData {
  to: string;
  memberName: string;
  memberRegNumber: string;
  departmentName: string;
  postName: string;
  level: 'national' | 'state' | 'district';
  state?: string | null;
  district?: string | null;
  certificatePath: string;
  appointmentDate: string;
  certificateNumber: string;
  idCardPath?: string;
  language?: 'hi' | 'en';
}

const shouldRetainCertificates = process.env.RETAIN_CERTIFICATE_FILES !== 'false';

function resolveAttachmentPath(rawPath: string): string {
  const trimmed = rawPath?.trim();
  if (!trimmed) {
    throw new Error('Attachment path missing');
  }

  if (/^https?:\/\//i.test(trimmed)) {
    throw new Error('Attachment path must be a local file');
  }

  // Windows absolute paths like C:\foo or C:/foo
  if (/^[a-zA-Z]:[\\/]/.test(trimmed)) {
    return path.normalize(trimmed);
  }

  // Paths starting with / or \ should be treated as relative to public/
  if (trimmed.startsWith('/') || trimmed.startsWith('\\')) {
    const relativePart = trimmed.replace(/^[/\\]+/, '');
    return path.join(process.cwd(), 'public', relativePart);
  }

  if (path.isAbsolute(trimmed)) {
    return path.normalize(trimmed);
  }

  return path.join(process.cwd(), 'public', trimmed.replace(/^[/\\]+/, ''));
}

async function cleanupAttachmentFile(filePath: string) {
  if (shouldRetainCertificates || /^https?:\/\//i.test(filePath)) return;
  try {
    await fsPromises.unlink(filePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.warn('Failed to cleanup attachment file:', error);
    }
  }
}

// Email transporter configuration
const createTransporter = () => {
  // You can configure this with your email service (Gmail, Outlook, etc.)
  // For now, using a basic SMTP configuration
  return nodemailer.createTransport({
    host: 'smtp.hostinger.com',
    port: 465,
    secure: true, // true for port 465
    auth: {
      user: 'admin@rashtriyahinduvahinisangathan.org',
      pass: 'RhvsAdmin#992640',
    },
    from: 'admin@rashtriyahinduvahinisangathan.org',
  });
};

// Generate creative email templates
const generateEmailTemplate = (data: EmailData) => {
  const {
    memberName,
    memberRegNumber,
    departmentName,
    postName,
    level,
    state,
    district,
    appointmentDate,
    certificateNumber,
    idCardPath,
    language = 'hi',
  } = data;

  const isHindi = language === 'hi';

  const formatLevelText = () => {
    if (isHindi) {
      switch (level) {
        case 'national':
          return 'राष्ट्रीय स्तर पर';
        case 'state':
          return state ? `राज्य स्तर पर, ${state}` : 'राज्य स्तर पर';
        case 'district':
          if (state && district) {
            return `जिला स्तर पर, ${district}, ${state}`;
          }
          if (district) return `जिला स्तर पर, ${district}`;
          return 'जिला स्तर पर';
        default:
          return '';
      }
    }

    switch (level) {
      case 'national':
        return 'National Level';
      case 'state':
        return state ? `State Level, ${state}` : 'State Level';
      case 'district': {
        const parts = [district, state].filter(Boolean);
        return parts.length > 0 ? `District Level, ${parts.join(', ')}` : 'District Level';
      }
      default:
        return '';
    }
  };

  const levelText = formatLevelText();

  const appointmentDateText = new Date(appointmentDate).toLocaleDateString(isHindi ? 'hi-IN' : 'en-IN');

  const messageBlock = isHindi
    ? `
      <div style="font-family: 'Noto Sans Devanagari', Arial, sans-serif; text-align:left;">
        <h2 style="color: #DC2626; text-align: center;">🎉 हार्दिक बधाई! 🎉</h2>
        <p style="font-size: 18px; line-height: 1.6; margin-top: 16px;">
          प्रिय <strong>${memberName}</strong> जी,
        </p>
        <p style="font-size: 16px; line-height: 1.6;">
          आपको <strong>राष्ट्रीय हिन्दू वाहिनी संगठन</strong> में <strong>${departmentName}</strong> के <strong>${postName}</strong> पद पर ${levelText} नियुक्त किया गया है।
        </p>
        <div style="background: linear-gradient(135deg, #FEF3C7, #FCD34D); padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 5px solid #DC2626;">
          <p style="font-size: 16px; font-weight: bold; color: #92400E; margin: 0;">
            "जब तक सूरज चाँद रहेगा, तब तक हिन्दू धर्म रहेगा।"<br/>
            <span style="font-size: 14px; color: #78350F;">- स्वामी विवेकानंद</span>
          </p>
        </div>
        <p style="font-size: 16px; line-height: 1.6;">
          आपकी यह नियुक्ति संगठन के लिए गर्व की बात है। हम आशा करते हैं कि आप अपने पद की जिम्मेदारियों का निर्वहन पूरी निष्ठा और ईमानदारी से करेंगे।
        </p>
        <div style="background: #F0F9FF; padding: 15px; border-radius: 8px; margin: 20px 0; border: 2px solid #0EA5E9;">
          <h3 style="color: #0C4A6E; margin-top: 0;">📋 नियुक्ति विवरण:</h3>
          <ul style="color: #0C4A6E; font-size: 14px; padding-left: 18px; line-height:1.7;">
            <li><strong>नाम:</strong> ${memberName}</li>
            <li><strong>पंजीकरण संख्या:</strong> ${memberRegNumber}</li>
            <li><strong>विभाग:</strong> ${departmentName}</li>
            <li><strong>पद:</strong> ${postName}</li>
            <li><strong>स्तर:</strong> ${levelText}</li>
            <li><strong>नियुक्ति दिनांक:</strong> ${appointmentDateText}</li>
            <li><strong>प्रमाणपत्र संख्या:</strong> ${certificateNumber}</li>
          </ul>
        </div>
      </div>
    `
    : `
      <div style="font-family: Arial, sans-serif; text-align:left;">
        <h2 style="color: #DC2626; text-align: center;">🎉 Heartfelt Congratulations! 🎉</h2>
        <p style="font-size: 18px; line-height: 1.6; margin-top: 16px;">
          Dear <strong>${memberName}</strong>,
        </p>
        <p style="font-size: 16px; line-height: 1.6;">
          We are delighted to inform you that you have been appointed as <strong>${postName}</strong> in the <strong>${departmentName}</strong> department of <strong>Rashtriya Hindu Vahini Sangathan</strong> at the <strong>${levelText}</strong>.
        </p>
        <div style="background: linear-gradient(135deg, #FEF3C7, #FCD34D); padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 5px solid #DC2626;">
          <p style="font-size: 16px; font-weight: bold; color: #92400E; margin: 0;">
            "As long as the sun and moon exist, Hindu Dharma will exist."<br/>
            <span style="font-size: 14px; color: #78350F;">- Swami Vivekananda</span>
          </p>
        </div>
        <p style="font-size: 16px; line-height: 1.6;">
          This appointment is a matter of pride for our organization. We expect you to fulfill your responsibilities with complete dedication and honesty for the organization, the nation, and the protection of Sanatan Dharma.
        </p>
        <div style="background: #F0F9FF; padding: 15px; border-radius: 8px; margin: 20px 0; border: 2px solid #0EA5E9;">
          <h3 style="color: #0C4A6E; margin-top: 0;">📋 Appointment Details:</h3>
          <ul style="color: #0C4A6E; font-size: 14px; padding-left: 18px; line-height:1.7;">
            <li><strong>Name:</strong> ${memberName}</li>
            <li><strong>Registration Number:</strong> ${memberRegNumber}</li>
            <li><strong>Department:</strong> ${departmentName}</li>
            <li><strong>Post:</strong> ${postName}</li>
            <li><strong>Level:</strong> ${levelText}</li>
            <li><strong>Appointment Date:</strong> ${appointmentDateText}</li>
            <li><strong>Certificate Number:</strong> ${certificateNumber}</li>
          </ul>
        </div>
      </div>
    `;

  const importantNote = isHindi
    ? idCardPath
      ? 'आपका नियुक्ति प्रमाणपत्र और नियुक्ति पहचान पत्र दोनों इस ईमेल में संलग्न हैं। कृपया इन्हें सुरक्षित रखें।'
      : 'आपका नियुक्ति प्रमाणपत्र इस ईमेल में संलग्न है। कृपया इसे सुरक्षित रखें।'
    : idCardPath
      ? 'Your appointment certificate and ID card are attached to this email. Please save them for your records.'
      : 'Your appointment certificate is attached to this email. Please save it for your records.';

  return `
    <!DOCTYPE html>
    <html lang="${isHindi ? 'hi' : 'en'}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Appointment Certificate - ${memberName}</title>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap" rel="stylesheet">
    </head>
    <body style="margin: 0; padding: 20px; background-color: #f8fafc;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 15px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #DC2626, #B91C1C); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: bold;">
            राष्ट्रीय हिन्दू वाहिनी संगठन
          </h1>
          <p style="color: #FEF3C7; margin: 10px 0 0 0; font-size: 16px;">
            ।। गर्व से कहो हम हिन्दू हैं ।।
          </p>
          <p style="color: #FEF3C7; margin: 5px 0 0 0; font-size: 16px;">
            ।। हिन्दुस्तान हमारा है ।।
          </p>
        </div>
        
        <!-- Content -->
        <div style="padding: 30px; text-align:left;">
          ${messageBlock}
          <div style="background: #FEF2F2; padding: 20px; border-radius: 10px; margin: 30px 0; border: 2px solid #FECACA;">
            <h3 style="color: #991B1B; margin-top: 0; text-align: center;">📧 ${isHindi ? 'महत्वपूर्ण सूचना' : 'Important Note'}</h3>
            <p style="color: #991B1B; text-align: center; margin: 0; font-size: 14px;">
              ${importantNote}
            </p>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background: linear-gradient(135deg, #DC2626, #B91C1C); padding: 20px; text-align: center;">
          <p style="color: white; margin: 0; font-size: 14px;">
            <strong>Central Office:</strong> D-305 Kanha Kunj, Indira Park, Najafgarh, New Delhi - 110043
          </p>
          <p style="color: #FEF3C7; margin: 5px 0 0 0; font-size: 12px;">
            <strong>Head Office:</strong> 883, Shri Vedehi Vallabh Kunj, Vavan Mandir, Ayodhya (Uttar Pradesh) - 224001
          </p>
          <p style="color: #FEF3C7; margin: 5px 0 0 0; font-size: 12px;">
            <strong>Head Office:</strong> Shri Rameshwaram Dham, Ganga Surajpur Colony, Harpurkala, Haridwar (Uttarakhand) - 249205
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Send certificate email
export async function sendCertificateEmail(data: EmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const transporter = createTransporter();
    
    // Check if certificate file exists
    let certificateFilePath: string;
    try {
      certificateFilePath = resolveAttachmentPath(data.certificatePath);
      console.log(`[Email Service] Resolved certificate path: ${certificateFilePath}`);
    } catch (pathError) {
      console.error(`[Email Service] Failed to resolve certificate path: ${data.certificatePath}`, pathError);
      throw new Error(`Invalid certificate path: ${pathError instanceof Error ? pathError.message : 'Unknown error'}`);
    }

    if (!fs.existsSync(certificateFilePath)) {
      console.error(`[Email Service] Certificate file does not exist: ${certificateFilePath}`);
      console.error(`[Email Service] Original path: ${data.certificatePath}`);
      console.error(`[Email Service] Process CWD: ${process.cwd()}`);
      throw new Error(`Certificate file not found at ${certificateFilePath}`);
    }
    
    const stats = fs.statSync(certificateFilePath);
    if (stats.size === 0) {
      console.error(`[Email Service] Certificate file is empty: ${certificateFilePath}`);
      throw new Error(`Certificate file is empty at ${certificateFilePath}`);
    }
    
    console.log(`[Email Service] Certificate file verified: ${certificateFilePath} (${stats.size} bytes)`);

    // Generate email content
    const htmlContent = generateEmailTemplate(data);
    
    const attachments: Array<{ filename: string; path: string }> = [
      {
        filename: `appointment-certificate-${data.certificateNumber}.pdf`,
        path: certificateFilePath,
      }
    ];

    if (data.idCardPath) {
      try {
        const idCardFilePath = resolveAttachmentPath(data.idCardPath);
        if (fs.existsSync(idCardFilePath)) {
          attachments.push({
            filename: `appointment-id-card-${data.memberRegNumber}.pdf`,
            path: idCardFilePath,
          });
        } else {
          console.warn('Appointment ID card not found for email attachment:', idCardFilePath);
        }
      } catch (attachmentError) {
        console.warn('Could not resolve appointment ID card path:', attachmentError);
      }
    }
    
    // Email options
    const subject = data.language === 'en'
      ? `🎉 Appointment Certificate - ${data.memberName} | Rashtriya Hindu Vahini Sangathan`
      : `🎉 नियुक्ति प्रमाणपत्र - ${data.memberName} | राष्ट्रीय हिन्दू वाहिनी संगठन`;

    const mailOptions = {
      from: `"राष्ट्रीय हिन्दू वाहिनी संगठन" <admin@rashtriyahinduvahinisangathan.org>`,
      to: data.to,
      subject,
      html: htmlContent,
      attachments,
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    console.log('Certificate email sent successfully:', info.messageId);
    
    if (!shouldRetainCertificates) {
      await Promise.all(
        attachments.map(async ({ path: filePath }) => {
          try {
            await cleanupAttachmentFile(filePath);
          } catch (cleanupError) {
            console.warn('Failed to cleanup attachment:', cleanupError);
          }
        })
      );
    }
    
    return {
      success: true,
      messageId: info.messageId
    };

  } catch (error) {
    console.error('Error sending certificate email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Test email function
export async function testEmailService(email: string): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"राष्ट्रीय हिन्दू वाहिनी संगठन" <admin@rashtriyahinduvahinisangathan.org>`,
      to: email,
      subject: 'Test Email - Certificate System',
      html: `
        <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
          <h2 style="color: #DC2626;">Test Email Successful!</h2>
          <p>The certificate email system is working correctly.</p>
          <p>राष्ट्रीय हिन्दू वाहिनी संगठन</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    
    return {
      success: true,
      message: `Test email sent successfully. Message ID: ${info.messageId}`
    };

  } catch (error) {
    console.error('Error sending test email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
