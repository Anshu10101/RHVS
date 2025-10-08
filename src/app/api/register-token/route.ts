import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { sendTokenEmail } from '@/lib/email';
import crypto from 'crypto';

// Generate a secure token
function generateRegistrationToken(): string {
  return crypto.randomBytes(32).toString('hex').toUpperCase();
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
      const existingTokenQuery = 'SELECT id FROM registration_tokens WHERE email = ? AND status = "pending"';
      const existingTokens = await executeQuery(existingTokenQuery, [email]) as Array<{ id: number }>;
      
      if (existingTokens.length > 0) {
        return NextResponse.json(
          { success: false, message: 'Registration already pending. Please check your email for the verification token.' },
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

      // Generate registration token
      const token = generateRegistrationToken();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      // Insert registration token
      const insertTokenQuery = `
        INSERT INTO registration_tokens (
          token, name, email, phone, address, state, district, aadhar_card_number,
          father_husband_name, mother_wife_name, registration_date, existing_member_reg_number, 
          profile_photo_path, department, expires_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        profilePhotoPath || null,
        department || null,
        expiresAt
      ]) as any; // eslint-disable-line @typescript-eslint/no-explicit-any

      // Send token email
      try {
        await sendTokenEmail(email, token, name, 'registration');
      } catch (e) {
        console.error('Failed to send token email (continuing):', e);
      }

      return NextResponse.json({
        success: true,
        message: 'Registration token generated successfully. Please check your email and bring the token to the admin for verification.',
        token: token,
        tokenId: result.insertId
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
