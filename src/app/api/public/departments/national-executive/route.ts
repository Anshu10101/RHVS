import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { noCacheJsonResponse } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    // Get the National Executive Department
    const deptQuery = `
      SELECT 
        d.id,
        d.name_en,
        d.name_hi
      FROM departments d
      WHERE d.is_national_executive = TRUE
      LIMIT 1
    `;

    const deptResult = await executeQuery(deptQuery, []) as Array<{
      id: number;
      name_en: string;
      name_hi: string;
    }>;

    if (deptResult.length === 0) {
      return noCacheJsonResponse({
        success: true,
        department: null,
        members: []
      });
    }

    const department = deptResult[0];

    // Get all hierarchy members ordered by position_order
    // Return ALL members assigned to each post, not just the first one
    const membersQuery = `
      SELECT 
        dp.id as post_id,
        dp.name_en as post_name_en,
        dp.name_hi as post_name_hi,
        dp.position_order,
        m.id as member_id,
        m.name as member_name,
        CASE 
          WHEN m.profile_photo_blob IS NOT NULL THEN CONCAT('/api/media/members/', m.id, '/profile')
          ELSE m.profile_photo_path
        END AS profile_photo_path,
        m.member_reg_number,
        m.email as member_email,
        m.updated_at as member_updated_at,
        dm.assigned_at
      FROM department_posts dp
      LEFT JOIN department_members dm ON dp.id = dm.post_id 
        AND dm.department_id = ?
        AND dm.level = 'national'
      LEFT JOIN members m ON dm.member_id = m.id AND m.status = 'verified'
      WHERE dp.department_id = ?
      ORDER BY dp.position_order ASC, dm.assigned_at ASC
    `;

    const membersResult = await executeQuery(membersQuery, [
      department.id,
      department.id
    ]) as Array<{
      post_id: number;
      post_name_en: string | null;
      post_name_hi: string | null;
      position_order: number;
      member_id: number | null;
      member_name: string | null;
      profile_photo_path: string | null;
      member_reg_number: string | null;
      member_email: string | null;
      member_updated_at: string | null;
      assigned_at: string | null;
    }>;

    // Format the members - include ALL members for each post
    const members = membersResult.map(member => ({
      post: {
        id: member.post_id,
        name_en: member.post_name_en || '',
        name_hi: member.post_name_hi || '',
        position_order: member.position_order
      },
      member: member.member_id ? {
        id: member.member_id,
        name: member.member_name || '',
        photo_path: member.profile_photo_path,
        reg_number: member.member_reg_number || '',
        email: member.member_email || '',
        updated_at: member.member_updated_at || null
      } : null
    }));

    return noCacheJsonResponse({
      success: true,
      department: {
        id: department.id,
        name_en: department.name_en,
        name_hi: department.name_hi
      },
      members: members
    });
  } catch (error) {
    console.error('Error fetching National Executive Department:', error);
    return noCacheJsonResponse({
      success: false,
      error: 'Failed to fetch National Executive Department',
      department: null,
      members: []
    }, { status: 500 });
  }
}

