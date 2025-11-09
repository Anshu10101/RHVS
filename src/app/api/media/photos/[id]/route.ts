import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { join } from 'path';
import { promises as fs } from 'fs';

interface PhotoBlobRow {
  file_blob: Buffer | null;
  file_type: string | null;
  file_size: number | null;
  original_name: string | null;
  file_path: string | null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const rows = await executeQuery(
    `SELECT file_blob, file_type, file_size, original_name, file_path 
     FROM photos 
     WHERE id = ? 
     LIMIT 1`,
    [id]
  ) as unknown as PhotoBlobRow[];

  const record = rows?.[0];

  if (!record) {
    return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
  }

  const directResponse = await serveDirectBlob(
    record.file_blob,
    record.file_type,
    record.file_size,
    record.original_name,
    id
  );
  if (directResponse) {
    return directResponse;
  }

  if (record.file_path) {
    const normalizedPath = record.file_path.startsWith('/')
      ? record.file_path.slice(1)
      : record.file_path;
    const absolutePath = join(process.cwd(), 'public', normalizedPath);

    try {
      const fileBuffer = await fs.readFile(absolutePath);
      const stat = await fs.stat(absolutePath);
      const contentType = record.file_type || 'application/octet-stream';
      const filename = record.original_name || `${id}.bin`;

      const payload = toBlob(fileBuffer);
      return new NextResponse(payload, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Length': stat.size.toString(),
          'Content-Disposition': `inline; filename="${encodeURIComponent(filename)}"`,
          'Cache-Control': 'public, max-age=86400'
        }
      });
    } catch {
      return NextResponse.json({ error: 'Photo asset missing' }, { status: 404 });
    }
  }

  return NextResponse.json({ error: 'Photo binary not available' }, { status: 404 });
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

  const contentType = mime || 'application/octet-stream';
  const filename = originalName || `${cacheKey}.bin`;
  const payload = toBlob(blob);

  const headers: Record<string, string> = {
    'Content-Type': contentType,
    'Content-Disposition': `inline; filename="${encodeURIComponent(filename)}"`,
    'Cache-Control': 'public, max-age=31536000, immutable'
  };
  if (size != null) {
    headers['Content-Length'] = size.toString();
  }

  return new NextResponse(payload, {
    status: 200,
    headers
  });
}

function toBlob(input: Buffer | Uint8Array): Blob {
  const view =
    input instanceof Buffer
      ? new Uint8Array(input.buffer, input.byteOffset, input.byteLength)
      : new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
  return new Blob([view]);
}

