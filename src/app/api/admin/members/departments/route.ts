import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

// GET - Fetch all unique departments from the new department system
export async function GET(_request: NextRequest) {
  try {
    // Get departments from the departments table
    const departmentsQuery = `
      SELECT id, name_en, name_hi
      FROM departments 
      ORDER BY name_en
    `;
    const departmentsResult = await executeQuery(departmentsQuery, []) as Array<{ 
      id: number;
      name_en: string; 
      name_hi: string; 
    }>;

    return NextResponse.json({
      success: true,
      data: departmentsResult.map(d => d.name_en)
    });
  } catch (error) {
    console.error('Error fetching departments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch departments' },
      { status: 500 }
    );
  }
}
