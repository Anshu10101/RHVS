import { createCanvas, loadImage, registerFont } from 'canvas';
import { PDFDocument, rgb } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

interface CertificateData {
  memberId: number;
  memberName: string;
  memberRegNumber: string;
  registrationDate: string;
  profilePhotoPath?: string;
}

interface CertificateResult {
  certificateNumber: string;
  certificatePath: string;
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
    const headerColor = '#DC2626';
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

    // Draw Ram image in header
    try {
      const ramImage = await loadImage(path.join(process.cwd(), 'public', 'certificates', 'Ram.png'));
      const ramHeight = 450;
      const ramWidth = (ramImage.width / ramImage.height) * ramHeight;
      ctx.drawImage(ramImage, width - ramWidth - borderMargin - 80, borderMargin + 40, ramWidth, ramHeight);
    } catch (error) {
      console.error('Error loading Ram image:', error);
    }

    // Organization name
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 160px "Mangal", "Noto Sans Devanagari", "Arial Unicode MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('राष्ट्रीय हिन्दू वाहिनी संगठन', width / 2, borderMargin + 200);

    // Taglines
    ctx.font = 'bold 72px "Mangal", "Noto Sans Devanagari", "Arial Unicode MS", sans-serif';
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
    
    // MEMBERSHIP CERTIFICATE text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 84px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('MEMBERSHIP CERTIFICATE', width / 2, ribbonY + 55);

    // === MEMBER PHOTO ===
    const photoSize = 480; // Even bigger photo
    const photoX = width - 600; // Moved more left to avoid text overlap
    const photoY = ribbonY + 200; // Moved even more down
    
    let photoLoaded = false;
    try {
      if (data.profilePhotoPath) {
        const photoPath = path.join(process.cwd(), 'public', data.profilePhotoPath);
        if (fs.existsSync(photoPath)) {
          const memberPhoto = await loadImage(photoPath);
          
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
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('No Photo', photoX + photoSize/2, photoY + photoSize/2);
    }

    // === MEMBER INFO (Right below photo, centered) ===
    const memberInfoY = photoY + photoSize + 80; // More space below photo to avoid collision with border
    
    // Registration Number (much larger font, centered, not underlined)
    const regNumberY = memberInfoY;
    ctx.fillStyle = '#DC2626';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Reg: ${data.memberRegNumber}`, photoX + photoSize/2, regNumberY);

    // === MEMBERSHIP TEXT (Left side, clean formatting) ===
    const membershipBoxY = ribbonY + 280;
    const textBoxX = borderMargin + 80;
    const textBoxWidth = photoX - textBoxX - 120;
    
    // Clean membership text - only member name underlined
    ctx.fillStyle = accentOrange;
    ctx.font = 'bold 64px "Mangal", "Noto Sans Devanagari", Arial, sans-serif'; // Increased from 48px to 64px
    ctx.textAlign = 'left';
    
    const membershipText = `${data.memberName} is now a proud member of राष्ट्रीय हिन्दू वाहिनी संगठन (RHVS) and is committed to serve the organization with dedication and devotion to Sanatan Dharma.`;
    
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
    const motTextY = memberInfoY + 450;
    const motivationalText = "We welcome you to the great family of राष्ट्रीय हिन्दू वाहिनी संगठन. As a member, you are now part of our mission to strengthen Hindu values and protect Sanatan Dharma. We hope you will contribute significantly to the organization with complete devotion, honesty, and dedication to our nation and dharma.";

    // Motivational text
    ctx.fillStyle = textColor;
    ctx.font = 'italic 64px "Mangal", "Noto Sans Devanagari", "Georgia", serif'; // Increased from 48px to 64px
    ctx.textAlign = 'center';
    
    const maxWidth = width - 300;
    const motLines = wrapText(ctx, motivationalText, maxWidth);
    
    motLines.forEach((line, index) => {
      ctx.fillText(line, width / 2, motTextY + (index * 90)); // Increased line spacing from 75 to 90
    });

    // === SIGNATURES SECTION ===
    const signaturesY = motTextY + (motLines.length * 90) + 200; // Updated to match new line spacing
    
    const signatureBlockWidth = 500;
    const signatureSpacing = 60;
    const totalSignatureWidth = (signatureBlockWidth * 4) + (signatureSpacing * 3);
    const signatureStartX = (width - totalSignatureWidth) / 2;
    
    const sigX1 = signatureStartX;
    const sigX2 = sigX1 + signatureBlockWidth + signatureSpacing;
    const sigX3 = sigX2 + signatureBlockWidth + signatureSpacing;
    const sigX4 = sigX3 + signatureBlockWidth + signatureSpacing;

    drawSignatureBlock(ctx, 'नवीन चन्द्र शुक्ला', 'राष्ट्रीय महामंत्री', sigX1, signaturesY);
    drawSignatureBlock(ctx, 'रमेश चन्द्र द्विवेदी "राजू भैया"', 'राष्ट्रीय अध्यक्ष', sigX2, signaturesY);
    drawSignatureBlock(ctx, 'डॉ॰ विभा द्विवेदी', 'राष्ट्रीय महामंत्री, महिला मोर्चा', sigX3, signaturesY);
    drawSignatureBlock(ctx, 'डॉ॰ मयंक ढेंगुला', 'राष्ट्रीय प्रभारी एवं सदस्यता प्रमुख', sigX4, signaturesY);

    // === FOOTER ===
    const footerY = height - 450;
    
    ctx.fillStyle = headerColor;
    ctx.fillRect(borderMargin, footerY, width - 2 * borderMargin, height - footerY - borderMargin);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Reg. no - ${certificateNumber}`, borderMargin + 50, footerY + 100);
    
    ctx.textAlign = 'right';
    ctx.fillText(`Date - ${formatDate(data.registrationDate)}`, width - borderMargin - 50, footerY + 100);

    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    
    const footerTexts = [
      'Central Office :- D-305 Kanha Kunj, Indira Park, Najafgarh, New Delhi - 110043',
      'Head Office :- 883, Shri Vedehi Vallabh Kunj, Vavan Mandir, Ayodhya (Uttar Pradesh) - 224001',
      'Head Office -: Shri Rameshwaram Dham, Ganga Surajpur Colony, Harpurkala, Haridwar (Uttarakhand) - 249205'
    ];
    
    footerTexts.forEach((text, index) => {
      ctx.fillText(text, width / 2, footerY + 180 + (index * 60));
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

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB');
}

function drawSignatureBlock(ctx: any, name: string, title: string, x: number, y: number) {
  const blockWidth = 500;
  const blockHeight = 250;
  
  // Signature line
  ctx.strokeStyle = '#DC2626';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x + 20, y);
  ctx.lineTo(x + blockWidth - 40, y);
  ctx.stroke();
  
  // Name
  ctx.fillStyle = '#1F2937';
  ctx.font = 'bold 38px "Mangal", "Noto Sans Devanagari", "Arial Unicode MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(name, x + blockWidth / 2, y + 70);
  
  // Title
  ctx.font = 'bold 42px "Mangal", "Noto Sans Devanagari", "Arial Unicode MS", sans-serif';
  ctx.fillStyle = '#DC2626';
  
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