import { createCanvas, loadImage, registerFont } from 'canvas';
import type { CanvasRenderingContext2D } from 'canvas';
import { PDFDocument, rgb } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { executeQuery } from '@/lib/database';

interface CertificateData {
  memberId: number;
  memberName: string;
  memberRegNumber: string;
  registrationDate: string;
  profilePhotoPath?: string;
  language?: 'hi' | 'en';
}

interface CertificateResult {
  certificateNumber: string;
  certificatePath: string;
}

async function loadProfilePhotoImage(profilePhotoPath?: string | null) {
  if (!profilePhotoPath) return null;
  const trimmed = profilePhotoPath.trim();
  if (!trimmed) return null;

  const memberMatch = trimmed.match(/^\/api\/media\/members\/(\d+)\/profile/);
  if (memberMatch) {
    const memberId = Number(memberMatch[1]);
    if (!Number.isNaN(memberId)) {
      const rows = await executeQuery(
        'SELECT profile_photo_blob FROM members WHERE id = ? LIMIT 1',
        [memberId]
      ) as Array<{ profile_photo_blob: Buffer | null }>;
      const buffer = rows[0]?.profile_photo_blob;
      if (buffer && buffer.length > 0) {
        return await loadImage(buffer);
      }
    }
  }

  const tokenMatch = trimmed.match(/^\/api\/media\/registration-tokens\/(\d+)\/profile/);
  if (tokenMatch) {
    const tokenId = Number(tokenMatch[1]);
    if (!Number.isNaN(tokenId)) {
      const rows = await executeQuery(
        'SELECT profile_photo_blob FROM registration_tokens WHERE id = ? LIMIT 1',
        [tokenId]
      ) as Array<{ profile_photo_blob: Buffer | null }>;
      const buffer = rows[0]?.profile_photo_blob;
      if (buffer && buffer.length > 0) {
        return await loadImage(buffer);
      }
    }
  }

  const normalizedPath = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed;
  const absolutePath = path.join(process.cwd(), 'public', normalizedPath);
  if (fs.existsSync(absolutePath)) {
    return await loadImage(absolutePath);
  }

  return null;
}

