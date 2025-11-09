import { NextRequest, NextResponse } from 'next/server';
import { getStagedBlob } from '@/lib/blob-storage';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const asset = await getStagedBlob(id);

  if (!asset) {
    return NextResponse.json({ error: 'Staged asset not found' }, { status: 404 });
  }

  const payload = toBlob(asset.data);

  const headers = new Headers({
    'Content-Type': asset.mimeType || 'application/octet-stream',
    'Content-Disposition': `inline; filename="${encodeURIComponent(asset.originalName || id)}"`,
    'Cache-Control': 'private, max-age=300'
  });
  if (asset.size != null) {
    headers.set('Content-Length', asset.size.toString());
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

