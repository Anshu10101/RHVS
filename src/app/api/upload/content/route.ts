import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminJwt } from '@/lib/auth-jwt';
import { createHash } from 'crypto';
import { createStagedBlob } from '@/lib/blob-storage';

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
    const type = formData.get('type') as string; // 'news' or 'events'

    if (!file) {
      return NextResponse.json({ 
        success: false, 
        error: 'No file provided' 
      }, { status: 400 });
    }

    if (!type || !['news', 'events'].includes(type)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Type must be either "news" or "events"' 
      }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ 
        success: false, 
        error: 'File must be an image' 
      }, { status: 400 });
    }

    // Validate file size (max 6MB)
    if (file.size > 6 * 1024 * 1024) {
      return NextResponse.json({ 
        success: false, 
        error: 'File size must be less than 6MB' 
      }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const hash = createHash('sha256').update(buffer).digest('hex');

    const assetId = await createStagedBlob({
      category: `content_${type}`,
      buffer,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      hash,
      ttlSeconds: 60 * 60 * 24
    });

    const stagedUrl = `/api/media/staged/${assetId}`;

    return NextResponse.json({ 
      success: true, 
      url: stagedUrl,
      assetId,
      originalName: file.name,
      size: file.size,
      type: file.type,
      hash
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to upload file' 
    }, { status: 500 });
  }
}
