import { NextRequest, NextResponse } from 'next/server';
import { ContentService, PhotoEvent } from '@/lib/content';
import { verifyAdminJwt } from '@/lib/auth-jwt';
import { executeQuery } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_session')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const claims = await verifyAdminJwt(token);
    if (!claims) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const state = searchParams.get('state');
    const district = searchParams.get('district');
    
    console.log('Photo events API - Received filters:', { state, district });
    
    // Build scope based on user type
    let scope: any = {};
    
    if (claims.type === 'district_admin') {
      // District admins are restricted to their district
      scope = { 
        district: claims.district, 
        adminId: parseInt(claims.sub), 
        unrestricted: false 
      };
    } else {
      // Superadmins can filter by state/district if provided
      scope = { unrestricted: true };
      
      // Apply filters for superadmins if provided
      if (state) scope.state = state;
      if (district) scope.district = district;
    }
    
    console.log('Photo events API - Final scope:', scope);
    
    const events = await ContentService.getPhotoEvents(scope);

    return NextResponse.json({
      success: true,
      events
    });
  } catch (error) {
    console.error('Error fetching photo events:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch photo events'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_session')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const claims = await verifyAdminJwt(token);
    if (!claims) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { eventName, eventDate, eventType, location, description, status, isPublic } = body;

    if (!eventName || !eventDate || !eventType) {
      return NextResponse.json({
        success: false,
        error: 'Event name, date, and type are required'
      }, { status: 400 });
    }

    // Get user details for ownership
    const userType = claims.type || 'superadmin';
    let finalDistrict = null;
    let finalState = null;
    let createdBy = claims.email;

    if (userType === 'district_admin') {
      // For district admins, use their assigned district and get state from district
      finalDistrict = claims.district;
      
      // Get state from district admin's district
      const adminRows: any[] = await executeQuery(
        'SELECT da.district, da.state, m.name FROM district_admins da JOIN members m ON da.member_id = m.id WHERE da.id = ?',
        [claims.sub]
      );
      if (adminRows.length > 0) {
        finalState = adminRows[0].state;
        createdBy = adminRows[0].name || claims.email;
      }
    } else {
      // For superadmins, events are global (no specific state/district)
      finalState = null;
      finalDistrict = null;
    }
    
    const eventData: Omit<PhotoEvent, 'id' | 'createdAt' | 'updatedAt'> = {
      eventName,
      eventDate: new Date(eventDate),
      eventType,
      location,
      description,
      status: status || 'upcoming',
      isPublic: isPublic !== false,
      district: finalDistrict,
      state: finalState,
      ownerAdminId: parseInt(claims.sub),
      createdBy
    };

    const eventId = await ContentService.createPhotoEvent(eventData);

    return NextResponse.json({
      success: true,
      eventId,
      message: 'Photo event created successfully'
    });
  } catch (error) {
    console.error('Error creating photo event:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create photo event'
    }, { status: 500 });
  }
}
