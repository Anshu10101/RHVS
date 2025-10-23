import { NextRequest, NextResponse } from 'next/server';
import { downloadIDCard } from '@/lib/id-card-generator';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    
    // Validate filename to prevent directory traversal
    if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }
    
    const idCardPath = `/id-cards/${filename}`;
    const idCardBuffer = await downloadIDCard(idCardPath);
    
    return new NextResponse(new Uint8Array(idCardBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      },
    });
  } catch (error) {
    console.error('Error downloading ID card:', error);
    return NextResponse.json({ error: 'ID card not found' }, { status: 404 });
  }
}
