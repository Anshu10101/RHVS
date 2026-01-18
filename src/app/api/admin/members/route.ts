import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { getAdminScope } from '@/lib/admin-scope';
import { noCacheJsonResponse } from '@/lib/api-helpers';

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

    // Reduced logging for production - only log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Members API called with params:', {
        page, limit, search, regNumber, status, state, district, department, sortBy, sortOrder
      });
      console.log('Admin scope:', {
        isSuperAdmin: scope.isSuperAdmin,
        isDistrictAdmin: scope.isDistrictAdmin,
        districtName: scope.districtName
      });
    }

    // Build WHERE clause
    const whereConditions = [];
    const queryParams = [];

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
      if (process.env.NODE_ENV === 'development') {
        console.log('Filtering by state ID:', state);
      }
      const stateNameQuery = 'SELECT state_name_english FROM states WHERE id = ?';
      const stateNameResult = await executeQuery(stateNameQuery, [state]) as Array<{ state_name_english: string }>;
      if (stateNameResult.length > 0) {
        whereConditions.push('m.state = ?');
        queryParams.push(stateNameResult[0].state_name_english);
      }
    }

    // District filter - convert ID to name
    if (district && district !== 'all') {
      if (process.env.NODE_ENV === 'development') {
        console.log('Filtering by district ID:', district);
      }
      const districtNameQuery = 'SELECT district_name_english FROM districts WHERE district_code = ?';
      const districtNameResult = await executeQuery(districtNameQuery, [district]) as Array<{ district_name_english: string }>;
      if (districtNameResult.length > 0) {
        whereConditions.push('m.district = ?');
        queryParams.push(districtNameResult[0].district_name_english);
      }
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // Department filter - will be applied in HAVING clause
    let havingClause = '';
    if (department) {
      havingClause = 'HAVING departments LIKE ?';
      queryParams.push(`%${department}%`);
    }
    
    // Only log query details in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Final WHERE clause:', whereClause);
      console.log('HAVING clause:', havingClause);
      console.log('Query parameters:', queryParams);
    }

    // Build the main query with department assignments
    const offset = (page - 1) * limit;
    const membersQuery = `
      SELECT 
        m.id, m.name, m.email, m.phone, m.address, 
        m.father_husband_name, m.mother_wife_name,
        m.registration_date, m.existing_member_reg_number, 
        CASE 
          WHEN m.profile_photo_blob IS NOT NULL THEN CONCAT('/api/media/members/', m.id, '/profile')
          ELSE m.profile_photo_path
        END AS profile_photo_path,
        m.member_reg_number, 
        m.created_at, m.updated_at, m.status, 
        m.state,
        m.district,
        s.state_name_hindi AS state_hi,
        m.aadhar_card_number,
        m.verified_by_member_id,
        verifier.name as verified_by_name,
        -- English department string (existing behaviour)
        GROUP_CONCAT(
          CONCAT(d.name_en, ' (', dp.name_en, ' - ', dm.level, 
            CASE 
              WHEN dm.level = 'district' THEN CONCAT(', ', dm.state, ', ', dm.district)
              WHEN dm.level = 'state' THEN CONCAT(', ', dm.state)
              ELSE ''
            END,
          ')')
          SEPARATOR ' | '
        ) as departments,
        -- Hindi department string (if available, with English fallback)
        GROUP_CONCAT(
          CONCAT(
            COALESCE(d.name_hi, d.name_en),
            ' (',
            COALESCE(dp.name_hi, dp.name_en),
            ' - ',
            dm.level,
            CASE 
              WHEN dm.level = 'district' THEN CONCAT(', ', dm.state, ', ', dm.district)
              WHEN dm.level = 'state' THEN CONCAT(', ', dm.state)
              ELSE ''
            END,
          ')')
          SEPARATOR ' | '
        ) as departments_hi
      FROM members m
      LEFT JOIN members verifier ON m.verified_by_member_id = verifier.id
      LEFT JOIN department_members dm ON m.id = dm.member_id
      LEFT JOIN departments d ON dm.department_id = d.id
      LEFT JOIN department_posts dp ON dm.post_id = dp.id
      LEFT JOIN states s ON s.state_name_english = m.state
      LEFT JOIN districts di ON di.district_name_english = m.district
      ${whereClause}
      GROUP BY m.id
      ${havingClause}
      ORDER BY m.${sortBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    queryParams.push(limit, offset);

    // Execute the query
    const members = await executeQuery(membersQuery, queryParams) as any[]; // eslint-disable-line @typescript-eslint/no-explicit-any

    // Get total count for pagination (needs same logic as main query for department filter)
    const countQuery = `
      SELECT COUNT(*) as total
      FROM (
        SELECT m.id
        FROM members m
        LEFT JOIN department_members dm ON m.id = dm.member_id
        LEFT JOIN departments d ON dm.department_id = d.id
        ${whereClause}
        GROUP BY m.id
        ${havingClause}
      ) as filtered_members
    `;
    const countParams = queryParams.slice(0, -2); // Remove limit and offset
    const countResult = await executeQuery(countQuery, countParams) as Array<{ total: number }>;
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    // Only log in development to reduce production log noise
    if (process.env.NODE_ENV === 'development') {
      console.log('Members fetched:', members.length, 'Total:', total);
    }
    
    return noCacheJsonResponse({
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
