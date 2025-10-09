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
      // Get all unique states from members table
      const states = await executeQuery(`
        SELECT DISTINCT state
        FROM members
        WHERE state IS NOT NULL AND state != ''
        ORDER BY state ASC
      `) as any[];
      
      return NextResponse.json({ states: states.map(row => row.state) });
    } else if (type === 'districts' && state) {
      // Get all unique districts for a specific state
      const districts = await executeQuery(`
        SELECT DISTINCT district
        FROM members
        WHERE state = ? AND district IS NOT NULL AND district != ''
        ORDER BY district ASC
      `, [state]) as any[];
      
      return NextResponse.json({ districts: districts.map(row => row.district) });
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
