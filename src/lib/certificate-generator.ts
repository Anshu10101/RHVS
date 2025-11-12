import { createCanvas, loadImage, registerFont } from 'canvas';
import { PDFDocument, rgb } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { executeQuery } from '@/lib/database';

interface CertificateData {
  member: {
    id: number;
    name: string;
    member_reg_number: string;
    profile_photo_path?: string;
    state?: string;
    district?: string;
  };
  department: {
    dept_name_en: string;
    dept_name_hi: string;
    post_name_en: string;
    post_name_hi: string;
  };
  level: 'national' | 'state' | 'district';
  state?: string | null;
  district?: string | null;
  appointment_date: string;
  certificate_number: string;
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

export async function generateAppointmentCertificate(data: CertificateData): Promise<string> {
  // Certificate dimensions (A4 size in pixels at 300 DPI)
  const width = 2480;
  const height = 3508;
  const organizationRegNumber = '169';
  
  const borderMargin = 60; // Define border margin for consistent positioning
  
  // Create canvas
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Colors
  const headerColor = '#DC2626'; // Red
  const borderColor = '#FCD34D'; // Yellow/Gold
  const textColor = '#1F2937'; // Dark gray
  const accentOrange = '#D97706'; // Orange

  // Fill background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);
  
  // Draw watermarks in background
  try {
    // RHVS logo watermark (much larger and more prominent)
    const rhvsWatermark = await loadImage(path.join(process.cwd(), 'public', 'certificates', 'rhvs_logo.png'));
    ctx.globalAlpha = 0.12; // Increased opacity for better visibility
    const rhvsSize = 1400; // Much larger watermark
    const rhvsX = (width - rhvsSize) / 2;
    const rhvsY = (height - rhvsSize) / 2;
    ctx.drawImage(rhvsWatermark, rhvsX, rhvsY, rhvsSize, rhvsSize);
    
    ctx.globalAlpha = 1.0;
  } catch (error) {
    console.error('Error loading watermark images:', error);
  }

  // === HEADER SECTION ===
  const headerHeight = 700;
  
  // Draw header background with straight edges
  ctx.fillStyle = headerColor;
  ctx.fillRect(borderMargin, borderMargin + 20, width - 2 * borderMargin, headerHeight - borderMargin - 40);

  // Additional watermark in header (removed duplicate)

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

  ctx.fillStyle = '#FCD34D';
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'right';
  ctx.fillText('Reg. No: 169', width - borderMargin - 120, borderMargin + 120);
  ctx.textAlign = 'center';
 
  // Organization name
  ctx.font = 'bold 160px "Mangal", "Noto Sans Devanagari", "Arial Unicode MS", sans-serif';
  ctx.fillStyle = '#FCD34D';
  ctx.fillText('राष्ट्रीय हिन्दू वाहिनी संगठन', width / 2 + 40, borderMargin + 260);

  // Taglines (larger font)
  ctx.font = 'bold 72px "Mangal", "Noto Sans Devanagari", "Arial Unicode MS", sans-serif';
  ctx.fillStyle = '#FCD34D';
  ctx.fillText('।। गर्व से कहो हम हिन्दू हैं ।।', width / 2 + 40, borderMargin + 380);
  ctx.fillText('।। हिन्दुस्तान हमारा है ।।', width / 2 + 40, borderMargin + 460);

  // === CONTENT SECTION ===
  const contentStartY = headerHeight - borderMargin + 40;
  

  // APPOINTMENT LETTER title with ribbon effect
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
  
  // APPOINTMENT LETTER text (larger font)
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 84px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('APPOINTMENT LETTER', width / 2, ribbonY + 55);


  // === MEMBER APPOINTMENT INFO ===
  const appointmentBoxY = ribbonY + 180;
  
  // === MEMBER PHOTO === (define before using photoX for text layout)
  const photoSize = 480;
  const photoX = width - 600;
  const photoY = appointmentBoxY + 200;

  const textStartX = borderMargin + 80;
  const textAreaWidth = photoX - textStartX - 120;
  const messageStartY = appointmentBoxY + 320;
  ctx.textAlign = 'left';
  ctx.fillStyle = accentOrange;
  ctx.font = 'bold 64px "Mangal", "Noto Sans Devanagari", "Arial Unicode MS", sans-serif';

  const departmentName = (data.department.dept_name_hi || data.department.dept_name_en || '').trim();
  const postName = (data.department.post_name_hi || data.department.post_name_en || '').trim();
  const deptPostPhrase = `${departmentName} ${postName}`.trim();
  const appointmentMessage = `${data.member.name} को ${deptPostPhrase} पद पर नियुक्त किया जाता है और संगठन अपेक्षा करता है कि आप अनुशासन तथा राष्ट्रधर्म को सर्वोपरि रखेंगे।`;

  const appointmentLines = wrapText(ctx, appointmentMessage, textAreaWidth);
  appointmentLines.forEach((line, index) => {
    const lineY = messageStartY + index * 80;
    ctx.fillText(line, textStartX, lineY);

    underlinePhrase(ctx, line, data.member.name, textStartX, lineY, accentOrange, 4);
    underlinePhrase(ctx, line, deptPostPhrase, textStartX, lineY, accentOrange, 4);
  });

  // Address intentionally omitted per requirements

  // === MEMBER PHOTO ===
  try {
    const memberPhoto = await loadProfilePhotoImage(data.member.profile_photo_path);
    
    if (memberPhoto) {
      // White background + golden border (same as membership certificate)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(photoX - 8, photoY - 8, photoSize + 16, photoSize + 16);
      
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 4;
      ctx.strokeRect(photoX - 8, photoY - 8, photoSize + 16, photoSize + 16);
      
      ctx.drawImage(memberPhoto, photoX, photoY, photoSize, photoSize);
    }
  } catch (error) {
    console.error('Error loading member photo:', error);
  }

  const memberInfoY = photoY + photoSize + 80;
  ctx.font = 'bold 32px Arial';
  ctx.fillStyle = '#DC2626';
  ctx.textAlign = 'center';
  ctx.fillText(`Reg: ${data.member.member_reg_number}`, photoX + photoSize / 2, memberInfoY);
  ctx.textAlign = 'center';

  // === MOTIVATIONAL TEXT/OATH (Much lower on certificate) ===
  const motTextY = memberInfoY + 350; // Much more space after member info
  const motivationalText = "Hearty congratulations to you. We hope you will make a significant contribution to strengthening the organization by giving it even more momentum. You are expected to fulfill your responsibilities with complete devotion and honesty, in the interest of the organization, the nation, and the protection of Sanatan Dharma.";
  

  // Add quote marks around motivational text
  ctx.font = 'bold 150px Arial'; // Much larger quote marks
  ctx.fillStyle = 'rgba(220, 38, 38, 0.15)';
  ctx.fillText('"', 80, motTextY - 60);
  ctx.fillText('"', width - 80, motTextY + 220);

  // Motivational text (MUCH larger font with better wrapping)
  ctx.fillStyle = textColor;
  ctx.font = 'italic 56px "Georgia", serif'; // MUCH larger font
  ctx.textAlign = 'center';
  
  // Split text into fewer, longer lines
  const maxWidth = width - 300; // Even wider text area for larger font
  const motLines = wrapText(ctx, motivationalText, maxWidth);
  
  motLines.forEach((line, index) => {
    ctx.fillText(line, width / 2, motTextY + (index * 85)); // Much more line spacing for larger font
  });

  // === CENTRAL EMBLEM (REMOVED - No more Shri Ram Hindu Rashtra round UI) ===

  // === SIGNATURES SECTION (Much lower on certificate) ===
  const signaturesY = motTextY + (motLines.length * 85) + 200; // Much more space after oath
  

  // Center the signatures properly
  // Calculate positions for four signature blocks
  const signatureBlockWidth = 500; // Width of each signature block
  const signatureSpacing = 60; // Gap between blocks
  const totalSignatureWidth = (signatureBlockWidth * 4) + (signatureSpacing * 3); // 4 blocks + 3 gaps
  const signatureStartX = (width - totalSignatureWidth) / 2;
  
  // Calculate X positions for each signature block
  const sigX1 = signatureStartX;
  const sigX2 = sigX1 + signatureBlockWidth + signatureSpacing;
  const sigX3 = sigX2 + signatureBlockWidth + signatureSpacing;
  const sigX4 = sigX3 + signatureBlockWidth + signatureSpacing;

  // Draw all four signature blocks
  drawSignatureBlock(ctx, 'नवीन चन्द्र शुक्ला', 'राष्ट्रीय महामंत्री', sigX1, signaturesY);
  drawSignatureBlock(ctx, 'रमेश चन्द्र द्विवेदी "राजू भैया"', 'राष्ट्रीय अध्यक्ष', sigX2, signaturesY);
  drawSignatureBlock(ctx, 'डॉ॰ विभा द्विवेदी', 'राष्ट्रीय महामंत्री, महिला मोर्चा', sigX3, signaturesY);
  drawSignatureBlock(ctx, 'डॉ॰ मयंक ढेंगुला', 'राष्ट्रीय प्रभारी एवं सदस्यता प्रमुख', sigX4, signaturesY);

  // === FOOTER ===
  const footerY = height - 450; // Even larger footer height
  
  // Draw decorative line above footer (using design.png) - maintain aspect ratio
  
  // Footer background within border
  ctx.fillStyle = headerColor;
  ctx.fillRect(borderMargin, footerY, width - 2 * borderMargin, height - footerY - borderMargin);

  // Registration number and date in footer (much larger font)
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 48px Arial'; // Much larger font
  ctx.textAlign = 'left';
  ctx.fillText(`Reg. no - ${data.certificate_number}`, borderMargin + 50, footerY + 100); // Adjusted Y position
  
  ctx.textAlign = 'right';
  ctx.fillText(`Date - ${formatDate(data.appointment_date)}`, width - borderMargin - 50, footerY + 100); // Adjusted Y position

  // Footer text (much larger font)
  ctx.font = 'bold 40px Arial';
  ctx.textAlign = 'left';
  
  const footerTexts = [
    'Central Office :- D-305 Kanha Kunj, Indira Park, Najafgarh, New Delhi - 110043',
    'Head Office :- 883, Shri Vedehi Vallabh Kunj, Vavan Mandir, Ayodhya (Uttar Pradesh) - 224001',
    'Head Office -: Shri Rameshwaram Dham, Ganga Surajpur Colony, Harpurkala, Haridwar (Uttarakhand) - 249205'
  ];
  
  footerTexts.forEach((text, index) => {
    ctx.fillText(text, borderMargin + 60, footerY + 180 + (index * 60));
  });

  // === DRAW GOLDEN BORDERS ON TOP OF EVERYTHING ===
  // Draw complete golden border around entire A4 page
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 15;
  ctx.strokeRect(30, 30, width - 60, height - 60);
  
  // Draw inner golden border
  ctx.lineWidth = 8;
  ctx.strokeRect(60, 60, width - 120, height - 120);

  // Save certificate as PDF
  const certificatesDir = path.join(process.cwd(), 'public', 'certificates');
  if (!fs.existsSync(certificatesDir)) {
    fs.mkdirSync(certificatesDir, { recursive: true });
  }

  // Convert canvas to PNG buffer first
  const pngBuffer = canvas.toBuffer('image/png');
  
  // Create PDF document
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 size in PDF points (72 DPI)
  
  // Embed the PNG image
  const pngImage = await pdfDoc.embedPng(pngBuffer);
  
  // Scale the image to fit A4 page
  const { width: imgWidth, height: imgHeight } = pngImage.scale(1);
  const pageWidth = page.getWidth();
  const pageHeight = page.getHeight();
  
  // Calculate scaling to fit A4
  const scaleX = pageWidth / imgWidth;
  const scaleY = pageHeight / imgHeight;
  const scale = Math.min(scaleX, scaleY);
  
  const scaledWidth = imgWidth * scale;
  const scaledHeight = imgHeight * scale;
  const x = (pageWidth - scaledWidth) / 2;
  const y = (pageHeight - scaledHeight) / 2;
  
  // Draw the image on PDF page
  page.drawImage(pngImage, {
    x: x,
    y: y,
    width: scaledWidth,
    height: scaledHeight,
  });

  // Save PDF
  const pdfBytes = await pdfDoc.save();
  const fileName = `certificate-${data.certificate_number}.pdf`;
  const filePath = path.join(certificatesDir, fileName);
  
  fs.writeFileSync(filePath, pdfBytes);

  return `/certificates/${fileName}`;
}

interface MembershipCertificateData {
  member: {
    id: number;
    name: string;
    member_reg_number: string;
    profile_photo_path?: string;
    state?: string;
    district?: string;
  };
  registration_date: string;
  certificate_number: string;
}

export async function generateMembershipCertificate(data: MembershipCertificateData): Promise<string> {
  // Certificate dimensions (A4 size in pixels at 300 DPI)
  const width = 2480;
  const height = 3508;
  const organizationRegNumber = '169';
  
  const borderMargin = 60; // Define border margin for consistent positioning
  
  // Create canvas
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Colors
  const headerColor = '#DC2626'; // Red
  const borderColor = '#FCD34D'; // Yellow/Gold
  const textColor = '#1F2937'; // Dark gray
  const accentOrange = '#D97706'; // Orange

  // Fill background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);
  
  // Draw watermarks in background
  try {
    // RHVS logo watermark (much larger and more prominent)
    const rhvsWatermark = await loadImage(path.join(process.cwd(), 'public', 'certificates', 'rhvs_logo.png'));
    ctx.globalAlpha = 0.12; // Increased opacity for better visibility
    const rhvsSize = 1400; // Much larger watermark
    const rhvsX = (width - rhvsSize) / 2;
    const rhvsY = (height - rhvsSize) / 2;
    ctx.drawImage(rhvsWatermark, rhvsX, rhvsY, rhvsSize, rhvsSize);
    
    ctx.globalAlpha = 1.0;
  } catch (error) {
    console.error('Error loading watermark images:', error);
  }

  // === HEADER SECTION ===
  const headerHeight = 700;
  
  // Draw header background with straight edges
  ctx.fillStyle = headerColor;
  ctx.fillRect(borderMargin, borderMargin + 20, width - 2 * borderMargin, headerHeight - borderMargin - 40);

  // Additional watermark in header (removed duplicate)

  // Draw RHVS logo on left side next to organization name
  try {
    const logoImage = await loadImage(path.join(process.cwd(), 'public', 'certificates', 'rhvs_logo.png'));
    const logoHeight = 260;
    const logoWidth = (logoImage.width / logoImage.height) * logoHeight;
    const logoX = width / 2 - 520;
    const logoY = borderMargin + 40;
    ctx.drawImage(logoImage, logoX, logoY, logoWidth, logoHeight);
  } catch (error) {
    console.error('Error loading RHVS logo:', error);
  }

  // Draw Ram image in header (top right) with lower placement
  try {
    const ramImage = await loadImage(path.join(process.cwd(), 'public', 'certificates', 'Ram.png'));
    const ramHeight = 420;
    const ramWidth = (ramImage.width / ramImage.height) * ramHeight;
    const ramX = width - ramWidth - borderMargin - 80;
    const ramY = borderMargin + 120;
    ctx.drawImage(ramImage, ramX, ramY, ramWidth, ramHeight);
  } catch (error) {
    console.error('Error loading Ram image:', error);
  }

  // Registration number top-right within header
  const membershipHeaderRegText = `Reg. No: ${organizationRegNumber}`;
  ctx.fillStyle = '#FCD34D';
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'right';
  ctx.fillText(membershipHeaderRegText, width - borderMargin - 120, borderMargin + 120);
  ctx.textAlign = 'center';

  // Organization name - Hindi (larger font)
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 160px "Arial Unicode MS", "Mangal", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('राष्ट्रीय हिन्दू वाहिनी संगठन', width / 2, borderMargin + 200);

  // Taglines (larger font)
  ctx.font = 'bold 72px "Arial Unicode MS", "Mangal", sans-serif';
  ctx.fillStyle = '#FCD34D';
  ctx.fillText('।। गर्व से कहो हम हिन्दू हैं ।।', width / 2, borderMargin + 320);
  ctx.fillText('।। हिन्दुस्तान हमारा है ।।', width / 2, borderMargin + 400);

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
  
  // MEMBERSHIP CERTIFICATE text (larger font)
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 84px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('MEMBERSHIP CERTIFICATE', width / 2, ribbonY + 55);

  // === MEMBER MEMBERSHIP INFO ===
  const membershipBoxY = ribbonY + 180;
  
  const membershipText = `${data.member.name} is now a proud member of राष्ट्रीय हिन्दू वाहिनी संगठन (RHVS)`;
  const fullMembershipText = `${membershipText} and is committed to serve the organization with dedication and devotion to Sanatan Dharma.`;

  // Wrap membership text
  const membershipLines = wrapText(ctx, fullMembershipText, width - 600);
  
  // Draw membership text (no background, centered, selective underlining)
  const lineHeight = 85; // Increased line height for bigger font
  
  // Membership text in orange/accent color (much larger font, centered)
  ctx.fillStyle = accentOrange;
  ctx.font = 'bold 56px Arial'; // Much bigger font
  ctx.textAlign = 'center';
  
  // Draw text and selectively underline
  membershipLines.forEach((line, index) => {
    const lineY = membershipBoxY + 350 + (index * lineHeight); // Moved much further down
    ctx.fillText(line, width / 2, lineY);
    
    // Only underline if line contains member name
    if (line.includes(data.member.name)) {
      const lineMetrics = ctx.measureText(line);
      ctx.strokeStyle = accentOrange;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(width/2 - lineMetrics.width/2, lineY + 8);
      ctx.lineTo(width/2 + lineMetrics.width/2, lineY + 8);
      ctx.stroke();
    }
  });

  // === MEMBER PHOTO ===
  const photoSize = 300; // Bigger photo
  const photoX = width - 450; // Moved more left
  const photoY = membershipBoxY + 200; // Moved even more down
  
  try {
    const memberPhoto = await loadProfilePhotoImage(data.member.profile_photo_path);
    
    if (memberPhoto) {
      // White background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(photoX - 8, photoY - 8, photoSize + 16, photoSize + 16);
      
      // Gold border
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 4;
      ctx.strokeRect(photoX - 8, photoY - 8, photoSize + 16, photoSize + 16);
      
      // Draw photo
      ctx.drawImage(memberPhoto, photoX, photoY, photoSize, photoSize);
    }
  } catch (error) {
    console.error('Error loading member photo:', error);
  }

  // === MEMBER NAME AND MEMBER INFO (Right below photo, centered and underlined) ===
  const memberInfoY = photoY + photoSize + 50; // More space below photo
  
  // Member name (much larger font, centered, underlined)
  ctx.fillStyle = '#1F2937'; // Dark gray for better readability
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(data.member.name, photoX + photoSize/2, memberInfoY);
  // Underline member name
  const memberNameMetrics = ctx.measureText(data.member.name);
  ctx.strokeStyle = '#1F2937'; // Same color as text
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(photoX + photoSize/2 - memberNameMetrics.width / 2, memberInfoY + 8);
  ctx.lineTo(photoX + photoSize/2 + memberNameMetrics.width / 2, memberInfoY + 8);
  ctx.stroke();
  
  // Registration Number (much larger font, centered, not underlined)
  const regNumberY = memberInfoY + 60;
  ctx.fillStyle = '#DC2626';
  ctx.font = 'bold 36px Arial';
  ctx.fillText(`Reg: ${data.member.member_reg_number}`, photoX + photoSize/2, regNumberY);

  // === MOTIVATIONAL TEXT/OATH (Much lower on certificate) ===
  const motTextY = memberInfoY + 350; // Much more space after member info
  const motivationalText = "Hearty congratulations to you. We hope you will make a significant contribution to strengthening the organization by giving it even more momentum. You are expected to fulfill your responsibilities with complete devotion and honesty, in the interest of the organization, the nation, and the protection of Sanatan Dharma.";
  

  // Add quote marks around motivational text
  ctx.font = 'bold 150px Arial'; // Much larger quote marks
  ctx.fillStyle = 'rgba(220, 38, 38, 0.15)';
  ctx.fillText('"', 80, motTextY - 60);
  ctx.fillText('"', width - 80, motTextY + 220);

  // Motivational text (MUCH larger font with better wrapping)
  ctx.fillStyle = textColor;
  ctx.font = 'italic 56px "Georgia", serif'; // MUCH larger font
  ctx.textAlign = 'center';
  
  // Split text into fewer, longer lines
  const maxWidth = width - 300; // Even wider text area for larger font
  const motLines = wrapText(ctx, motivationalText, maxWidth);
  
  motLines.forEach((line, index) => {
    ctx.fillText(line, width / 2, motTextY + (index * 85)); // Much more line spacing for larger font
  });

  // === CENTRAL EMBLEM (REMOVED - No more Shri Ram Hindu Rashtra round UI) ===

  // === SIGNATURES SECTION (Much lower on certificate) ===
  const signaturesY = motTextY + (motLines.length * 85) + 200; // Much more space after oath
  

  // Center the signatures properly
  // Calculate positions for four signature blocks
  const signatureBlockWidth = 500; // Width of each signature block
  const signatureSpacing = 60; // Gap between blocks
  const totalSignatureWidth = (signatureBlockWidth * 4) + (signatureSpacing * 3); // 4 blocks + 3 gaps
  const signatureStartX = (width - totalSignatureWidth) / 2;
  
  // Calculate X positions for each signature block
  const sigX1 = signatureStartX;
  const sigX2 = sigX1 + signatureBlockWidth + signatureSpacing;
  const sigX3 = sigX2 + signatureBlockWidth + signatureSpacing;
  const sigX4 = sigX3 + signatureBlockWidth + signatureSpacing;

  // Draw all four signature blocks
  drawSignatureBlock(ctx, 'नवीन चन्द्र शुक्ला', 'राष्ट्रीय महामंत्री', sigX1, signaturesY);
  drawSignatureBlock(ctx, 'रमेश चन्द्र द्विवेदी "राजू भैया"', 'राष्ट्रीय अध्यक्ष', sigX2, signaturesY);
  drawSignatureBlock(ctx, 'डॉ॰ विभा द्विवेदी', 'राष्ट्रीय महामंत्री, महिला मोर्चा', sigX3, signaturesY);
  drawSignatureBlock(ctx, 'डॉ॰ मयंक ढेंगुला', 'राष्ट्रीय प्रभारी एवं सदस्यता प्रमुख', sigX4, signaturesY);

  // === FOOTER ===
  const footerY = height - 450; // Even larger footer height
  
  // Draw decorative line above footer (using design.png) - maintain aspect ratio
  
  // Footer background within border
  ctx.fillStyle = headerColor;
  ctx.fillRect(borderMargin, footerY, width - 2 * borderMargin, height - footerY - borderMargin);

  // Registration number and date in footer (much larger font)
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 48px Arial'; // Much larger font
  ctx.textAlign = 'left';
  ctx.fillText(`Reg. no - ${data.certificate_number}`, borderMargin + 50, footerY + 100); // Adjusted Y position
  
  ctx.textAlign = 'right';
  ctx.fillText(`Date - ${formatDate(data.registration_date)}`, width - borderMargin - 50, footerY + 100); // Adjusted Y position

  // Footer text (much larger font)
  ctx.font = 'bold 40px Arial'; // Much larger font
  ctx.textAlign = 'center';
  
  const footerTexts = [
    'Central Office :- D-305 Kanha Kunj, Indira Park, Najafgarh, New Delhi - 110043',
    'Head Office :- 883, Shri Vedehi Vallabh Kunj, Vavan Mandir, Ayodhya (Uttar Pradesh) - 224001',
    'Head Office -: Shri Rameshwaram Dham, Ganga Surajpur Colony, Harpurkala, Haridwar (Uttarakhand) - 249205'
  ];
  
  footerTexts.forEach((text, index) => {
    ctx.fillText(text, width / 2, footerY + 180 + (index * 60)); // Adjusted Y position and line spacing
  });

  // === DRAW GOLDEN BORDERS ON TOP OF EVERYTHING ===
  // Draw complete golden border around entire A4 page
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 15;
  ctx.strokeRect(30, 30, width - 60, height - 60);
  
  // Draw inner golden border
  ctx.lineWidth = 8;
  ctx.strokeRect(60, 60, width - 120, height - 120);

  // Save certificate as PDF
  const certificatesDir = path.join(process.cwd(), 'public', 'certificates');
  if (!fs.existsSync(certificatesDir)) {
    fs.mkdirSync(certificatesDir, { recursive: true });
  }

  // Convert canvas to PNG buffer first
  const pngBuffer = canvas.toBuffer('image/png');
  
  // Create PDF document
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 size in PDF points (72 DPI)
  
  // Embed the PNG image
  const pngImage = await pdfDoc.embedPng(pngBuffer);
  
  // Scale the image to fit A4 page
  const { width: imgWidth, height: imgHeight } = pngImage.scale(1);
  const pageWidth = page.getWidth();
  const pageHeight = page.getHeight();
  
  // Calculate scaling to fit A4
  const scaleX = pageWidth / imgWidth;
  const scaleY = pageHeight / imgHeight;
  const scale = Math.min(scaleX, scaleY);
  
  const scaledWidth = imgWidth * scale;
  const scaledHeight = imgHeight * scale;
  const x = (pageWidth - scaledWidth) / 2;
  const y = (pageHeight - scaledHeight) / 2;
  
  // Draw the image on PDF page
  page.drawImage(pngImage, {
    x: x,
    y: y,
    width: scaledWidth,
    height: scaledHeight,
  });

  // Save PDF
  const pdfBytes = await pdfDoc.save();
  const fileName = `membership-certificate-${data.certificate_number}.pdf`;
  const filePath = path.join(certificatesDir, fileName);
  
  fs.writeFileSync(filePath, pdfBytes);

  return `/certificates/${fileName}`;
}

function getLevelText(level: string, state?: string | null, district?: string | null): string {
  switch (level) {
    case 'national':
      return ' at National Level';
    case 'state':
      return state ? ` at State Level, ${state}` : ' at State Level';
    case 'district':
      return state && district ? ` at District Level, ${district}, ${state}` : ' at District Level';
    default:
      return '';
  }
}

function getLevelTextHindi(level: string, state?: string | null, district?: string | null): string {
  switch (level) {
    case 'national':
      return 'राष्ट्रीय स्तर';
    case 'state':
      return state ? `राज्य स्तर - ${state}` : 'राज्य स्तर';
    case 'district':
      if (state && district) {
        return `जिला स्तर - ${district}, ${state}`;
      }
      if (district) {
        return `जिला स्तर - ${district}`;
      }
      return 'जिला स्तर';
    default:
      return '—';
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB');
}

function formatDateHindi(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('hi-IN');
}

function drawOrnamentalLine(ctx: any, x: number, y: number, lineWidth: number, color: string) {
  const decorSize = 15;
  const padding = 25;
  
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  
  // Left curve
  ctx.beginPath();
  ctx.moveTo(x - lineWidth / 2, y);
  ctx.quadraticCurveTo(x - lineWidth / 2 - padding, y - decorSize, x - lineWidth / 2 - padding * 2, y);
  ctx.stroke();
  
  // Main line
  ctx.beginPath();
  ctx.moveTo(x - lineWidth / 2, y);
  ctx.lineTo(x + lineWidth / 2, y);
  ctx.stroke();
  
  // Right curve
  ctx.beginPath();
  ctx.moveTo(x + lineWidth / 2, y);
  ctx.quadraticCurveTo(x + lineWidth / 2 + padding, y - decorSize, x + lineWidth / 2 + padding * 2, y);
  ctx.stroke();
}

function drawSignatureBlock(ctx: any, name: string, title: string, x: number, y: number) {
  const blockWidth = 500; // Even wider blocks for larger text
  const blockHeight = 250; // Even taller blocks for multi-line titles
  
  // Signature line (thicker)
  ctx.strokeStyle = '#DC2626';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x + 20, y);
  ctx.lineTo(x + blockWidth - 40, y);
  ctx.stroke();
  
  // Name (MUCH larger font)
  ctx.fillStyle = '#1F2937';
  ctx.font = 'bold 38px "Arial Unicode MS", "Mangal", sans-serif'; // Slightly smaller for longer names
  ctx.textAlign = 'center';
  ctx.fillText(name, x + blockWidth / 2, y + 70);
  
  // Title (MUCH larger and bolder font)
  ctx.font = 'bold 42px "Arial Unicode MS", "Mangal", sans-serif'; // Much bigger and bolder
  ctx.fillStyle = '#DC2626';
  
  // Handle multi-line titles
  const titleLines = title.split(', ');
  titleLines.forEach((line, index) => {
    ctx.fillText(line, x + blockWidth / 2, y + 130 + (index * 45));
  });
}

function wrapText(ctx: any, text: string, maxWidth: number): string[] {
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

function underlinePhrase(
  ctx: any,
  line: string,
  phrase: string,
  startX: number,
  baselineY: number,
  color: string,
  lineWidth: number
) {
  if (!phrase || !line.includes(phrase)) return;

  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  const index = line.indexOf(phrase);
  const before = line.substring(0, index);
  const beforeWidth = ctx.measureText(before).width;
  const phraseWidth = ctx.measureText(phrase).width;

  ctx.beginPath();
  ctx.moveTo(startX + beforeWidth, baselineY + 10);
  ctx.lineTo(startX + beforeWidth + phraseWidth, baselineY + 10);
  ctx.stroke();
}