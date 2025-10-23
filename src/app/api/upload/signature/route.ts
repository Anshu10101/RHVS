import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { mkdir } from 'fs/promises';

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

    // Create unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `signature_${timestamp}_${uuidv4().substring(0, 8)}.${fileExtension}`;

    // Create directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'signatures');
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      console.error('Error creating directory:', error);
    }

    // Write file to disk
    const filePath = join(uploadDir, fileName);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    await writeFile(filePath, buffer);

    // Return the relative path to be stored in the database
    const relativePath = `/uploads/signatures/${fileName}`;
    
    return NextResponse.json({
      success: true,
      url: relativePath,
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
