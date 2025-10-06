import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const stateId = searchParams.get('stateId');
    const search = searchParams.get('search');
    
    if (!stateId) {
      return NextResponse.json(
        { success: false, error: 'State ID is required' },
        { status: 400 }
      );
    }
    
    // First get the state code from state ID
    const stateQuery = 'SELECT state_code FROM states WHERE id = ?';
    const stateResult: any = await executeQuery(stateQuery, [stateId]);
    
    if (stateResult.length === 0) {
      return NextResponse.json(
        { success: false, error: 'State not found' },
        { status: 404 }
      );
    }
    
    const stateCode = stateResult[0].state_code;
    
    // Build query with optional search
    let query = `
      SELECT DISTINCT district_code as id, district_name_english as name 
      FROM districts 
      WHERE state_code = ?
    `;
    const params: any[] = [stateCode];
    
    // Add search filter if provided
    if (search && search.trim()) {
      query += ` AND LOWER(district_name_english) LIKE LOWER(?)`;
      params.push(`%${search.trim()}%`);
    }
    
    query += ` ORDER BY district_name_english LIMIT 100`;
    
    const districts = await executeQuery(query, params);
    
    return NextResponse.json({
      success: true,
      data: districts,
      total: districts.length
    });
  } catch (error) {
    console.error('Error fetching districts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch districts' },
      { status: 500 }
    );
  }
}
