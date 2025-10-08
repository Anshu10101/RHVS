import { NextRequest, NextResponse } from 'next/server';
import { ContentService, PhotoGallery } from '@/lib/content';
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

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    // Build scope based on user type
    const scope = claims.type === 'district_admin' 
      ? { district: claims.district, adminId: parseInt(claims.sub), unrestricted: false }
      : { unrestricted: true };
    
    const galleries = await ContentService.getPhotoGalleries(scope, eventId || undefined);

    return NextResponse.json({
      success: true,
      galleries
    });
  } catch (error) {
    console.error('Error fetching photo galleries:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch photo galleries'
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
    const { eventId, galleryName, description, isPublic, isFeatured, sortOrder } = body;

    if (!galleryName) {
      return NextResponse.json({
        success: false,
        error: 'Gallery name is required'
      }, { status: 400 });
    }

    // Get user details for ownership
    const userType = claims.type || 'superadmin';
    let district = null;
    const state = null;
    let createdBy = claims.email;

    if (userType === 'district_admin') {
      district = claims.district;
      // Get district admin details
      const adminRows = await executeQuery(
        'SELECT da.district, m.name FROM district_admins da JOIN members m ON da.member_id = m.id WHERE da.id = ?',
        [claims.sub]
      ) as Array<{ district: string; name: string }>;
      if (adminRows.length > 0) {
        createdBy = adminRows[0].name || claims.email;
      }
    }
    
    const galleryData: Omit<PhotoGallery, 'id' | 'createdAt' | 'updatedAt' | 'photoCount'> = {
      eventId: eventId || null,
      galleryName,
      description,
      isPublic: isPublic !== false,
      isFeatured: isFeatured || false,
      sortOrder: sortOrder || 0,
      district: district || undefined,
      state: state || undefined,
      ownerAdminId: parseInt(claims.sub),
      createdBy
    };

    const galleryId = await ContentService.createPhotoGallery(galleryData);

    return NextResponse.json({
      success: true,
      galleryId,
      message: 'Photo gallery created successfully'
    });
  } catch (error) {
    console.error('Error creating photo gallery:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create photo gallery'
    }, { status: 500 });
  }
}
