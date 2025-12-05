import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminJwt, getAdminToken } from '@/lib/auth-jwt';
import { createHash } from 'crypto';
import { createStagedBlob } from '@/lib/blob-storage';

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
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
    }

    // Validate file size (2MB max)
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const actualSize = buffer.length;
    
    const maxSizeBytes = 2 * 1024 * 1024; // 2MB
    if (actualSize > maxSizeBytes) {
      const fileSizeMB = (actualSize / (1024 * 1024)).toFixed(2);
      return NextResponse.json({ 
        error: `File size must be less than 2MB. Your file is ${fileSizeMB}MB` 
      }, { status: 400 });
    }

    const fileHash = createHash('sha256').update(buffer).digest('hex');

    const assetId = await createStagedBlob({
      category: 'about_page',
      buffer,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      hash: fileHash,
      ttlSeconds: 60 * 60 * 24 * 365 // 1 year staging
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
    console.error('Error uploading about page image:', error);
    return NextResponse.json({ 
      error: 'Failed to upload image' 
    }, { status: 500 });
  }
}

