import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { getAdminScope } from '@/lib/admin-scope';

// GET eligible members for assignment to departments
export async function GET(request: NextRequest) {
  try {
    const scope = await getAdminScope(request);
    
    // Check if user is authenticated and is a superadmin or district admin
    if (!scope.isSuperAdmin && !scope.isDistrictAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // For district admins, check permission
    if (scope.isDistrictAdmin && !scope.isSuperAdmin) {
      const { ensurePermission } = await import('@/lib/admin-scope');
      if (!ensurePermission(scope, 'assign_members_to_departments')) {
        return NextResponse.json({ 
          error: 'Permission denied. You do not have permission to assign members to departments.' 
        }, { status: 403 });
      }
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    let level = searchParams.get('level');
    let state = searchParams.get('state');
    let district = searchParams.get('district');
    const departmentId = searchParams.get('departmentId');
    const search = searchParams.get('search');
    
    // For district admins, block National Executive Department
    if (scope.isDistrictAdmin && !scope.isSuperAdmin && departmentId) {
      const nationalExecDept = await executeQuery(
        'SELECT id FROM departments WHERE is_national_executive = 1 LIMIT 1'
      ) as Array<{ id: number }>;
      
      if (nationalExecDept.length > 0 && parseInt(departmentId) === nationalExecDept[0].id) {
        return NextResponse.json({ 
          error: 'Access denied. National Executive Department assignments are restricted to superadmins only.' 
        }, { status: 403 });
      }
    }

    // For district admins, enforce level-specific restrictions
    if (scope.isDistrictAdmin && !scope.isSuperAdmin) {
      // Get state from district admin's member record
      let adminState: string | null = null;
      if (scope.adminId) {
        const adminStateResult = await executeQuery(
          'SELECT m.state FROM district_admins da JOIN members m ON da.member_id = m.id WHERE da.id = ?',
          [scope.adminId]
        ) as Array<{ state: string }>;
        if (adminStateResult.length > 0 && adminStateResult[0].state) {
          adminState = adminStateResult[0].state;
        }
      }
      
      if (level === 'district') {
        // Must be their district
        if (scope.districtName) {
          district = scope.districtName;
        }
        if (adminState) {
          state = adminState;
        }
      } else if (level === 'state') {
        // Must be their state
        if (adminState) {
          state = adminState;
        }
        district = null; // District must be null for state level
      } else if (level === 'national') {
        // National level is allowed (but not National Executive, which is already blocked above)
        state = null;
        district = null;
      }
    }

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

    // Exclude members already assigned to this department at the SAME level if departmentId is provided
    // For National Executive departments, national level, and state level: 
    //   - Allow members who are already assigned to OTHER posts in the same department
    //   - Only exclude if they're assigned to the SAME post
    // For district level: Exclude all members already assigned (only one post per member per department)
    if (departmentId) {
      // Check if this is a National Executive department
      const deptInfo = await executeQuery(
        'SELECT is_national_executive FROM departments WHERE id = ?',
        [departmentId]
      ) as Array<{ is_national_executive: number | boolean | null }>;
      
      const isNationalExecutive = deptInfo.length > 0 && (
        deptInfo[0].is_national_executive === 1 || 
        deptInfo[0].is_national_executive === true
      );
      
      // Allow multiple posts for: National Executive departments, national level, or state level
      const allowsMultiplePosts = isNationalExecutive || level === 'national' || level === 'state';
      
      if (allowsMultiplePosts) {
        // For multiple post assignments: Only exclude if member is assigned to the SAME post
        // (This will be handled by the backend when assigning, so we don't need to exclude here)
        // Actually, we should still show all members - the backend will prevent duplicate assignments to the same post
        // So we don't add any exclusion query for multiple post scenarios
        console.log(`[Eligible Members] Allowing multiple post assignments for department ${departmentId} at ${level} level`);
      } else {
        // For district level (and non-National Executive departments): Exclude all members already assigned
        let exclusionQuery = `
          AND m.id NOT IN (
            SELECT member_id FROM department_members 
            WHERE department_id = ? AND level = ?
        `;
        const exclusionParams: any[] = [departmentId, level];
        
        // Add level-specific state/district matching for exclusion
        if (level === 'state' && state) {
          exclusionQuery += ' AND state = ?';
          exclusionParams.push(state);
        } else if (level === 'district' && state && district) {
          exclusionQuery += ' AND state = ? AND district = ?';
          exclusionParams.push(state, district);
        }
        // For national level, no additional filters needed
        
        exclusionQuery += ')';
        query += exclusionQuery;
        params.push(...exclusionParams);
      }
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
