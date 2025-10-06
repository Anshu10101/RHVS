import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

export async function GET() {
  try {
    const query = 'SELECT id, state_code as code, state_name_english as name FROM states ORDER BY state_name_english';
    const states = await executeQuery(query);
    
    return NextResponse.json({
      success: true,
      data: states
    });
  } catch (error) {
    console.error('Error fetching states:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch states' },
      { status: 500 }
    );
  }
}
