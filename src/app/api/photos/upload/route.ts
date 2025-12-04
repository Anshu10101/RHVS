import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminJwt, getAdminToken } from '@/lib/auth-jwt';
import { ContentService, PhotoCreateInput } from '@/lib/content';
import { executeQuery } from '@/lib/database';
import { createHash } from 'crypto';

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

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const youtubeVideoUrl = formData.get('youtubeVideoUrl') as string | null;
    const eventId = (formData.get('eventId') as string)?.trim() || null;
    const galleryId = (formData.get('galleryId') as string)?.trim() || null;
    const caption = formData.get('caption') as string;
    const description = formData.get('description') as string;
    const photographer = formData.get('photographer') as string;
    const tags = formData.get('tags') as string;
    const uploadSessionId = formData.get('uploadSessionId') as string;

    console.log('[Upload API] Received form data:', {
      hasFile: !!file,
      youtubeVideoUrl: youtubeVideoUrl ? 'provided' : 'not provided',
      eventId: eventId || 'not provided',
      galleryId: galleryId || 'not provided'
    });

    // Validate that either file or YouTube URL is provided
    if (!file && !youtubeVideoUrl) {
      return NextResponse.json({ 
        success: false, 
        error: 'Either a file or YouTube video URL is required' 
      }, { status: 400 });
    }

    if (!eventId && !galleryId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Either eventId or galleryId is required. Please select an event or gallery first.' 
      }, { status: 400 });
    }

    // Helper function to extract YouTube video ID
    const getYouTubeVideoId = (url: string): string | null => {
      if (!url || !url.trim()) return null;
      
      const trimmedUrl = url.trim();
      
      const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/watch\?.*[&?]v=([a-zA-Z0-9_-]{11})/,
        /youtu\.be\/([a-zA-Z0-9_-]{11})/,
        /(?:youtube\.com\/shorts\/|m\.youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/, // YouTube Shorts
        /^([a-zA-Z0-9_-]{11})$/, // Direct video ID
      ];
      
      for (const pattern of patterns) {
        const match = trimmedUrl.match(pattern);
        if (match && match[1]) {
          return match[1];
        }
      }
      
      if (trimmedUrl.includes('embed/')) {
        const embedMatch = trimmedUrl.match(/embed\/([a-zA-Z0-9_-]{11})/);
        if (embedMatch && embedMatch[1]) {
          return embedMatch[1];
        }
      }
      
      if (trimmedUrl.includes('/shorts/')) {
        const shortsMatch = trimmedUrl.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
        if (shortsMatch && shortsMatch[1]) {
          return shortsMatch[1];
        }
      }
      
      return null;
    };

    let buffer: Buffer | null = null;
    let fileHash: string | undefined = undefined;
    let fileSize: number | undefined = undefined;
    let fileType: string | undefined = undefined;
    let dimensions: string = 'unknown';
    let isVideo = false;
    let videoUrl: string | undefined = undefined;

    // Handle YouTube video URL
    if (youtubeVideoUrl) {
      console.log('[Upload API] Processing YouTube video URL:', youtubeVideoUrl);
      const videoId = getYouTubeVideoId(youtubeVideoUrl);
      console.log('[Upload API] Extracted video ID:', videoId);
      
      if (!videoId) {
        console.error('[Upload API] Failed to extract video ID from URL:', youtubeVideoUrl);
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid YouTube video URL' 
        }, { status: 400 });
      }
      isVideo = true;
      videoUrl = youtubeVideoUrl.trim();
      fileType = 'video/youtube';
      dimensions = '1920x1080'; // Default YouTube video dimensions
      console.log('[Upload API] Video processed:', { isVideo, videoUrl, videoId });
    } else if (file) {
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
      buffer = Buffer.from(bytes);
      fileHash = createHash('sha256').update(buffer).digest('hex');
      fileSize = file.size;
      fileType = file.type;
      // Dimensions already initialized as 'unknown' - can be enhanced later with image processing library
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
      filename: isVideo ? (caption || 'YouTube Video') : (file?.name || 'photo'),
      originalName: isVideo ? 'YouTube Video' : (file?.name || undefined),
      filePath: undefined,
      youtubeVideoUrl: videoUrl || undefined,
      isVideo: isVideo,
      fileSize: fileSize || undefined,
      dimensions,
      fileType: fileType || undefined,
      fileHash,
      fileBuffer: buffer,
      tags: processedTags,
      caption: caption || (isVideo ? 'YouTube Video' : (file?.name || 'Photo')),
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
      // Only set ownerAdminId for district admins (superadmins are not in district_admins table)
      ownerAdminId: userType === 'district_admin' ? parseInt(claims.sub) : undefined,
      createdBy
    };

    console.log('[Upload API] Creating photo with data:', {
      isVideo: photoData.isVideo,
      youtubeVideoUrl: photoData.youtubeVideoUrl,
      filename: photoData.filename,
      eventId: photoData.eventId,
      galleryId: photoData.galleryId
    });

    const photoId = await ContentService.createPhoto(photoData);
    console.log('[Upload API] Photo created with ID:', photoId);
    const publicUrl = `/api/media/photos/${photoId}`;

    return NextResponse.json({ 
      success: true, 
      photoId,
      url: publicUrl,
      filename: isVideo ? (caption || 'YouTube Video') : (file?.name || 'photo'),
      fileSize: fileSize || 0,
      fileType: fileType || 'unknown',
      isVideo: isVideo,
      youtubeVideoUrl: videoUrl || undefined,
      message: isVideo ? 'Video added successfully' : 'Photo uploaded successfully'
    });

  } catch (error) {
    console.error('[Upload API] Error uploading photo/video:', error);
    
    let errorMessage = 'Failed to upload photo';
    let errorDetails = '';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = error.stack || error.message;
      console.error('[Upload API] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      // Check if it's a database column error
      if (error.message.includes('Unknown column') || 
          error.message.includes('youtube_video_url') || 
          error.message.includes('is_video') ||
          error.message.includes("Column 'youtube_video_url'") ||
          error.message.includes("Column 'is_video'")) {
        errorMessage = 'Database columns missing. Please run the migration: database/add-youtube-video-to-photos.sql';
      }
    }
    
    return NextResponse.json({ 
      success: false, 
      error: errorMessage,
      details: errorDetails || (error instanceof Error ? error.message : String(error))
    }, { status: 500 });
  }
}
