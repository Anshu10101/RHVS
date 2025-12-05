import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminJwt, getAdminToken } from '@/lib/auth-jwt';
import { executeQuery } from '@/lib/database';
import { getAdminScope } from '@/lib/admin-scope';
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

    const scope = await getAdminScope(request);
    if (!scope.isSuperAdmin && !scope.isDistrictAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Build WHERE clause for district filtering
    let memberWhereClause = '';
    let queryParams: string[] = [];
    const isDistrictFilter = scope.isDistrictAdmin && !scope.isSuperAdmin && scope.districtName;
    
    if (isDistrictFilter && scope.districtName) {
      memberWhereClause = 'WHERE (m.district = ? OR m.district LIKE ?)';
      queryParams = [scope.districtName, `${scope.districtName}%`];
    }

    // Get member growth over last 12 months
    const growthQuery = `
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as members
      FROM members m
      ${memberWhereClause ? memberWhereClause + ' AND' : 'WHERE'} created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month ASC
    `;
    const growthResult = await executeQuery(growthQuery, queryParams) as Array<{ month: string; members: number }>;
    
    // Get event count over last 12 months
    const eventsQuery = `
      SELECT 
        DATE_FORMAT(e.created_at, '%Y-%m') as month,
        COUNT(*) as events
      FROM events e
      ${isDistrictFilter 
        ? `JOIN content_origin co ON e.id = co.content_id AND co.content_type = 'event' WHERE co.district_id = ? AND` 
        : 'WHERE'} e.created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(e.created_at, '%Y-%m')
      ORDER BY month ASC
    `;
    const eventsResult = await executeQuery(eventsQuery, isDistrictFilter && scope.districtName ? [scope.districtName] : []) as Array<{ month: string; events: number }>;
    
    // Get product count over last 12 months
    const productsQuery = `
      SELECT 
        DATE_FORMAT(p.created_at, '%Y-%m') as month,
        COUNT(*) as products
      FROM products p
      ${isDistrictFilter 
        ? `JOIN content_origin co ON p.id = co.content_id AND co.content_type = 'product' WHERE co.district_id = ? AND` 
        : 'WHERE'} p.created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(p.created_at, '%Y-%m')
      ORDER BY month ASC
    `;
    const productsResult = await executeQuery(productsQuery, isDistrictFilter && scope.districtName ? [scope.districtName] : []) as Array<{ month: string; products: number }>;

    // Combine monthly data
    const monthlyDataMap = new Map<string, { month: string; members: number; events: number; products: number }>();
    
    growthResult.forEach(row => {
      monthlyDataMap.set(row.month, { month: row.month, members: row.members, events: 0, products: 0 });
    });
    
    eventsResult.forEach(row => {
      const existing = monthlyDataMap.get(row.month);
      if (existing) {
        existing.events = row.events;
      } else {
        monthlyDataMap.set(row.month, { month: row.month, members: 0, events: row.events, products: 0 });
      }
    });
    
    productsResult.forEach(row => {
      const existing = monthlyDataMap.get(row.month);
      if (existing) {
        existing.products = row.products;
      } else {
        monthlyDataMap.set(row.month, { month: row.month, members: 0, events: 0, products: row.products });
      }
    });

    const monthlyGrowth = Array.from(monthlyDataMap.values())
      .map(item => ({
        month: new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        members: item.members,
        events: item.events,
        products: item.products
      }));

    // Get members by state
    const stateQuery = `
      SELECT 
        state,
        COUNT(*) as count
      FROM members m
      ${memberWhereClause ? memberWhereClause + ' AND' : 'WHERE'} state IS NOT NULL AND state != ''
      GROUP BY state
      ORDER BY count DESC
      LIMIT 10
    `;
    const stateResult = await executeQuery(stateQuery, queryParams) as Array<{ state: string; count: number }>;

    // Get members by district
    const districtQuery = `
      SELECT 
        district,
        COUNT(*) as count
      FROM members m
      ${memberWhereClause ? memberWhereClause + ' AND' : 'WHERE'} district IS NOT NULL AND district != ''
      GROUP BY district
      ORDER BY count DESC
      LIMIT 10
    `;
    const districtResult = await executeQuery(districtQuery, queryParams) as Array<{ district: string; count: number }>;

    // Get department distribution
    let departmentQuery = `
      SELECT 
        d.name_en as department,
        COUNT(DISTINCT dm.member_id) as count
      FROM departments d
      LEFT JOIN department_members dm ON d.id = dm.department_id
    `;
    let deptParams: string[] = [];
    
    if (scope.isDistrictAdmin && !scope.isSuperAdmin && scope.districtName) {
      departmentQuery += `
        LEFT JOIN members m ON dm.member_id = m.id
        WHERE (m.district = ? OR m.district LIKE ?)
      `;
      deptParams = [scope.districtName, `${scope.districtName}%`];
    }
    
    departmentQuery += `
      GROUP BY d.id, d.name_en
      ORDER BY count DESC
      LIMIT 10
    `;
    const departmentResult = await executeQuery(departmentQuery, deptParams) as Array<{ department: string; count: number }>;

    // Get member status distribution
    const statusQuery = `
      SELECT 
        status,
        COUNT(*) as count
      FROM members m
      ${memberWhereClause || 'WHERE 1=1'}
      GROUP BY status
    `;
    const statusResult = await executeQuery(statusQuery, queryParams) as Array<{ status: string; count: number }>;
    const statusStats = statusResult.reduce((acc, row) => {
      acc[row.status] = row.count;
      return acc;
    }, {} as Record<string, number>);

    // Get total counts
    const totalQuery = `SELECT COUNT(*) as total FROM members m ${memberWhereClause || ''}`;
    const totalResult = await executeQuery(totalQuery, queryParams) as Array<{ total: number }>;
    const totalMembers = totalResult[0]?.total || 0;

    // Get recent members (last 30 days)
    const recentQuery = `
      SELECT COUNT(*) as count
      FROM members m
      ${memberWhereClause ? memberWhereClause + ' AND' : 'WHERE'} created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `;
    const recentResult = await executeQuery(recentQuery, queryParams) as Array<{ count: number }>;
    const recentMembers = recentResult[0]?.count || 0;

    // Get this month's members
    const monthlyQuery = `
      SELECT COUNT(*) as count
      FROM members m
      ${memberWhereClause ? memberWhereClause + ' AND' : 'WHERE'} YEAR(created_at) = YEAR(NOW()) 
      AND MONTH(created_at) = MONTH(NOW())
    `;
    const monthlyResult = await executeQuery(monthlyQuery, queryParams) as Array<{ count: number }>;
    const monthlyMembers = monthlyResult[0]?.count || 0;

    // Get last month's members for comparison
    const lastMonthQuery = `
      SELECT COUNT(*) as count
      FROM members m
      ${memberWhereClause ? memberWhereClause + ' AND' : 'WHERE'} YEAR(created_at) = YEAR(DATE_SUB(NOW(), INTERVAL 1 MONTH))
      AND MONTH(created_at) = MONTH(DATE_SUB(NOW(), INTERVAL 1 MONTH))
    `;
    const lastMonthResult = await executeQuery(lastMonthQuery, queryParams) as Array<{ count: number }>;
    const lastMonthMembers = lastMonthResult[0]?.count || 0;

    // Calculate growth percentage
    const growthPercentage = lastMonthMembers > 0 
      ? Math.round(((monthlyMembers - lastMonthMembers) / lastMonthMembers) * 100)
      : monthlyMembers > 0 ? 100 : 0;

    // Get activity logs count
    const activityQuery = `
      SELECT COUNT(*) as count
      FROM activity_logs
      ${scope.isDistrictAdmin && !scope.isSuperAdmin 
        ? 'WHERE user_id = ? AND user_type = ?' 
        : ''}
    `;
    const activityParams = scope.isDistrictAdmin && !scope.isSuperAdmin 
      ? [Number(claims.sub), 'district_admin'] 
      : [];
    const activityResult = await executeQuery(activityQuery, activityParams) as Array<{ count: number }>;
    const totalActivities = activityResult[0]?.count || 0;

    // Get unique districts count
    const districtsCountQuery = `
      SELECT COUNT(DISTINCT district) as count
      FROM members m
      ${memberWhereClause ? memberWhereClause + ' AND' : 'WHERE'} district IS NOT NULL AND district != ''
    `;
    const districtsCountResult = await executeQuery(districtsCountQuery, queryParams) as Array<{ count: number }>;
    const activeDistricts = districtsCountResult[0]?.count || 0;

    return noCacheJsonResponse({
      success: true,
      data: {
        overview: {
          totalMembers,
          verifiedMembers: statusStats.verified || 0,
          pendingMembers: statusStats.pending || 0,
          rejectedMembers: statusStats.rejected || 0,
          recentMembers,
          monthlyMembers,
          growthPercentage,
          activeDistricts,
          totalActivities,
        },
        monthlyGrowth,
        stateDistribution: stateResult,
        districtDistribution: districtResult,
        departmentDistribution: departmentResult,
        statusDistribution: statusStats,
        isDistrictView: scope.isDistrictAdmin && !scope.isSuperAdmin,
        districtName: scope.districtName || null,
      },
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch analytics',
    }, { status: 500 });
  }
}

