import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    // Get sample states
    const [states] = await executeQuery(`
      SELECT id, state_name_english, state_code
      FROM states 
      ORDER BY state_name_english
      LIMIT 10
    `);

    // Get sample districts
    const [districts] = await executeQuery(`
      SELECT id, district_name_english, district_code, state_code
      FROM districts 
      ORDER BY district_name_english
      LIMIT 10
    `);

    return NextResponse.json({
      success: true,
      states,
      districts
    });

  } catch (error) {
    console.error('Error debugging states/districts:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to debug states/districts'
    }, { status: 500 });
  }
}
