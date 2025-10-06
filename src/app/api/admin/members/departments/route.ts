import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

// GET - Fetch all unique departments
export async function GET(request: NextRequest) {
  try {
    // Get unique departments from members table
    const membersQuery = `
      SELECT DISTINCT department
      FROM members 
      WHERE department IS NOT NULL AND department != ''
      ORDER BY department
    `;
    const membersResult: any = await executeQuery(membersQuery, []);

    // Get unique departments from registration_tokens table
    const tokensQuery = `
      SELECT DISTINCT department
      FROM registration_tokens 
      WHERE department IS NOT NULL AND department != ''
      ORDER BY department
    `;
    const tokensResult: any = await executeQuery(tokensQuery, []);

    // Combine and deduplicate departments
    const allDepartments = new Set([
      ...membersResult.map((row: any) => row.department),
      ...tokensResult.map((row: any) => row.department)
    ]);

    const departments = Array.from(allDepartments).sort();

    return NextResponse.json({
      success: true,
      data: departments
    });
  } catch (error) {
    console.error('Error fetching departments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch departments' },
      { status: 500 }
    );
  }
}
