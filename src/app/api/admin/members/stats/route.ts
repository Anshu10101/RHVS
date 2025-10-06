import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { getAdminScope } from '@/lib/admin-scope';

// GET - Fetch member statistics
export async function GET(request: NextRequest) {
  try {
    // Check admin authentication and scope
    const scope = await getAdminScope(request);
    
    if (!scope.isSuperAdmin && !scope.isDistrictAdmin) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized access' },
        { status: 401 }
      );
    }

    // Build WHERE clause for district filtering
    let whereClause = '';
    let queryParams: any[] = [];
    
    if (scope.isDistrictAdmin && !scope.isSuperAdmin) {
      whereClause = 'WHERE (m.district = ? OR m.district LIKE ?)';
      queryParams = [scope.districtName, `${scope.districtName}%`];
    }

    // Get total members count
    const totalQuery = `SELECT COUNT(*) as total FROM members m ${whereClause}`;
    const totalResult: any = await executeQuery(totalQuery, queryParams);
    const totalMembers = totalResult[0].total;

    // Get members by status
    const statusQuery = `
      SELECT 
        status,
        COUNT(*) as count
      FROM members m
      ${whereClause}
      GROUP BY status
    `;
    const statusResult: any = await executeQuery(statusQuery, queryParams);
    const statusStats = statusResult.reduce((acc: any, row: any) => {
      acc[row.status] = row.count;
      return acc;
    }, {});

    // Get members by state
    const stateQuery = `
      SELECT 
        state,
        COUNT(*) as count
      FROM members m
      ${whereClause ? whereClause + ' AND' : 'WHERE'} state IS NOT NULL AND state != ''
      GROUP BY state
      ORDER BY count DESC
      LIMIT 10
    `;
    const stateResult: any = await executeQuery(stateQuery, queryParams);
    const stateStats = stateResult.map((row: any) => ({
      state: row.state,
      count: row.count
    }));

    // Get members by district
    const districtQuery = `
      SELECT 
        district,
        COUNT(*) as count
      FROM members m
      ${whereClause ? whereClause + ' AND' : 'WHERE'} district IS NOT NULL AND district != ''
      GROUP BY district
      ORDER BY count DESC
      LIMIT 10
    `;
    const districtResult: any = await executeQuery(districtQuery, queryParams);
    const districtStats = districtResult.map((row: any) => ({
      district: row.district,
      count: row.count
    }));

    // Get members by department
    const departmentQuery = `
      SELECT 
        department,
        COUNT(*) as count
      FROM members m
      ${whereClause ? whereClause + ' AND' : 'WHERE'} department IS NOT NULL AND department != ''
      GROUP BY department
      ORDER BY count DESC
      LIMIT 10
    `;
    const departmentResult: any = await executeQuery(departmentQuery, queryParams);
    const departmentStats = departmentResult.map((row: any) => ({
      department: row.department,
      count: row.count
    }));

    // Get recent members (last 30 days)
    const recentQuery = `
      SELECT COUNT(*) as count
      FROM members m
      ${whereClause ? whereClause + ' AND' : 'WHERE'} created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `;
    const recentResult: any = await executeQuery(recentQuery, queryParams);
    const recentMembers = recentResult[0].count;

    // Get members added this month
    const monthlyQuery = `
      SELECT COUNT(*) as count
      FROM members m
      ${whereClause ? whereClause + ' AND' : 'WHERE'} YEAR(created_at) = YEAR(NOW()) 
      AND MONTH(created_at) = MONTH(NOW())
    `;
    const monthlyResult: any = await executeQuery(monthlyQuery, queryParams);
    const monthlyMembers = monthlyResult[0].count;

    // Get verification stats
    const verificationQuery = `
      SELECT 
        COUNT(*) as total_verified,
        COUNT(CASE WHEN verified_by_member_id IS NOT NULL THEN 1 END) as verified_by_members,
        COUNT(CASE WHEN verified_by_member_id IS NULL THEN 1 END) as verified_by_admin
      FROM members m
      ${whereClause ? whereClause + ' AND' : 'WHERE'} status = 'verified'
    `;
    const verificationResult: any = await executeQuery(verificationQuery, queryParams);
    const verificationStats = verificationResult[0];

    return NextResponse.json({
      success: true,
      data: {
        total: totalMembers,
        status: statusStats,
        states: stateStats,
        districts: districtStats,
        departments: departmentStats,
        recent: recentMembers,
        monthly: monthlyMembers,
        verification: verificationStats
      }
    });
  } catch (error) {
    console.error('Error fetching member statistics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch member statistics' },
      { status: 500 }
    );
  }
}
