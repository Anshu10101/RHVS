import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminJwt, getAdminToken } from '@/lib/auth-jwt';
import { executeQuery } from '@/lib/database';
import { noCacheJsonResponse } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const token = getAdminToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const claims = await verifyAdminJwt(token);
    if (!claims) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get total members
    const membersResult = await executeQuery(
      'SELECT COUNT(*) as count FROM members'
    ) as Array<{ count: number }>;
    const totalMembers = membersResult[0]?.count || 0;

    // Get total district admins
    const adminsResult = await executeQuery(
      'SELECT COUNT(*) as count FROM district_admins WHERE is_active = true'
    ) as Array<{ count: number }>;
    const totalAdmins = adminsResult[0]?.count || 0;

    // Get total departments
    const deptResult = await executeQuery(
      'SELECT COUNT(*) as count FROM departments'
    ) as Array<{ count: number }>;
    const totalDepartments = deptResult[0]?.count || 0;

    // Get database size (approximate)
    const dbSizeResult = await executeQuery(
      `SELECT 
        ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS size_mb
      FROM information_schema.tables 
      WHERE table_schema = DATABASE()`
    ) as Array<{ size_mb: number | string }>;
    const sizeMb = dbSizeResult[0]?.size_mb;
    const databaseSize = sizeMb 
      ? `${Number(sizeMb).toFixed(2)} MB`
      : 'N/A';

    return noCacheJsonResponse({
      success: true,
      data: {
        totalMembers,
        totalAdmins,
        totalDepartments,
        databaseSize,
        lastBackup: null, // Can be implemented later
      },
    });
  } catch (error) {
    console.error('Error fetching system info:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch system information',
    }, { status: 500 });
  }
}

