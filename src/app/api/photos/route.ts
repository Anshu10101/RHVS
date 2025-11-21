import { NextRequest, NextResponse } from 'next/server';
import { ContentService, PhotoCreateInput } from '@/lib/content';
import { verifyAdminJwt, getAdminToken } from '@/lib/auth-jwt';
import { getAdminScope } from '@/lib/admin-scope';
import { executeQuery } from '@/lib/database';
import { createHash } from 'crypto';

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

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const galleryId = searchParams.get('galleryId');
    const isFeatured = searchParams.get('isFeatured');
    const isApproved = searchParams.get('isApproved');
    const isVisible = searchParams.get('isVisible');
    const search = searchParams.get('search');

    // Build scope using getAdminScope to get accurate district/state
    const adminScope = await getAdminScope(request);
    const scope = adminScope.isSuperAdmin
      ? { unrestricted: true }
      : { district: adminScope.districtName || '', state: adminScope.stateName || '', unrestricted: false };
    
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
    const token = getAdminToken(request);
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
      fileSize,
      dimensions,
      fileType,
      fileHash,
      fileData,
      thumbnailData,
      mediumData,
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

    if (!filename) {
      return NextResponse.json({
        success: false,
        error: 'Filename is required'
      }, { status: 400 });
    }

    if (!filePath && !fileData) {
      return NextResponse.json({
        success: false,
        error: 'Either file path or file data is required'
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
    
    let primaryBuffer: Buffer | null = null;
    let derivedHash = fileHash as string | undefined;

    if (typeof fileData === 'string' && fileData.length > 0) {
      primaryBuffer = Buffer.from(fileData, 'base64');
      if (!derivedHash) {
        derivedHash = createHash('sha256').update(primaryBuffer).digest('hex');
      }
    }

    const thumbBuffer = typeof thumbnailData === 'string' && thumbnailData.length > 0
      ? Buffer.from(thumbnailData, 'base64')
      : null;

    const mediumBuffer = typeof mediumData === 'string' && mediumData.length > 0
      ? Buffer.from(mediumData, 'base64')
      : null;
    
    const photoData: PhotoCreateInput = {
      galleryId: galleryId || undefined,
      eventId: eventId || undefined,
      filename,
      originalName,
      filePath: filePath || undefined,
      fileSize,
      dimensions,
      fileType,
      fileHash: derivedHash,
      fileBuffer: primaryBuffer,
      thumbnailBuffer: thumbBuffer,
      mediumBuffer,
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
      district: district || undefined,
      state: state || undefined,
      ownerAdminId: parseInt(claims.sub),
      createdBy
    };

    const photoId = await ContentService.createPhoto(photoData);
    const photoUrl = `/api/media/photos/${photoId}`;

    return NextResponse.json({
      success: true,
      photoId,
      url: photoUrl,
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
