import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { join } from 'path';
import { promises as fs } from 'fs';

interface SuperadminProfileRow {
  profile_photo_blob: Buffer | null;
  profile_photo_path: string | null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const rows = await executeQuery(
    `SELECT profile_photo_blob, profile_photo_path
     FROM superadmin
     WHERE id = ?
     LIMIT 1`,
    [id]
  ) as SuperadminProfileRow[];

  const record = rows?.[0];

  if (!record) {
    return NextResponse.json({ error: 'Superadmin profile photo not found' }, { status: 404 });
  }

  // Try to serve from blob first
  // Check if blob exists and has data
  const hasBlob = record.profile_photo_blob && (
    (Buffer.isBuffer(record.profile_photo_blob) && record.profile_photo_blob.length > 0) ||
    (typeof record.profile_photo_blob === 'object' && 'length' in record.profile_photo_blob && (record.profile_photo_blob as any).length > 0)
  );

  if (hasBlob && record.profile_photo_blob) {
    const headers: Record<string, string> = {
      'Content-Type': 'image/jpeg', // Default to JPEG, can be improved with MIME detection
      'Content-Disposition': `inline; filename="superadmin-${id}-profile.jpg"`,
      'Cache-Control': 'private, max-age=86400'
    };
    const payload = toBlob(record.profile_photo_blob);
    return new NextResponse(payload, { status: 200, headers });
  }

  // Fallback to path
  if (record.profile_photo_path) {
    if (record.profile_photo_path.startsWith('/uploads/')) {
      const absolutePath = join(process.cwd(), 'public', record.profile_photo_path.replace(/^\//, ''));
      try {
        const buffer = await fs.readFile(absolutePath);
        const stat = await fs.stat(absolutePath);
        const headers: Record<string, string> = {
          'Content-Type': 'image/jpeg', // Default, can be improved with file extension detection
          'Content-Disposition': `inline; filename="superadmin-${id}-profile.jpg"`,
          'Content-Length': stat.size.toString(),
          'Cache-Control': 'private, max-age=86400'
        };
        const payload = toBlob(buffer);
        return new NextResponse(payload, { status: 200, headers });
      } catch {
        return NextResponse.json({ error: 'Profile photo file not found' }, { status: 404 });
      }
    }

    if (record.profile_photo_path.startsWith('http://') || record.profile_photo_path.startsWith('https://')) {
      return NextResponse.redirect(record.profile_photo_path, { status: 302 });
    }
  }

  return NextResponse.json({ error: 'Superadmin profile asset missing' }, { status: 404 });
}

function toBlob(input: Buffer | Uint8Array): Blob {
  const view =
    input instanceof Buffer
      ? new Uint8Array(input.buffer, input.byteOffset, input.byteLength)
      : new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
  return new Blob([view]);
}

