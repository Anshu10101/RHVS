import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { verifyAdminJwt } from '@/lib/auth-jwt';
import { ContentService } from '@/lib/content';
import { executeQuery } from '@/lib/database';

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

    // Create uploads directory structure
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'photos');
    const eventDir = join(uploadsDir, eventId || 'misc');
    
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }
    if (!existsSync(eventDir)) {
      await mkdir(eventDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const filename = `photo_${timestamp}.${fileExtension}`;
    const filePath = join(eventDir, filename);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Generate public URL
    const publicUrl = `/uploads/photos/${eventId || 'misc'}/${filename}`;

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
      const adminRows: any[] = await executeQuery(
        'SELECT da.district, da.state, m.name FROM district_admins da JOIN members m ON da.member_id = m.id WHERE da.id = ?',
        [claims.sub]
      );
      if (adminRows.length > 0) {
        createdBy = adminRows[0].name || claims.email;
        state = adminRows[0].state;
      }
    }

    // Process tags - add district tag automatically
    let processedTags = [];
    if (tags) {
      try {
        processedTags = JSON.parse(tags);
      } catch (e) {
        // If not JSON, treat as comma-separated string
        processedTags = tags.split(',').map(t => t.trim()).filter(t => t);
      }
    }
    
    // Add district tag automatically if not already present
    if (district && !processedTags.some(tag => tag.toLowerCase().includes(district.toLowerCase()))) {
      processedTags.push(district);
    }
    
    // Add state tag automatically if not already present
    if (state && !processedTags.some(tag => tag.toLowerCase().includes(state.toLowerCase()))) {
      processedTags.push(state);
    }
    
    const photoData = {
      galleryId: galleryId || null,
      eventId: eventId || null,
      filename,
      originalName: file.name,
      filePath: publicUrl,
      fileSize: file.size,
      dimensions,
      fileType: file.type,
      tags: processedTags,
      caption: caption || file.name,
      description: description || '',
      photographer: photographer || createdBy,
      uploadSource: 'admin' as const,
      uploadSessionId: uploadSessionId || null,
      isFeatured: false,
      isApproved: true,
      isVisible: true,
      sortOrder: 0,
      district,
      state,
      ownerAdminId: parseInt(claims.sub),
      createdBy
    };

    const photoId = await ContentService.createPhoto(photoData);

    return NextResponse.json({ 
      success: true, 
      photoId,
      url: publicUrl,
      filename,
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
