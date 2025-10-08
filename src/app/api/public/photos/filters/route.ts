import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

export async function GET(_request: NextRequest) {
  try {
    // Get all states from the states table
    const statesResult = await executeQuery(`
      SELECT id, state_code as code, state_name_english as name 
      FROM states 
      ORDER BY state_name_english
    `) as any[]; // eslint-disable-line @typescript-eslint/no-explicit-any

    // Get unique districts from photos (we'll still use photo-based districts for now)
    const districtsResult = await executeQuery(`
      SELECT DISTINCT district 
      FROM photos 
      WHERE district IS NOT NULL AND district != '' AND is_visible = 1 AND is_approved = 1
      ORDER BY district
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
        } catch (_e) {
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

    const states = Array.isArray(statesResult) ? statesResult.map((row: { id: number; name: string }) => ({
      id: String(row.id),
      name: String(row.name)
    })) : [];
    const districts = Array.isArray(districtsResult) ? districtsResult.map((row: { district: string }) => row.district) : [];
    const tags = Array.from(allTags).sort();
    const events = Array.isArray(eventsResult) ? eventsResult.map((row: { event_name: string }) => row.event_name) : [];

    // Fallback data if database queries return empty results
    const fallbackStates = states.length > 0 ? states : [
      { id: '1', name: 'Uttar Pradesh' },
      { id: '2', name: 'Madhya Pradesh' }
    ];
    const fallbackDistricts = districts.length > 0 ? districts : ['Jhansi', 'Gwalior'];
    const fallbackTags = tags.length > 0 ? tags : ['festival', 'celebration', 'community', 'spiritual', 'prayer', 'devotion', 'cultural', 'heritage', 'tradition'];
    const fallbackEvents = events.length > 0 ? events : ['Diwali event', 'hinduism meet', 'Annual General Meeting 2024'];

    return NextResponse.json({
      success: true,
      states: fallbackStates,
      districts: fallbackDistricts,
      tags: fallbackTags,
      events: fallbackEvents
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
