import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { join } from 'path';
import { promises as fs } from 'fs';

interface MemberSignatureRow {
  signature_blob: Buffer | null;
  signature_mime: string | null;
  signature_size: number | null;
  signature_original_name: string | null;
  signature_path: string | null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const rows = await executeQuery(
    `SELECT signature_blob, signature_mime, signature_size, signature_original_name, signature_path
     FROM members
     WHERE id = ?
     LIMIT 1`,
    [id]
  ) as MemberSignatureRow[];

  const record = rows?.[0];

  if (!record) {
    return NextResponse.json({ error: 'Member signature not found' }, { status: 404 });
  }

  const directResponse = await serveDirectBlob(
    record.signature_blob,
    record.signature_mime,
    record.signature_size,
    record.signature_original_name,
    id
  );
  if (directResponse) {
    return directResponse;
  }

  const fallback = await serveFromPath(record.signature_path, {
    mime: record.signature_mime,
    originalName: record.signature_original_name,
    size: record.signature_size
  });
  if (fallback) {
    return fallback;
  }

  return NextResponse.json({ error: 'Member signature asset missing' }, { status: 404 });
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
  headers['Cache-Control'] = 'private, max-age=86400';
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
      headers['Cache-Control'] = 'private, max-age=86400';
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

