import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { getAdminScope } from '@/lib/admin-scope';

// GET - Fetch members who have appointments in departments
export async function GET(request: NextRequest) {
  try {
    const scope = await getAdminScope(request);
    
    if (!scope.isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Superadmin access required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get('department_id') || null;

    let query = `
      SELECT DISTINCT
        m.id,
        m.name,
        m.member_reg_number,
        m.signature_blob,
        m.signature_path,
        d.id as department_id,
        d.name_en as dept_name_en,
        d.name_hi as dept_name_hi,
        dp.id as post_id,
        dp.name_en as post_name_en,
        dp.name_hi as post_name_hi,
        dm.level,
        dm.state,
        dm.district
      FROM members m
      JOIN department_members dm ON m.id = dm.member_id
      JOIN departments d ON (dm.department_id = d.id OR CAST(dm.department_id AS CHAR) = d.id)
      JOIN department_posts dp ON dm.post_id = dp.id
      WHERE m.status = 'verified'
        AND (m.signature_blob IS NOT NULL OR m.signature_path IS NOT NULL)
    `;

    const params: Array<string | number> = [];

    if (departmentId) {
      query += ' AND (dm.department_id = ? OR CAST(dm.department_id AS CHAR) = ?)';
      params.push(departmentId, departmentId);
    }

    query += ' ORDER BY d.name_en, dp.name_en, m.name';

    const members = await executeQuery(query, params) as any[];

    return NextResponse.json({ 
      success: true,
      members: members.map(m => ({
        id: m.id,
        name: m.name,
        memberRegNumber: m.member_reg_number,
        hasSignature: !!(m.signature_blob || m.signature_path),
        departmentId: m.department_id,
        deptNameEn: m.dept_name_en,
        deptNameHi: m.dept_name_hi,
        postId: m.post_id,
        postNameEn: m.post_name_en,
        postNameHi: m.post_name_hi,
        level: m.level,
        state: m.state,
        district: m.district
      }))
    });
  } catch (error) {
    console.error('Error fetching members with appointments:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch members' 
    }, { status: 500 });
  }
}

