import { NextRequest, NextResponse } from 'next/server';
import { ContentService, Photo } from '@/lib/content';
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
    const galleryId = searchParams.get('galleryId');
    const isFeatured = searchParams.get('isFeatured');
    const isApproved = searchParams.get('isApproved');
    const isVisible = searchParams.get('isVisible');
    const search = searchParams.get('search');

    // Build scope based on user type
    const scope = claims.type === 'district_admin' 
      ? { district: claims.district, adminId: parseInt(claims.sub), unrestricted: false }
      : { unrestricted: true };
    
    const filters = {
      eventId: eventId || undefined,
      galleryId: galleryId || undefined,
      isFeatured: isFeatured ? isFeatured === 'true' : undefined,
      isApproved: isApproved ? isApproved === 'true' : undefined,
      isVisible: isVisible ? isVisible === 'true' : undefined,
      search: search || undefined
    };

    const photos = await ContentService.getPhotos(scope, filters);

    return NextResponse.json({
      success: true,
      photos
    });
  } catch (error) {
    console.error('Error fetching photos:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch photos'
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
    const { 
      galleryId, 
      eventId, 
      filename, 
      originalName, 
      filePath, 
      thumbnailPath,
      mediumPath,
      fileSize,
      dimensions,
      fileType,
      cameraInfo,
      tags, 
      caption, 
      photographer, 
      uploadSource, 
      uploadSessionId,
      isFeatured, 
      isApproved, 
      isVisible, 
      sortOrder 
    } = body;

    if (!filename || !filePath) {
      return NextResponse.json({
        success: false,
        error: 'Filename and file path are required'
      }, { status: 400 });
    }

    // Get user details for ownership
    const userType = claims.type || 'superadmin';
    let district = null;
    let state = null;
    let createdBy = claims.email;

    if (userType === 'district_admin') {
      district = claims.district;
      // Get district admin details
      const adminRows: any[] = await executeQuery(
        'SELECT da.district, m.name FROM district_admins da JOIN members m ON da.member_id = m.id WHERE da.id = ?',
        [claims.sub]
      );
      if (adminRows.length > 0) {
        createdBy = adminRows[0].name || claims.email;
      }
    }
    
    const photoData: Omit<Photo, 'id' | 'createdAt' | 'updatedAt' | 'viewCount' | 'downloadCount'> = {
      galleryId: galleryId || null,
      eventId: eventId || null,
      filename,
      originalName,
      filePath,
      thumbnailPath,
      mediumPath,
      fileSize,
      dimensions,
      fileType,
      cameraInfo,
      tags: tags || [],
      caption,
      photographer,
      uploadSource: uploadSource || 'admin',
      uploadSessionId,
      isFeatured: isFeatured || false,
      isApproved: isApproved !== false,
      isVisible: isVisible !== false,
      sortOrder: sortOrder || 0,
      district,
      state,
      ownerAdminId: parseInt(claims.sub),
      createdBy
    };

    const photoId = await ContentService.createPhoto(photoData);

    return NextResponse.json({
      success: true,
      photoId,
      message: 'Photo created successfully'
    });
  } catch (error) {
    console.error('Error creating photo:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create photo'
    }, { status: 500 });
  }
}
