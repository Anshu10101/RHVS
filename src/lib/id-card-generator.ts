import { createCanvas, loadImage, registerFont } from 'canvas';
import type { CanvasRenderingContext2D } from 'canvas';
import { PDFDocument, rgb } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { executeQuery } from '@/lib/database';
import { getStateLanguagePreference } from '@/lib/language-preference';

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
  printAsName?: string | null; // Complete designation (post + department) if provided
  level?: 'national' | 'state' | 'district';
  state?: string | null;
  district?: string | null;
  appointmentDate?: string | null;
  language?: 'hi' | 'en';
  isNationalExecutive?: boolean;
  valid_from?: string | null;
  valid_until?: string | null;
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

// Helper function to get state name in correct language (Hindi or English)
async function getStateNameForIDCard(stateName: string | null | undefined, isHindi: boolean): Promise<string | null> {
  if (!stateName || !stateName.trim()) return null;
  
  try {
    // Get language preference for the state
    const languagePreference = await getStateLanguagePreference({ stateName: stateName.trim() });
    
    // If ID card is in Hindi and state prefers Hindi, get Hindi name
    if (isHindi && languagePreference === 'hi') {
      const result = await executeQuery(
        'SELECT state_name_hindi FROM states WHERE state_name_english = ? LIMIT 1',
        [stateName.trim()]
      ) as Array<{ state_name_hindi: string | null }>;
      
      if (result.length > 0 && result[0].state_name_hindi) {
        return result[0].state_name_hindi;
      }
    }
    
    // Otherwise return English name (or fallback to provided name)
    return stateName.trim();
  } catch (error) {
    console.warn(`Error fetching state name for ${stateName}:`, error);
    return stateName.trim(); // Fallback to provided name
  }
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
          officeAddress: 'केंद्रीय कार्यालय - गुरुकुल तिराहा, दतिया म.प्र.',
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
          officeAddress: 'Central Office - Gurukul tiraha, Datia M.P.',
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
    const headerColor = '#E30303'; // Red
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
      ctx.drawImage(ramImage, width - ramWidth - 30, 25, ramWidth, ramHeight); // Lowered by 10px to avoid overlap with reg number
    } catch (error) {
      console.error('Error loading Ram image for ID card:', error);
    }

    // Organization registration number in header (top right corner)
    // Position it high up to avoid overlap with organization name
    const headerRegLabel = isHindi ? 'पंजीकरण संख्या: 169' : 'Reg. No: 169';
    ctx.fillStyle = '#FDE68A';
    // Use a smaller font size for registration number to avoid overlap
    const regFont = isHindi 
      ? 'bold 18px "Mangal", "Noto Sans Devanagari", sans-serif'
      : 'bold 16px "Arial", sans-serif';
    ctx.font = regFont;
    ctx.textAlign = 'right';
    // Position at top right, well above the organization name and logo
    ctx.fillText(headerRegLabel, width - 25, 20);
    ctx.textAlign = 'center';

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

    // === LOAD ID CARD SIGNATURES ===
    // Load signatures based on card type: membership_id_card for membership cards, appointment_id_card for appointment cards
    let idCardSignatures: Array<{
      name: string;
      title: string;
      signaturePath: string | null;
    }> = [];
    
    try {
      const idCardType = cardType === 'membership' ? 'membership_id_card' : 'appointment_id_card';
      const signatureRows = await executeQuery(
        `SELECT name_en, name_hi, designation_en, designation_hi, 
                CASE 
                  WHEN signature_blob IS NOT NULL THEN CONCAT('/api/media/certificate-signatures/', id, '/signature')
                  ELSE signature_path
                END AS signature_path
         FROM certificate_signatures
         WHERE certificate_type = ? AND is_active = TRUE
         ORDER BY display_order ASC
         LIMIT 4`,
        [idCardType]
      ) as Array<{
        name_en: string;
        name_hi: string | null;
        designation_en: string;
        designation_hi: string | null;
        signature_path: string | null;
      }>;
      
      idCardSignatures = signatureRows.map(sig => ({
        name: isHindi && sig.name_hi ? sig.name_hi : sig.name_en,
        title: isHindi && sig.designation_hi ? sig.designation_hi : sig.designation_en,
        signaturePath: sig.signature_path
      }));
      
      console.log(`[ID Card] Loaded ${idCardSignatures.length} signatures from database for ${idCardType} (cardType: ${cardType})`);
      if (idCardSignatures.length > 0) {
        console.log(`[ID Card] Signature details:`, idCardSignatures.map(s => ({ name: s.name, title: s.title, hasPath: !!s.signaturePath })));
      }
    } catch (error) {
      console.error('[ID Card] Error loading signatures from database:', error);
    }

    // === MEMBER PHOTO ===
    const photoSize = 180;
    const photoX = width - 220; // Photo X position (defined here for use in info section)
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

    // === SIGNATURES BELOW PHOTO ===
    // Display signatures for both membership and appointment cards
    console.log(
      `[ID Card] Checking signatures for display: ${idCardSignatures.length} signatures available, cardType: ${cardType}`
    );
    if (idCardSignatures.length > 0) {
      const signatureStartY = photoY + photoSize + 18;
      const signatureAreaWidth = photoSize + 20;
      const signatureAreaX = photoX - 10;
      const maxSignaturesToShow = Math.min(idCardSignatures.length, 2); // Show max 2 signatures due to space
      const signatureHeight = 65; // Taller blocks so signatures are clearly visible
      const spacing = 10; // More spacing between signatures
      
      // Slightly larger but still compact fonts for signatures on ID cards
      const signatureNameFont = isHindi
        ? '600 12px "Mangal", "Noto Sans Devanagari", sans-serif'
        : '600 11px "Arial", sans-serif';
      const signatureTitleFont = isHindi
        ? '500 11px "Mangal", "Noto Sans Devanagari", sans-serif'
        : '500 10px "Arial", sans-serif';
      
      for (let i = 0; i < maxSignaturesToShow; i++) {
        const sig = idCardSignatures[i];
        const sigY = signatureStartY + (i * (signatureHeight + spacing));
        
        // Draw signature image if available
        if (sig.signaturePath) {
          try {
            // Try to load signature from blob endpoint or file path
            let signatureImage = null;
            const sigMatch = sig.signaturePath.match(/^\/api\/media\/certificate-signatures\/(\d+)\/signature/);
            if (sigMatch) {
              const sigId = Number(sigMatch[1]);
              if (!Number.isNaN(sigId)) {
                const sigRows = await executeQuery(
                  'SELECT signature_blob FROM certificate_signatures WHERE id = ? LIMIT 1',
                  [sigId]
                ) as Array<{ signature_blob: Buffer | null }>;
                const sigBuffer = sigRows[0]?.signature_blob;
                if (sigBuffer && sigBuffer.length > 0) {
                  signatureImage = await loadImage(sigBuffer);
                }
              }
            } else {
              // Try to load from file path
              const normalizedPath = sig.signaturePath.startsWith('/') ? sig.signaturePath.slice(1) : sig.signaturePath;
              const absolutePath = path.join(process.cwd(), 'public', normalizedPath);
              if (fs.existsSync(absolutePath)) {
                signatureImage = await loadImage(absolutePath);
              }
            }
            
            if (signatureImage) {
              const sigImgWidth = 80; // Wider signature image
              const sigImgHeight = 40; // Taller signature image
              const sigImgX = signatureAreaX + (signatureAreaWidth - sigImgWidth) / 2;
              ctx.drawImage(signatureImage, sigImgX, sigY, sigImgWidth, sigImgHeight);
            }
          } catch (error) {
            console.error(`Error loading signature ${i + 1}:`, error);
          }
        }
        
        // Draw name
        ctx.font = signatureNameFont;
        ctx.fillStyle = textColor;
        ctx.textAlign = 'center';
        const nameY = sigY + (sig.signaturePath ? 48 : 14); // Push text further below larger image
        // Truncate name if too long
        let displayName = sig.name;
        const maxNameWidth = signatureAreaWidth - 10;
        let nameWidth = ctx.measureText(displayName).width;
        while (nameWidth > maxNameWidth && displayName.length > 0) {
          displayName = displayName.slice(0, -1);
          nameWidth = ctx.measureText(displayName + '...').width;
        }
        if (displayName !== sig.name && sig.name.length > displayName.length) {
          displayName += '...';
        }
        ctx.fillText(displayName, signatureAreaX + signatureAreaWidth / 2, nameY);
        
        // Draw title/designation
        ctx.font = signatureTitleFont;
        ctx.fillStyle = accentColor;
        const titleY = nameY + 12; // Slightly more gap between name and title
        // Truncate title if too long
        let displayTitle = sig.title;
        let titleWidth = ctx.measureText(displayTitle).width;
        while (titleWidth > maxNameWidth && displayTitle.length > 0) {
          displayTitle = displayTitle.slice(0, -1);
          titleWidth = ctx.measureText(displayTitle + '...').width;
        }
        if (displayTitle !== sig.title && sig.title.length > displayTitle.length) {
          displayTitle += '...';
        }
        ctx.fillText(displayTitle, signatureAreaX + signatureAreaWidth / 2, titleY);
      }
    }

    // === MEMBER INFORMATION ===
    const infoX = 60;
    let currentY = lineY + 90;
    const lineSpacing = 40;
    // Calculate max width based on photo position to prevent overlap
    // Photo is positioned at photoX (width - 220), so text should stop before that with a margin
    const photoMargin = 30; // Margin between text and photo
    const textMaxEndX = photoX - photoMargin; // Text should not go beyond this point
    const infoMaxWidth = textMaxEndX - infoX; // Maximum width for text area

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
      const appointmentDate = data.appointmentDate
        ? new Date(data.appointmentDate).toLocaleDateString(isHindi ? 'hi-IN' : 'en-IN')
        : '—';

      let departmentAndPost: string;
      
      // Check if print_as is provided (complete designation including post + department)
      if (data.printAsName && data.printAsName.trim().length > 0) {
        // Use print_as directly with level prefix only
        const isNationalExecutive = data.isNationalExecutive === true;
        if (!isNationalExecutive) {
          const levelPrefix = isHindi
            ? (data.level === 'national' ? 'राष्ट्रीय' : data.level === 'state' ? 'प्रदेश' : 'जिला')
            : (data.level === 'national' ? 'National' : data.level === 'state' ? 'State' : 'District');
          departmentAndPost = `${levelPrefix} ${data.printAsName.trim()}`;
        } else {
          departmentAndPost = data.printAsName.trim();
        }
      } else {
        // Default method: [level_prefix] [post] [department]
      const department = data.departmentName && data.departmentName.trim().length > 0
        ? data.departmentName
        : '—';
      let post = translateDesignation(data.postName || data.designation, 'appointment', language);
      
      // Add level prefix to post name, but NOT if department is National Executive
      const isNationalExecutive = data.isNationalExecutive === true;
      if (!isNationalExecutive) {
        const levelPrefix = isHindi
          ? (data.level === 'national' ? 'राष्ट्रीय' : data.level === 'state' ? 'प्रदेश' : 'जिला')
          : (data.level === 'national' ? 'National' : data.level === 'state' ? 'State' : 'District');
        post = `${levelPrefix} ${post}`.trim();
      }
      
        departmentAndPost = department !== '—' ? `${post} ${department}` : post;
      }

      // Add location names (state/district) for state and district level appointments
      // Get state name in correct language (Hindi for Hindi states, English for English states)
      if (data.level === 'state' && data.state) {
        // For state level: get state name in correct language
        const stateName = await getStateNameForIDCard(data.state, isHindi);
        if (stateName) {
          departmentAndPost = `${departmentAndPost}, ${stateName}`;
        }
      } else if (data.level === 'district' && data.district && data.state) {
        // For district level: get state name in correct language, district stays as is
        const stateName = await getStateNameForIDCard(data.state, isHindi);
        if (stateName) {
          departmentAndPost = `${departmentAndPost}, ${data.district}, ${stateName}`;
        }
      }
      // For national level: no location added

      lines.push({ label: strings.designationLabel, value: departmentAndPost });
      lines.push({ label: strings.appointmentDateLabel, value: appointmentDate });
    } else {
      const designation = translateDesignation(data.designation, 'membership', language);
      lines.push({ label: strings.designationLabel, value: designation });
    }

    lines.forEach(({ label, value }) => {
      currentY = drawLabelValue(ctx, {
        label,
        value,
        x: infoX,
        baseline: currentY,
        maxWidth: infoMaxWidth,
        maxTextEndX: textMaxEndX, // Maximum X position where text can end (already calculated above)
        lineSpacing,
        labelFont: fonts.label,
        valueFont: fonts.value,
        labelColor: accentColor,
        valueColor: textColor,
      });
      currentY += 10;
    });

    // === BOTTOM DECORATIVE LINE ===
    // Adjust bottom line position to accommodate validity text if needed
    const hasValidity = data.valid_from && data.valid_until;
    const bottomLineY = hasValidity ? height - 60 : height - 40; // More space if validity text exists
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(50, bottomLineY);
    ctx.lineTo(width - 50, bottomLineY);
    ctx.stroke();

    // Organization name and office address on same line at bottom
    // Use smaller font to ensure it fits within card width
    const bottomFont = isHindi
      ? 'bold 18px "Mangal", "Noto Sans Devanagari", sans-serif'
      : '700 16px "Arial", sans-serif';
    ctx.fillStyle = accentColor;
    ctx.font = bottomFont;
    ctx.textAlign = 'center';
    const bottomText = `${strings.bottomOrgName} | ${strings.officeAddress}`;
    
    // Check if text fits, if not use even smaller font
    const maxWidth = width - 100; // Leave 50px margin on each side
    const textMetrics = ctx.measureText(bottomText);
    const finalFont = textMetrics.width > maxWidth
      ? (isHindi
          ? 'bold 16px "Mangal", "Noto Sans Devanagari", sans-serif'
          : '700 14px "Arial", sans-serif')
      : bottomFont;
    
    ctx.font = finalFont;
    const orgTextY = bottomLineY + 25; // Increased spacing for better visibility
    ctx.fillText(bottomText, width / 2, orgTextY);
    
    // Add validity period below organization address (if validity dates are provided)
    if (hasValidity && data.valid_from && data.valid_until) {
      // Simple date formatting function
      const formatDate = (dateStr: string): string => {
        try {
          const date = new Date(dateStr);
          const day = date.getDate();
          const month = date.getMonth() + 1;
          const year = date.getFullYear();
          return `${day}/${month}/${year}`;
        } catch {
          return dateStr;
        }
      };
      
      const validityText = isHindi
        ? `मान्यता: ${formatDate(data.valid_from)} - ${formatDate(data.valid_until)}`
        : `Validity: ${formatDate(data.valid_from)} - ${formatDate(data.valid_until)}`;
      
      // Use larger font for validity (slightly smaller than organization address but still readable)
      const validityFont = isHindi
        ? 'bold 16px "Mangal", "Noto Sans Devanagari", sans-serif'
        : '700 15px "Arial", sans-serif';
      
      // Set text color and alignment for validity text
      ctx.fillStyle = accentColor; // Use same color as organization address
      ctx.font = validityFont;
      ctx.textAlign = 'center';
      const validityY = orgTextY + 25; // Increased spacing between org name and validity line
      ctx.fillText(validityText, width / 2, validityY);
    }

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
  maxTextEndX?: number; // Optional: Maximum X position where text can end (to prevent overlap with photo)
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
    maxTextEndX,
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
  const valueStartX = x + labelWidth + 20;
  
  // Calculate available width for value text
  // If maxTextEndX is provided, use it to ensure text doesn't overlap with photo
  let availableWidth: number;
  if (maxTextEndX !== undefined) {
    // Available width is the space between value start and max end position
    availableWidth = maxTextEndX - valueStartX;
    // Ensure minimum width (at least 40% of maxWidth for readability)
    availableWidth = Math.max(availableWidth, maxWidth * 0.4);
  } else {
    // Fallback to original calculation
    availableWidth = Math.max(maxWidth - labelWidth - 20, maxWidth * 0.4);
  }
  
  const valueLines = wrapTextLines(ctx, value, availableWidth);

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
