import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminJwt, getAdminToken } from '@/lib/auth-jwt';
import { executeQuery } from '@/lib/database';
import { ContentService } from '@/lib/content';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('DELETE /api/photos/events/[id] called');
    
    // Verify admin authentication
    const token = getAdminToken(request);
    console.log('Token exists:', !!token);
    if (!token) {
      console.log('No token found, returning 401');
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const admin = await verifyAdminJwt(token);
    console.log('Admin verified:', !!admin);
    if (!admin) {
      console.log('Token invalid, returning 401');
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id: eventId } = await params;
    console.log('Event ID to delete:', eventId);

    // Check if event exists
    console.log('Checking if event exists:', eventId);
    const eventResult = await executeQuery(
      'SELECT id FROM photo_events WHERE id = ?',
      [eventId]
    );
    console.log('Event query result:', eventResult);

    if (!eventResult || !Array.isArray(eventResult) || eventResult.length === 0) {
      console.log('Event not found, returning 404');
      return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 });
    }

    // Delete all photos associated with this event
    console.log('Deleting photos for event:', eventId);
    await executeQuery(
      'DELETE FROM photos WHERE event_id = ?',
      [eventId]
    );

    // Delete all galleries associated with this event
    console.log('Deleting galleries for event:', eventId);
    await executeQuery(
      'DELETE FROM photo_galleries WHERE event_id = ?',
      [eventId]
    );

    // Delete the event
    console.log('Deleting event:', eventId);
    await executeQuery(
      'DELETE FROM photo_events WHERE id = ?',
      [eventId]
    );

    console.log('Event deleted successfully');
    return NextResponse.json({
      success: true,
      message: 'Event and all associated photos deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete event'
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin authentication
    const token = getAdminToken(request);
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const admin = await verifyAdminJwt(token);
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id: eventId } = await params;
    const body = await request.json();
    const { eventName, eventDate, eventType, location, description, status, isPublic } = body;

    if (!eventName || !eventDate || !eventType || !status) {
      return NextResponse.json({
        success: false,
        error: 'Required fields missing'
      }, { status: 400 });
    }

    // Check if event exists
    const eventResult = await executeQuery(
      'SELECT id FROM photo_events WHERE id = ?',
      [eventId]
    );

    if (!eventResult || !Array.isArray(eventResult) || eventResult.length === 0) {
      return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 });
    }

    // Update the event
    await executeQuery(
      `UPDATE photo_events SET 
       event_name = ?, 
       event_date = ?, 
       event_type = ?, 
       location = ?, 
       description = ?, 
       status = ?, 
       is_public = ?,
       updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        eventName,
        eventDate,
        eventType,
        location || null,
        description || null,
        status,
        isPublic,
        eventId
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Event updated successfully'
    });

  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update event'
    }, { status: 500 });
  }
}
