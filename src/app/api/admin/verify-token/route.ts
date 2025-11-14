import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { getAdminScope } from '@/lib/admin-scope';
import { generateMemberRegistrationNumber } from '@/lib/member-registration';
import { generateCertificate } from '@/lib/certificate';
import { generateIDCard } from '@/lib/id-card-generator';
import { sendWelcomeEmail } from '@/lib/email';
import { getStateLanguagePreference } from '@/lib/language-preference';

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const scope = await getAdminScope(request);
    
    if (!scope.isSuperAdmin && !scope.isDistrictAdmin) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized access' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    const offset = (page - 1) * limit;

    // Build WHERE clause based on filters
    const whereConditions: string[] = [];
    const queryParams: Array<string | number> = [];

    // District admin can only see tokens from their district
    if (scope.isDistrictAdmin && !scope.isSuperAdmin && scope.districtName) {
      whereConditions.push('rt.district = ?');
      queryParams.push(scope.districtName);
    }

    // Status filter
    if (status) {
      whereConditions.push('rt.status = ?');
      queryParams.push(status);
    }

    // Search filter
    if (search) {
      whereConditions.push(
        '(rt.name LIKE ? OR rt.email LIKE ? OR rt.phone LIKE ? OR rt.token LIKE ? OR rt.existing_member_reg_number LIKE ?)'
      );
      const searchPattern = `%${search}%`;
      queryParams.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM registration_tokens rt
      ${whereClause}
    `;
    
    const countResult = await executeQuery(countQuery, queryParams) as Array<{ total: number }>;
    const total = countResult[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);

    // Get tokens with pagination
    const tokensQuery = `
      SELECT 
        rt.*,
        CASE 
          WHEN rt.profile_photo_blob IS NOT NULL THEN CONCAT('/api/media/registration-tokens/', rt.id, '/profile')
          ELSE rt.profile_photo_path
        END AS resolved_profile_photo_path,
        CASE 
          WHEN rt.signature_blob IS NOT NULL THEN CONCAT('/api/media/registration-tokens/', rt.id, '/signature')
          ELSE rt.signature_path
        END AS resolved_signature_path,
        COALESCE(m.name, 'N/A') as verified_by_admin_name,
        mem.member_reg_number,
        initiator.name AS initiated_by_name,
        initiator.email AS initiated_by_email,
        initiator.phone AS initiated_by_phone
      FROM registration_tokens rt
      LEFT JOIN district_admins da ON rt.verified_by_admin_id = da.id
      LEFT JOIN members m ON da.member_id = m.id
      LEFT JOIN members mem ON mem.email = rt.email AND mem.verified_by_admin_id = rt.verified_by_admin_id
      LEFT JOIN members initiator ON initiator.member_reg_number = rt.existing_member_reg_number
      ${whereClause}
      ORDER BY rt.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const tokens = await executeQuery(tokensQuery, [...queryParams, limit, offset]) as Array<{
      id: number;
      token: string;
      name: string;
      email: string;
      phone: string;
      address: string;
      state: string;
      district: string;
      aadhar_card_number: string;
      father_husband_name: string;
      mother_wife_name: string;
      registration_date: string;
      existing_member_reg_number: string;
      profile_photo_path: string;
      signature_path: string;
      department: string;
      status: string;
      created_at: string;
      expires_at: string;
      verified_at: string | null;
      verified_by_admin_id: number | null;
      verified_by_admin_name: string | null;
      member_reg_number: string | null;
      initiated_by_name?: string | null;
      initiated_by_email?: string | null;
      initiated_by_phone?: string | null;
      resolved_profile_photo_path?: string | null;
      resolved_signature_path?: string | null;
    }>;

    return NextResponse.json({
      success: true,
      data: {
        tokens: tokens.map(token => ({
          id: token.id,
          token: token.token,
          name: token.name,
          email: token.email,
          phone: token.phone,
          address: token.address,
          state: token.state,
          district: token.district,
          aadharCardNumber: token.aadhar_card_number,
          fatherHusbandName: token.father_husband_name,
          motherWifeName: token.mother_wife_name,
          registrationDate: token.registration_date,
          existingMemberRegNumber: token.existing_member_reg_number,
          existing_member_reg_number: token.existing_member_reg_number,
          profilePhotoPath: token.resolved_profile_photo_path ?? token.profile_photo_path,
          signaturePath: token.resolved_signature_path ?? token.signature_path,
          department: token.department,
          status: token.status,
          createdAt: token.created_at,
          expiresAt: token.expires_at,
          verifiedAt: token.verified_at,
          verifiedByAdminId: token.verified_by_admin_id,
          verifiedByAdminName: token.verified_by_admin_name,
          memberRegNumber: token.member_reg_number,
          initiatedByName: token.initiated_by_name,
          initiatedByEmail: token.initiated_by_email,
          initiatedByPhone: token.initiated_by_phone,
          initiated_by_name: token.initiated_by_name,
          initiated_by_email: token.initiated_by_email,
          initiated_by_phone: token.initiated_by_phone,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching tokens:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tokens' },
      { status: 500 }
    );
  }
}

const retainCertificateFiles = process.env.RETAIN_CERTIFICATE_FILES !== 'false';

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const scope = await getAdminScope(request);
    
    if (!scope.isSuperAdmin && !scope.isDistrictAdmin) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized access' },
        { status: 401 }
      );
    }

    const { token, action } = await request.json();

    if (!token || !action) {
      return NextResponse.json(
        { success: false, message: 'Token and action are required' },
        { status: 400 }
      );
    }

    // Get token details
    const tokenQuery = `
      SELECT * FROM registration_tokens 
      WHERE token = ? AND status = 'pending' AND expires_at > NOW()
      LIMIT 1
    `;
    
    const tokens = await executeQuery(tokenQuery, [token]) as Array<{
      id: number;
      name: string;
      email: string;
      phone: string;
      address: string;
      state: string;
      district: string;
      aadhar_card_number: string;
      father_husband_name: string;
      mother_wife_name: string;
      registration_date: string;
      existing_member_reg_number: string;
      profile_photo_path: string;
      profile_photo_blob: Buffer | null;
      profile_photo_mime: string | null;
      profile_photo_hash: string | null;
      profile_photo_size: number | null;
      profile_photo_original_name: string | null;
      signature_path: string;
      signature_blob: Buffer | null;
      signature_mime: string | null;
      signature_hash: string | null;
      signature_size: number | null;
      signature_original_name: string | null;
      department: string;
    }>;

    if (tokens.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired token' },
        { status: 404 }
      );
    }

    const tokenData = tokens[0];
    const languagePreference = await getStateLanguagePreference({
      stateName: tokenData.state
    });

    if (action === 'reject') {
      // Reject the token
      await executeQuery(
        'UPDATE registration_tokens SET status = ?, verified_by_admin_id = ?, verified_at = NOW() WHERE id = ?',
        ['rejected', scope.adminId, tokenData.id]
      );

      return NextResponse.json({
        success: true,
        message: 'Registration token rejected successfully'
      });
    }

    if (action === 'verify') {
      // Check if email already exists in members table
      const existingMemberQuery = 'SELECT id FROM members WHERE email = ?';
      const existingMembers = await executeQuery(existingMemberQuery, [tokenData.email]) as Array<{ id: number }>;
      
      if (existingMembers.length > 0) {
        return NextResponse.json(
          { success: false, message: 'Email already registered as a member' },
          { status: 400 }
        );
      }

      // Generate new member registration number
      const memberRegNumber = await generateMemberRegistrationNumber();

      // Get verifier's ID for tracking
      let verifierId = null;
      if (scope.isDistrictAdmin && !scope.isSuperAdmin) {
        // For district admins, use their member ID
        const adminQuery = `
          SELECT m.id as member_id
          FROM district_admins da
          JOIN members m ON da.member_id = m.id
          WHERE da.id = ?
          LIMIT 1
        `;
        const adminResult = await executeQuery(adminQuery, [scope.adminId]) as Array<{ member_id: number }>;
        verifierId = adminResult.length > 0 ? adminResult[0].member_id : null;
      }

      // Insert new member
      const insertMemberQuery = `
        INSERT INTO members (
          member_reg_number, name, email, phone, address, state, district, aadhar_card_number,
          father_husband_name, mother_wife_name, registration_date, existing_member_reg_number,
          profile_photo_path, signature_path, department, verified_by_admin_id, verification_date,
          status, verified_by_member_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'verified', ?, NOW(), NOW())
      `;

      const memberResult = await executeQuery(insertMemberQuery, [
        memberRegNumber,
        tokenData.name,
        tokenData.email,
        tokenData.phone,
        tokenData.address,
        tokenData.state,
        tokenData.district,
        tokenData.aadhar_card_number,
        tokenData.father_husband_name,
        tokenData.mother_wife_name,
        tokenData.registration_date,
        tokenData.existing_member_reg_number,
        tokenData.profile_photo_path,
        tokenData.signature_path,
        tokenData.department,
        scope.adminId,
        verifierId
      ]) as { insertId: number };

      const memberId = memberResult.insertId;

      let memberProfilePath = tokenData.profile_photo_path;
      if (tokenData.profile_photo_blob) {
        memberProfilePath = `/api/media/members/${memberId}/profile`;
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
            tokenData.profile_photo_blob,
            tokenData.profile_photo_mime,
            tokenData.profile_photo_hash,
            tokenData.profile_photo_size,
            tokenData.profile_photo_original_name,
            memberProfilePath,
            memberId
          ]
        );
      }

      let memberSignaturePath = tokenData.signature_path;
      if (tokenData.signature_blob) {
        memberSignaturePath = `/api/media/members/${memberId}/signature`;
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
            tokenData.signature_blob,
            tokenData.signature_mime,
            tokenData.signature_hash,
            tokenData.signature_size,
            tokenData.signature_original_name,
            memberSignaturePath,
            memberId
          ]
        );
      }

      // Update token status
      await executeQuery(
        'UPDATE registration_tokens SET status = ?, verified_by_admin_id = ?, verified_at = NOW() WHERE id = ?',
        ['verified', scope.adminId, tokenData.id]
      );

      // Generate membership certificate
      let certificatePath = null;
      let certificateNumber = null;
      let certificateRecordId: number | null = null;
      
      try {
        console.log('Generating membership certificate for:', memberRegNumber);
        const certificateResult = await generateCertificate({
          memberId: memberId,
          memberName: tokenData.name,
          memberRegNumber: memberRegNumber,
          registrationDate: tokenData.registration_date,
          profilePhotoPath: memberProfilePath || undefined,
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
          memberName: tokenData.name,
          memberRegNumber: memberRegNumber,
          profilePhotoPath: memberProfilePath || undefined,
          address: tokenData.address,
          designation: 'Member',
          cardType: 'membership',
          language: languagePreference
        });
        
        idCardPath = idCardResult.idCardPath;
        
        console.log('✅ ID card generated:', idCardPath);
      } catch (error) {
        console.error('❌ Error generating ID card:', error);
        // Continue without ID card - don't fail the registration
      }

      // Send welcome email with certificate and ID card
      try {
        console.log('Sending welcome email to:', tokenData.email, 'with certificate:', certificatePath, 'and ID card:', idCardPath);
        const welcomeEmailResult = await sendWelcomeEmail(
          tokenData.email,
          tokenData.name,
          memberRegNumber,
          certificatePath || undefined,
          idCardPath || undefined,
          languagePreference
        );
        
        if (welcomeEmailResult?.success) {
          console.log('✅ Welcome email sent successfully');
        } else {
          console.error('❌ Welcome email failed:', welcomeEmailResult?.error);
        }
        
        if (
          !retainCertificateFiles &&
          welcomeEmailResult?.success &&
          certificateRecordId
        ) {
          await executeQuery(
            'UPDATE member_certificates SET certificate_path = NULL WHERE id = ?',
            [certificateRecordId]
          );
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
            const adminQuery = 'SELECT name FROM superadmins WHERE id = ? LIMIT 1';
            const adminResult = await executeQuery(adminQuery, [scope.adminId]) as Array<{ name: string }>;
            if (adminResult.length > 0) {
              adminName = adminResult[0].name;
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
          action: 'token_verified',
          memberId: memberId,
          memberName: tokenData.name,
          memberEmail: tokenData.email,
          memberRegNumber: memberRegNumber,
          verifiedBy: scope.isSuperAdmin ? 'Superadmin' : 'District Admin',
          adminId: scope.adminId,
          adminType: scope.isSuperAdmin ? 'superadmin' : 'district_admin',
          tokenId: tokenData.id
        });

        await executeQuery(activityLogQuery, [
          scope.adminId?.toString() || '0', 
          adminName,
          scope.isSuperAdmin ? 'superadmin' : 'district_admin', 
          'token_verified', 
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
    }

    return NextResponse.json(
      { success: false, message: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error in token verification:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
