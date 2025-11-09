import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { createStagedBlob } from '@/lib/blob-storage';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (max 100KB)
    if (file.size > 100 * 1024) {
      return NextResponse.json(
        { success: false, error: 'Signature image must be less than 100KB' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const hash = createHash('sha256').update(buffer).digest('hex');

    const assetId = await createStagedBlob({
      category: 'member_signature',
      buffer,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      hash,
      ttlSeconds: 60 * 60 * 24
    });

    const relativePath = `/api/media/staged/${assetId}`;
    
    return NextResponse.json({
      success: true,
      url: relativePath,
      assetId,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      hash,
      message: 'Signature uploaded successfully'
    });
    
  } catch (error) {
    console.error('Error uploading signature:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload signature' },
      { status: 500 }
    );
  }
}
