import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { generateOTP, sendOTPEmail, sendWelcomeEmail } from '@/lib/email';
import { generateMemberRegistrationNumber } from '@/lib/member-registration';
import { generateCertificate } from '@/lib/certificate';
import { generateIDCard } from '@/lib/id-card-generator';
import { consumeStagedBlob } from '@/lib/blob-storage';

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
      
      const members = await executeQuery(memberQuery, [existingMemberRegNumber, existingMemberRegNumber]) as Array<{ id: number; name: string; email: string; member_reg_number: string }>;
      
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
      } catch (_e) {
        // Log only; allow client to continue and show OTP field
        console.error('Failed to send OTP email (continuing):', _e);
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
        stateId,
        districtId,
        aadharCardNumber,
        fatherHusbandName, 
        motherWifeName, 
        registrationDate,
        existingMemberRegNumber,
        profilePhotoPath: incomingProfilePhotoPath 
      } = data;

      // Check if email already exists
      const existingMemberQuery = 'SELECT id FROM members WHERE email = ?';
      const existingMembers = await executeQuery(existingMemberQuery, [email]) as Array<{ id: number }>;
      
      if (existingMembers.length > 0) {
        return NextResponse.json(
          { success: false, message: 'Email already registered' },
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

      // Generate new member registration number - maintain sequential flow
      const newMemberRegNumber = await generateMemberRegistrationNumber();

      let profilePhotoPath = incomingProfilePhotoPath;
      let profilePhotoBlob: Buffer | null = null;
      let profilePhotoMime: string | null = null;
      let profilePhotoHash: string | null = null;
      let profilePhotoSize: number | null = null;
      let profilePhotoOriginalName: string | null = null;

      if (typeof profilePhotoPath === 'string' && profilePhotoPath.startsWith('/api/media/staged/')) {
        const assetId = profilePhotoPath.split('/').pop();
        if (!assetId) {
          return NextResponse.json(
            { success: false, message: 'Invalid staged profile photo reference' },
            { status: 400 }
          );
        }
        const asset = await consumeStagedBlob(assetId);
        if (!asset) {
          return NextResponse.json(
            { success: false, message: 'Profile photo upload expired. Please re-upload.' },
            { status: 400 }
          );
        }
        profilePhotoBlob = asset.data;
        profilePhotoMime = asset.mimeType;
        profilePhotoHash = asset.hash;
        profilePhotoSize = asset.size;
        profilePhotoOriginalName = asset.originalName;
        profilePhotoPath = null;
      }

      // Insert new member
      const insertQuery = `
        INSERT INTO members (
          member_reg_number, name, email, phone, address, state, district, aadhar_card_number, 
          father_husband_name, mother_wife_name, registration_date, existing_member_reg_number, 
          profile_photo_path, verified_by_member_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      try {
        // Get verifier's ID for tracking
        const verifierQuery = 'SELECT id FROM members WHERE member_reg_number = ? LIMIT 1';
        const verifierResult = await executeQuery(verifierQuery, [existingMemberRegNumber]) as Array<{ id: number }>;
        const verifierId = verifierResult.length > 0 ? verifierResult[0].id : null;

        const result = await executeQuery(insertQuery, [
          newMemberRegNumber,
          name,
          email,
          phone,
          address,
          stateName,
          districtName,
          aadharCardNumber,
          fatherHusbandName,
          motherWifeName,
          registrationDate,
          existingMemberRegNumber,
          profilePhotoPath || null,
          verifierId
        ]) as { insertId: number };

        let resolvedProfilePath = profilePhotoPath || null;

        if (profilePhotoBlob) {
          resolvedProfilePath = `/api/media/members/${result.insertId}/profile`;
          await executeQuery(
            `UPDATE members 
             SET profile_photo_blob = ?, 
                 profile_photo_mime = ?, 
                 profile_photo_hash = ?, 
                 profile_photo_size = ?, 
                 profile_photo_original_name = ?, 
                 profile_photo_path = ?
             WHERE id = ?`,
            [
              profilePhotoBlob,
              profilePhotoMime,
              profilePhotoHash,
              profilePhotoSize,
              profilePhotoOriginalName,
              resolvedProfilePath,
              result.insertId
            ]
          );
        }

        // Generate certificate and ID card (fire-and-forget)
        Promise.all([
          // Generate certificate
          generateCertificate({
            memberId: result.insertId,
            memberName: name,
            memberRegNumber: newMemberRegNumber,
            registrationDate: registrationDate,
            profilePhotoPath: resolvedProfilePath || undefined
          }).then(async (certResult) => {
            // Store certificate in database
            const certificateQuery = `
              INSERT INTO member_certificates (member_id, certificate_number, certificate_path, generated_by_admin_id)
              VALUES (?, ?, ?, ?)
            `;
            await executeQuery(certificateQuery, [
              result.insertId,
              certResult.certificateNumber,
              certResult.certificatePath,
              verifierId
            ]);
            return certResult.certificatePath;
          }).catch((e) => {
            console.error('Certificate generation error (non-blocking):', e);
            return null;
          }),
          
          // Generate ID card
          generateIDCard({
            memberId: result.insertId,
            memberName: name,
            memberRegNumber: newMemberRegNumber,
            profilePhotoPath: resolvedProfilePath || undefined,
            address: address,
            designation: 'Member'
          }).then((idCardResult) => {
            return idCardResult.idCardPath;
          }).catch((e) => {
            console.error('ID card generation error (non-blocking):', e);
            return null;
          })
        ]).then(([certPath, idCardPath]) => {
          // Send welcome email with both documents
          return sendWelcomeEmail(email, name, newMemberRegNumber, certPath || undefined, idCardPath || undefined);
        }).catch((_e) => {
          console.error('Welcome email error (non-blocking):', _e);
        });

        return NextResponse.json({
          success: true,
          message: 'Member registered successfully',
          memberId: result.insertId,
          memberRegNumber: newMemberRegNumber,
          profilePhotoPath: resolvedProfilePath
        });
      } catch (e: unknown) {
        // Handle duplicate keys and other SQL errors explicitly
        if ((e as { code?: string })?.code === 'ER_DUP_ENTRY') {
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
