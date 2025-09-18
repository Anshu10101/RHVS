import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

// GET - Fetch all members with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const district = searchParams.get('district') || '';
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'DESC';

    const offset = (page - 1) * limit;

    // Build WHERE clause
    let whereConditions = [];
    let queryParams = [];

    if (search) {
      whereConditions.push(`(name LIKE ? OR email LIKE ? OR phone LIKE ? OR member_reg_number LIKE ?)`);
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (status) {
      whereConditions.push('status = ?');
      queryParams.push(status);
    }

    if (district) {
      whereConditions.push('district = ?');
      queryParams.push(district);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM members ${whereClause}`;
    const countResult: any = await executeQuery(countQuery, queryParams);
    const total = countResult[0].total;

    // Get members with pagination
    const membersQuery = `
      SELECT 
        id, name, email, phone, address, father_husband_name, mother_wife_name,
        registration_date, existing_member_reg_number, profile_photo_path,
        member_reg_number, created_at, updated_at, status, district, department,
        verified_by_member_id
      FROM members 
      ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    const members: any = await executeQuery(membersQuery, [...queryParams, limit, offset]);

    // Get verifier names for verified members
    const memberIds = members.map((m: any) => m.verified_by_member_id).filter(Boolean);
    let verifiers = {};
    if (memberIds.length > 0) {
      const verifierQuery = `SELECT id, name FROM members WHERE id IN (${memberIds.map(() => '?').join(',')})`;
      const verifierResult: any = await executeQuery(verifierQuery, memberIds);
      verifiers = verifierResult.reduce((acc: any, v: any) => {
        acc[v.id] = v.name;
        return acc;
      }, {});
    }

    // Add verifier names to members
    const membersWithVerifiers = members.map((member: any) => ({
      ...member,
      verified_by_name: member.verified_by_member_id ? verifiers[member.verified_by_member_id] : null,
      created_at: new Date(member.created_at),
      updated_at: new Date(member.updated_at),
      registration_date: new Date(member.registration_date)
    }));

    return NextResponse.json({
      success: true,
      data: {
        members: membersWithVerifiers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch members' },
      { status: 500 }
    );
  }
}

// POST - Add new member
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name, email, phone, address, father_husband_name, mother_wife_name,
      registration_date, existing_member_reg_number, profile_photo_path,
      district, department, verified_by_member_id
    } = body;

    // Validate required fields
    if (!name || !email || !phone || !address || !father_husband_name || !mother_wife_name) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingEmailQuery = 'SELECT id FROM members WHERE email = ?';
    const existingEmail: any = await executeQuery(existingEmailQuery, [email]);
    if (existingEmail.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Email already exists' },
        { status: 400 }
      );
    }

    // Generate member registration number
    const countQuery = 'SELECT COUNT(*) as count FROM members';
    const countResult: any = await executeQuery(countQuery, []);
    const memberCount = countResult[0].count;
    const memberRegNumber = `RHVS${String(memberCount + 1).padStart(6, '0')}`;

    // Insert new member
    const insertQuery = `
      INSERT INTO members (
        name, email, phone, address, father_husband_name, mother_wife_name,
        registration_date, existing_member_reg_number, profile_photo_path,
        member_reg_number, district, department, verified_by_member_id, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result: any = await executeQuery(insertQuery, [
      name, email, phone, address, father_husband_name, mother_wife_name,
      registration_date || new Date().toISOString().split('T')[0],
      existing_member_reg_number || null,
      profile_photo_path || null,
      memberRegNumber,
      district || null,
      department || null,
      verified_by_member_id || null,
      'verified' // Auto-verify admin-added members
    ]);

    return NextResponse.json({
      success: true,
      message: 'Member added successfully',
      data: {
        id: result.insertId,
        member_reg_number: memberRegNumber
      }
    });
  } catch (error) {
    console.error('Error adding member:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add member' },
      { status: 500 }
    );
  }
}