export async function generateCertificate(data: CertificateData): Promise<CertificateResult> {
  try {
    // Register Hindi fonts
    try {
      registerFont(path.join(process.cwd(), 'public', 'fonts', 'Noto-Sans-Devanagari.ttf'), {
        family: 'Noto Sans Devanagari'
      });
      registerFont(path.join(process.cwd(), 'public', 'fonts', 'Mangal Regular.ttf'), {
        family: 'Mangal'
      });
    } catch (error) {
      console.error('Error registering Hindi fonts:', error);
    }

    // Generate certificate number
    const certificateNumber = `CERT-${data.memberRegNumber}-${Date.now()}`;
    const language = data.language ?? 'hi';
    const isHindi = language === 'hi';
    
    const orgName = 'राष्ट्रीय हिन्दू वाहिनी संगठन';
    const tagline1 = '।। गर्व से कहो हम हिन्दू हैं ।।';
    const tagline2 = '।। हिन्दुस्तान हमारा है ।।';
    const headerRegLabel = isHindi ? 'पंजीकरण संख्या: 169' : 'Reg. No: 169';
    const membershipTitle = isHindi ? 'सदस्यता प्रमाणपत्र' : 'MEMBERSHIP CERTIFICATE';
    const membershipText = isHindi
      ? `${data.memberName} राष्ट्रीय हिन्दू वाहिनी संगठन (RHVS) के सदस्य हैं और संगठन की सेवा में पूर्ण निष्ठा तथा समर्पण के साथ सनातन धर्म की रक्षा हेतु प्रतिबद्ध हैं।`
      : `${data.memberName} is now a proud member of Rashtriya Hindu Vahini Sangathan (RHVS) and is committed to serve the organization with dedication and devotion to Sanatan Dharma.`;
    const motivationalText = isHindi
      ? 'हम आपको राष्ट्रीय हिन्दू वाहिनी संगठन के परिवार में हार्दिक स्वागत करते हैं। हमें विश्वास है कि आप संगठन को और सशक्त बनाने में महत्वपूर्ण योगदान देंगे। संगठन, राष्ट्र एवं सनातन धर्म के हित में आप अपने दायित्वों का पूर्ण निष्ठा, अनुशासन और ईमानदारी से निर्वहन करेंगे।'
      : 'We welcome you to the great family of Rashtriya Hindu Vahini Sangathan. We believe you will strengthen the organization with renewed momentum. You are expected to fulfill every responsibility with discipline, honesty, and complete devotion to the organization, the nation, and the protection of Sanatan Dharma.';
    const profileRegLabel = isHindi
      ? `पंजीकरण संख्या: ${data.memberRegNumber}`
      : `Reg: ${data.memberRegNumber}`;
    const footerRegLine = isHindi
      ? `पंजीकरण संख्या - ${certificateNumber}`
      : `Reg. no - ${certificateNumber}`;
    const footerDateLine = isHindi
      ? `दिनांक - ${formatDateByLanguage(data.registrationDate, language)}`
      : `Date - ${formatDateByLanguage(data.registrationDate, language)}`;
    const fonts = isHindi
      ? {
          header: 'bold 160px "Mangal", "Noto Sans Devanagari", "Arial Unicode MS", sans-serif',
          tagline: 'bold 72px "Mangal", "Noto Sans Devanagari", "Arial Unicode MS", sans-serif',
          ribbon: 'bold 84px "Mangal", "Noto Sans Devanagari", "Arial Unicode MS", sans-serif',
          membership: 'bold 80px "Mangal", "Noto Sans Devanagari", "Arial Unicode MS", sans-serif',
          motivational: 'italic 80px "Mangal", "Noto Sans Devanagari", "Georgia", serif',
          quote: 'bold 150px "Mangal", "Noto Sans Devanagari", "Arial Unicode MS", sans-serif',
          regLine: 'bold 36px "Mangal", "Noto Sans Devanagari", "Arial Unicode MS", sans-serif',
          footer: 'bold 48px "Mangal", "Noto Sans Devanagari", "Arial Unicode MS", sans-serif',
          footerAddress: 'bold 40px "Mangal", "Noto Sans Devanagari", "Arial Unicode MS", sans-serif',
          signatureName: 'bold 48px "Mangal", "Noto Sans Devanagari", "Arial Unicode MS", sans-serif',
          signatureTitle: 'bold 52px "Mangal", "Noto Sans Devanagari", "Arial Unicode MS", sans-serif',
        }
      : {
          header: 'bold 160px "Arial Black", "Arial", sans-serif',
          tagline: 'bold 72px "Arial", sans-serif',
          ribbon: 'bold 70px "Arial Black", "Arial", sans-serif',
          membership: '700 68px "Arial", sans-serif',
          motivational: 'italic 74px "Georgia", serif',
          quote: 'bold 140px "Georgia", serif',
          regLine: '700 34px "Arial", sans-serif',
          footer: '700 48px "Arial", sans-serif',
          footerAddress: '600 36px "Arial", sans-serif',
          signatureName: '700 42px "Arial", sans-serif',
          signatureTitle: '600 40px "Arial", sans-serif',
        };
    // Load signatures from database
    let signatureRows: Array<{
      name_en: string;
      name_hi: string | null;
      designation_en: string;
      designation_hi: string | null;
      signature_path: string | null;
    }> = [];
    
    try {
      signatureRows = await executeQuery(
        `SELECT name_en, name_hi, designation_en, designation_hi, 
                CASE 
                  WHEN signature_blob IS NOT NULL THEN CONCAT('/api/media/certificate-signatures/', id, '/signature')
                  ELSE signature_path
                END AS signature_path
         FROM certificate_signatures
         WHERE certificate_type = 'membership' AND is_active = TRUE
         ORDER BY display_order ASC
         LIMIT 4`,
        []
      ) as Array<{
        name_en: string;
        name_hi: string | null;
        designation_en: string;
        designation_hi: string | null;
        signature_path: string | null;
      }>;
      
      console.log(`[Membership Certificate] Loaded ${signatureRows.length} signatures from database`);
    } catch (error) {
      console.error('[Membership Certificate] Error loading signatures from database:', error);
    }

    // Fallback to hardcoded signatures if none found in database
    const signatureBlocks = signatureRows.length > 0
      ? signatureRows.map(sig => ({
          name: isHindi && sig.name_hi ? sig.name_hi : sig.name_en,
          title: isHindi && sig.designation_hi ? sig.designation_hi : sig.designation_en,
          signaturePath: sig.signature_path
        }))
      : (isHindi
      ? [
              { name: 'नवीन चन्द्र शुक्ला', title: 'राष्ट्रीय महामंत्री', signaturePath: null },
              { name: 'रमेश चन्द्र द्विवेदी "राजू भैया"', title: 'राष्ट्रीय अध्यक्ष', signaturePath: null },
              { name: 'डॉ॰ विभा द्विवेदी', title: 'राष्ट्रीय महामंत्री, महिला मोर्चा', signaturePath: null },
              { name: 'डॉ॰ मयंक ढेंगुला', title: 'राष्ट्रीय प्रभारी एवं सदस्यता प्रमुख', signaturePath: null },
        ]
      : [
              { name: 'Naveen Chandra Shukla', title: 'National General Secretary', signaturePath: null },
              { name: 'Ramesh Chandra Dwivedi "Raju Bhaiya"', title: 'National President', signaturePath: null },
              { name: 'Dr. Vibha Dwivedi', title: 'National General Secretary, Women Wing', signaturePath: null },
              { name: 'Dr. Mayank Dhengula', title: 'National In-charge & Membership Head', signaturePath: null },
            ]);
    const placeholderText = isHindi ? 'फोटो उपलब्ध नहीं' : 'No Photo';

    // Create certificate directory if it doesn't exist
    const certDir = path.join(process.cwd(), 'public', 'certificates');
    if (!fs.existsSync(certDir)) {
      fs.mkdirSync(certDir, { recursive: true });
    }

    // Certificate file path
    const certificatePath = `/certificates/${certificateNumber}.pdf`;
    const fullPath = path.join(process.cwd(), 'public', 'certificates', `${certificateNumber}.pdf`);

    // Certificate dimensions (A4 size in pixels at 300 DPI)
    const width = 2480;
    const height = 3508;
    
    const borderMargin = 60;
    
    // Create canvas
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Colors
    const headerColor = '#E30303';
    const borderColor = '#FCD34D';
    const textColor = '#1F2937';
    const accentOrange = '#D97706';

    // Fill background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
    
    // Draw watermarks in background
    try {
      const rhvsWatermark = await loadImage(path.join(process.cwd(), 'public', 'certificates', 'rhvs_logo.png'));
      ctx.globalAlpha = 0.12;
      const rhvsSize = 1400;
      const rhvsX = (width - rhvsSize) / 2;
      const rhvsY = (height - rhvsSize) / 2;
      ctx.drawImage(rhvsWatermark, rhvsX, rhvsY, rhvsSize, rhvsSize);
      ctx.globalAlpha = 1.0;
    } catch (error) {
      console.error('Error loading watermark images:', error);
    }

    // === HEADER SECTION ===
    const headerHeight = 700;
    
    ctx.fillStyle = headerColor;
    ctx.fillRect(borderMargin, borderMargin + 20, width - 2 * borderMargin, headerHeight - borderMargin - 40);

    // Draw RHVS logo on left side next to organization name
    try {
      const logoImage = await loadImage(path.join(process.cwd(), 'public', 'certificates', 'rhvs_logo.png'));
      const logoHeight = 220;
      const logoWidth = (logoImage.width / logoImage.height) * logoHeight;
      const logoX = borderMargin + 80;
      const logoY = borderMargin + 130;
      ctx.drawImage(logoImage, logoX, logoY, logoWidth, logoHeight);
    } catch (error) {
      console.error('Error loading RHVS logo:', error);
    }

    // Draw Ram image in header slightly lower to accommodate registration number
    try {
      const ramImage = await loadImage(path.join(process.cwd(), 'public', 'certificates', 'Ram.png'));
      const ramHeight = 400;
      const ramWidth = (ramImage.width / ramImage.height) * ramHeight;
      const ramX = width - ramWidth - borderMargin - 40;
      const ramY = borderMargin + 130;
      ctx.drawImage(ramImage, ramX, ramY, ramWidth, ramHeight);
    } catch (error) {
      console.error('Error loading Ram image:', error);
    }

    // Organization registration number in header
    ctx.fillStyle = '#FCD34D';
    ctx.font = fonts.regLine;
    ctx.textAlign = 'right';
    ctx.fillText(headerRegLabel, width - borderMargin - 120, borderMargin + 120);
    ctx.textAlign = 'center';

    // Organization name
    // For English, adjust positioning to avoid logo collision
    // Left logo ends around 360px (140 + 220), right logo starts around 2080px (2480 - 400)
    // Center text in available space, but keep offset for Hindi
    const textOffsetX = isHindi ? 40 : 0;
    ctx.font = fonts.header;
    ctx.fillText(orgName, width / 2 + textOffsetX, borderMargin + 260);

    // Taglines
    ctx.font = fonts.tagline;
    ctx.fillStyle = '#FCD34D';
    ctx.fillText(tagline1, width / 2 + textOffsetX, borderMargin + 380);
    ctx.fillText(tagline2, width / 2 + textOffsetX, borderMargin + 460);

    // === CONTENT SECTION ===
    const contentStartY = headerHeight - borderMargin + 40;
    const ribbonY = contentStartY + 100;
    
    // Ribbon background
    ctx.fillStyle = headerColor;
    const ribbonPadding = 30;
    ctx.fillRect(200, ribbonY - ribbonPadding, width - 400, 100);
    
    // Ribbon decorative triangles
    ctx.fillStyle = headerColor;
    ctx.beginPath();
    ctx.moveTo(200, ribbonY + 70 - ribbonPadding);
    ctx.lineTo(170, ribbonY + 50);
    ctx.lineTo(200, ribbonY + 30);
    ctx.closePath();
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(width - 200, ribbonY + 70 - ribbonPadding);
    ctx.lineTo(width - 170, ribbonY + 50);
    ctx.lineTo(width - 200, ribbonY + 30);
    ctx.closePath();
    ctx.fill();
    
    // MEMBERSHIP CERTIFICATE text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = fonts.ribbon;
    ctx.textAlign = 'center';
    ctx.fillText(membershipTitle, width / 2, ribbonY + 55);

    // === MEMBER PHOTO ===
    const photoSize = 480; // Even bigger photo
    const photoX = width - 600; // Moved more left to avoid text overlap
    const photoY = ribbonY + 150; // Moved up by 50px
    
    let photoLoaded = false;
    try {
      const memberPhoto = await loadProfilePhotoImage(data.profilePhotoPath);
      if (memberPhoto) {
          // Modern royal frame design
          const framePadding = 20;
          const frameSize = photoSize + (framePadding * 2);
          
          // Outer shadow for depth
          ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
          ctx.fillRect(photoX - framePadding + 8, photoY - framePadding + 8, frameSize, frameSize);
          
          // Clean white background for the frame
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(photoX - framePadding, photoY - framePadding, frameSize, frameSize);
          
          // Royal gold border - thick and elegant
          ctx.strokeStyle = '#D4AF37'; // Rich gold color
          ctx.lineWidth = 8;
          ctx.strokeRect(photoX - framePadding, photoY - framePadding, frameSize, frameSize);
          
          // Inner gold accent line for elegance
          ctx.strokeStyle = '#D4AF37';
          ctx.lineWidth = 3;
          ctx.strokeRect(photoX - framePadding + 4, photoY - framePadding + 4, frameSize - 8, frameSize - 8);
          
          // White inner background for photo
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(photoX - 4, photoY - 4, photoSize + 8, photoSize + 8);
          
          // Draw photo with original aspect ratio
          const aspectRatio = memberPhoto.width / memberPhoto.height;
          let drawWidth = photoSize;
          let drawHeight = photoSize;
          let drawX = photoX;
          let drawY = photoY;
          
          if (aspectRatio > 1) {
            // Landscape - fit width
            drawHeight = photoSize / aspectRatio;
            drawY = photoY + (photoSize - drawHeight) / 2;
          } else if (aspectRatio < 1) {
            // Portrait - fit height
            drawWidth = photoSize * aspectRatio;
            drawX = photoX + (photoSize - drawWidth) / 2;
          }
          
          ctx.drawImage(memberPhoto, drawX, drawY, drawWidth, drawHeight);
          photoLoaded = true;
      }
    } catch (error) {
      console.error('Error loading member photo:', error);
    }

    // If photo not loaded, draw placeholder with same royal frame
    if (!photoLoaded) {
      const framePadding = 20;
      const frameSize = photoSize + (framePadding * 2);
      
      // Outer shadow for depth
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.fillRect(photoX - framePadding + 8, photoY - framePadding + 8, frameSize, frameSize);
      
      // Clean white background for the frame
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(photoX - framePadding, photoY - framePadding, frameSize, frameSize);
      
      // Royal gold border - thick and elegant
      ctx.strokeStyle = '#D4AF37'; // Rich gold color
      ctx.lineWidth = 8;
      ctx.strokeRect(photoX - framePadding, photoY - framePadding, frameSize, frameSize);
      
      // Inner gold accent line for elegance
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 3;
      ctx.strokeRect(photoX - framePadding + 4, photoY - framePadding + 4, frameSize - 8, frameSize - 8);
      
      // Light gray inner background for placeholder
      ctx.fillStyle = '#F3F4F6';
      ctx.fillRect(photoX - 4, photoY - 4, photoSize + 8, photoSize + 8);
      
      // Placeholder text
      ctx.fillStyle = '#9CA3AF';
      ctx.font = fonts.regLine;
      ctx.textAlign = 'center';
      ctx.fillText(placeholderText, photoX + photoSize / 2, photoY + photoSize / 2);
    }

    // === MEMBER INFO (Right below photo, centered) ===
    const memberInfoY = photoY + photoSize + 50; // Moved up by 30px
    
    // Registration Number (much larger font, centered, not underlined)
    const regNumberY = memberInfoY;
    ctx.fillStyle = '#E30303';
    ctx.font = fonts.regLine;
    ctx.textAlign = 'center';
    ctx.fillText(profileRegLabel, photoX + photoSize / 2, regNumberY);

    // === MEMBERSHIP TEXT (Left side, clean formatting) ===
    const membershipBoxY = ribbonY + 230; // Moved up by 50px
    const textBoxX = borderMargin + 80;
    const textBoxWidth = photoX - textBoxX - 120;
    
    // Clean membership text - only member name underlined
    ctx.fillStyle = accentOrange;
    ctx.font = fonts.membership;
    ctx.textAlign = 'left';
    
    // Wrap text to fit in the available space
    const membershipLines = wrapText(ctx, membershipText, textBoxWidth);
    
    // Draw each line
    membershipLines.forEach((line, index) => {
      const lineY = membershipBoxY + (index * 80); // Increased line spacing from 60 to 80
      ctx.fillText(line, textBoxX, lineY);
      
      // Underline only the member name, not the entire line
      if (line.includes(data.memberName)) {
        const nameStartIndex = line.indexOf(data.memberName);
        const textBeforeName = line.substring(0, nameStartIndex);
        const nameWidth = ctx.measureText(data.memberName).width;
        const textBeforeWidth = ctx.measureText(textBeforeName).width;
        
        ctx.strokeStyle = accentOrange;
        ctx.lineWidth = 4; // Slightly thicker underline
        ctx.beginPath();
        ctx.moveTo(textBoxX + textBeforeWidth, lineY + 10);
        ctx.lineTo(textBoxX + textBeforeWidth + nameWidth, lineY + 10);
        ctx.stroke();
      }
    });

    // === MOTIVATIONAL TEXT ===
    const motTextY = memberInfoY + 300; // Reduced spacing by 150px to move up

    // Motivational text
    ctx.fillStyle = textColor;
    ctx.font = fonts.motivational;
    ctx.textAlign = 'center';
    
    const maxWidth = width - 300;
    const motLines = wrapText(ctx, motivationalText, maxWidth);
    
    motLines.forEach((line, index) => {
      // Adjust line spacing based on language (English has larger font, needs more spacing)
      const lineSpacing = isHindi ? 90 : 100;
      ctx.fillText(line, width / 2, motTextY + (index * lineSpacing));
    });

    // === SIGNATURES SECTION ===
    const lineSpacing = isHindi ? 90 : 100;
    // For English, add moderate extra spacing to prevent signatures from merging with footer
    const extraSpacingForEnglish = isHindi ? 0 : 40; // Reduced to 40px for better balance
    const signaturesY = motTextY + (motLines.length * lineSpacing) + 200 + extraSpacingForEnglish; // Reduced base spacing from 280 to 200
    
    // Dynamically center 1–4 signatures within the inner golden border.
    // The group of signatures is always centered on the inner content area.
    const signatureBlockWidth = 500;
    const signatureSpacing = 60;
    const visibleSignatureCount = Math.min(signatureBlocks.length, 4);
    
    if (visibleSignatureCount > 0) {
      const innerWidth = width - borderMargin * 2;
      const totalSignatureWidth =
        (signatureBlockWidth * visibleSignatureCount) +
        (signatureSpacing * (visibleSignatureCount - 1));
      const signatureStartX = borderMargin + (innerWidth - totalSignatureWidth) / 2;

      for (let index = 0; index < visibleSignatureCount; index++) {
        const block = signatureBlocks[index];
        const position = signatureStartX + index * (signatureBlockWidth + signatureSpacing);
        await drawSignatureBlock(
          ctx,
          block.name,
          block.title,
          position,
          signaturesY,
          fonts,
          block.signaturePath || undefined
        );
      }
    }

    // === FOOTER ===
    const footerY = height - 450;
    
    ctx.fillStyle = headerColor;
    ctx.fillRect(borderMargin, footerY, width - 2 * borderMargin, height - footerY - borderMargin);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = fonts.footer;
    ctx.textAlign = 'left';
    ctx.fillText(footerRegLine, borderMargin + 50, footerY + 100);
    
    ctx.textAlign = 'right';
    ctx.fillText(footerDateLine, width - borderMargin - 50, footerY + 100);

    ctx.font = fonts.footerAddress;
    ctx.textAlign = 'left';
    
    const footerTexts = [
      'Central Office :- D-305 Kanha Kunj, Indira Park, Najafgarh, New Delhi - 110043',
      'Head Office :- 883, Shri Vedehi Vallabh Kunj, Vavan Mandir, Ayodhya (Uttar Pradesh) - 224001',
      'Head Office -: Shri Rameshwaram Dham, Ganga Surajpur Colony, Harpurkala, Haridwar (Uttarakhand) - 249205'
    ];
    
    footerTexts.forEach((text, index) => {
      ctx.fillText(text, borderMargin + 60, footerY + 180 + (index * 60));
    });

    // === GOLDEN BORDERS ===
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 15;
    ctx.strokeRect(30, 30, width - 60, height - 60);
    
    ctx.lineWidth = 8;
    ctx.strokeRect(60, 60, width - 120, height - 120);

    // Convert to PDF
    const pngBuffer = canvas.toBuffer('image/png');
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]);
    
    const pngImage = await pdfDoc.embedPng(pngBuffer);
    const { width: imgWidth, height: imgHeight } = pngImage.scale(1);
    const pageWidth = page.getWidth();
    const pageHeight = page.getHeight();
    
    const scaleX = pageWidth / imgWidth;
    const scaleY = pageHeight / imgHeight;
    const scale = Math.min(scaleX, scaleY);
    
    const scaledWidth = imgWidth * scale;
    const scaledHeight = imgHeight * scale;
    const x = (pageWidth - scaledWidth) / 2;
    const y = (pageHeight - scaledHeight) / 2;
    
    page.drawImage(pngImage, {
      x: x,
      y: y,
      width: scaledWidth,
      height: scaledHeight,
    });

    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(fullPath, pdfBytes);

    return {
      certificateNumber,
      certificatePath
    };
  } catch (error) {
    console.error('Error generating certificate:', error);
    throw new Error('Failed to generate certificate');
  }
}

