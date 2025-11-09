import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminJwt } from '@/lib/auth-jwt';
import { ContentService, PhotoCreateInput } from '@/lib/content';
import { executeQuery } from '@/lib/database';
import { createHash } from 'crypto';

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

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const eventId = formData.get('eventId') as string;
    const galleryId = formData.get('galleryId') as string;
    const caption = formData.get('caption') as string;
    const description = formData.get('description') as string;
    const photographer = formData.get('photographer') as string;
    const tags = formData.get('tags') as string;
    const uploadSessionId = formData.get('uploadSessionId') as string;

    if (!file) {
      return NextResponse.json({ 
        success: false, 
        error: 'No file provided' 
      }, { status: 400 });
    }

    if (!eventId && !galleryId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Either eventId or galleryId is required' 
      }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ 
        success: false, 
        error: 'File must be an image' 
      }, { status: 400 });
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ 
        success: false, 
        error: 'File size must be less than 10MB' 
      }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileHash = createHash('sha256').update(buffer).digest('hex');

    // Get file dimensions (basic implementation)
    let dimensions = '';
    try {
      // For now, we'll skip dimension detection in Node.js environment
      // In production, you might want to use a proper image processing library like 'sharp'
      dimensions = 'unknown';
    } catch (error) {
      console.log('Could not get image dimensions:', error);
      dimensions = 'unknown';
    }

    // Create photo record in database
    const userType = claims.type || 'superadmin';
    let district = null;
    let state = null;
    let createdBy = claims.email;

    if (userType === 'district_admin') {
      district = claims.district;
      // Get district admin details
      const adminRows = await executeQuery(
        'SELECT da.district, da.state, m.name FROM district_admins da JOIN members m ON da.member_id = m.id WHERE da.id = ?',
        [claims.sub]
      ) as any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
      if (adminRows.length > 0) {
        createdBy = adminRows[0].name || claims.email;
        state = adminRows[0].state;
      }
    }

    // Process tags - add district tag automatically
    let processedTags: string[] = [];
    if (tags) {
      try {
        processedTags = JSON.parse(tags);
      } catch (e) {
        // If not JSON, treat as comma-separated string
        processedTags = tags.split(',').map(t => t.trim()).filter(t => t);
      }
    }
    
    // Add district tag automatically if not already present
    if (district && !processedTags.some((tag: string) => tag.toLowerCase().includes(district.toLowerCase()))) {
      processedTags.push(district);
    }
    
    // Add state tag automatically if not already present
    if (state && !processedTags.some((tag: string) => tag.toLowerCase().includes(state.toLowerCase()))) {
      processedTags.push(state);
    }
    
    const photoData: PhotoCreateInput = {
      galleryId: galleryId || undefined,
      eventId: eventId || undefined,
      filename: file.name,
      originalName: file.name,
      filePath: undefined,
      fileSize: file.size,
      dimensions,
      fileType: file.type,
      fileHash,
      fileBuffer: buffer,
      tags: processedTags,
      caption: caption || file.name,
      description: description || '',
      photographer: photographer || createdBy,
      uploadSource: 'admin' as const,
      uploadSessionId: uploadSessionId || undefined,
      isFeatured: false,
      isApproved: true,
      isVisible: true,
      sortOrder: 0,
      district: district || undefined,
      state: state || undefined,
      ownerAdminId: parseInt(claims.sub),
      createdBy
    };

    const photoId = await ContentService.createPhoto(photoData);
    const publicUrl = `/api/media/photos/${photoId}`;

    return NextResponse.json({ 
      success: true, 
      photoId,
      url: publicUrl,
      filename: file.name,
      fileSize: file.size,
      fileType: file.type,
      message: 'Photo uploaded successfully'
    });

  } catch (error) {
    console.error('Error uploading photo:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to upload photo' 
    }, { status: 500 });
  }
}
