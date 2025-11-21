import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { join } from 'path';
import { promises as fs } from 'fs';
import { ensureHttps } from '@/lib/secure-url';

interface NewsImageRow {
  image_blob: Buffer | null;
  image_mime: string | null;
  image_size: number | null;
  image_original_name: string | null;
  image_path: string | null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const rows = await executeQuery(
    `SELECT image_blob, image_mime, image_size, image_original_name, image_path
     FROM news
     WHERE id = ?
     LIMIT 1`,
    [id]
  ) as NewsImageRow[];

  const record = rows?.[0];

  if (!record) {
    return NextResponse.json({ error: 'News image not found' }, { status: 404 });
  }

  const directResponse = await serveDirectBlob(
    record.image_blob,
    record.image_mime,
    record.image_size,
    record.image_original_name,
    id
  );
  if (directResponse) {
    return directResponse;
  }

  const fallback = await serveFromPath(record.image_path, {
    mime: record.image_mime,
    originalName: record.image_original_name,
    size: record.image_size
  });
  if (fallback) {
    return fallback;
  }

  return NextResponse.json({ error: 'News image asset missing' }, { status: 404 });
}

function buildHeaders(
  mime: string | null,
  size: number | null,
  name: string | null
): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': mime || 'application/octet-stream',
    'Content-Disposition': `inline; filename="${encodeURIComponent(name || 'asset.bin')}"`,
    'Cache-Control': 'public, max-age=3600, must-revalidate'
  };
  if (size) {
    headers['Content-Length'] = size.toString();
  }
  return headers;
}

async function serveDirectBlob(
  blob: Buffer | Uint8Array | null,
  mime: string | null,
  size: number | null,
  name: string | null,
  cacheKey: string
): Promise<NextResponse | null> {
  if (!blob || blob.length === 0) {
    return null;
  }
  const headers = buildHeaders(mime, size, name || `${cacheKey}.bin`);
  // Use must-revalidate instead of immutable to allow cache invalidation when image is updated
  headers['Cache-Control'] = 'public, max-age=3600, must-revalidate';
  const payload = toBlob(blob);
  return new NextResponse(payload, { status: 200, headers });
}

async function serveFromPath(
  path: string | null | undefined,
  meta: { mime: string | null; originalName: string | null; size: number | null }
): Promise<NextResponse | null> {
  if (!path) {
    return null;
  }

  if (path.startsWith('/uploads/')) {
    const absolutePath = join(process.cwd(), 'public', path.replace(/^\//, ''));
    try {
      const buffer = await fs.readFile(absolutePath);
      const stat = await fs.stat(absolutePath);
      const headers = buildHeaders(meta.mime, stat.size, meta.originalName);
      headers['Cache-Control'] = 'public, max-age=3600, must-revalidate';
      const payload = toBlob(buffer);
      return new NextResponse(payload, { status: 200, headers });
    } catch {
      return null;
    }
  }

  if (path.startsWith('http://') || path.startsWith('https://')) {
    // Convert HTTP to HTTPS to prevent mixed content warnings
    const secureUrl = ensureHttps(path);
    if (secureUrl) {
      return NextResponse.redirect(secureUrl, { status: 302 });
    }
  }

  return null;
}

function toBlob(input: Buffer | Uint8Array): Blob {
  const view =
    input instanceof Buffer
      ? new Uint8Array(input.buffer, input.byteOffset, input.byteLength)
      : new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
  return new Blob([view]);
}

