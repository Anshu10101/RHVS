import { NextRequest, NextResponse } from 'next/server';
import { ContentService } from '@/lib/content';
import { executeQuery } from '@/lib/database';

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

    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('limit') || '24'); // Default 24 images per page
    const offset = (page - 1) * pageSize;

    const photos = await ContentService.getPhotos(scope, filters);
    
    // Get total count before pagination
    const totalPhotos = photos.length;
    const totalPages = Math.ceil(totalPhotos / pageSize);
    
    // Apply pagination
    const paginatedPhotos = photos
      .filter(photo => photo.filePath) // Only photos with valid file paths
      .slice(offset, offset + pageSize);
    
    // Transform photos for public gallery format
    const galleryImages = paginatedPhotos.map((photo, index) => ({
        id: index + 1,
        src: photo.filePath,
        alt: photo.caption || photo.filename || 'Gallery Image',
        title: photo.caption || photo.filename || 'Untitled',
        description: photo.description || photo.caption || '',
        category: photo.eventType ? 
          photo.eventType.charAt(0).toUpperCase() + photo.eventType.slice(1) : 
          'Community',
        aspectRatio: ['wide', 'tall', 'square'][index % 3] as 'wide' | 'tall' | 'square',
        date: photo.createdAt ? new Date(photo.createdAt).toISOString().split('T')[0] : 
          new Date().toISOString().split('T')[0],
        tags: photo.tags || [],
        eventName: photo.eventName || '',
        eventDate: photo.eventDate || null,
        photographer: photo.photographer || '',
        isFeatured: photo.isFeatured || false,
        district: photo.district || '',
        state: photo.state || ''
      }));

    return NextResponse.json({
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
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch photos',
      images: []
    }, { status: 500 });
  }
}
