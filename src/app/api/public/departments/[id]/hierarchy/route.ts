import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const departmentId = parseInt(params.id);
    if (isNaN(departmentId)) {
      return NextResponse.json({ error: 'Invalid department ID' }, { status: 400 });
    }

    // Get department basic info
    const [dept] = await executeQuery(
      'SELECT id, name_en, name_hi FROM departments WHERE id = ? LIMIT 1',
      [departmentId]
    ) as Array<{ id: number; name_en: string; name_hi: string }>;

    if (!dept) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    // Posts for the department (ordered)
    let posts = await executeQuery(
      'SELECT id, name_en, name_hi, position_order FROM department_posts WHERE department_id = ? ORDER BY position_order ASC',
      [departmentId]
    ) as Array<{ id: number; name_en: string; name_hi: string; position_order: number }>;

    // Fallback default post structure if none exist
    if (!posts || posts.length === 0) {
      posts = [
        { id: -1, name_en: 'President', name_hi: 'अध्यक्ष', position_order: 1 },
        { id: -2, name_en: 'Vice President', name_hi: 'उपाध्यक्ष', position_order: 2 },
        { id: -3, name_en: 'General Secretary', name_hi: 'महामंत्री', position_order: 3 },
        { id: -4, name_en: 'Joint Secretary', name_hi: 'संयुक्त मंत्री', position_order: 4 },
        { id: -5, name_en: 'Treasurer', name_hi: 'कोषाध्यक्ष', position_order: 5 },
        { id: -6, name_en: 'Executive Member', name_hi: 'कार्यकारिणी सदस्य', position_order: 6 },
      ];
    }

    // Fetch all assigned national-level members per post
    let assignments: Array<{
      post_id: number;
      position_order: number;
      post_name_en: string;
      post_name_hi: string;
      member_id: number;
      member_name: string;
      photo_path: string | null;
      reg_number: string | null;
      email: string | null;
    }> = [];
    try {
      assignments = await executeQuery(
        `SELECT dp.id as post_id, dp.position_order, dp.name_en as post_name_en, dp.name_hi as post_name_hi,
                m.id as member_id, m.name as member_name, m.profile_photo_path as photo_path,
                m.member_reg_number as reg_number, m.email
         FROM department_members dm
         JOIN department_posts dp ON dp.id = dm.post_id AND dp.department_id = dm.department_id
         JOIN members m ON m.id = dm.member_id
         WHERE dm.department_id = ? AND dm.level = 'national'
         ORDER BY dp.position_order ASC`,
        [departmentId]
      ) as any[];
    } catch {}

    const result = {
      department: dept,
      posts: posts.map(p => ({
        id: p.id,
        name_en: p.name_en,
        name_hi: p.name_hi,
        position_order: p.position_order,
        members: assignments
          .filter(a => a.post_id === p.id)
          .map(a => ({
            id: a.member_id,
            name: a.member_name,
            photo_path: a.photo_path,
            reg_number: a.reg_number,
            email: a.email,
          })),
      }))
    };

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    // Fallback with minimal defaults
    return NextResponse.json({
      success: true,
      data: {
        department: { id: -1, name_en: 'Department', name_hi: 'विभाग' },
        posts: [
          { id: -1, name_en: 'President', name_hi: 'अध्यक्ष', position_order: 1, members: [] },
          { id: -2, name_en: 'Vice President', name_hi: 'उपाध्यक्ष', position_order: 2, members: [] },
          { id: -3, name_en: 'General Secretary', name_hi: 'महामंत्री', position_order: 3, members: [] },
        ],
      }
    });
  }
}


