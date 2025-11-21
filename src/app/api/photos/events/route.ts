import { NextRequest, NextResponse } from 'next/server';
import { ContentService, PhotoEvent } from '@/lib/content';
import { verifyAdminJwt, getAdminToken } from '@/lib/auth-jwt';
import { executeQuery } from '@/lib/database';
import { noCacheJsonResponse } from '@/lib/api-helpers';

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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const state = searchParams.get('state');
    const district = searchParams.get('district');
    
    // Build scope based on user type
    let scope: Record<string, unknown> = {};
    
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
    
    const events = await ContentService.getPhotoEvents(scope);

    return noCacheJsonResponse({
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
    const token = getAdminToken(request);
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
      const adminRows = await executeQuery(
        'SELECT da.district, da.state, m.name FROM district_admins da JOIN members m ON da.member_id = m.id WHERE da.id = ?',
        [claims.sub]
      ) as any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
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
      district: finalDistrict || undefined,
      state: finalState || undefined,
      // Only set ownerAdminId for district admins (superadmins are not in district_admins table)
      ownerAdminId: userType === 'district_admin' ? parseInt(claims.sub) : undefined,
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
