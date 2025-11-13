import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const signatureId = parseInt(id);

    if (isNaN(signatureId)) {
      return NextResponse.json({ error: 'Invalid signature ID' }, { status: 400 });
    }

    const rows = await executeQuery(
      `SELECT signature_blob, signature_mime, signature_size, signature_original_name, signature_path
       FROM certificate_signatures 
       WHERE id = ? AND is_active = TRUE
       LIMIT 1`,
      [signatureId]
    ) as Array<{
      signature_blob: Buffer | null;
      signature_mime: string | null;
      signature_size: number | null;
      signature_original_name: string | null;
      signature_path: string | null;
    }>;

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Signature not found' }, { status: 404 });
    }

    const record = rows[0];

    // If blob exists, serve it
    if (record.signature_blob && record.signature_blob.length > 0) {
      const mimeType = record.signature_mime || 'image/png';
      
      return new NextResponse(record.signature_blob as unknown as BodyInit, {
        headers: {
          'Content-Type': mimeType,
          'Content-Length': record.signature_size?.toString() || record.signature_blob.length.toString(),
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
    }

    // Fallback to path if blob doesn't exist
    if (record.signature_path) {
      // If it's already an API path, redirect
      if (record.signature_path.startsWith('/api/')) {
        return NextResponse.redirect(new URL(record.signature_path, request.url), { status: 302 });
      }

      // Otherwise, try to serve from file system
      const { join } = await import('path');
      const { readFileSync, existsSync } = await import('fs');
      
      const normalizedPath = record.signature_path.startsWith('/') 
        ? record.signature_path.slice(1) 
        : record.signature_path;
      const absolutePath = join(process.cwd(), 'public', normalizedPath);
      
      if (existsSync(absolutePath)) {
        const fileBuffer = readFileSync(absolutePath);
        const mimeType = record.signature_mime || 'image/png';
        
        return new NextResponse(fileBuffer as unknown as BodyInit, {
          headers: {
            'Content-Type': mimeType,
            'Content-Length': fileBuffer.length.toString(),
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
        });
      }
    }

    return NextResponse.json({ error: 'Signature file not found' }, { status: 404 });

  } catch (error) {
    console.error('Error serving certificate signature:', error);
    return NextResponse.json({ error: 'Failed to serve signature' }, { status: 500 });
  }
}

