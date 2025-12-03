import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { getAdminScope } from '@/lib/admin-scope';

// GET - Fetch all certificates
export async function GET(request: NextRequest) {
  try {
    const scope = await getAdminScope(request);
    
    if (!scope.isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Superadmin access required' }, { status: 401 });
    }

    const certificates = await executeQuery(`
      SELECT 
        c.id, c.certificate_number, c.appointment_date, c.generated_at, c.status, c.certificate_path,
        c.level, c.state, c.district, c.email_status, c.email_sent_at,
        m.name as member_name, m.member_reg_number, m.profile_photo_path,
        d.name_en as dept_name_en, d.name_hi as dept_name_hi,
        COALESCE(dp.print_as_name_en, dp.name_en) as post_name_en,
        COALESCE(dp.print_as_name_hi, dp.name_hi) as post_name_hi
      FROM certificates c
      JOIN members m ON c.member_id = m.id
      JOIN departments d ON c.department_id = d.id
      JOIN department_posts dp ON c.post_id = dp.id
      ORDER BY c.generated_at DESC
    `) as any[];

    return NextResponse.json({ certificates });
  } catch (error) {
    console.error('Error fetching certificates:', error);
    return NextResponse.json({ error: 'Failed to fetch certificates' }, { status: 500 });
  }
}
