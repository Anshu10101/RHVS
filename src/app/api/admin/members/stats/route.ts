import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

// GET - Fetch member statistics
export async function GET(request: NextRequest) {
  try {
    // Get total members count
    const totalQuery = 'SELECT COUNT(*) as total FROM members';
    const totalResult: any = await executeQuery(totalQuery, []);
    const totalMembers = totalResult[0].total;

    // Get members by status
    const statusQuery = `
      SELECT 
        status,
        COUNT(*) as count
      FROM members 
      GROUP BY status
    `;
    const statusResult: any = await executeQuery(statusQuery, []);
    const statusStats = statusResult.reduce((acc: any, row: any) => {
      acc[row.status] = row.count;
      return acc;
    }, {});

    // Get members by district
    const districtQuery = `
      SELECT 
        district,
        COUNT(*) as count
      FROM members 
      WHERE district IS NOT NULL AND district != ''
      GROUP BY district
      ORDER BY count DESC
      LIMIT 10
    `;
    const districtResult: any = await executeQuery(districtQuery, []);
    const districtStats = districtResult.map((row: any) => ({
      district: row.district,
      count: row.count
    }));

    // Get recent members (last 30 days)
    const recentQuery = `
      SELECT COUNT(*) as count
      FROM members 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `;
    const recentResult: any = await executeQuery(recentQuery, []);
    const recentMembers = recentResult[0].count;

    // Get members added this month
    const monthlyQuery = `
      SELECT COUNT(*) as count
      FROM members 
      WHERE YEAR(created_at) = YEAR(NOW()) 
      AND MONTH(created_at) = MONTH(NOW())
    `;
    const monthlyResult: any = await executeQuery(monthlyQuery, []);
    const monthlyMembers = monthlyResult[0].count;

    // Get verification stats
    const verificationQuery = `
      SELECT 
        COUNT(*) as total_verified,
        COUNT(CASE WHEN verified_by_member_id IS NOT NULL THEN 1 END) as verified_by_members,
        COUNT(CASE WHEN verified_by_member_id IS NULL THEN 1 END) as verified_by_admin
      FROM members 
      WHERE status = 'verified'
    `;
    const verificationResult: any = await executeQuery(verificationQuery, []);
    const verificationStats = verificationResult[0];

    return NextResponse.json({
      success: true,
      data: {
        total: totalMembers,
        status: statusStats,
        districts: districtStats,
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
