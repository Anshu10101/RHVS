import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { sendTokenEmail } from '@/lib/email';
import { getStateLanguagePreference } from '@/lib/language-preference';
import crypto from 'crypto';
import { consumeStagedBlob } from '@/lib/blob-storage';

// Generate a secure token
function generateRegistrationToken(sourceDate?: string): string {
  const prefix = 'RHVS';

  // 5-digit pseudo-random number (10000-99999)
  const randomDigits = crypto.randomInt(10000, 100000).toString();

  // Use provided registration date if valid, else fallback to today
  const referenceDate = sourceDate && !Number.isNaN(Date.parse(sourceDate))
    ? new Date(sourceDate)
    : new Date();

  const day = referenceDate.getDate().toString().padStart(2, '0');
  const month = (referenceDate.getMonth() + 1).toString().padStart(2, '0');

  return `${prefix}-${randomDigits}-${day}${month}`;
}

// Send OTP to existing member
export async function POST(request: NextRequest) {
  try {
    const { action, data } = await request.json();

    if (action === 'send-otp') {
      const { existingMemberRegNumber } = data;

      // Find verifier by their member_reg_number (or email fallback)
      const memberQuery = `
        SELECT id, name, email, member_reg_number FROM members 
        WHERE member_reg_number = ? OR email = ?
        LIMIT 1
      `;
      
      const members = await executeQuery(memberQuery, [existingMemberRegNumber, existingMemberRegNumber]) as Array<{ id: number; name: string; email: string; member_reg_number: string }>;
      
      if (members.length === 0) {
        return NextResponse.json(
          { success: false, message: 'Existing member not found' },
          { status: 404 }
        );
      }

      const member = members[0];
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAtMs = Date.now() + 10 * 60 * 1000; // 10 minutes

      // Store OTP in database
      const otpQuery = `
        INSERT INTO otp_verifications (existing_member_reg_number, otp, email, expires_at)
        VALUES (?, ?, ?, FROM_UNIXTIME(?))
        ON DUPLICATE KEY UPDATE
        otp = VALUES(otp),
        expires_at = VALUES(expires_at),
        used = FALSE
      `;
      
      await executeQuery(otpQuery, [existingMemberRegNumber, otp, member.email, expiresAtMs / 1000]);

      // Try sending OTP email (non-blocking for success path)
      try {
        await sendTokenEmail(member.email, otp, member.name);
      } catch (e) {
        console.error('Failed to send OTP email (continuing):', e);
      }

      return NextResponse.json({
        success: true,
        message: 'OTP sent successfully',
        memberName: member.name
      });

    } else if (action === 'verify-otp') {
      const { existingMemberRegNumber, otp } = data;

      // Verify OTP from database
      const otpQuery = `
        SELECT * FROM otp_verifications 
        WHERE existing_member_reg_number = ? AND otp = ? AND expires_at > NOW() AND used = FALSE
        ORDER BY created_at DESC LIMIT 1
      `;
      
      const otpRecords = await executeQuery(otpQuery, [existingMemberRegNumber, otp]) as Array<{ id: number }>;
      
      if (otpRecords.length === 0) {
        return NextResponse.json(
          { success: false, message: 'Invalid or expired OTP' },
          { status: 400 }
        );
      }

      // Mark OTP as used
      await executeQuery(
        'UPDATE otp_verifications SET used = TRUE WHERE id = ?',
        [otpRecords[0].id]
      );

      return NextResponse.json({
        success: true,
        message: 'OTP verified successfully'
      });

    } else if (action === 'register-member') {
      const { 
        name, 
        email, 
        phone, 
        address, 
        stateId,
        districtId,
        aadharCardNumber,
        fatherHusbandName, 
        motherWifeName, 
        registrationDate,
        existingMemberRegNumber,
        profilePhotoPath,
        signaturePath,
        district,
        department
      } = data;

      // Validate profile photo is required
      if (!profilePhotoPath || profilePhotoPath.trim() === '') {
        return NextResponse.json(
          { success: false, message: 'Profile photo is required for registration' },
          { status: 400 }
        );
      }
      
      // Validate signature is required
      if (!signaturePath || signaturePath.trim() === '') {
        return NextResponse.json(
          { success: false, message: 'Signature image is required for registration' },
          { status: 400 }
        );
      }

      // Check if email already exists in members table
      const existingMemberQuery = 'SELECT id FROM members WHERE email = ?';
      const existingMembers = await executeQuery(existingMemberQuery, [email]) as Array<{ id: number }>;
      
      if (existingMembers.length > 0) {
        return NextResponse.json(
          { success: false, message: 'Email already registered as a member' },
          { status: 400 }
        );
      }

      // Check if email already has a pending token
      const pendingTokenQuery = `
        SELECT token, expires_at 
        FROM registration_tokens 
        WHERE email = ? AND status = 'pending'
        ORDER BY created_at DESC
        LIMIT 1
      `;
      const pendingTokens = await executeQuery(pendingTokenQuery, [email]) as Array<{ token: string; expires_at: string }>;
      
      if (pendingTokens.length > 0) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'Registration already pending. Please check your email for the verification token.', 
            code: 'REGISTRATION_PENDING',
            token: pendingTokens[0].token,
            expiresAt: pendingTokens[0].expires_at,
            name,
            email
          },
          { status: 400 }
        );
      }

      // Get state and district names from IDs
      const stateQuery = 'SELECT state_name_english FROM states WHERE id = ?';
      const stateResult = await executeQuery(stateQuery, [stateId]) as Array<{ state_name_english: string }>;
      const stateName = stateResult.length > 0 ? stateResult[0].state_name_english : '';

      const districtQuery = 'SELECT district_name_english FROM districts WHERE district_code = ? LIMIT 1';
      const districtResult = await executeQuery(districtQuery, [districtId]) as Array<{ district_name_english: string }>;
      const districtName = districtResult.length > 0 ? districtResult[0].district_name_english : '';

      let profileAsset: ResolvedAsset;
      let signatureAsset: ResolvedAsset;
      try {
        profileAsset = await resolveAssetFromInput(profilePhotoPath, 'Profile photo');
        signatureAsset = await resolveAssetFromInput(signaturePath, 'Signature image');
      } catch (assetError) {
        return NextResponse.json(
          { success: false, message: (assetError as Error).message },
          { status: 400 }
        );
      }

      // Generate unique registration token (retry on collision)
      let token = '';
      for (let attempt = 0; attempt < 5; attempt++) {
        token = generateRegistrationToken(registrationDate);
        const existingToken = await executeQuery(
          'SELECT id FROM registration_tokens WHERE token = ? LIMIT 1',
          [token]
        ) as Array<{ id: number }>;

        if (existingToken.length === 0) {
          break;
        }

        if (attempt === 4) {
          return NextResponse.json(
            { success: false, message: 'Could not generate a unique registration token. Please try again.' },
            { status: 500 }
          );
        }
      }
      const expiresAt = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000); // 10 days

      // Insert registration token
      const insertTokenQuery = `
        INSERT INTO registration_tokens (
          token, name, email, phone, address, state, district, aadhar_card_number,
          father_husband_name, mother_wife_name, registration_date, existing_member_reg_number, 
          profile_photo_path, profile_photo_blob, profile_photo_mime, profile_photo_hash, profile_photo_size, profile_photo_original_name,
          signature_path, signature_blob, signature_mime, signature_hash, signature_size, signature_original_name,
          department, expires_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const result = await executeQuery(insertTokenQuery, [
        token,
        name,
        email,
        phone,
        address,
        stateName,
        districtName || district || null,
        aadharCardNumber || null,
        fatherHusbandName,
        motherWifeName,
        registrationDate || new Date().toISOString().split('T')[0],
        existingMemberRegNumber,
        profileAsset.url,
        profileAsset.blob,
        profileAsset.mime,
        profileAsset.hash,
        profileAsset.size,
        profileAsset.originalName,
        signatureAsset.url,
        signatureAsset.blob,
        signatureAsset.mime,
        signatureAsset.hash,
        signatureAsset.size,
        signatureAsset.originalName,
        department || null,
        expiresAt
      ]) as { insertId?: number };

      const tokenId = result.insertId ?? null;

      if (tokenId != null) {
        if (profileAsset.blob) {
          await executeQuery(
            'UPDATE registration_tokens SET profile_photo_path = ? WHERE id = ?',
            [`/api/media/registration-tokens/${tokenId}/profile`, tokenId]
          );
        }
        if (signatureAsset.blob) {
          await executeQuery(
            'UPDATE registration_tokens SET signature_path = ? WHERE id = ?',
            [`/api/media/registration-tokens/${tokenId}/signature`, tokenId]
          );
        }
      }

      const languagePreference = await getStateLanguagePreference({ stateName });

      // Send token email
      try {
        await sendTokenEmail(email, token, name, 'registration', languagePreference);
      } catch (e) {
        console.error('Failed to send token email (continuing):', e);
      }

      return NextResponse.json({
        success: true,
        message: 'Registration token generated successfully. Please check your email and bring the token to the admin for verification.',
        token: token,
        tokenId
      });

    } else {
      return NextResponse.json(
        { success: false, message: 'Invalid action' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, message: 'Registration failed' },
      { status: 500 }
    );
  }
}

type ResolvedAsset = {
  url: string | null;
  blob: Buffer | null;
  mime: string | null;
  hash: string | null;
  size: number | null;
  originalName: string | null;
};

async function resolveAssetFromInput(value: unknown, label: string): Promise<ResolvedAsset> {
  if (typeof value !== 'string' || value.trim() === '') {
    return {
      url: null,
      blob: null,
      mime: null,
      hash: null,
      size: null,
      originalName: null
    };
  }

  if (value.startsWith('/api/media/staged/')) {
    const assetId = value.split('/').pop();
    if (!assetId) {
      throw new Error(`${label}: invalid staged asset reference`);
    }
    const asset = await consumeStagedBlob(assetId);
    if (!asset) {
      throw new Error(`${label}: staged upload expired. Please re-upload.`);
    }
    return {
      url: null,
      blob: asset.data,
      mime: asset.mimeType || null,
      hash: asset.hash || null,
      size: asset.size ?? null,
      originalName: asset.originalName || null
    };
  }

  return {
    url: value,
    blob: null,
    mime: null,
    hash: null,
    size: null,
    originalName: null
  };
}
