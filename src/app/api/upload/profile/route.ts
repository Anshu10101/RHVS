import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { createStagedBlob } from '@/lib/blob-storage';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 2MB' }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileHash = createHash('sha256').update(buffer).digest('hex');

    const assetId = await createStagedBlob({
      category: 'profile_photo',
      buffer,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      hash: fileHash,
      ttlSeconds: 60 * 60 * 24 // 24 hours staging
    });

    const publicUrl = `/api/media/staged/${assetId}`;
    
    return NextResponse.json({ 
      success: true, 
      url: publicUrl,
      assetId,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      hash: fileHash
    });

  } catch (error) {
    console.error('Error uploading profile photo:', error);
    return NextResponse.json({ 
      error: 'Failed to upload profile photo' 
    }, { status: 500 });
  }
}
