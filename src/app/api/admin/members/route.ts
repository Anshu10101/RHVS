import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { getAdminScope } from '@/lib/admin-scope';

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

    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const regNumber = searchParams.get('regNumber') || '';
    const status = searchParams.get('status') || '';
    const state = searchParams.get('state') || '';
    const district = searchParams.get('district') || '';
    const department = searchParams.get('department') || '';
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'DESC';

    console.log('Members API called with params:', {
      page, limit, search, regNumber, status, state, district, department, sortBy, sortOrder
    });
    console.log('Admin scope:', {
      isSuperAdmin: scope.isSuperAdmin,
      isDistrictAdmin: scope.isDistrictAdmin,
      districtName: scope.districtName
    });

    // Build WHERE clause
    let whereConditions = [];
    let queryParams = [];

    // Apply district admin scope filter
    if (scope.isDistrictAdmin && !scope.isSuperAdmin) {
      whereConditions.push('(m.district = ? OR m.district LIKE ?)');
      queryParams.push(scope.districtName, `${scope.districtName}%`);
    }

    // Search filter
    if (search.trim()) {
      whereConditions.push(`(
        m.name LIKE ? OR 
        m.email LIKE ? OR 
        m.phone LIKE ? OR 
        m.aadhar_card_number LIKE ?
      )`);
      const searchTerm = `%${search.trim()}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Registration number filter
    if (regNumber.trim()) {
      whereConditions.push('m.member_reg_number LIKE ?');
      queryParams.push(`%${regNumber.trim()}%`);
    }

    // Status filter
    if (status) {
      whereConditions.push('m.status = ?');
      queryParams.push(status);
    }

    // State filter - convert ID to name
    if (state && state !== 'all') {
      console.log('Filtering by state ID:', state);
      const stateNameQuery = 'SELECT state_name_english FROM states WHERE id = ?';
      const stateNameResult: any = await executeQuery(stateNameQuery, [state]);
      if (stateNameResult.length > 0) {
        console.log('State name found:', stateNameResult[0].state_name_english);
        whereConditions.push('m.state = ?');
        queryParams.push(stateNameResult[0].state_name_english);
      } else {
        console.log('No state found for ID:', state);
      }
    }

    // District filter - convert ID to name
    if (district && district !== 'all') {
      console.log('Filtering by district ID:', district);
      const districtNameQuery = 'SELECT district_name_english FROM districts WHERE district_code = ?';
      const districtNameResult: any = await executeQuery(districtNameQuery, [district]);
      if (districtNameResult.length > 0) {
        console.log('District name found:', districtNameResult[0].district_name_english);
        whereConditions.push('m.district = ?');
        queryParams.push(districtNameResult[0].district_name_english);
      } else {
        console.log('No district found for ID:', district);
      }
    }

    // Department filter
    if (department) {
      whereConditions.push('m.department = ?');
      queryParams.push(department);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    console.log('Final WHERE clause:', whereClause);
    console.log('Query parameters:', queryParams);

    // Build the main query
    const offset = (page - 1) * limit;
    const membersQuery = `
      SELECT 
        m.id, m.name, m.email, m.phone, m.address, 
        m.father_husband_name, m.mother_wife_name,
        m.registration_date, m.existing_member_reg_number, 
        m.profile_photo_path, m.member_reg_number, 
        m.created_at, m.updated_at, m.status, 
        m.state, m.district, m.department,
        m.verified_by_member_id,
        verifier.name as verified_by_name
      FROM members m
      LEFT JOIN members verifier ON m.verified_by_member_id = verifier.id
      ${whereClause}
      ORDER BY m.${sortBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    queryParams.push(limit, offset);

    // Execute the query
    const members = await executeQuery(membersQuery, queryParams);

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM members m
      ${whereClause}
    `;
    const countParams = queryParams.slice(0, -2); // Remove limit and offset
    const countResult: any = await executeQuery(countQuery, countParams);
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    console.log('Members fetched:', members.length, 'Total:', total);
    
    return NextResponse.json({
      success: true,
      data: {
        members,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
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
