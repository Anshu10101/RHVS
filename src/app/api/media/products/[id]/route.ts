import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { join } from 'path';
import { promises as fs } from 'fs';

interface ProductMediaRow {
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
     FROM products
     WHERE id = ?
     LIMIT 1`,
    [id]
  ) as ProductMediaRow[];

  const record = rows?.[0];

  if (!record) {
    return NextResponse.json({ error: 'Product image not found' }, { status: 404 });
  }

  const response = await serveDirectBlob(
    record.image_blob,
    record.image_mime,
    record.image_size,
    record.image_original_name,
    id
  );
  if (response) {
    return response;
  }

  const fallbackFromPath = await serveFromPath(record.image_path, {
    mime: record.image_mime,
    originalName: record.image_original_name,
    size: record.image_size
  });
  if (fallbackFromPath) {
    return fallbackFromPath;
  }

  const galleryRows = await executeQuery(
    `SELECT 
       image_blob,
       image_mime,
       image_size,
       image_original_name,
       image_url,
       id
     FROM product_images
     WHERE product_id = ?
     ORDER BY is_primary DESC, sort_order ASC
     LIMIT 1`,
    [id]
  ) as Array<{
    image_blob: Buffer | null;
    image_mime: string | null;
    image_size: number | null;
    image_original_name: string | null;
    image_url: string | null;
    id: string | number;
  }>;

  const primary = galleryRows?.[0];
  if (primary) {
    const primaryResponse = await serveDirectBlob(
      primary.image_blob,
      primary.image_mime,
      primary.image_size,
      primary.image_original_name,
      String(primary.id)
    );
    if (primaryResponse) {
      return primaryResponse;
    }
    const primaryPathResponse = await serveFromPath(primary.image_url, {
      mime: primary.image_mime,
      originalName: primary.image_original_name,
      size: primary.image_size
    });
    if (primaryPathResponse) {
      return primaryPathResponse;
    }
  }

  return NextResponse.json({ error: 'Product image asset missing' }, { status: 404 });
}

function buildHeaders(
  mime: string | null,
  size: number | null,
  name: string | null
): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': mime || 'application/octet-stream',
    'Content-Disposition': `inline; filename="${encodeURIComponent(name || 'asset.bin')}"`
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
  // Use shorter cache with revalidation to allow updates to be seen
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

  if (path.startsWith('/api/media/product-images/')) {
    const imageId = path.split('/').pop();
    if (!imageId) {
      return null;
    }
    const rows = await executeQuery(
      `SELECT image_blob, image_mime, image_size, image_original_name, image_url
       FROM product_images
       WHERE id = ?
       LIMIT 1`,
      [imageId]
    ) as Array<{
      image_blob: Buffer | null;
      image_mime: string | null;
      image_size: number | null;
      image_original_name: string | null;
      image_url: string | null;
    }>;
    const row = rows?.[0];
    if (row) {
      const direct = await serveDirectBlob(
        row.image_blob,
        row.image_mime || meta.mime,
        row.image_size ?? meta.size,
        row.image_original_name || meta.originalName,
        String(imageId)
      );
      if (direct) {
        return direct;
      }
      return serveFromPath(row.image_url, {
        mime: row.image_mime || meta.mime,
        originalName: row.image_original_name || meta.originalName,
        size: row.image_size ?? meta.size
      });
    }
    return null;
  }

  if (path.startsWith('/uploads/')) {
    const absolutePath = join(process.cwd(), 'public', path.replace(/^\//, ''));
    try {
      const buffer = await fs.readFile(absolutePath);
      const stat = await fs.stat(absolutePath);
      const headers = buildHeaders(meta.mime, stat.size, meta.originalName);
      headers['Cache-Control'] = 'public, max-age=86400';
      const payload = toBlob(buffer);
      return new NextResponse(payload, { status: 200, headers });
    } catch {
      return null;
    }
  }

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return NextResponse.redirect(path, { status: 302 });
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

