import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { getAdminScope } from '@/lib/admin-scope';

// GET eligible members for assignment to departments
export async function GET(request: NextRequest) {
  try {
    const scope = await getAdminScope(request);
    
    // Check if user is authenticated and is a superadmin
    if (!scope.isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const level = searchParams.get('level');
    const state = searchParams.get('state');
    const district = searchParams.get('district');
    const departmentId = searchParams.get('departmentId');
    const search = searchParams.get('search');

    // Validate required parameters
    if (!level) {
      return NextResponse.json({ error: 'Level parameter is required' }, { status: 400 });
    }

    if ((level === 'state' || level === 'district') && !state) {
      return NextResponse.json({ error: 'State parameter is required for state and district levels' }, { status: 400 });
    }

    if (level === 'district' && !district) {
      return NextResponse.json({ error: 'District parameter is required for district level' }, { status: 400 });
    }

    // Build the query based on filters
    let query = `
      SELECT m.id, m.name, m.email, m.phone, m.member_reg_number,
             CASE 
               WHEN m.profile_photo_blob IS NOT NULL THEN CONCAT('/api/media/members/', m.id, '/profile')
               ELSE m.profile_photo_path
             END AS profile_photo_path,
             m.district, m.state
      FROM members m
      WHERE m.status = 'verified'
    `;
    
    const params: any[] = [];

    // Add level-specific filters
    if (level === 'national') {
      // No additional filters for national level
    } else if (level === 'state' && state) {
      query += ' AND m.state = ?';
      params.push(state);
    } else if (level === 'district' && state && district) {
      query += ' AND m.state = ? AND m.district = ?';
      params.push(state, district);
    }

    // Add search filter if provided
    if (search) {
      query += ' AND (m.name LIKE ? OR m.email LIKE ? OR m.member_reg_number LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Exclude members already assigned to this department if departmentId is provided
    if (departmentId) {
      query += `
        AND m.id NOT IN (
          SELECT member_id FROM department_members WHERE department_id = ?
        )
      `;
      params.push(departmentId);
    }

    query += ' ORDER BY m.name ASC LIMIT 100';

    // Execute the query
    const members = await executeQuery(query, params) as any[];

    return NextResponse.json({ members });
  } catch (error) {
    console.error('Error fetching eligible members:', error);
    return NextResponse.json({ error: 'Failed to fetch eligible members' }, { status: 500 });
  }
}
