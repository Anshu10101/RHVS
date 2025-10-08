import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

export async function GET(_request: NextRequest) {
  try {
    // Get all photo events with their state and district values
    const events = await executeQuery(`
      SELECT id, event_name, state, district, created_at
      FROM photo_events 
      ORDER BY created_at DESC
      LIMIT 20
    `) as any[]; // eslint-disable-line @typescript-eslint/no-explicit-any

    // Get unique states and districts from photo_events
    const states = await executeQuery(`
      SELECT DISTINCT state 
      FROM photo_events 
      WHERE state IS NOT NULL AND state != ''
      ORDER BY state
    `) as any[]; // eslint-disable-line @typescript-eslint/no-explicit-any

    const districts = await executeQuery(`
      SELECT DISTINCT district 
      FROM photo_events 
      WHERE district IS NOT NULL AND district != ''
      ORDER BY district
    `) as any[]; // eslint-disable-line @typescript-eslint/no-explicit-any

    return NextResponse.json({
      success: true,
      events,
      states,
      districts
    });

  } catch (error) {
    console.error('Error debugging photo events:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to debug photo events'
    }, { status: 500 });
  }
}
