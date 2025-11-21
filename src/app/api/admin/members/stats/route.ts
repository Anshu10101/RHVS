import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { getAdminScope } from '@/lib/admin-scope';
import { noCacheJsonResponse } from '@/lib/api-helpers';

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
    let queryParams: string[] = [];
    
    if (scope.isDistrictAdmin && !scope.isSuperAdmin && scope.districtName) {
      whereClause = 'WHERE (m.district = ? OR m.district LIKE ?)';
      queryParams = [scope.districtName, `${scope.districtName}%`];
    }

    // Get total members count
    const totalQuery = `SELECT COUNT(*) as total FROM members m ${whereClause}`;
    const totalResult = await executeQuery(totalQuery, queryParams) as Array<{ total: number }>;
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
    const statusResult = await executeQuery(statusQuery, queryParams) as Array<{ status: string; count: number }>;
    const statusStats = statusResult.reduce((acc: { [key: string]: number }, row: { status: string; count: number }) => {
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
    const stateResult = await executeQuery(stateQuery, queryParams) as Array<{ state: string; count: number }>;
    const stateStats = stateResult.map((row: { state: string; count: number }) => ({
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
    const districtResult = await executeQuery(districtQuery, queryParams) as Array<{ district: string; count: number }>;
    const districtStats = districtResult.map((row: { district: string; count: number }) => ({
      district: row.district,
      count: row.count
    }));

    // Get members by department
    const departmentQuery = `
      SELECT 
        d.name_en as department,
        COUNT(DISTINCT dm.member_id) as count
      FROM departments d
      LEFT JOIN department_members dm ON d.id = dm.department_id
      GROUP BY d.id, d.name_en
      ORDER BY count DESC
      LIMIT 10
    `;
    const departmentResult = await executeQuery(departmentQuery, []) as Array<{ department: string; count: number }>;
    const departmentStats = departmentResult.map((row: { department: string; count: number }) => ({
      department: row.department,
      count: row.count
    }));

    // Get recent members (last 30 days)
    const recentQuery = `
      SELECT COUNT(*) as count
      FROM members m
      ${whereClause ? whereClause + ' AND' : 'WHERE'} created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `;
    const recentResult = await executeQuery(recentQuery, queryParams) as Array<{ count: number }>;
    const recentMembers = recentResult[0].count;

    // Get members added this month
    const monthlyQuery = `
      SELECT COUNT(*) as count
      FROM members m
      ${whereClause ? whereClause + ' AND' : 'WHERE'} YEAR(created_at) = YEAR(NOW()) 
      AND MONTH(created_at) = MONTH(NOW())
    `;
    const monthlyResult = await executeQuery(monthlyQuery, queryParams) as Array<{ count: number }>;
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
    const verificationResult = await executeQuery(verificationQuery, queryParams) as Array<{ total_verified: number; verified_by_members: number; verified_by_admin: number }>;
    const verificationStats = verificationResult[0];

    return noCacheJsonResponse({
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
