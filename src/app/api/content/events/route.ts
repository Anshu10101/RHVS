import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';
import { getAdminScope, ensurePermission } from '@/lib/admin-scope';

// GET - Fetch events
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const type = searchParams.get('type');
    const upcoming = searchParams.get('upcoming');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    let query = `
      SELECT e.*, 
             COALESCE(e.district, 'All Districts') as district,
             COALESCE(e.state, 'All States') as state
      FROM events e
      WHERE isVisible = TRUE 
    `;
    const params: any[] = [];

    if (id) {
      query += ` AND id = ?`;
      params.push(id);
    }

    if (type && type !== 'all') {
      query += ` AND event_type = ?`;
      params.push(type);
    }

    if (upcoming === 'true') {
      query += ` AND event_date >= CURDATE()`;
    }

    query += ` ORDER BY event_date ASC, \`order\` ASC`;

    if (limit) {
      query += ` LIMIT ?`;
      params.push(parseInt(limit));
      
      if (offset) {
        query += ` OFFSET ?`;
        params.push(parseInt(offset));
      }
    }

    const [rows] = await pool.execute(query, params);
    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

// POST - Add new event
export async function POST(request: NextRequest) {
  try {
    const scope = await getAdminScope(request);
    if (!scope.isSuperAdmin && !ensurePermission(scope, ['edit_news_events', 'manage_news_events'])) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      title, title_hindi, description, event_date, event_time, end_date, end_time,
      location, address, image_path, registration_required, registration_url,
      max_participants, event_type, order, created_by 
    } = body;

    const id = `event_${Date.now()}`;
    
    // Convert undefined values to null for MySQL
    const safeValue = (val: any) => val === undefined ? null : val;
    
    // Determine content ownership
    let district = null as string | null;
    let state = null as string | null;
    let owner_admin_id = null as string | null;

    if (!scope.isSuperAdmin && scope.isDistrictAdmin && scope.adminId) {
      district = scope.districtName || null;
      state = scope.stateName || null;
      owner_admin_id = scope.adminId || null;
    }

    await pool.execute(
      `INSERT INTO events 
       (id, title, title_hindi, description, event_date, event_time, end_date, end_time,
        location, address, image_path, registration_required, registration_url,
        max_participants, event_type, \`order\`, isVisible, district, state, owner_admin_id, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, 
        safeValue(title), 
        safeValue(title_hindi), 
        safeValue(description), 
        safeValue(event_date), 
        safeValue(event_time), 
        safeValue(end_date), 
        safeValue(end_time),
        safeValue(location), 
        safeValue(address), 
        safeValue(image_path), 
        safeValue(registration_required), 
        safeValue(registration_url),
        safeValue(max_participants), 
        safeValue(event_type), 
        safeValue(order), 
        true,
        safeValue(district),
        safeValue(state),
        safeValue(owner_admin_id), 
        safeValue(created_by)
      ]
    );

    return NextResponse.json({ 
      success: true, 
      message: 'Event added successfully',
      data: { id }
    });
  } catch (error) {
    console.error('Error adding event:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add event' },
      { status: 500 }
    );
  }
}

// PUT - Update event
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      id, title, title_hindi, description, event_date, event_time, end_date, end_time,
      location, address, image_path, registration_required, registration_url,
      max_participants, event_type, order, isVisible 
    } = body;

    // Convert undefined values to null for MySQL
    const safeValue = (val: any) => val === undefined ? null : val;
    
    await pool.execute(
      `UPDATE events SET 
       title = ?, title_hindi = ?, description = ?, event_date = ?, event_time = ?, 
       end_date = ?, end_time = ?, location = ?, address = ?, image_path = ?, 
       registration_required = ?, registration_url = ?, max_participants = ?, 
       event_type = ?, \`order\` = ?, isVisible = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        safeValue(title), 
        safeValue(title_hindi), 
        safeValue(description), 
        safeValue(event_date), 
        safeValue(event_time), 
        safeValue(end_date), 
        safeValue(end_time),
        safeValue(location), 
        safeValue(address), 
        safeValue(image_path), 
        safeValue(registration_required), 
        safeValue(registration_url),
        safeValue(max_participants), 
        safeValue(event_type), 
        safeValue(order), 
        safeValue(isVisible), 
        safeValue(id)
      ]
    );

    return NextResponse.json({ 
      success: true, 
      message: 'Event updated successfully'
    });
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update event' },
      { status: 500 }
    );
  }
}

// DELETE - Delete event
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Event ID is required' },
        { status: 400 }
      );
    }

    await pool.execute('DELETE FROM events WHERE id = ?', [id]);

    return NextResponse.json({ 
      success: true, 
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete event' },
      { status: 500 }
    );
  }
}