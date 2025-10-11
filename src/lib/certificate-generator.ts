import { createCanvas, loadImage, registerFont } from 'canvas';
import { PDFDocument, rgb } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

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

export async function generateCertificate(data: CertificateData): Promise<string> {
  // Certificate dimensions (A4 size in pixels at 300 DPI)
  const width = 2480;
  const height = 3508;
  
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

  // Draw Ram image in header (top right)
  try {
    const ramImage = await loadImage(path.join(process.cwd(), 'public', 'certificates', 'Ram.png'));
    const ramHeight = 450;
    const ramWidth = (ramImage.width / ramImage.height) * ramHeight;
    ctx.drawImage(ramImage, width - ramWidth - borderMargin - 80, borderMargin + 40, ramWidth, ramHeight);
  } catch (error) {
    console.error('Error loading Ram image:', error);
  }

  // Organization name - Hindi (larger font)
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 160px "Arial Unicode MS", "Mangal", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('राष्ट्रीय हिन्दू वाहिनी संगठन', width / 2 - 100, borderMargin + 200);

  // Taglines (larger font)
  ctx.font = 'bold 72px "Arial Unicode MS", "Mangal", sans-serif';
  ctx.fillStyle = '#FCD34D';
  ctx.fillText('।। गर्व से कहो हम हिन्दू हैं ।।', width / 2 - 100, borderMargin + 320);
  ctx.fillText('।। हिन्दुस्तान हमारा है ।।', width / 2 - 100, borderMargin + 400);

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

  // Draw decorative line below title using design.png - maintain aspect ratio
  try {
    const designImage = await loadImage(path.join(process.cwd(), 'public', 'certificates', 'design.png'));
    
    // Calculate dimensions maintaining aspect ratio
    const originalWidth = designImage.width;
    const originalHeight = designImage.height;
    const aspectRatio = originalWidth / originalHeight;
    
    // Set desired height and calculate width to maintain aspect ratio
    const designHeight = 120; // Much larger height for better proportion
    const designWidth = designHeight * aspectRatio;
    
    // Center the image horizontally
    const designX = (width - designWidth) / 2;
    ctx.drawImage(designImage, designX, ribbonY + 120, designWidth, designHeight);
  } catch (error) {
    console.error('Error loading design image:', error);
  }

  // === MEMBER APPOINTMENT INFO ===
  const appointmentBoxY = ribbonY + 180;
  
  const appointmentText = `${data.member.name} is appointed as ${data.department.post_name_en}`;
  const levelText = getLevelText(data.level, data.state, data.district);
  const fullAppointmentText = `${appointmentText}, ${data.department.dept_name_en}${levelText}.`;

  // Wrap appointment text
  const appointmentLines = wrapText(ctx, fullAppointmentText, width - 600);
  
  // Draw appointment text box with decorative border
  const boxPadding = 50;
  const lineHeight = 65;
  const boxHeight = appointmentLines.length * lineHeight + boxPadding * 2;
  const boxX = 150;
  const boxWidth = width - 500;
  
  // Box background (no border)
  ctx.fillStyle = 'rgba(255, 243, 205, 0.4)';
  ctx.fillRect(boxX, appointmentBoxY, boxWidth, boxHeight);

  // Appointment text in orange/accent color (larger font)
  ctx.fillStyle = accentOrange;
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  appointmentLines.forEach((line, index) => {
    ctx.fillText(line, width / 2, appointmentBoxY + boxPadding + (index * lineHeight) + 35);
  });

  // === MEMBER PHOTO ===
  const photoSize = 300; // Slightly larger photo
  const photoX = width - 450; // Moved more left
  const photoY = appointmentBoxY + 100; // Moved much more down
  
  try {
    let memberPhoto;
    if (data.member.profile_photo_path) {
      const photoPath = path.join(process.cwd(), 'public', data.member.profile_photo_path);
      if (fs.existsSync(photoPath)) {
        memberPhoto = await loadImage(photoPath);
      }
    }
    
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

  // === MEMBER NAME AND DESIGNATION (Right in front of photo) ===
  const memberInfoY = photoY + photoSize + 60;
  
  // Member name (much larger font)
  ctx.fillStyle = '#1F2937'; // Dark gray for better readability
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(data.member.name, photoX + photoSize/2, memberInfoY);
  
  // Designation (much larger font)
  ctx.fillStyle = '#DC2626';
  ctx.font = 'bold 36px Arial';
  ctx.fillText(`${data.department.post_name_en}`, photoX + photoSize/2, memberInfoY + 50);
  ctx.fillText(`${data.department.dept_name_en}`, photoX + photoSize/2, memberInfoY + 100);

  // === MOTIVATIONAL TEXT/OATH (Below member info) ===
  const motTextY = memberInfoY + 180; // More space after member info
  const motivationalText = "Hearty congratulations to you. We hope you will make a significant contribution to strengthening the organization by giving it even more momentum. You are expected to fulfill your responsibilities with complete devotion and honesty, in the interest of the organization, the nation, and the protection of Sanatan Dharma.";
  
  // Decorative line above motivational text
  drawOrnamentalLine(ctx, width / 2, motTextY - 60, 700, borderColor);

  // Add quote marks around motivational text
  ctx.font = 'bold 100px Arial'; // Even larger quote marks
  ctx.fillStyle = 'rgba(220, 38, 38, 0.2)';
  ctx.fillText('"', 100, motTextY - 40);
  ctx.fillText('"', width - 100, motTextY + 180);

  // Motivational text (much larger font with better wrapping)
  ctx.fillStyle = textColor;
  ctx.font = 'italic 42px "Georgia", serif'; // Much larger font
  ctx.textAlign = 'center';
  
  // Split text into fewer, longer lines
  const maxWidth = width - 400; // Wider text area
  const motLines = wrapText(ctx, motivationalText, maxWidth);
  
  motLines.forEach((line, index) => {
    ctx.fillText(line, width / 2, motTextY + (index * 70)); // More line spacing
  });

  // === CENTRAL EMBLEM (REMOVED - No more Shri Ram Hindu Rashtra round UI) ===

  // === SIGNATURES SECTION ===
  const signaturesY = motTextY + (motLines.length * 60) + 100;
  
  // Decorative line above signatures
  drawOrnamentalLine(ctx, width / 2, signaturesY - 60, 700, borderColor);

  const signatureSpacing = (width - 200) / 3;
  const sigX1 = 100;
  const sigX2 = sigX1 + signatureSpacing;
  const sigX3 = sigX2 + signatureSpacing;

  // Draw signature blocks (3 instead of 4)
  drawSignatureBlock(ctx, 'सचिव', 'Secretary', sigX1, signaturesY);
  drawSignatureBlock(ctx, 'प्रदेश अध्यक्ष', 'State President', sigX2, signaturesY);
  drawSignatureBlock(ctx, 'डॉ. अजय मिश्रा', 'Dr. Ajay Mishra', sigX3, signaturesY);

  // === FOOTER ===
  const footerY = height - 450; // Even larger footer height
  
  // Draw decorative line above footer (using design.png) - maintain aspect ratio
  try {
    const designImage = await loadImage(path.join(process.cwd(), 'public', 'certificates', 'design.png'));
    
    // Calculate dimensions maintaining aspect ratio
    const originalWidth = designImage.width;
    const originalHeight = designImage.height;
    const aspectRatio = originalWidth / originalHeight;
    
    // Set desired height and calculate width to maintain aspect ratio
    const designHeight = 150; // Much larger height for better proportion
    const designWidth = designHeight * aspectRatio;
    
    // Center the image horizontally and position it higher
    const designX = (width - designWidth) / 2;
    ctx.drawImage(designImage, designX, footerY - 200, designWidth, designHeight);
  } catch (error) {
    console.error('Error loading bottom design image:', error);
  }
  
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
  const fileName = `certificate-${data.certificate_number}.pdf`;
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

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB');
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
  const blockWidth = 400;
  const blockHeight = 140;
  
  // Signature line
  ctx.strokeStyle = '#DC2626';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 20, y);
  ctx.lineTo(x + blockWidth - 40, y);
  ctx.stroke();
  
  // Name
  ctx.fillStyle = '#1F2937';
  ctx.font = 'bold 24px "Arial Unicode MS", "Mangal", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(name, x + blockWidth / 2, y + 45);
  
  // Title
  ctx.font = '20px "Arial Unicode MS", "Mangal", sans-serif';
  ctx.fillStyle = '#DC2626';
  ctx.fillText(title, x + blockWidth / 2, y + 85);
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