import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { sendWelcomeEmail } from '@/lib/email';
import { generateCertificate } from '@/lib/certificate';
import { generateMemberRegistrationNumber } from '@/lib/member-registration';
import { getAdminScope } from '@/lib/admin-scope';

// GET - Fetch pending registration tokens or search by token
export async function GET(request: NextRequest) {
  try {
    // Check admin authentication and scope
    const scope = await getAdminScope(request);
    
    if (!scope.isSuperAdmin && !scope.isDistrictAdmin) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized access' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    
    // If token parameter is provided, search for specific token
    if (token) {
      let tokenQuery = `
        SELECT 
          id, token, name, email, phone, address, state, district, aadhar_card_number,
          father_husband_name, mother_wife_name, registration_date, existing_member_reg_number, 
          profile_photo_path, department, status, expires_at, created_at, updated_at,
          verified_by_admin_id, verified_at
        FROM registration_tokens 
        WHERE token = ?
      `;
      
      let queryParams = [token];
      
      // Apply district admin scope filter
      if (scope.isDistrictAdmin && !scope.isSuperAdmin) {
        tokenQuery += ` AND (district = ? OR district LIKE ?)`;
        queryParams.push(scope.districtName, `${scope.districtName}%`);
      }
      
      const tokens: any = await executeQuery(tokenQuery, queryParams);
      
      if (tokens.length === 0) {
        return NextResponse.json(
          { success: false, message: 'Token not found' },
          { status: 404 }
        );
      }

      const tokenData = tokens[0];
      
      // Check if token is expired
      if (new Date(tokenData.expires_at) < new Date()) {
        return NextResponse.json(
          { success: false, message: 'Token has expired' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          ...tokenData,
          created_at: new Date(tokenData.created_at),
          updated_at: new Date(tokenData.updated_at),
          expires_at: new Date(tokenData.expires_at),
          verified_at: tokenData.verified_at ? new Date(tokenData.verified_at) : null,
          registration_date: new Date(tokenData.registration_date)
        }
      });
    }

    // Regular paginated fetch
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'pending';

    const offset = (page - 1) * limit;

    // Build WHERE clause
    let whereConditions = ['status = ?'];
    let queryParams = [status];

    // Apply district admin scope filter
    if (scope.isDistrictAdmin && !scope.isSuperAdmin) {
      whereConditions.push('(district = ? OR district LIKE ?)');
      queryParams.push(scope.districtName, `${scope.districtName}%`);
    }

    if (search) {
      whereConditions.push('(name LIKE ? OR email LIKE ? OR token LIKE ?)');
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM registration_tokens ${whereClause}`;
    const countResult: any = await executeQuery(countQuery, queryParams);
    const total = countResult[0].total;

    // Get tokens with pagination
    const tokensQuery = `
      SELECT 
        id, token, name, email, phone, address, state, district, aadhar_card_number,
        father_husband_name, mother_wife_name, registration_date, existing_member_reg_number, 
        profile_photo_path, department, status, expires_at, created_at, updated_at,
        verified_by_admin_id, verified_at
      FROM registration_tokens 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    const tokens: any = await executeQuery(tokensQuery, [...queryParams, limit, offset]);

    return NextResponse.json({
      success: true,
      data: {
        tokens: tokens.map((token: any) => ({
          ...token,
          created_at: new Date(token.created_at),
          updated_at: new Date(token.updated_at),
          expires_at: new Date(token.expires_at),
          verified_at: token.verified_at ? new Date(token.verified_at) : null,
          registration_date: new Date(token.registration_date)
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching registration tokens:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch registration tokens' },
      { status: 500 }
    );
  }
}

// POST - Verify token and create member
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication and scope
    const scope = await getAdminScope(request);
    
    if (!scope.isSuperAdmin && !scope.isDistrictAdmin) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized access' },
        { status: 401 }
      );
    }

    const { token, adminId, action } = await request.json();

    if (action === 'verify') {
      console.log('🔍 Verifying token:', token);
      
      // First, let's check if the token exists at all
      let tokenExistsQuery = `SELECT * FROM registration_tokens WHERE token = ?`;
      let tokenExistsParams = [token];
      
      // Apply district admin scope filter
      if (scope.isDistrictAdmin && !scope.isSuperAdmin) {
        tokenExistsQuery += ` AND (district = ? OR district LIKE ?)`;
        tokenExistsParams.push(scope.districtName, `${scope.districtName}%`);
      }
      
      const allTokens: any = await executeQuery(tokenExistsQuery, tokenExistsParams);
      
      console.log('📊 Token query result:', allTokens.length, 'tokens found');
      
      if (allTokens.length === 0) {
        console.log('❌ Token not found in database');
        return NextResponse.json(
          { success: false, message: 'Token not found' },
          { status: 404 }
        );
      }

      const tokenData = allTokens[0];
      console.log('📋 Token data:', {
        id: tokenData.id,
        status: tokenData.status,
        expires_at: tokenData.expires_at,
        name: tokenData.name,
        email: tokenData.email
      });
      
      // Check if token is already verified
      if (tokenData.status === 'verified') {
        return NextResponse.json(
          { success: false, message: 'Token has already been verified' },
          { status: 400 }
        );
      }
      
      // Check if token is rejected
      if (tokenData.status === 'rejected') {
        return NextResponse.json(
          { success: false, message: 'Token has been rejected' },
          { status: 400 }
        );
      }
      
      // Check if token is expired
      const now = new Date();
      const expiresAt = new Date(tokenData.expires_at);
      console.log('⏰ Expiration check:', {
        now: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        isExpired: expiresAt < now
      });
      
      if (expiresAt < now) {
        console.log('❌ Token has expired');
        return NextResponse.json(
          { success: false, message: 'Token has expired' },
          { status: 400 }
        );
      }
      
      // Check if token is pending
      if (tokenData.status !== 'pending') {
        return NextResponse.json(
          { success: false, message: 'Token is not in pending status' },
          { status: 400 }
        );
      }

      // Check if this token has already been processed (member already created)
      const existingMemberByTokenQuery = 'SELECT id FROM members WHERE registration_token_id = ?';
      const existingMemberByToken: any = await executeQuery(existingMemberByTokenQuery, [tokenData.id]);
      
      if (existingMemberByToken.length > 0) {
        return NextResponse.json(
          { success: false, message: 'This token has already been processed and member created' },
          { status: 400 }
        );
      }

      // Check if email already exists in members table
      const existingMemberQuery = 'SELECT id FROM members WHERE email = ?';
      const existingMembers: any = await executeQuery(existingMemberQuery, [tokenData.email]);
      
      if (existingMembers.length > 0) {
        return NextResponse.json(
          { success: false, message: 'Email already registered as a member' },
          { status: 400 }
        );
      }

      // Check if Aadhar card number already exists in members table
      const existingAadharQuery = 'SELECT id, name, email FROM members WHERE aadhar_card_number = ?';
      const existingAadhar: any = await executeQuery(existingAadharQuery, [tokenData.aadhar_card_number]);
      
      if (existingAadhar.length > 0) {
        const existingMember = existingAadhar[0];
        return NextResponse.json(
          { 
            success: false, 
            message: `Aadhar card number ${tokenData.aadhar_card_number} is already registered with another member (${existingMember.name} - ${existingMember.email}). Since Aadhar is unique to each person, this registration cannot be verified. Please ask the applicant to verify their Aadhar number or contact the existing member.`,
            errorCode: 'DUPLICATE_AADHAR',
            existingMember: {
              name: existingMember.name,
              email: existingMember.email
            }
          },
          { status: 400 }
        );
      }

      // Generate member registration number - maintain sequential flow
      let memberRegNumber = await generateMemberRegistrationNumber();

      // Double-check that the generated registration number doesn't already exist
      const checkRegNumberQuery = 'SELECT id FROM members WHERE member_reg_number = ?';
      const existingRegNumber: any = await executeQuery(checkRegNumberQuery, [memberRegNumber]);
      
      if (existingRegNumber.length > 0) {
        // If it exists, find the next available number
        let nextNumber = maxNumber + 1;
        let newRegNumber = `RHVS${String(nextNumber).padStart(6, '0')}`;
        
        while (true) {
          const checkNextQuery = 'SELECT id FROM members WHERE member_reg_number = ?';
          const checkNextResult: any = await executeQuery(checkNextQuery, [newRegNumber]);
          
          if (checkNextResult.length === 0) {
            break; // Found available number
          }
          
          nextNumber++;
          newRegNumber = `RHVS${String(nextNumber).padStart(6, '0')}`;
        }
        
        memberRegNumber = newRegNumber;
      }

      // Validate profile photo is required
      if (!tokenData.profile_photo_path || tokenData.profile_photo_path.trim() === '') {
        return NextResponse.json(
          { success: false, message: 'Profile photo is required for member verification' },
          { status: 400 }
        );
      }

      // Insert new member
      const insertMemberQuery = `
        INSERT INTO members (
          name, email, phone, address, state, district, aadhar_card_number,
          father_husband_name, mother_wife_name, registration_date, existing_member_reg_number, 
          profile_photo_path, member_reg_number, department, status, verified_by_admin_id,
          verification_date, registration_token_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'verified', ?, NOW(), ?)
      `;
      
      const memberResult: any = await executeQuery(insertMemberQuery, [
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
        memberRegNumber,
        tokenData.department,
        adminId,
        tokenData.id
      ]);

      // Update token status
      await executeQuery(
        'UPDATE registration_tokens SET status = "verified", verified_by_admin_id = ?, verified_at = NOW() WHERE id = ?',
        [adminId, tokenData.id]
      );

      // Generate certificate
      const certificateData = await generateCertificate({
        memberId: memberResult.insertId,
        memberName: tokenData.name,
        memberRegNumber: memberRegNumber,
        registrationDate: tokenData.registration_date
      });

      // Store certificate
      const certificateQuery = `
        INSERT INTO member_certificates (member_id, certificate_number, certificate_path, generated_by_admin_id)
        VALUES (?, ?, ?, ?)
      `;
      
      await executeQuery(certificateQuery, [
        memberResult.insertId,
        certificateData.certificateNumber,
        certificateData.certificatePath,
        adminId
      ]);

      // Send welcome email with certificate
      try {
        await sendWelcomeEmail(
          tokenData.email, 
          tokenData.name, 
          memberRegNumber,
          certificateData.certificatePath
        );
      } catch (e) {
        console.error('Failed to send welcome email (non-blocking):', e);
      }

      return NextResponse.json({
        success: true,
        message: 'Member verified and registered successfully',
        data: {
          memberId: memberResult.insertId,
          memberRegNumber: memberRegNumber,
          certificatePath: certificateData.certificatePath
        }
      });

    } else if (action === 'reject') {
      // Reject the token
      await executeQuery(
        'UPDATE registration_tokens SET status = "rejected", verified_by_admin_id = ?, verified_at = NOW() WHERE token = ?',
        [adminId, token]
      );

      return NextResponse.json({
        success: true,
        message: 'Registration token rejected'
      });

    } else {
      return NextResponse.json(
        { success: false, message: 'Invalid action' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error verifying token:', error);
    
    // Handle specific database errors
    if (error?.code === 'ER_DUP_ENTRY') {
      if (error.sqlMessage?.includes('aadhar_card_number')) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'Aadhar card number already exists in the system. Since Aadhar is unique to each person, this registration cannot be verified. Please ask the applicant to verify their Aadhar number.',
            errorCode: 'DUPLICATE_AADHAR'
          },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to verify token' },
      { status: 500 }
    );
  }
}