export async function downloadCertificate(certificatePath: string): Promise<Buffer> {
  try {
    const fullPath = path.join(process.cwd(), 'public', certificatePath);
    return fs.readFileSync(fullPath);
  } catch (error) {
    console.error('Error reading certificate:', error);
    throw new Error('Certificate not found');
  }
}

function formatDateByLanguage(dateString: string, language: 'hi' | 'en'): string {
  const date = new Date(dateString);
  const locale = language === 'hi' ? 'hi-IN' : 'en-GB';
  return date.toLocaleDateString(locale);
}

async function drawSignatureBlock(
  ctx: CanvasRenderingContext2D,
  name: string,
  title: string,
  x: number,
  y: number,
  fonts: { signatureName: string; signatureTitle: string },
  signaturePath?: string
) {
  const blockWidth = 500;
  const blockHeight = 250;
  
  // Load and draw signature image if available
  let signatureImage = null;
  if (signaturePath) {
    try {
      signatureImage = await loadSignatureImage(signaturePath);
    } catch (error) {
      console.error('Error loading signature image:', error);
    }
  }

  // Calculate positions
  let lineY = y; // Horizontal line position
  let nameY = y + 80; // Name position (below the line)
  
  // Draw signature image first (if available)
  if (signatureImage) {
    // Draw signature image bigger and higher up
    const sigHeight = 130; // Increased from 90 to 130 for bigger signature
    const sigWidth = (signatureImage.width / signatureImage.height) * sigHeight;
    const sigX = x + (blockWidth - sigWidth) / 2;
    const sigY = y - 150; // Move signature higher up to accommodate larger size
    ctx.drawImage(signatureImage, sigX, sigY, sigWidth, sigHeight);
    
    // Adjust line position to be below signature with more spacing
    lineY = sigY + sigHeight + 20; // Increased spacing from 15 to 20
    nameY = lineY + 50; // Increased spacing from 25 to 50 to prevent merging
  } else {
    // If no signature image, adjust name position for better spacing
    nameY = lineY + 50; // Increased spacing from default
  }
  
  // Draw horizontal line (always draw, either below signature or at default position)
  ctx.strokeStyle = '#E30303';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x + 20, lineY);
  ctx.lineTo(x + blockWidth - 40, lineY);
  ctx.stroke();
  
  // Name (bigger font) - wrap if too long
  ctx.fillStyle = '#1F2937';
  ctx.font = fonts.signatureName;
  ctx.textAlign = 'center';
  const maxNameWidth = blockWidth - 40; // Leave padding
  const nameLines = wrapText(ctx, name, maxNameWidth);
  nameLines.forEach((line, index) => {
    ctx.fillText(line, x + blockWidth / 2, nameY + (index * 55));
  });
  
  // Adjust title Y position based on name lines
  const titleStartY = nameY + (nameLines.length * 55) + 20;
  
  // Title/Designation (bigger font) - wrap if too long
  ctx.font = fonts.signatureTitle;
  ctx.fillStyle = '#E30303';
  
  // Handle multi-line titles with text wrapping to prevent overflow
  const maxTitleWidth = blockWidth - 40; // Leave some padding
  const titleParts = title.split(', ');
  const titleLines: string[] = [];
  
  // Wrap each part and combine
  for (const part of titleParts) {
    const wrapped = wrapText(ctx, part, maxTitleWidth);
    titleLines.push(...wrapped);
  }
  
  // Draw wrapped title lines
  titleLines.forEach((line, index) => {
    ctx.fillText(line, x + blockWidth / 2, titleStartY + (index * 50));
  });
}

async function loadSignatureImage(signaturePath?: string | null) {
  if (!signaturePath) return null;
  const trimmed = signaturePath.trim();
  if (!trimmed) return null;

  // Handle API endpoint for certificate signatures
  const apiMatch = trimmed.match(/^\/api\/media\/certificate-signatures\/(\d+)\/signature/);
  if (apiMatch) {
    const signatureId = Number(apiMatch[1]);
    if (!Number.isNaN(signatureId)) {
      const rows = await executeQuery(
        'SELECT signature_blob FROM certificate_signatures WHERE id = ? AND is_active = TRUE LIMIT 1',
        [signatureId]
      ) as Array<{ signature_blob: Buffer | null }>;
      const buffer = rows[0]?.signature_blob;
      if (buffer && buffer.length > 0) {
        return await loadImage(buffer);
      }
    }
  }

  // Handle file path
  const normalizedPath = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed;
  const absolutePath = path.join(process.cwd(), 'public', normalizedPath);
  if (fs.existsSync(absolutePath)) {
    return await loadImage(absolutePath);
  }

  return null;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';
  
  for (const word of words) {
    const testLine = currentLine + (currentLine ? ' ' : '') + word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth) {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  
  return lines;
}