import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { generateOTP, sendOTPEmail, sendWelcomeEmail } from '@/lib/email';

// In-memory OTP store (resets on server restart/redeploy)
const otpStore: Map<string, { otp: string; email: string; expiresAt: number; used: boolean }> = new Map();

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
      
      const members: any = await executeQuery(memberQuery, [existingMemberRegNumber, existingMemberRegNumber]);
      
      if (members.length === 0) {
        return NextResponse.json(
          { success: false, message: 'Existing member not found' },
          { status: 404 }
        );
      }

      const member = members[0];
      const otp = generateOTP();
      const expiresAtMs = Date.now() + 10 * 60 * 1000; // 10 minutes

      // Store OTP in memory
      otpStore.set(member.member_reg_number, {
        otp,
        email: member.email,
        expiresAt: expiresAtMs,
        used: false,
      });

      // Try sending OTP email (non-blocking for success path)
      try {
        await sendOTPEmail(member.email, otp, member.name);
      } catch (e) {
        // Log only; allow client to continue and show OTP field
        console.error('Failed to send OTP email (continuing):', e);
      }

      return NextResponse.json({
        success: true,
        message: 'OTP sent successfully',
        memberName: member.name
      });

    } else if (action === 'verify-otp') {
      const { existingMemberRegNumber, otp } = data;

      // Verify OTP from in-memory store
      const record = otpStore.get(existingMemberRegNumber);
      if (!record || record.used || record.otp !== otp || Date.now() > record.expiresAt) {
        return NextResponse.json(
          { success: false, message: 'Invalid or expired OTP' },
          { status: 400 }
        );
      }
      // Mark OTP as used
      otpStore.set(existingMemberRegNumber, { ...record, used: true });

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
        fatherHusbandName, 
        motherWifeName, 
        registrationDate,
        existingMemberRegNumber,
        profilePhotoPath 
      } = data;

      // Check if email already exists
      const existingMemberQuery = 'SELECT id FROM members WHERE email = ?';
      const existingMembers: any = await executeQuery(existingMemberQuery, [email]);
      
      if (existingMembers.length > 0) {
        return NextResponse.json(
          { success: false, message: 'Email already registered' },
          { status: 400 }
        );
      }

      // Generate new member registration number
      const memberCountQuery = 'SELECT COUNT(*) as count FROM members';
      const countResult: any = await executeQuery(memberCountQuery);
      const memberCount = countResult[0].count as number;
      const newMemberRegNumber = `RHVS${String(memberCount + 1).padStart(6, '0')}`;

      // Insert new member
      const insertQuery = `
        INSERT INTO members (
          member_reg_number, name, email, phone, address, father_husband_name, mother_wife_name, 
          registration_date, existing_member_reg_number, profile_photo_path, verified_by_member_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      try {
        // Get verifier's ID for tracking
        const verifierQuery = 'SELECT id FROM members WHERE member_reg_number = ? LIMIT 1';
        const verifierResult: any = await executeQuery(verifierQuery, [existingMemberRegNumber]);
        const verifierId = verifierResult.length > 0 ? verifierResult[0].id : null;

        const result: any = await executeQuery(insertQuery, [
          newMemberRegNumber,
          name,
          email,
          phone,
          address,
          fatherHusbandName,
          motherWifeName,
          registrationDate,
          existingMemberRegNumber,
          profilePhotoPath || null,
          verifierId
        ]);

        // Fire-and-forget welcome email (do not block response)
        sendWelcomeEmail(email, name, newMemberRegNumber).catch((e) => {
          console.error('Welcome email error (non-blocking):', e);
        });

        return NextResponse.json({
          success: true,
          message: 'Member registered successfully',
          memberId: result.insertId,
          memberRegNumber: newMemberRegNumber
        });
      } catch (e: any) {
        // Handle duplicate keys and other SQL errors explicitly
        if (e?.code === 'ER_DUP_ENTRY') {
          return NextResponse.json(
            { success: false, message: 'Duplicate entry (email or member number already exists)' },
            { status: 400 }
          );
        }
        console.error('Insert member failed:', e);
        return NextResponse.json(
          { success: false, message: 'Database error while registering member' },
          { status: 500 }
        );
      }

    } else {
      return NextResponse.json(
        { success: false, message: 'Invalid action' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Registration API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
