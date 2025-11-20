import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { getAdminScope, ensurePermission } from '@/lib/admin-scope';
import { sendWelcomeEmail } from '@/lib/email';
import { generateMemberRegistrationNumber } from '@/lib/member-registration';
import { generateCertificate } from '@/lib/certificate';
import { generateIDCard } from '@/lib/id-card-generator';
import { consumeStagedBlob } from '@/lib/blob-storage';

const retainCertificateFiles = process.env.RETAIN_CERTIFICATE_FILES !== 'false';

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication and permissions
    const scope = await getAdminScope(request);
    
    if (!scope.isSuperAdmin && !scope.isDistrictAdmin) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized access' },
        { status: 401 }
      );
    }

    // Check if admin has permission to add members
    if (!ensurePermission(scope, ['add_members', 'manage_members'])) {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions to add members' },
        { status: 403 }
      );
    }

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
      profilePhotoPath: incomingProfilePhotoPath,
      signaturePath: incomingSignaturePath,
      feePaid
    } = await request.json();

    // Debug logging
    console.log('Admin member add request:', {
      name, email, phone, address, stateId, districtId,
      aadharCardNumber, fatherHusbandName, motherWifeName,
      registrationDate, profilePhotoPath: incomingProfilePhotoPath, signaturePath: incomingSignaturePath, feePaid
    });

    // Validate required fields
    if (!name || !email || !phone || !address || !stateId || !districtId || 
        !aadharCardNumber || !fatherHusbandName || !motherWifeName || 
        !registrationDate || !incomingProfilePhotoPath) {
      return NextResponse.json(
        { success: false, message: 'All required fields must be provided' },
        { status: 400 }
      );
    }
    
    // Validate signature is required
    if (!incomingSignaturePath) {
      return NextResponse.json(
        { success: false, message: 'Signature image is required' },
        { status: 400 }
      );
    }

    let profilePhotoPath = incomingProfilePhotoPath;
    let signaturePath = incomingSignaturePath;

    let profilePhotoBlob: Buffer | null = null;
    let profilePhotoMime: string | null = null;
    let profilePhotoHash: string | null = null;
    let profilePhotoSize: number | null = null;
    let profilePhotoOriginalName: string | null = null;

    let signatureBlob: Buffer | null = null;
    let signatureMime: string | null = null;
    let signatureHash: string | null = null;
    let signatureSize: number | null = null;
    let signatureOriginalName: string | null = null;

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

    if (typeof signaturePath === 'string' && signaturePath.startsWith('/api/media/staged/')) {
      const assetId = signaturePath.split('/').pop();
      if (!assetId) {
        return NextResponse.json(
          { success: false, message: 'Invalid staged signature reference' },
          { status: 400 }
        );
      }
      const asset = await consumeStagedBlob(assetId);
      if (!asset) {
        return NextResponse.json(
          { success: false, message: 'Signature upload expired. Please re-upload.' },
          { status: 400 }
        );
      }
      signatureBlob = asset.data;
      signatureMime = asset.mimeType;
      signatureHash = asset.hash;
      signatureSize = asset.size;
      signatureOriginalName = asset.originalName;
      signaturePath = null;
    }

    // Check if email already exists
    const existingMemberQuery = 'SELECT id FROM members WHERE email = ?';
    const existingMembers = await executeQuery(existingMemberQuery, [email]) as Array<{ id: number }>;
    
    if (existingMembers.length > 0) {
      return NextResponse.json(
        { success: false, message: 'Email already registered' },
        { status: 400 }
      );
    }

    // Automatically set existing member registration number based on admin type
    let verifierId = null;
    let existingMemberRegNumberFinal = 'RHVS000000'; // Default superadmin reference
    
    if (scope.isDistrictAdmin && !scope.isSuperAdmin) {
      // For district admins, use their own registration number
      const adminQuery = `
        SELECT m.member_reg_number, m.id as member_id
        FROM district_admins da
        JOIN members m ON da.member_id = m.id
        WHERE da.id = ?
        LIMIT 1
      `;
      const adminResult = await executeQuery(adminQuery, [scope.adminId]) as Array<{ member_id: number; member_reg_number: string }>;
      
      if (adminResult.length > 0 && adminResult[0].member_id) {
        existingMemberRegNumberFinal = adminResult[0].member_reg_number;
        verifierId = adminResult[0].member_id;
      } else {
        return NextResponse.json(
          { success: false, message: 'District admin member record not found' },
          { status: 400 }
        );
      }
    }
    // For superadmins, use RHVS000000 as reference (superadmin reference)

    // Get state and district names from IDs
    const stateQuery = 'SELECT state_name_english, language_pref FROM states WHERE id = ?';
    const stateResult = await executeQuery(stateQuery, [stateId]) as Array<{ state_name_english: string; language_pref: number | null }>;
    const stateName = stateResult.length > 0 ? stateResult[0].state_name_english : '';
    const languagePreference = stateResult.length > 0
      ? (stateResult[0].language_pref === 0 ? 'en' : 'hi')
      : 'hi';

    const districtQuery = 'SELECT district_name_english FROM districts WHERE district_code = ? LIMIT 1';
    const districtResult = await executeQuery(districtQuery, [districtId]) as Array<{ district_name_english: string }>;
    const districtName = districtResult.length > 0 ? districtResult[0].district_name_english : '';

    // SECURITY CHECK: District admins can only add members to their own district
    if (scope.isDistrictAdmin && !scope.isSuperAdmin) {
      // Check if the district being added matches the admin's district
      if (districtName.toLowerCase() !== scope.districtName?.toLowerCase()) {
        return NextResponse.json(
          { success: false, message: `You can only add members to your assigned district: ${scope.districtName}` },
          { status: 403 }
        );
      }
    }

    // Generate new member registration number - maintain sequential flow
    const memberRegNumber = await generateMemberRegistrationNumber();

    // Insert new member directly into members table
    const insertMemberQuery = `
      INSERT INTO members (
        name, email, phone, address, father_husband_name, mother_wife_name,
        registration_date, existing_member_reg_number, profile_photo_path, signature_path,
        member_reg_number, state, aadhar_card_number,
        verified_by_admin_id, verification_date, status, district,
        verified_by_member_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'verified', ?, ?, NOW(), NOW())
    `;

    const memberResult = await executeQuery(insertMemberQuery, [
      name,
      email,
      phone,
      address,
      fatherHusbandName,
      motherWifeName,
      registrationDate,
      existingMemberRegNumberFinal,
      profilePhotoPath,
      signaturePath,
      memberRegNumber,
      stateName,
      aadharCardNumber,
      scope.isSuperAdmin ? scope.adminId : null, // Only superadmin IDs for verified_by_admin_id
      districtName,
      verifierId
    ]) as { insertId: number };

    const memberId = memberResult.insertId;

    let resolvedProfilePath = profilePhotoPath || null;
    if (profilePhotoBlob) {
      resolvedProfilePath = `/api/media/members/${memberId}/profile`;
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
          memberId
        ]
      );
    }

    let resolvedSignaturePath = signaturePath || null;
    if (signatureBlob) {
      resolvedSignaturePath = `/api/media/members/${memberId}/signature`;
      await executeQuery(
        `UPDATE members
         SET signature_blob = ?,
             signature_mime = ?,
             signature_hash = ?,
             signature_size = ?,
             signature_original_name = ?,
             signature_path = ?
         WHERE id = ?`,
        [
          signatureBlob,
          signatureMime,
          signatureHash,
          signatureSize,
          signatureOriginalName,
          resolvedSignaturePath,
          memberId
        ]
      );
    }

    // Generate membership certificate
    let certificatePath = null;
    let certificateNumber = null;
    let certificateRecordId: number | null = null;
    
    try {
      console.log('Generating membership certificate for:', memberRegNumber);
      const certificateResult = await generateCertificate({
        memberId: memberId,
        memberName: name,
        memberRegNumber: memberRegNumber,
        registrationDate: registrationDate,
        profilePhotoPath: resolvedProfilePath,
        language: languagePreference
      });
      
      certificatePath = certificateResult.certificatePath;
      certificateNumber = certificateResult.certificateNumber;
      
      console.log('✅ Certificate generated:', certificateNumber, certificatePath);
      
      // Store certificate info in database
      const certificateQuery = `
        INSERT INTO member_certificates (member_id, certificate_number, certificate_path, generated_by_admin_id)
        VALUES (?, ?, ?, ?)
      `;
      
      const certificateInsertResult = await executeQuery(certificateQuery, [
        memberId,
        certificateNumber,
        certificatePath,
        scope.adminId
      ]) as { insertId: number };
      
      certificateRecordId = certificateInsertResult.insertId ?? null;
      
      console.log('✅ Certificate record saved to database');
    } catch (error) {
      console.error('❌ Error generating certificate:', error);
      // Continue without certificate - don't fail the registration
    }

    // Generate ID card
    let idCardPath = null;
    
    try {
      console.log('Generating ID card for:', memberRegNumber);
      const idCardResult = await generateIDCard({
        memberId: memberId,
        memberName: name,
        memberRegNumber: memberRegNumber,
        profilePhotoPath: resolvedProfilePath,
        address: address,
        designation: 'Member',
        cardType: 'membership',
        language: languagePreference,
        state: stateName,
        district: districtName
      });
      
      idCardPath = idCardResult.idCardPath;
      
      console.log('✅ ID card generated:', idCardPath);
    } catch (error) {
      console.error('❌ Error generating ID card:', error);
      // Continue without ID card - don't fail the registration
    }

    // Send welcome email with certificate and ID card
    try {
      console.log('Sending welcome email to:', email, 'with certificate:', certificatePath, 'and ID card:', idCardPath);
      const welcomeEmailResult = await sendWelcomeEmail(
        email,
        name,
        memberRegNumber,
        certificatePath || undefined,
        idCardPath || undefined,
        languagePreference
      );
      
      if (welcomeEmailResult?.success) {
      console.log('✅ Welcome email sent successfully');
        
        if (!retainCertificateFiles && certificateRecordId) {
          await executeQuery(
            'UPDATE member_certificates SET certificate_path = NULL WHERE id = ?',
            [certificateRecordId]
          );
        }
      } else {
        console.error('❌ Error sending welcome email:', welcomeEmailResult?.error);
      }
    } catch (error) {
      console.error('❌ Error sending welcome email:', error);
    }

    // Log the admin action
    try {
      // Get admin name for logging
      let adminName = 'Unknown Admin';
      try {
        if (scope.isSuperAdmin) {
          const adminQuery = 'SELECT email FROM superadmin WHERE id = ? LIMIT 1';
          const adminResult = await executeQuery(adminQuery, [scope.adminId]) as Array<{ email: string }>;
          if (adminResult.length > 0) {
            // Extract name from email (part before @) and capitalize it
            const emailName = adminResult[0].email.split('@')[0];
            adminName = emailName
              .split(/[._-]/)
              .map(part => part.charAt(0).toUpperCase() + part.slice(1))
              .join(' ');
          }
        } else if (scope.isDistrictAdmin) {
          const adminQuery = `
            SELECT m.name 
            FROM district_admins da 
            JOIN members m ON da.member_id = m.id 
            WHERE da.id = ? 
            LIMIT 1
          `;
          const adminResult = await executeQuery(adminQuery, [scope.adminId]) as Array<{ name: string }>;
          if (adminResult.length > 0) {
            adminName = adminResult[0].name;
          }
        }
      } catch (nameError) {
        console.warn('Could not fetch admin name for activity log:', nameError);
      }

      const activityLogQuery = `
        INSERT INTO activity_logs (user_id, user_name, user_type, action, details, created_at)
        VALUES (?, ?, ?, ?, ?, NOW())
      `;
      
      const logDetails = JSON.stringify({
        action: 'member_added_direct',
        memberId: memberId,
        memberName: name,
        memberEmail: email,
        memberRegNumber: memberRegNumber,
        verifiedBy: scope.isSuperAdmin ? 'Superadmin' : 'District Admin',
        verifiedByRegNumber: existingMemberRegNumberFinal,
        adminId: scope.adminId,
        adminType: scope.isSuperAdmin ? 'superadmin' : 'district_admin'
      });

      await executeQuery(activityLogQuery, [
        scope.adminId?.toString() || '0', 
        adminName,
        scope.isSuperAdmin ? 'superadmin' : 'district_admin', 
        'member_added_direct', 
        logDetails
      ]);
    } catch (error) {
      console.error('Error logging admin action:', error);
    }

    return NextResponse.json({
      success: true,
      message: 'Member registered successfully',
      memberId: memberId,
      memberRegNumber: memberRegNumber,
      certificatePath: certificatePath,
      certificateNumber: certificateNumber,
      idCardPath: idCardPath
    });

  } catch (error) {
    console.error('Error in admin member add:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

