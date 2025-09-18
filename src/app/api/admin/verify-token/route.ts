import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { sendWelcomeEmail } from '@/lib/email';
import { generateCertificate } from '@/lib/certificate';

// GET - Fetch pending registration tokens or search by token
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    
    // If token parameter is provided, search for specific token
    if (token) {
      const tokenQuery = `
        SELECT 
          id, token, name, email, phone, address, father_husband_name, mother_wife_name,
          registration_date, existing_member_reg_number, profile_photo_path,
          district, department, status, expires_at, created_at, updated_at,
          verified_by_admin_id, verified_at
        FROM registration_tokens 
        WHERE token = ?
      `;
      
      const tokens: any = await executeQuery(tokenQuery, [token]);
      
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
        id, token, name, email, phone, address, father_husband_name, mother_wife_name,
        registration_date, existing_member_reg_number, profile_photo_path,
        district, department, status, expires_at, created_at, updated_at,
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
    const { token, adminId, action } = await request.json();

    if (action === 'verify') {
      console.log('🔍 Verifying token:', token);
      
      // First, let's check if the token exists at all
      const tokenExistsQuery = `SELECT * FROM registration_tokens WHERE token = ?`;
      const allTokens: any = await executeQuery(tokenExistsQuery, [token]);
      
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

      // Check if email already exists in members table
      const existingMemberQuery = 'SELECT id FROM members WHERE email = ?';
      const existingMembers: any = await executeQuery(existingMemberQuery, [tokenData.email]);
      
      if (existingMembers.length > 0) {
        return NextResponse.json(
          { success: false, message: 'Email already registered as a member' },
          { status: 400 }
        );
      }

      // Generate member registration number
      const countQuery = 'SELECT COUNT(*) as count FROM members';
      const countResult: any = await executeQuery(countQuery, []);
      const memberCount = countResult[0].count;
      const memberRegNumber = `RHVS${String(memberCount + 1).padStart(6, '0')}`;

      // Insert new member
      const insertMemberQuery = `
        INSERT INTO members (
          name, email, phone, address, father_husband_name, mother_wife_name,
          registration_date, existing_member_reg_number, profile_photo_path,
          member_reg_number, district, department, status, verified_by_admin_id,
          verification_date, registration_token_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'verified', ?, NOW(), ?)
      `;
      
      const memberResult: any = await executeQuery(insertMemberQuery, [
        tokenData.name,
        tokenData.email,
        tokenData.phone,
        tokenData.address,
        tokenData.father_husband_name,
        tokenData.mother_wife_name,
        tokenData.registration_date,
        tokenData.existing_member_reg_number,
        tokenData.profile_photo_path,
        memberRegNumber,
        tokenData.district,
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
  } catch (error) {
    console.error('Error verifying token:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to verify token' },
      { status: 500 }
    );
  }
}
