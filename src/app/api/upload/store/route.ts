import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { createStagedBlob } from '@/lib/blob-storage';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const productId = formData.get('productId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
    }

    // Validate file size (6MB max to allow higher-res shots)
    if (file.size > 6 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 6MB' }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const hash = createHash('sha256').update(buffer).digest('hex');

    const assetId = await createStagedBlob({
      category: 'product_image',
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
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      hash
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ 
      error: 'Failed to upload file' 
    }, { status: 500 });
  }
}
