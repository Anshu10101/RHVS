import { NextRequest, NextResponse } from 'next/server';
import { ContentService } from '@/lib/content';

export async function GET() {
  try {
    const albums = await ContentService.getGalleryAlbums();
    const images = await ContentService.getGalleryImages();

    return NextResponse.json({ 
      success: true, 
      albums, 
      images 
    });
  } catch (error) {
    console.error('Error fetching gallery content:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch gallery content' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { albums, images, updatedBy } = await request.json();

    if (!albums || !images) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    const success = await ContentService.saveGalleryContent(albums, images, updatedBy || 'admin');

    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Gallery content saved successfully' 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to save gallery content' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error saving gallery content:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to save gallery content' 
    }, { status: 500 });
  }
}