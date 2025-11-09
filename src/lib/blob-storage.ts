import crypto from 'crypto';
import type { RowDataPacket } from 'mysql2';
import pool from './database';

export interface StagedBlobAsset {
  id: string;
  category: string;
  originalName: string | null;
  mimeType: string | null;
  size: number | null;
  hash: string | null;
  data: Buffer;
  createdAt: Date;
  expiresAt: Date | null;
}

export interface CreateStagedBlobInput {
  category: string;
  buffer: Buffer;
  originalName?: string;
  mimeType?: string;
  size?: number;
  hash?: string;
  ttlSeconds?: number;
}

export async function createStagedBlob(input: CreateStagedBlobInput): Promise<string> {
  const id = `blob_${crypto.randomUUID()}`;
  const expiresAt = input.ttlSeconds
    ? new Date(Date.now() + input.ttlSeconds * 1000)
    : null;

  await pool.execute(
    `INSERT INTO staged_uploads (
      id,
      category,
      original_name,
      mime_type,
      size,
      hash,
      data,
      created_at,
      expires_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?)`
  ,
    [
      id,
      input.category,
      input.originalName || null,
      input.mimeType || null,
      input.size ?? null,
      input.hash || null,
      input.buffer,
      expiresAt ? expiresAt.toISOString().slice(0, 19).replace('T', ' ') : null
    ]
  );

  return id;
}

type StagedUploadRow = {
  id: string;
  category: string;
  original_name: string | null;
  mime_type: string | null;
  size: number | null;
  hash: string | null;
  data: Buffer;
  created_at: Date | string;
  expires_at: Date | string | null;
};

export async function getStagedBlob(id: string): Promise<StagedBlobAsset | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, category, original_name, mime_type, size, hash, data, created_at, expires_at
     FROM staged_uploads
     WHERE id = ?
     LIMIT 1`,
    [id]
  );

  const record = Array.isArray(rows) ? rows[0] : undefined;
  if (!record) {
    return null;
  }

  return {
    id: record.id,
    category: record.category,
    originalName: record.original_name,
    mimeType: record.mime_type,
    size: record.size,
    hash: record.hash,
    data: record.data,
    createdAt: new Date(record.created_at),
    expiresAt: record.expires_at ? new Date(record.expires_at) : null
  };
}

export async function consumeStagedBlob(id: string): Promise<StagedBlobAsset | null> {
  const asset = await getStagedBlob(id);
  if (!asset) {
    return null;
  }
  await pool.execute('DELETE FROM staged_uploads WHERE id = ?', [id]);
  return asset;
}

export async function deleteStagedBlob(id: string): Promise<void> {
  await pool.execute('DELETE FROM staged_uploads WHERE id = ?', [id]);
}


