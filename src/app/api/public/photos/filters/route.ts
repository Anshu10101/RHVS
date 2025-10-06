import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    // Get unique states and districts from photos
    const [statesResult] = await executeQuery(`
      SELECT DISTINCT state 
      FROM photos 
      WHERE state IS NOT NULL AND state != '' AND is_visible = 1 AND is_approved = 1
      ORDER BY state
    `);

    const [districtsResult] = await executeQuery(`
      SELECT DISTINCT district 
      FROM photos 
      WHERE district IS NOT NULL AND district != '' AND is_visible = 1 AND is_approved = 1
      ORDER BY district
    `);

    // Get all tags from photos and extract them
    const [tagsResult] = await executeQuery(`
      SELECT tags 
      FROM photos 
      WHERE tags IS NOT NULL 
        AND tags != '[]' 
        AND tags != 'null'
        AND is_visible = 1 AND is_approved = 1
    `);
    
    // Extract unique tags from JSON arrays
    const allTags = new Set<string>();
    if (Array.isArray(tagsResult)) {
      tagsResult.forEach((row: any) => {
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

    const [eventsResult] = await executeQuery(`
      SELECT DISTINCT e.event_name
      FROM photos p
      JOIN photo_events e ON p.event_id = e.id
      WHERE p.is_visible = 1 AND p.is_approved = 1
        AND e.event_name IS NOT NULL AND e.event_name != ''
      ORDER BY e.event_name
    `);

    const states = Array.isArray(statesResult) ? statesResult.map((row: any) => row.state) : [];
    const districts = Array.isArray(districtsResult) ? districtsResult.map((row: any) => row.district) : [];
    const tags = Array.from(allTags).sort();
    const events = Array.isArray(eventsResult) ? eventsResult.map((row: any) => row.event_name) : [];

    // Fallback data if database queries return empty results
    const fallbackStates = states.length > 0 ? states : ['Uttar Pradesh', 'Madhya Pradesh'];
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
