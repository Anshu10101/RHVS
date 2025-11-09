import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { join } from 'path';
import { promises as fs } from 'fs';

interface TokenProfileRow {
  profile_photo_blob: Buffer | null;
  profile_photo_mime: string | null;
  profile_photo_size: number | null;
  profile_photo_original_name: string | null;
  profile_photo_path: string | null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const rows = await executeQuery(
    `SELECT profile_photo_blob, profile_photo_mime, profile_photo_size, profile_photo_original_name, profile_photo_path
     FROM registration_tokens
     WHERE id = ?
     LIMIT 1`,
    [id]
  ) as TokenProfileRow[];

  const record = rows?.[0];

  if (!record) {
    return NextResponse.json({ error: 'Registration token profile photo not found' }, { status: 404 });
  }

  const directResponse = await serveDirectBlob(
    record.profile_photo_blob,
    record.profile_photo_mime,
    record.profile_photo_size,
    record.profile_photo_original_name,
    id
  );
  if (directResponse) {
    return directResponse;
  }

  if (record.profile_photo_path) {
    if (record.profile_photo_path.startsWith('/uploads/')) {
      const absolutePath = join(process.cwd(), 'public', record.profile_photo_path.replace(/^\//, ''));
      try {
        const buffer = await fs.readFile(absolutePath);
        const stat = await fs.stat(absolutePath);
        const headers: Record<string, string> = {
          'Content-Type': record.profile_photo_mime || 'application/octet-stream',
          'Content-Disposition': `inline; filename="${encodeURIComponent(record.profile_photo_original_name || `${id}.bin`)}"`,
          'Cache-Control': 'private, max-age=86400',
          'Content-Length': stat.size.toString()
        };
        const payload = toBlob(buffer);
        return new NextResponse(payload, { status: 200, headers });
      } catch {
        // fall through
      }
    }

    if (record.profile_photo_path.startsWith('http://') || record.profile_photo_path.startsWith('https://')) {
      return NextResponse.redirect(record.profile_photo_path, { status: 302 });
    }
  }

  return NextResponse.json({ error: 'Registration token profile asset missing' }, { status: 404 });
}

async function serveDirectBlob(
  blob: Buffer | Uint8Array | null,
  mime: string | null,
  size: number | null,
  originalName: string | null,
  cacheKey: string
): Promise<NextResponse | null> {
  if (!blob || blob.length === 0) {
    return null;
  }

  const payload = toBlob(blob);
  const headers: Record<string, string> = {
    'Content-Type': mime || 'application/octet-stream',
    'Content-Disposition': `inline; filename="${encodeURIComponent(originalName || `${cacheKey}.bin`)}"`,
    'Cache-Control': 'private, max-age=86400'
  };
  if (size != null) {
    headers['Content-Length'] = size.toString();
  }
  return new NextResponse(payload, { status: 200, headers });
}

function toBlob(input: Buffer | Uint8Array): Blob {
  const view =
    input instanceof Buffer
      ? new Uint8Array(input.buffer, input.byteOffset, input.byteLength)
      : new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
  return new Blob([view]);
}

