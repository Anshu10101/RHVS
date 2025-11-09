import { createCanvas, loadImage, registerFont } from 'canvas';
import { PDFDocument, rgb } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { executeQuery } from '@/lib/database';

interface IDCardData {
  memberId: number;
  memberName: string;
  memberRegNumber: string;
  profilePhotoPath?: string;
  address?: string;
  designation?: string;
}

interface IDCardResult {
  idCardPath: string;
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

export async function generateIDCard(data: IDCardData): Promise<IDCardResult> {
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

    // ID Card dimensions (standard ID card size: 3.375" x 2.125" at 300 DPI)
    const width = 1013; // 3.375" * 300 DPI
    const height = 638;  // 2.125" * 300 DPI
    
    // Create canvas
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Colors
    const headerColor = '#F97316'; // Orange
    const goldColor = '#D4AF37'; // Gold
    const textColor = '#1F2937'; // Dark gray
    const accentOrange = '#D97706'; // Orange

    // Fill background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    // === HEADER SECTION ===
    const headerHeight = 120;
    
    // Header background
    ctx.fillStyle = headerColor;
    ctx.fillRect(0, 0, width, headerHeight);

    // Organization name in header
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 32px "Mangal", "Noto Sans Devanagari", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('राष्ट्रीय हिन्दू वाहिनी संगठन', width / 2, 50);

    // Subtitle
    ctx.font = 'bold 16px Arial';
    ctx.fillText('Member ID Card', width / 2, 80);

    // === DECORATIVE GOLD LINE ===
    const lineY = headerHeight + 20;
    ctx.strokeStyle = goldColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(50, lineY);
    ctx.lineTo(width - 50, lineY);
    ctx.stroke();

    // Decorative center element
    ctx.fillStyle = goldColor;
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('◆', width / 2, lineY + 8);

    // === MEMBER PHOTO ===
    const photoSize = 180;
    const photoX = width - 220;
    const photoY = lineY + 40;
    
    let photoLoaded = false;
    try {
      const memberPhoto = await loadProfilePhotoImage(data.profilePhotoPath);
      if (memberPhoto) {
        // Photo frame
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(photoX - 5, photoY - 5, photoSize + 10, photoSize + 10);
        
        // Gold border
        ctx.strokeStyle = goldColor;
        ctx.lineWidth = 3;
        ctx.strokeRect(photoX - 5, photoY - 5, photoSize + 10, photoSize + 10);
        
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

    // If photo not loaded, draw placeholder
    if (!photoLoaded) {
      ctx.fillStyle = '#F3F4F6';
      ctx.fillRect(photoX, photoY, photoSize, photoSize);
      
      ctx.strokeStyle = goldColor;
      ctx.lineWidth = 3;
      ctx.strokeRect(photoX - 5, photoY - 5, photoSize + 10, photoSize + 10);
      
      ctx.fillStyle = '#9CA3AF';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('No Photo', photoX + photoSize/2, photoY + photoSize/2);
    }

    // === MEMBER INFORMATION ===
    const infoX = 50;
    const infoY = lineY + 60;
    const lineHeight = 35;
    
    ctx.fillStyle = textColor;
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'left';
    
    // Registration Number
    ctx.fillText(`Reg. No. - ${data.memberRegNumber}`, infoX, infoY);
    
    // Member Name
    ctx.fillText(`Name - ${data.memberName}`, infoX, infoY + lineHeight);
    
    // Address
    const address = data.address || 'Not provided';
    ctx.fillText(`Address - ${address}`, infoX, infoY + (lineHeight * 2));
    
    // Designation
    const designation = data.designation || 'Member';
    ctx.fillText(`Designation - ${designation}`, infoX, infoY + (lineHeight * 3));

    // === BOTTOM DECORATIVE LINE ===
    const bottomLineY = height - 40;
    ctx.strokeStyle = goldColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(50, bottomLineY);
    ctx.lineTo(width - 50, bottomLineY);
    ctx.stroke();

    // Organization name at bottom
    ctx.fillStyle = accentOrange;
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('राष्ट्रीय हिन्दू वाहिनी संगठन', width / 2, bottomLineY + 25);

    // === BORDER ===
    ctx.strokeStyle = goldColor;
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, width - 4, height - 4);

    // Convert to PDF
    const pngBuffer = canvas.toBuffer('image/png');
    const pdfDoc = await PDFDocument.create();
    
    // ID card size in PDF points (3.375" x 2.125")
    const page = pdfDoc.addPage([243, 153]); // 3.375" x 2.125" in points
    
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

    // Save ID card
    const idCardsDir = path.join(process.cwd(), 'public', 'id-cards');
    if (!fs.existsSync(idCardsDir)) {
      fs.mkdirSync(idCardsDir, { recursive: true });
    }

    const pdfBytes = await pdfDoc.save();
    const fileName = `id-card-${data.memberRegNumber}.pdf`;
    const filePath = path.join(idCardsDir, fileName);
    
    fs.writeFileSync(filePath, pdfBytes);

    return {
      idCardPath: `/id-cards/${fileName}`
    };
  } catch (error) {
    console.error('Error generating ID card:', error);
    throw new Error('Failed to generate ID card');
  }
}

export async function downloadIDCard(idCardPath: string): Promise<Buffer> {
  try {
    const fullPath = path.join(process.cwd(), 'public', idCardPath);
    return fs.readFileSync(fullPath);
  } catch (error) {
    console.error('Error reading ID card:', error);
    throw new Error('ID card not found');
  }
}
