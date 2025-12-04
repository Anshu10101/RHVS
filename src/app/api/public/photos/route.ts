import { NextRequest, NextResponse } from 'next/server';
import { ContentService } from '@/lib/content';
import { executeQuery } from '@/lib/database';
import { noCacheJsonResponse } from '@/lib/api-helpers';
import { photoToGalleryImage } from '@/components/Home/gallery/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventType = searchParams.get('eventType');
    const state = searchParams.get('state');
    const district = searchParams.get('district');
    const districtId = searchParams.get('districtId');
    const event = searchParams.get('event');
    const tags = searchParams.get('tags');
    const limit = searchParams.get('limit');
    const featured = searchParams.get('featured');

    // Get all public photos with event information
    const scope = { unrestricted: true }; // Public access
    
    // If districtId is provided, we need to get the district name from the district ID
    let districtName = district;
    if (districtId && !districtName) {
      try {
        const districtQuery = 'SELECT district_name_english as name FROM districts WHERE district_code = ?';
        const districtResult = await executeQuery(districtQuery, [districtId]) as any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
        if (districtResult.length > 0) {
          districtName = districtResult[0].name;
        }
      } catch (error) {
        console.error('Error fetching district name:', error);
      }
    }
    
    const filters = {
      isVisible: true,
      isApproved: true,
      isFeatured: featured === 'true' ? true : undefined,
      state: state || undefined,
      district: districtName || undefined,
      event: event || undefined,
      tags: tags ? tags.split(',') : undefined
    };

    // If specific event type requested, filter by it
    if (eventType && eventType !== 'all') {
      // This would need to be implemented in ContentService.getPhotos to support eventType filtering
    }

    const isRandomRequest = searchParams.get('random') === 'true';
    
    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = isRandomRequest ? 10000 : parseInt(searchParams.get('limit') || '24'); // For random, fetch all photos
    const offset = isRandomRequest ? 0 : (page - 1) * pageSize;

    const photos = await ContentService.getPhotos(scope, filters);
    
    // Filter photos with valid file paths OR YouTube videos
    const validPhotos = photos.filter(photo => {
      const hasFilePath = !!photo.filePath;
      const isVideoWithUrl = !!(photo.isVideo && photo.youtubeVideoUrl);
      return hasFilePath || isVideoWithUrl;
    });
    
    // Get total count before pagination
    const totalPhotos = validPhotos.length;
    const totalPages = isRandomRequest ? 1 : Math.ceil(totalPhotos / pageSize);
    
    // Apply pagination only if not a random request
    const paginatedPhotos = isRandomRequest 
      ? validPhotos 
      : validPhotos.slice(offset, offset + pageSize);
    
    // Debug: Log video count
    const videoCount = paginatedPhotos.filter(p => p.isVideo).length;
    if (videoCount > 0) {
      console.log(`[Public Photos API] Found ${videoCount} videos in paginated results`);
    }
    
    // Transform photos for public gallery format using the conversion function
    const galleryImages = paginatedPhotos
      .map(photo => {
        const converted = photoToGalleryImage(photo);
        if (!converted && photo.isVideo) {
          console.warn('[Public Photos API] Failed to convert video:', photo.id, photo.youtubeVideoUrl);
        }
        return converted;
      })
      .filter((img): img is NonNullable<typeof img> => img !== null);
    
    // Debug: Log converted video count
    const convertedVideoCount = galleryImages.filter(img => img.isVideo).length;
    if (convertedVideoCount > 0) {
      console.log(`[Public Photos API] Successfully converted ${convertedVideoCount} videos`);
    }

    return noCacheJsonResponse({
      success: true,
      images: galleryImages,
      total: totalPhotos,
      page: page,
      pageSize: pageSize,
      totalPages: totalPages,
      hasMore: page < totalPages
    });

  } catch (error) {
    console.error('Error fetching public photos:', error);
    return noCacheJsonResponse({
      success: false,
      error: 'Failed to fetch photos',
      images: []
    }, { status: 500 });
  }
}
