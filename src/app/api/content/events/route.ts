import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';
import { getAdminScope, ensurePermission } from '@/lib/admin-scope';
import { consumeStagedBlob } from '@/lib/blob-storage';

// GET - Fetch events
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const type = searchParams.get('type');
    const upcoming = searchParams.get('upcoming');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    let query = `
      SELECT e.*,
             CASE 
               WHEN e.image_blob IS NOT NULL THEN CONCAT('/api/media/events/', e.id)
               ELSE e.image_path
             END AS resolved_image_path,
             COALESCE(e.district, 'All Districts') as district,
             COALESCE(e.state, 'All States') as state
      FROM events e
      WHERE isVisible = TRUE 
    `;
    const params: (string | number)[] = [];

    if (id) {
      query += ` AND id = ?`;
      params.push(id);
    }

    if (type && type !== 'all') {
      query += ` AND event_type = ?`;
      params.push(type);
    }

    if (upcoming === 'true') {
      query += ` AND event_date >= CURDATE()`;
    }

    query += ` ORDER BY event_date ASC, \`order\` ASC`;

    if (limit) {
      query += ` LIMIT ?`;
      params.push(parseInt(limit));
      
      if (offset) {
        query += ` OFFSET ?`;
        params.push(parseInt(offset));
      }
    }

    const [rows] = await pool.execute(query, params);
    const data = Array.isArray(rows)
      ? (rows as any[]).map((row: any) => {
          const { resolved_image_path, ...rest } = row;
          return {
            ...rest,
            image_path: resolved_image_path ?? rest.image_path ?? null
          };
        })
      : [];
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

