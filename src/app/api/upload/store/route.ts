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

    // Log file info for debugging
    console.log('File upload info:', {
      name: file.name,
      type: file.type,
      size: file.size,
      sizeKB: (file.size / 1024).toFixed(2),
      sizeMB: (file.size / (1024 * 1024)).toFixed(2)
    });

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
    }

    // Convert file to buffer FIRST to get actual size
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const actualSize = buffer.length;
    
    // Validate file size (1MB max) - use actual buffer size
    const maxSizeBytes = 1 * 1024 * 1024; // 1MB in bytes
    if (actualSize > maxSizeBytes) {
      const fileSizeMB = (actualSize / (1024 * 1024)).toFixed(2);
      const fileSizeKB = (actualSize / 1024).toFixed(2);
      console.error('File size validation failed:', {
        reportedSize: file.size,
        actualSize: actualSize,
        sizeMB: fileSizeMB,
        sizeKB: fileSizeKB
      });
      return NextResponse.json({ 
        success: false,
        error: `File size must be less than 1MB. Your file is ${fileSizeMB}MB (${fileSizeKB}KB)` 
      }, { status: 400 });
    }
    
    const hash = createHash('sha256').update(buffer).digest('hex');

    let assetId: string;
    try {
      assetId = await createStagedBlob({
        category: 'product_image',
        buffer,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        hash,
        ttlSeconds: 60 * 60 * 24
      });
    } catch (blobError) {
      console.error('Error creating staged blob:', blobError);
      const blobErrorMessage = blobError instanceof Error ? blobError.message : 'Failed to create staged blob';
      return NextResponse.json({ 
        success: false,
        error: `Blob storage error: ${blobErrorMessage}`,
        details: blobError instanceof Error ? blobError.stack : String(blobError)
      }, { status: 500 });
    }

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
    const errorMessage = error instanceof Error ? error.message : 'Failed to upload file';
    return NextResponse.json({ 
      success: false,
      error: errorMessage,
      details: error instanceof Error ? error.stack : String(error)
    }, { status: 500 });
  }
}
