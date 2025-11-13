import { createCanvas, loadImage, registerFont } from 'canvas';
import type { CanvasRenderingContext2D } from 'canvas';
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
  cardType?: 'membership' | 'appointment';
  departmentName?: string | null;
  postName?: string | null;
  level?: 'national' | 'state' | 'district';
  state?: string | null;
  district?: string | null;
  appointmentDate?: string | null;
  language?: 'hi' | 'en';
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

async function getHindiLocationName(
  englishName: string | null | undefined, 
  type: 'district' | 'state',
  stateName?: string | null
): Promise<string | null> {
  if (!englishName || !englishName.trim()) return null;
  
  // For districts, first check if the state is Hindi
  if (type === 'district' && stateName) {
    try {
      const stateQuery = 'SELECT language_pref FROM states WHERE state_name_english = ? LIMIT 1';
      const stateResult = await executeQuery(stateQuery, [stateName.trim()]) as Array<{ language_pref: number | null }>;
      
      // Only try to convert to Hindi if state language preference is Hindi (1)
      if (stateResult.length === 0 || stateResult[0].language_pref !== 1) {
        return null; // State is not Hindi, keep English
      }
    } catch (error) {
      // If we can't check state preference, skip Hindi conversion
      console.warn(`Could not check state language preference:`, error);
      return null;
    }
  }
  
  // Try to fetch Hindi name (only if state is Hindi for districts)
  // Note: districts table doesn't have district_name_hindi column, so skip for districts
  if (type === 'district') {
    return null; // Districts table doesn't have Hindi column
  }
  
  try {
    const table = 'states';
    const nameColumn = 'state_name_english';
    const hindiColumn = 'state_name_hindi';
    
    // Check if Hindi column exists by trying to query it
    const query = `SELECT ${hindiColumn} FROM ${table} WHERE ${nameColumn} = ? LIMIT 1`;
    const result = await executeQuery(query, [englishName.trim()]) as Array<{ [key: string]: string | null }>;
    
    if (result.length > 0 && result[0][hindiColumn]) {
      return result[0][hindiColumn];
    }
  } catch (error: unknown) {
    // If Hindi column doesn't exist (ER_BAD_FIELD_ERROR), silently fall back to English
    const dbError = error as { code?: string; errno?: number; sqlMessage?: string };
    if (dbError.code === 'ER_BAD_FIELD_ERROR' || dbError.errno === 1054 || 
        (dbError.sqlMessage && dbError.sqlMessage.includes('Unknown column'))) {
      // Column doesn't exist - this is expected if Hindi columns haven't been added yet
      return null;
    }
    // For other errors, log a warning but still return null
    console.warn(`Could not fetch Hindi name for ${type}:`, error);
    return null;
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

    const cardType = data.cardType ?? 'membership';
    const language = data.language ?? 'hi';
    const isHindi = language === 'hi';

    const ORG_NAME = 'राष्ट्रीय हिन्दू वाहिनी संगठन';

    const strings = isHindi
      ? {
          orgName: ORG_NAME,
          membershipTitle: 'सदस्य पहचान पत्र',
          appointmentTitle: 'नियुक्ति पहचान पत्र',
          registrationLabel: 'पंजीकरण संख्या',
          nameLabel: 'नाम',
          designationLabel: 'पद',
          addressLabel: 'पता',
          appointmentDateLabel: 'नियुक्ति दिनांक',
          placeholderNoPhoto: 'फोटो उपलब्ध नहीं',
          bottomOrgName: ORG_NAME,
        }
      : {
          orgName: ORG_NAME,
          membershipTitle: 'Member Identity Card',
          appointmentTitle: 'Appointment Identity Card',
          registrationLabel: 'Registration No.',
          nameLabel: 'Name',
          designationLabel: 'Designation',
          addressLabel: 'Address',
          appointmentDateLabel: 'Date of Appointment',
          placeholderNoPhoto: 'No Photo',
          bottomOrgName: ORG_NAME,
        };

    const fonts = isHindi
      ? {
          header: 'bold 56px "Mangal", "Noto Sans Devanagari", sans-serif',
          subtitle: 'bold 28px "Mangal", "Noto Sans Devanagari", sans-serif',
          decorative: 'bold 24px "Mangal", "Noto Sans Devanagari", sans-serif',
          label: '800 30px "Mangal", "Noto Sans Devanagari", sans-serif',
          value: 'bold 26px "Mangal", "Noto Sans Devanagari", sans-serif',
          placeholder: 'bold 20px "Mangal", "Noto Sans Devanagari", sans-serif',
          bottom: 'bold 24px "Mangal", "Noto Sans Devanagari", sans-serif',
        }
      : {
          header: 'bold 64px "Arial Black", "Arial", sans-serif',
          subtitle: '700 26px "Arial", sans-serif',
          decorative: 'bold 20px "Arial", sans-serif',
          label: '700 24px "Arial", sans-serif',
          value: '600 22px "Arial", sans-serif',
          placeholder: '600 18px "Arial", sans-serif',
          bottom: '700 20px "Arial", sans-serif',
        };

    // ID Card dimensions (standard ID card size: 3.375" x 2.125" at 300 DPI)
    const width = 1013; // 3.375" * 300 DPI
    const height = 638;  // 2.125" * 300 DPI
    
    // Create canvas
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Colors inspired by the appointment certificate
    const headerColor = '#B91C1C'; // Deep red
    const borderColor = '#D97706'; // Rich gold
    const textColor = '#0F172A'; // Deep slate
    const accentColor = '#7C2D12'; // Darker accent red

    // Fill background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    // === HEADER SECTION ===
    const headerHeight = 150;

    // Apply subtle watermark using RHVS logo (positioned below header)
    try {
      const watermark = await loadImage(path.join(process.cwd(), 'public', 'rhvs_logo.png'));
      const watermarkSize = Math.min(width * 0.45, height * 0.6);
      const watermarkX = (width - watermarkSize) / 2;
      const watermarkY = headerHeight + (height - headerHeight - watermarkSize) / 2;
      ctx.globalAlpha = 0.08;
      ctx.drawImage(watermark, watermarkX, watermarkY, watermarkSize, watermarkSize);
      ctx.globalAlpha = 1;
    } catch (error) {
      console.error('Error loading RHVS watermark for ID card:', error);
    }

    // Header background
    ctx.fillStyle = headerColor;
    ctx.fillRect(0, 0, width, headerHeight);

    // RHVS logo on left within header
    try {
      const logoImage = await loadImage(path.join(process.cwd(), 'public', 'certificates', 'rhvs_logo.png'));
      const logoHeight = headerHeight - 36;
      const logoWidth = (logoImage.width / logoImage.height) * logoHeight;
      ctx.drawImage(logoImage, 30, 18, logoWidth, logoHeight);
    } catch (error) {
      console.error('Error loading RHVS logo for ID card header:', error);
    }

    // Lord Ram artwork (mirrors certificate header)
    try {
      const ramImage = await loadImage(path.join(process.cwd(), 'public', 'certificates', 'Ram.png'));
      const ramHeight = headerHeight - 30;
      const ramWidth = (ramImage.width / ramImage.height) * ramHeight;
      ctx.drawImage(ramImage, width - ramWidth - 30, 15, ramWidth, ramHeight);
    } catch (error) {
      console.error('Error loading Ram image for ID card:', error);
    }

    // Organization name in header (bold & larger)
    ctx.fillStyle = '#FDE68A';
    ctx.font = fonts.header;
    ctx.textAlign = 'center';
    ctx.fillText(strings.orgName, width / 2, 75);

    // Subtitle
    ctx.font = fonts.subtitle;
    ctx.fillStyle = '#FFFBEB';
    const cardTitle = cardType === 'appointment' ? strings.appointmentTitle : strings.membershipTitle;
    ctx.fillText(cardTitle, width / 2, 115);

    // === DECORATIVE GOLD LINE ===
    const lineY = headerHeight + 20;
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(50, lineY);
    ctx.lineTo(width - 50, lineY);
    ctx.stroke();

    // Decorative center element
    ctx.fillStyle = borderColor;
    ctx.font = fonts.decorative;
    ctx.textAlign = 'center';
    ctx.fillText('◆', width / 2, lineY + 10);

    // === MEMBER PHOTO ===
    const photoSize = 180;
    const photoX = width - 220;
    const photoY = lineY + 25; // Moved slightly lower
    
    let photoLoaded = false;
    try {
      const memberPhoto = await loadProfilePhotoImage(data.profilePhotoPath);
      if (memberPhoto) {
        // Photo frame
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(photoX - 5, photoY - 5, photoSize + 10, photoSize + 10);
        
        // Gold border
        ctx.strokeStyle = borderColor;
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
      
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 3;
      ctx.strokeRect(photoX - 5, photoY - 5, photoSize + 10, photoSize + 10);
      
      ctx.fillStyle = '#9CA3AF';
      ctx.font = fonts.placeholder;
      ctx.textAlign = 'center';
      ctx.fillText(strings.placeholderNoPhoto, photoX + photoSize / 2, photoY + photoSize / 2);
    }

    // === MEMBER INFORMATION ===
    const infoX = 60;
    let currentY = lineY + 90;
    const lineSpacing = 40;
    const infoMaxWidth = width - 120;

    ctx.textAlign = 'left';

    const lines: Array<{ label: string; value: string }> = [];

    lines.push({ label: strings.registrationLabel, value: data.memberRegNumber });
    lines.push({ label: strings.nameLabel, value: data.memberName });

    // Convert address to Hindi if language is Hindi
    const displayAddress = await (async () => {
      let district = data.district?.trim() || null;
      let state = data.state?.trim() || null;
      
      if (isHindi) {
        // Try to get Hindi names for district and state
        // For district, pass state name to check if state is Hindi first
        if (district) {
          const hindiDistrict = await getHindiLocationName(district, 'district', state);
          if (hindiDistrict) district = hindiDistrict;
        }
        if (state) {
          const hindiState = await getHindiLocationName(state, 'state');
          if (hindiState) state = hindiState;
        }
      }
      
      if (district && state) return `${district}, ${state}`;
      if (district) return district;
      if (state) return state;
      return null;
    })();

    if (cardType === 'appointment') {
      const department = data.departmentName && data.departmentName.trim().length > 0
        ? data.departmentName
        : '—';
      const post = translateDesignation(data.postName || data.designation, 'appointment', language);
      const departmentAndPost = department !== '—' ? `${department} ${post}` : post;
      const appointmentDate = data.appointmentDate
        ? new Date(data.appointmentDate).toLocaleDateString(isHindi ? 'hi-IN' : 'en-IN')
        : '—';

      lines.push({ label: strings.designationLabel, value: departmentAndPost });
      // Add address right after designation (like membership card) - always show if district or state exists
      if (displayAddress) {
        lines.push({ label: strings.addressLabel, value: displayAddress });
      }
      lines.push({ label: strings.appointmentDateLabel, value: appointmentDate });
    } else {
      const designation = translateDesignation(data.designation, 'membership', language);
      lines.push({ label: strings.designationLabel, value: designation });
      if (displayAddress) {
        lines.push({ label: strings.addressLabel, value: displayAddress });
      }
    }

    lines.forEach(({ label, value }) => {
      currentY = drawLabelValue(ctx, {
        label,
        value,
        x: infoX,
        baseline: currentY,
        maxWidth: infoMaxWidth,
        lineSpacing,
        labelFont: fonts.label,
        valueFont: fonts.value,
        labelColor: accentColor,
        valueColor: textColor,
      });
      currentY += 10;
    });

    // === BOTTOM DECORATIVE LINE ===
    const bottomLineY = height - 40;
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(50, bottomLineY);
    ctx.lineTo(width - 50, bottomLineY);
    ctx.stroke();

    // Organization name at bottom
    ctx.fillStyle = accentColor;
    ctx.font = fonts.bottom;
    ctx.textAlign = 'center';
    ctx.fillText(strings.bottomOrgName, width / 2, bottomLineY + 25);

    // === BORDER ===
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 6;
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
    const safeReg = data.memberRegNumber.replace(/[^a-zA-Z0-9]/g, '');
    const timestamp = Date.now();
    const fileName = `${cardType}-id-card-${safeReg}-${timestamp}.pdf`;
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

function wrapTextLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  words.forEach((word) => {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const { width } = ctx.measureText(testLine);
    if (width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
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

interface LabelValueOptions {
  label: string;
  value: string;
  x: number;
  baseline: number;
  maxWidth: number;
  lineSpacing: number;
  labelFont: string;
  valueFont: string;
  labelColor: string;
  valueColor: string;
}

function drawLabelValue(ctx: CanvasRenderingContext2D, options: LabelValueOptions): number {
  const {
    label,
    value,
    x,
    baseline,
    maxWidth,
    lineSpacing,
    labelFont,
    valueFont,
    labelColor,
    valueColor,
  } = options;

  const labelText = `${label} :`;
  ctx.font = labelFont;
  ctx.fillStyle = labelColor;
  ctx.fillText(labelText, x, baseline);
  const labelWidth = ctx.measureText(labelText).width;

  ctx.font = valueFont;
  ctx.fillStyle = valueColor;
  const availableWidth = Math.max(maxWidth - labelWidth - 20, maxWidth * 0.4);
  const valueLines = wrapTextLines(ctx, value, availableWidth);
  const valueStartX = x + labelWidth + 20;

  valueLines.forEach((line, index) => {
    const drawX = valueStartX;
    const drawY = baseline + index * lineSpacing;
    ctx.fillText(line, drawX, drawY);
  });

  return baseline + valueLines.length * lineSpacing;
}

function translateDesignation(
  rawDesignation: string | undefined | null,
  cardType: 'membership' | 'appointment',
  language: 'hi' | 'en'
): string {
  if (!rawDesignation || rawDesignation.trim().length === 0) {
    if (language === 'hi') {
      return cardType === 'membership' ? 'रक्षा दल' : 'पदाधिकारी';
    }

    return cardType === 'membership' ? 'Security Unit' : 'Appointee';
  }

  const normalized = rawDesignation.trim().toLowerCase();

  const designationMaps: Record<'hi' | 'en', Record<string, string>> = {
    hi: {
      member: 'रक्षा दल',
      'sadashya': 'रक्षा दल',
      'district admin': 'जिला प्रशासक',
      'state admin': 'राज्य प्रशासक',
      'super admin': 'महाप्रशासक',
      'national president': 'राष्ट्रीय अध्यक्ष',
      president: 'अध्यक्ष',
      secretary: 'सचिव',
    },
    en: {
      member: 'Security Unit',
      'sadashya': 'Security Unit',
      'district admin': 'District Administrator',
      'state admin': 'State Administrator',
      'super admin': 'Chief Administrator',
      'national president': 'National President',
      president: 'President',
      secretary: 'Secretary',
    },
  };

  const map = designationMaps[language];
  return map[normalized] ?? rawDesignation;
}

function translateLevel(
  level: 'national' | 'state' | 'district' | undefined,
  state?: string | null,
  district?: string | null
): string {
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