// POST - Add new event
export async function POST(request: NextRequest) {
  try {
    const scope = await getAdminScope(request);
    if (!scope.isSuperAdmin && !ensurePermission(scope, ['edit_news_events', 'manage_news_events'])) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      title_hindi,
      description,
      event_date,
      event_time,
      end_date,
      end_time,
      location,
      address,
      image_path: imageInput,
      registration_required,
      registration_url,
      max_participants,
      event_type,
      order,
      created_by
    } = body;

    const id = `event_${Date.now()}`;
    
    // Convert undefined values to null for MySQL
    const safeValue = (val: unknown) => val === undefined ? null : val;

    let imageAsset: ResolvedAsset;
    try {
      imageAsset = await resolveAssetFromInput(imageInput, 'Event image');
    } catch (assetError) {
      return NextResponse.json(
        { success: false, error: (assetError as Error).message },
        { status: 400 }
      );
    }
    
    // Determine content ownership
    let district = null as string | null;
    let state = null as string | null;
    let owner_admin_id = null as string | null;

    if (!scope.isSuperAdmin && scope.isDistrictAdmin && scope.adminId) {
      district = scope.districtName || null;
      state = scope.stateName || null;
      owner_admin_id = scope.adminId?.toString() || null;
    }

    await pool.execute(
      `INSERT INTO events 
       (id, title, title_hindi, description, event_date, event_time, end_date, end_time,
        location, address, image_path, image_blob, image_mime, image_hash, image_size, image_original_name,
        registration_required, registration_url,
        max_participants, event_type, \`order\`, isVisible, district, state, owner_admin_id, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        safeValue(title),
        safeValue(title_hindi),
        safeValue(description),
        safeValue(event_date),
        safeValue(event_time),
        safeValue(end_date),
        safeValue(end_time),
        safeValue(location),
        safeValue(address),
        imageAsset.url,
        imageAsset.blob,
        imageAsset.mime,
        imageAsset.hash,
        imageAsset.size,
        imageAsset.originalName,
        safeValue(registration_required),
        safeValue(registration_url),
        safeValue(max_participants),
        safeValue(event_type),
        safeValue(order),
        true,
        safeValue(district),
        safeValue(state),
        safeValue(owner_admin_id),
        safeValue(created_by)
      ]
    );

    if (imageAsset.blob) {
      await pool.execute(
        'UPDATE events SET image_path = ? WHERE id = ?',
        [`/api/media/events/${id}`, id]
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Event added successfully',
      data: { id }
    });
  } catch (error) {
    console.error('Error adding event:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add event' },
      { status: 500 }
    );
  }
}

// PUT - Update event
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      title,
      title_hindi,
      description,
      event_date,
      event_time,
      end_date,
      end_time,
      location,
      address,
      image_path: imageInput,
      registration_required,
      registration_url,
      max_participants,
      event_type,
      order,
      isVisible
    } = body;

    // Convert undefined values to null for MySQL
    const safeValue = (val: unknown) => val === undefined ? null : val;

    const updateFields: string[] = [
      'title = ?',
      'title_hindi = ?',
      'description = ?',
      'event_date = ?',
      'event_time = ?',
      'end_date = ?',
      'end_time = ?',
      'location = ?',
      'address = ?',
      'registration_required = ?',
      'registration_url = ?',
      'max_participants = ?',
      'event_type = ?',
      '`order` = ?',
      'isVisible = ?'
    ];
    const updateParams: unknown[] = [
      safeValue(title),
      safeValue(title_hindi),
      safeValue(description),
      safeValue(event_date),
      safeValue(event_time),
      safeValue(end_date),
      safeValue(end_time),
      safeValue(location),
      safeValue(address),
      safeValue(registration_required),
      safeValue(registration_url),
      safeValue(max_participants),
      safeValue(event_type),
      safeValue(order),
      safeValue(isVisible)
    ];

    if (imageInput !== undefined) {
      let imageAsset: ResolvedAsset;
      try {
        imageAsset = await resolveAssetFromInput(imageInput, 'Event image');
      } catch (assetError) {
        return NextResponse.json(
          { success: false, error: (assetError as Error).message },
          { status: 400 }
        );
      }

      if (imageAsset.blob) {
        updateFields.push('image_blob = ?');
        updateParams.push(imageAsset.blob);
        updateFields.push('image_mime = ?');
        updateParams.push(imageAsset.mime);
        updateFields.push('image_hash = ?');
        updateParams.push(imageAsset.hash);
        updateFields.push('image_size = ?');
        updateParams.push(imageAsset.size);
        updateFields.push('image_original_name = ?');
        updateParams.push(imageAsset.originalName);
        updateFields.push('image_path = ?');
        updateParams.push(`/api/media/events/${id}`);
      } else {
        updateFields.push('image_path = ?');
        updateParams.push(imageAsset.url || null);
        if (!imageAsset.url) {
          updateFields.push('image_blob = NULL');
          updateFields.push('image_mime = NULL');
          updateFields.push('image_hash = NULL');
          updateFields.push('image_size = NULL');
          updateFields.push('image_original_name = NULL');
        }
      }
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateParams.push(safeValue(id));

    const updateSql = `UPDATE events SET ${updateFields.join(', ')} WHERE id = ?`;
    await pool.execute(updateSql, updateParams);

    return NextResponse.json({ 
      success: true, 
      message: 'Event updated successfully'
    });
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update event' },
      { status: 500 }
    );
  }
}

// DELETE - Delete event
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Event ID is required' },
        { status: 400 }
      );
    }

    await pool.execute('DELETE FROM events WHERE id = ?', [id]);

    return NextResponse.json({ 
      success: true, 
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete event' },
      { status: 500 }
    );
  }
}

type ResolvedAsset = {
  url: string | null;
  blob: Buffer | null;
  mime: string | null;
  hash: string | null;
  size: number | null;
  originalName: string | null;
};

async function resolveAssetFromInput(value: unknown, label: string): Promise<ResolvedAsset> {
  if (typeof value !== 'string' || value.trim() === '') {
    return {
      url: null,
      blob: null,
      mime: null,
      hash: null,
      size: null,
      originalName: null
    };
  }

  if (value.startsWith('/api/media/staged/')) {
    const assetId = value.split('/').pop();
    if (!assetId) {
      throw new Error(`${label}: invalid staged asset reference`);
    }
    const asset = await consumeStagedBlob(assetId);
    if (!asset) {
      throw new Error(`${label}: staged upload expired. Please re-upload.`);
    }
    return {
      url: null,
      blob: asset.data,
      mime: asset.mimeType || null,
      hash: asset.hash || null,
      size: asset.size ?? null,
      originalName: asset.originalName || null
    };
  }

  return {
    url: value,
    blob: null,
    mime: null,
    hash: null,
    size: null,
    originalName: null
  };
}