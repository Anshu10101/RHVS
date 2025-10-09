import { createCanvas, loadImage, registerFont } from 'canvas';
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
  
  // Define proper A4 proportions
  const headerHeight = Math.round(height * 0.15); // 15% for header
  const footerHeight = Math.round(height * 0.1);  // 10% for footer
  const contentHeight = height - headerHeight - footerHeight;
  
  // Create canvas
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Colors
  const headerColor = '#DC2626'; // Red
  const footerColor = '#DC2626'; // Red
  const borderColor = '#FCD34D'; // Yellow
  const textColor = '#1F2937'; // Dark gray
  const accentColor = '#F59E0B'; // Orange

  // Fill background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);
  
  // Draw decorative background pattern
  ctx.fillStyle = 'rgba(252, 211, 77, 0.03)'; // Very light gold
  const patternSize = 40;
  for (let x = 0; x < width; x += patternSize) {
    for (let y = 0; y < height; y += patternSize) {
      if ((x + y) % (patternSize * 2) === 0) {
        ctx.fillRect(x, y, patternSize, patternSize);
      }
    }
  }

  // Draw decorative corner elements
  const cornerSize = 100;
  const cornerPadding = 60;
  
  // Top-left corner
  ctx.beginPath();
  ctx.moveTo(cornerPadding, cornerPadding);
  ctx.lineTo(cornerPadding + cornerSize, cornerPadding);
  ctx.moveTo(cornerPadding, cornerPadding);
  ctx.lineTo(cornerPadding, cornerPadding + cornerSize);
  ctx.strokeStyle = '#FCD34D';
  ctx.lineWidth = 3;
  ctx.stroke();
  
  // Top-right corner
  ctx.beginPath();
  ctx.moveTo(width - cornerPadding, cornerPadding);
  ctx.lineTo(width - cornerPadding - cornerSize, cornerPadding);
  ctx.moveTo(width - cornerPadding, cornerPadding);
  ctx.lineTo(width - cornerPadding, cornerPadding + cornerSize);
  ctx.stroke();
  
  // Bottom-left corner
  ctx.beginPath();
  ctx.moveTo(cornerPadding, height - cornerPadding);
  ctx.lineTo(cornerPadding + cornerSize, height - cornerPadding);
  ctx.moveTo(cornerPadding, height - cornerPadding);
  ctx.lineTo(cornerPadding, height - cornerPadding - cornerSize);
  ctx.stroke();
  
  // Bottom-right corner
  ctx.beginPath();
  ctx.moveTo(width - cornerPadding, height - cornerPadding);
  ctx.lineTo(width - cornerPadding - cornerSize, height - cornerPadding);
  ctx.moveTo(width - cornerPadding, height - cornerPadding);
  ctx.lineTo(width - cornerPadding, height - cornerPadding - cornerSize);
  ctx.stroke();

  // Draw watermark
  try {
    const watermarkImage = await loadImage(path.join(process.cwd(), 'public', 'certificates', 'rhvs_logo.png'));
    ctx.globalAlpha = 0.05; // 5% opacity for more subtle watermark
    const watermarkSize = Math.min(width, height) * 0.6; // Slightly smaller
    const watermarkX = (width - watermarkSize) / 2;
    const watermarkY = (height - watermarkSize) / 2;
    ctx.drawImage(watermarkImage, watermarkX, watermarkY, watermarkSize, watermarkSize);
    ctx.globalAlpha = 1.0; // Reset opacity
  } catch (error) {
    console.error('Error loading watermark:', error);
  }

  // Draw border
  ctx.strokeStyle = '#FCD34D'; // Golden border
  ctx.lineWidth = 8;
  ctx.strokeRect(40, 40, width - 80, height - 80);

  // Draw header background
  ctx.fillStyle = '#DC2626'; // Red background
  ctx.fillRect(0, 0, width, headerHeight);

  // Add wave effect to header bottom
  ctx.beginPath();
  ctx.moveTo(0, headerHeight);
  ctx.quadraticCurveTo(width/2, headerHeight + 30, width, headerHeight);
  ctx.lineTo(width, 0);
  ctx.lineTo(0, 0);
  ctx.closePath();
  ctx.fill();

  // Draw Lord Ram image
  try {
    const ramImage = await loadImage(path.join(process.cwd(), 'public', 'certificates', 'Ram.png'));
    const ramHeight = 200;
    const ramWidth = (ramImage.width / ramImage.height) * ramHeight;
    ctx.drawImage(ramImage, width - ramWidth - 50, 25, ramWidth, ramHeight);
  } catch (error) {
    console.error('Error loading Ram image:', error);
  }

  // Draw decorative line
  try {
    const designImage = await loadImage(path.join(process.cwd(), 'public', 'certificates', 'design.png'));
    const designHeight = 50;
    const designWidth = (designImage.width / designImage.height) * designHeight;
    ctx.drawImage(designImage, (width - designWidth) / 2, 350, designWidth, designHeight);
  } catch (error) {
    console.error('Error loading design image:', error);
  }

  // Header text - Organization name
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 48px "Arial Unicode MS", "Mangal", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('राष्ट्रीय हिन्दू वाहिनी संगठन', width / 2, 80);

  // Slogans
  ctx.font = 'bold 24px "Arial Unicode MS", "Mangal", sans-serif';
  ctx.fillText('।। गर्व से कहो हम हिन्दू हैं ।।', width / 2, 120);
  ctx.fillText('।। हिन्दुस्तान हमारा है ।।', width / 2, 150);

  // Draw footer
  ctx.fillStyle = footerColor;
  ctx.fillRect(0, height - footerHeight, width, footerHeight);

  // Footer text - Office addresses
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'center';
  const footerTextY1 = height - footerHeight + Math.round(footerHeight * 0.3);
  const footerTextY2 = height - footerHeight + Math.round(footerHeight * 0.5);
  const footerTextY3 = height - footerHeight + Math.round(footerHeight * 0.7);
  ctx.fillText('Central Office: D-305 Kanha Kunj, Indira Park, Najafgarh, New Delhi - 110043', width / 2, footerTextY1);
  ctx.fillText('Head Office: 883, Shri Vedehi Vallabh Kunj, Vavan Mandir, Ayodhya (Uttar Pradesh) - 224001', width / 2, footerTextY2);
  ctx.fillText('Head Office: Shri Rameshwaram Dham, Ganga Surajpur Colony, Harpurkala, Haridwar (Uttarakhand) - 249205', width / 2, footerTextY3);

  // Main content area - moved up further
  const contentY = 220; // Reduced to minimize empty space
  
  // Registration number and date
  ctx.fillStyle = textColor;
  ctx.font = '20px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(`Reg. no. - ${data.certificate_number}`, 80, contentY);
  
  ctx.textAlign = 'right';
  ctx.fillText(`Date - ${formatDate(data.appointment_date)}`, width - 80, contentY);

  // Draw ribbon for title
  const ribbonWidth = 600;
  const ribbonHeight = 60;
  const ribbonX = (width - ribbonWidth) / 2;
  const ribbonY = contentY + 20;
  
  // Draw ribbon
  ctx.beginPath();
  ctx.moveTo(ribbonX, ribbonY);
  ctx.lineTo(ribbonX + ribbonWidth, ribbonY);
  ctx.lineTo(ribbonX + ribbonWidth + 20, ribbonY + ribbonHeight/2);
  ctx.lineTo(ribbonX + ribbonWidth, ribbonY + ribbonHeight);
  ctx.lineTo(ribbonX, ribbonY + ribbonHeight);
  ctx.lineTo(ribbonX - 20, ribbonY + ribbonHeight/2);
  ctx.closePath();
  
  // Fill with gradient
  const ribbonGradient = ctx.createLinearGradient(ribbonX, ribbonY, ribbonX, ribbonY + ribbonHeight);
  ribbonGradient.addColorStop(0, '#DC2626');
  ribbonGradient.addColorStop(1, '#B91C1C');
  ctx.fillStyle = ribbonGradient;
  ctx.fill();
  
  // APPOINTMENT LETTER title
  ctx.fillStyle = '#FFFFFF'; // White text on red ribbon
  ctx.font = 'bold 36px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('APPOINTMENT LETTER', width / 2, ribbonY + 40);

  // Draw decorative design
  try {
    const designImage = await loadImage(path.join(process.cwd(), 'public', 'certificates', 'design.png'));
    const designHeight = 30;
    const designWidth = 400;
    ctx.drawImage(designImage, (width - designWidth) / 2, contentY + 80, designWidth, designHeight);
  } catch (error) {
    console.error('Error loading design image:', error);
  }

  // Draw small circles
  const circleY = contentY + 95;
  const circleRadius = 4;
  const circleSpacing = 15;
  
  // Draw circles on both sides
  [-1, 1].forEach(side => {
    const x = width/2 + (side * 220); // 220px from center
    ctx.beginPath();
    ctx.arc(x, circleY, circleRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#DC2626';
    ctx.fill();
  });

  // Decorative line
  drawDecorativeLine(ctx, width / 2, contentY + 120, 400);

  // Appointment text
  const appointmentText = `${data.member.name} is appointed as ${data.department.post_name_en} in ${data.department.dept_name_en}`;
  const levelText = getLevelText(data.level, data.state, data.district);
  const fullAppointmentText = `${appointmentText}${levelText}.`;

  ctx.fillStyle = '#F59E0B'; // Orange color for appointment text
  ctx.font = 'bold 28px Arial';
  ctx.textAlign = 'center';
  
  // Split text into lines if too long
  const words = fullAppointmentText.split(' ');
  const lines = [];
  let currentLine = '';
  
  for (const word of words) {
    const testLine = currentLine + (currentLine ? ' ' : '') + word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > width - 200) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  lines.push(currentLine);

  // Draw decorative box around appointment text
  const boxPadding = 40;
  const boxHeight = lines.length * 40 + boxPadding * 2;
  const boxWidth = width - 400;
  const boxX = (width - boxWidth) / 2;
  const boxY = contentY + 160;
  
  // Draw box with rounded corners
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 10);
  ctx.strokeStyle = '#FCD34D'; // Golden border
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // Add subtle gradient background
  const gradient = ctx.createLinearGradient(boxX, boxY, boxX, boxY + boxHeight);
  gradient.addColorStop(0, 'rgba(255, 249, 219, 0.3)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0.1)');
  ctx.fillStyle = gradient;
  ctx.fill();
  
  // Draw appointment text
  lines.forEach((line, index) => {
    ctx.fillStyle = '#F59E0B'; // Orange color for text
    ctx.fillText(line, width / 2, boxY + boxPadding + (index * 40));
  });

  // Calculate where the appointment text ends
  const appointmentTextBottom = boxY + boxHeight + 10;

  // Draw decorative design below appointment text
  try {
    const designImage = await loadImage(path.join(process.cwd(), 'public', 'certificates', 'design.png'));
    const designHeight = 30;
    const designWidth = 400;
    ctx.drawImage(designImage, (width - designWidth) / 2, appointmentTextBottom + 20, designWidth, designHeight);
  } catch (error) {
    console.error('Error loading design image:', error);
  }

  // Draw small circles
  const circleY2 = appointmentTextBottom + 35;
  [-1, 1].forEach(side => {
    const x = width/2 + (side * 220); // 220px from center
    ctx.beginPath();
    ctx.arc(x, circleY2, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#DC2626';
    ctx.fill();
  });

  // Member photo
  try {
    let memberPhoto;
    if (data.member.profile_photo_path) {
      const photoPath = path.join(process.cwd(), 'public', data.member.profile_photo_path);
      if (fs.existsSync(photoPath)) {
        memberPhoto = await loadImage(photoPath);
      }
    }
    
    if (memberPhoto) {
      // Draw photo frame
      const photoSize = 200;
      const photoX = width - 300;
      const photoY = contentY + 150;
      
      // White background for photo
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(photoX - 10, photoY - 10, photoSize + 20, photoSize + 20);
      
      // Border for photo
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 4;
      ctx.strokeRect(photoX - 10, photoY - 10, photoSize + 20, photoSize + 20);
      
      // Draw photo
      ctx.drawImage(memberPhoto, photoX, photoY, photoSize, photoSize);
    }
  } catch (error) {
    console.error('Error loading member photo:', error);
  }

  // Motivational text
  const motivationalText = "Hearty congratulations to you. We hope you will make a significant contribution to strengthening the organization by giving it even more momentum. You are expected to fulfill your responsibilities with complete devotion and honesty, in the interest of the organization, the nation, and the protection of Sanatan Dharma.";
  
  ctx.fillStyle = textColor;
  ctx.font = 'italic 18px Arial';
  ctx.textAlign = 'center';
  
  // Split motivational text into lines
  const motivationalLines = wrapText(ctx, motivationalText, width - 400);
  
  // Calculate position to be between appointment text and signatures
  const textY = appointmentTextBottom + 70;
  
  // Draw decorative box for motivational text
  const motBoxPadding = 30;
  const motBoxHeight = motivationalLines.length * 25 + motBoxPadding * 2;
  const motBoxWidth = width - 300;
  const motBoxX = (width - motBoxWidth) / 2;
  const motBoxY = textY - motBoxPadding;
  
  // Draw decorative background
  ctx.beginPath();
  ctx.roundRect(motBoxX, motBoxY, motBoxWidth, motBoxHeight, 10);
  ctx.fillStyle = 'rgba(220, 38, 38, 0.05)'; // Very light red background
  ctx.fill();
  ctx.strokeStyle = '#DC2626'; // Red border
  ctx.lineWidth = 1;
  ctx.stroke();
  
  // Add quote marks
  ctx.font = 'bold 40px "Arial"';
  ctx.fillStyle = 'rgba(220, 38, 38, 0.2)';
  ctx.fillText('"', motBoxX + 20, motBoxY + 40);
  ctx.fillText('"', motBoxX + motBoxWidth - 30, motBoxY + motBoxHeight - 20);
  
  // Draw motivational text
  ctx.fillStyle = textColor;
  ctx.font = 'italic 18px Arial';
  motivationalLines.forEach((line, index) => {
    ctx.fillText(line, width / 2, textY + (index * 25));
  });

  // Removed extra decorative line

  // Signatures section - moved up significantly to reduce blank space
  const signatureY = contentY + 250;
  const signatureWidth = (width - 200) / 4;
  
  // Draw decorative design above signatures
  try {
    const designImage = await loadImage(path.join(process.cwd(), 'public', 'certificates', 'design.png'));
    const designHeight = 30;
    const designWidth = 400;
    ctx.drawImage(designImage, (width - designWidth) / 2, signatureY - 50, designWidth, designHeight);

    // Draw small circles
    [-1, 1].forEach(side => {
      const x = width/2 + (side * 220);
      ctx.beginPath();
      ctx.arc(x, signatureY - 35, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#DC2626';
      ctx.fill();
    });
  } catch (error) {
    console.error('Error loading design image:', error);
  }
  
  // Signature 1 - National General Secretary
  drawSignatureBlock(ctx, 'नर्वीन चन्द्र शुक्ता', 'राष्ट्रीय महामंत्री', 100, signatureY, signatureWidth);
  
  // Signature 2 - National President
  drawSignatureBlock(ctx, 'रमेश चंद्र द्विवेदी', 'राष्ट्रीय अध्यक्ष', 100 + signatureWidth, signatureY, signatureWidth);
  
  // Signature 3 - National General Secretary, Women's Wing
  drawSignatureBlock(ctx, 'ठोंविभा द्विवेदी', 'राष्ट्रीय महामन्त्री, महिला मोर्चा', 100 + (signatureWidth * 2), signatureY, signatureWidth);
  
  // Signature 4 - National In-charge
  drawSignatureBlock(ctx, 'डॉ. मयंक बेंगुला', 'राष्ट्रीय-प्रभारी एवं सदस्यता प्रमुख', 100 + (signatureWidth * 3), signatureY, signatureWidth);

  // Save certificate
  const certificatesDir = path.join(process.cwd(), 'public', 'certificates');
  if (!fs.existsSync(certificatesDir)) {
    fs.mkdirSync(certificatesDir, { recursive: true });
  }

  const fileName = `certificate-${data.certificate_number}.png`;
  const filePath = path.join(certificatesDir, fileName);
  
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filePath, buffer);

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

function drawDecorativeLine(ctx: any, x: number, y: number, width: number) {
  const lineWidth = 2;
  const decorationSize = 20;
  
  ctx.strokeStyle = '#DC2626';
  ctx.lineWidth = lineWidth;
  
  // Left decoration
  ctx.beginPath();
  ctx.arc(x - width/2 - decorationSize, y, decorationSize, 0, Math.PI * 2);
  ctx.stroke();
  
  // Right decoration
  ctx.beginPath();
  ctx.arc(x + width/2 + decorationSize, y, decorationSize, 0, Math.PI * 2);
  ctx.stroke();
  
  // Main line
  ctx.beginPath();
  ctx.moveTo(x - width/2, y);
  ctx.lineTo(x + width/2, y);
  ctx.stroke();
}

function drawSignatureBlock(ctx: any, name: string, title: string, x: number, y: number, width: number) {
  const textColor = '#1F2937'; // Dark gray color for text
  
  // Draw signature box
  ctx.fillStyle = 'rgba(252, 211, 77, 0.1)'; // Very light gold background
  ctx.fillRect(x, y - 10, width - 20, 60);
  
  // Signature line
  ctx.strokeStyle = '#DC2626'; // Red signature line
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + 10, y);
  ctx.lineTo(x + width - 30, y);
  ctx.stroke();
  
  // Name
  ctx.fillStyle = textColor;
  ctx.font = 'bold 14px "Arial Unicode MS", "Mangal", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(name, x + width/2 - 10, y + 20);
  
  // Title
  ctx.font = '12px "Arial Unicode MS", "Mangal", sans-serif';
  ctx.fillStyle = '#DC2626'; // Red color for title
  ctx.fillText(title, x + width/2 - 10, y + 40);
}

function wrapText(ctx: any, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';
  
  for (const word of words) {
    const testLine = currentLine + (currentLine ? ' ' : '') + word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  lines.push(currentLine);
  
  return lines;
}
