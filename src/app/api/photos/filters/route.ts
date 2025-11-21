import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminJwt, getAdminToken } from '@/lib/auth-jwt';
import { executeQuery } from '@/lib/database';

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

    // Get states that have photo events
    const statesResult = await executeQuery(`
      SELECT DISTINCT s.id, s.state_name_english as name, s.state_code as code
      FROM states s
      INNER JOIN photo_events pe ON s.state_name_english = pe.state
      WHERE pe.is_public = 1
      ORDER BY s.state_name_english
    `) as any[]; // eslint-disable-line @typescript-eslint/no-explicit-any

    // Get districts that have photo events
    const districtsResult = await executeQuery(`
      SELECT DISTINCT d.id, d.district_name_english as name, d.district_code as code, d.state_code
      FROM districts d
      INNER JOIN photo_events pe ON d.district_name_english = pe.district
      WHERE pe.is_public = 1
      ORDER BY d.district_name_english
    `) as any[]; // eslint-disable-line @typescript-eslint/no-explicit-any

    // Get all tags from photos and extract them
    const tagsResult = await executeQuery(`
      SELECT tags 
      FROM photos 
      WHERE tags IS NOT NULL 
        AND tags != '[]' 
        AND tags != 'null'
        AND is_visible = 1 AND is_approved = 1
    `) as any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
    
    // Extract unique tags from JSON arrays
    const allTags = new Set<string>();
    if (Array.isArray(tagsResult)) {
      tagsResult.forEach((row: { tags: string }) => {
        try {
          const tags = JSON.parse(row.tags);
          if (Array.isArray(tags)) {
            tags.forEach(tag => {
              if (tag && typeof tag === 'string' && tag.trim()) {
                allTags.add(tag.trim());
              }
            });
          }
        } catch (e) {
          // Skip invalid JSON
        }
      });
    }

    const eventsResult = await executeQuery(`
      SELECT DISTINCT e.event_name
      FROM photos p
      JOIN photo_events e ON p.event_id = e.id
      WHERE p.is_visible = 1 AND p.is_approved = 1
        AND e.event_name IS NOT NULL AND e.event_name != ''
      ORDER BY e.event_name
    `) as any[]; // eslint-disable-line @typescript-eslint/no-explicit-any

    const states = Array.isArray(statesResult) ? statesResult : [];
    const districts = Array.isArray(districtsResult) ? districtsResult : [];
    const tags = Array.from(allTags).sort();
    const events = Array.isArray(eventsResult) ? eventsResult.map((row: { event_name: string }) => row.event_name) : [];

    return NextResponse.json({
      success: true,
      states,
      districts,
      tags,
      events
    });

  } catch (error) {
    console.error('Error fetching photo filters:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch filters',
      states: [],
      districts: [],
      tags: [],
      events: []
    }, { status: 500 });
  }
}
