import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { getAdminScope } from '@/lib/admin-scope';

// GET states and districts
export async function GET(request: NextRequest) {
  try {
    const scope = await getAdminScope(request);
    
    // Check if user is authenticated
    if (!scope.isSuperAdmin && !scope.isDistrictAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type'); // 'states' or 'districts'
    const state = searchParams.get('state'); // Required for districts

    if (type === 'states') {
      // Get all states from the states table
      const statesResult = await executeQuery(`
        SELECT id, state_code, state_name_english
        FROM states
        ORDER BY state_name_english ASC
      `) as Array<{ id: number; state_code: string; state_name_english: string }>;
      
      return NextResponse.json({ 
        states: statesResult.map(row => row.state_name_english) 
      });
    } else if (type === 'districts' && state) {
      // Get all districts for a specific state from the districts table
      // First, find the state_code from the state name
      const stateResult = await executeQuery(`
        SELECT state_code
        FROM states
        WHERE state_name_english = ?
        LIMIT 1
      `, [state]) as Array<{ state_code: string }>;
      
      if (stateResult.length === 0) {
        return NextResponse.json({ districts: [] });
      }
      
      const stateCode = stateResult[0].state_code;
      
      // Get all districts for this state
      const districtsResult = await executeQuery(`
        SELECT DISTINCT district_code, district_name_english
        FROM districts
        WHERE state_code = ?
        ORDER BY district_name_english ASC
      `, [stateCode]) as Array<{ district_code: string; district_name_english: string }>;
      
      return NextResponse.json({ 
        districts: districtsResult.map(row => row.district_name_english) 
      });
    } else {
      return NextResponse.json({ 
        error: 'Invalid request. Specify type=states or type=districts with state parameter' 
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error fetching locations:', error);
    return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 });
  }
}
