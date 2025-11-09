import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { join } from 'path';
import { promises as fs } from 'fs';

interface TokenSignatureRow {
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
     FROM registration_tokens
     WHERE id = ?
     LIMIT 1`,
    [id]
  ) as TokenSignatureRow[];

  const record = rows?.[0];

  if (!record) {
    return NextResponse.json({ error: 'Registration token signature not found' }, { status: 404 });
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

  if (record.signature_path) {
    if (record.signature_path.startsWith('/uploads/')) {
      const absolutePath = join(process.cwd(), 'public', record.signature_path.replace(/^\//, ''));
      try {
        const buffer = await fs.readFile(absolutePath);
        const stat = await fs.stat(absolutePath);
        const headers: Record<string, string> = {
          'Content-Type': record.signature_mime || 'application/octet-stream',
          'Content-Disposition': `inline; filename="${encodeURIComponent(record.signature_original_name || `${id}.bin`)}"`,
          'Cache-Control': 'private, max-age=86400',
          'Content-Length': stat.size.toString()
        };
        const payload = toBlob(buffer);
        return new NextResponse(payload, { status: 200, headers });
      } catch {
        // fall through
      }
    }

    if (record.signature_path.startsWith('http://') || record.signature_path.startsWith('https://')) {
      return NextResponse.redirect(record.signature_path, { status: 302 });
    }
  }

  return NextResponse.json({ error: 'Registration token signature asset missing' }, { status: 404 });
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

