import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';
import { getAdminScope, ensurePermission } from '@/lib/admin-scope';
import { consumeStagedBlob } from '@/lib/blob-storage';
import { noCacheJsonResponse } from '@/lib/api-helpers';

// Force dynamic rendering to prevent Next.js caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET - Fetch events
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const type = searchParams.get('type');
    const upcoming = searchParams.get('upcoming');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');
    const district = searchParams.get('district');
    const state = searchParams.get('state');

    // Check if this is an admin panel request (via query param or referer)
    const isAdminRequest = searchParams.get('admin') === 'true' || 
                          request.headers.get('referer')?.includes('/admin/') ||
                          request.headers.get('x-admin-context') === 'true';

    let query = `
      SELECT e.*, 
             CASE 
               WHEN e.image_blob IS NOT NULL THEN CONCAT('/api/media/events/', e.id, '?v=', UNIX_TIMESTAMP(e.updated_at))
               ELSE e.image_path
             END AS resolved_image_path,
             COALESCE(e.district, 'All Districts') as district,
             COALESCE(e.state, 'All States') as state,
             COALESCE(
               CASE 
                 WHEN sa.profile_photo_blob IS NOT NULL THEN CONCAT('/api/media/superadmin/', sa.id, '/profile')
                 ELSE NULL
               END,
               CASE 
                 WHEN m2.profile_photo_blob IS NOT NULL THEN CONCAT('/api/media/members/', m2.id, '/profile')
                 ELSE m2.profile_photo_path
               END,
               CASE 
                 WHEN m.profile_photo_blob IS NOT NULL THEN CONCAT('/api/media/members/', m.id, '/profile')
                 ELSE m.profile_photo_path
               END
             ) as creator_photo,
             COALESCE(sa.name, sa.email, m2.name, m.name, 'Admin') as creator_name,
             COALESCE(sa.email, m2.email, m.email) as creator_email
      FROM events e
      LEFT JOIN superadmin sa ON (e.created_by = sa.id OR e.created_by = CAST(sa.id AS CHAR)) AND e.owner_admin_id IS NULL
      LEFT JOIN district_admins da ON e.owner_admin_id = da.id
      LEFT JOIN members m2 ON da.member_id = m2.id
      LEFT JOIN members m ON e.created_by = m.email AND e.owner_admin_id IS NOT NULL
      WHERE e.isVisible = TRUE 
    `;
    const params: (string | number)[] = [];
    
    // Filter by district/state for public website or admin panel
    if (district && state) {
      // Public website filtering by district/state
      query += ` AND (e.district = ? OR e.district LIKE ?) AND e.state = ?`;
      params.push(district, `${district}%`, state);
    } else if (isAdminRequest) {
      // Admin panel: apply admin scoping
      const scope = await getAdminScope(request);
      // For district admins in admin panel, show ALL events for their district/state
      // This ensures continuity - new admins can see content created by previous admins
      if (!scope.isSuperAdmin && scope.isDistrictAdmin && scope.districtName && scope.stateName) {
        // Use LIKE to handle district names that might include comma-separated values
        query += ` AND (e.district = ? OR e.district LIKE ?) AND e.state = ?`;
        params.push(scope.districtName, `${scope.districtName}%`, scope.stateName);
      }
    }

    if (id) {
      query += ` AND e.id = ?`;
      params.push(id);
    }

    if (type && type !== 'all') {
      query += ` AND event_type = ?`;
      params.push(type);
    }

    if (upcoming === 'true') {
      query += ` AND event_date >= CURDATE()`;
    }

    // Get total count before pagination
    // Build count query with same WHERE conditions
    let countQuery = `SELECT COUNT(*) as total FROM events e WHERE e.isVisible = TRUE`;
    const countParams: (string | number)[] = [];
    
    // Apply same filters for count
    if (district && state) {
      countQuery += ` AND (e.district = ? OR e.district LIKE ?) AND e.state = ?`;
      countParams.push(district, `${district}%`, state);
    } else if (isAdminRequest) {
      const scope = await getAdminScope(request);
      if (!scope.isSuperAdmin && scope.isDistrictAdmin && scope.districtName && scope.stateName) {
        // Use LIKE to handle district names that might include comma-separated values
        countQuery += ` AND (e.district = ? OR e.district LIKE ?) AND e.state = ?`;
        countParams.push(scope.districtName, `${scope.districtName}%`, scope.stateName);
      }
    }
    
    if (id) {
      countQuery += ` AND e.id = ?`;
      countParams.push(id);
    }
    
    if (type && type !== 'all') {
      countQuery += ` AND event_type = ?`;
      countParams.push(type);
    }
    
    if (upcoming === 'true') {
      countQuery += ` AND event_date >= CURDATE()`;
    }
    
    const [countRows] = await pool.execute(countQuery, countParams);
    const total = Array.isArray(countRows) && countRows.length > 0 ? (countRows[0] as { total: number }).total : 0;

    query += ` ORDER BY event_date ASC, \`order\` ASC`;

    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = limit ? parseInt(limit) : 12; // Default 12 items per page
    const pageOffset = offset ? parseInt(offset) : (page - 1) * pageSize;
    const totalPages = Math.ceil(total / pageSize);

    if (limit || page) {
      query += ` LIMIT ?`;
      params.push(pageSize);
      
        query += ` OFFSET ?`;
      params.push(pageOffset);
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
    
    return noCacheJsonResponse({ 
      success: true, 
      data,
      total,
      page: page || 1,
      pageSize,
      totalPages,
      hasMore: page < totalPages
    });
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
    // Check permissions - superadmin and news editors have full access
    // Only check permissions for district admins
    if (!scope.isSuperAdmin && !scope.isNewsEditor && !ensurePermission(scope, ['edit_news_events', 'manage_news_events'])) {
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
      created_by,
      district: districtInput,
      state: stateInput
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

    // Debug logging
    console.log('Event POST - Scope:', {
      isSuperAdmin: scope.isSuperAdmin,
      isNewsEditor: scope.isNewsEditor,
      isDistrictAdmin: scope.isDistrictAdmin,
      districtInput,
      stateInput
    });

    // Superadmin and news editors can specify district/state (if provided)
    if (scope.isSuperAdmin || scope.isNewsEditor) {
      if (districtInput && stateInput && String(districtInput).trim() && String(stateInput).trim()) {
      // Validate and get actual names from database
      const [stateRows] = await pool.execute(
        'SELECT state_name_english FROM states WHERE id = ? OR state_name_english = ? LIMIT 1',
        [stateInput, stateInput]
      ) as any[];
      
      if (stateRows && stateRows.length > 0) {
        state = stateRows[0].state_name_english;
        
        const [districtRows] = await pool.execute(
          'SELECT district_name_english FROM districts WHERE district_code = ? OR district_name_english = ? LIMIT 1',
          [districtInput, districtInput]
        ) as any[];
        
        if (districtRows && districtRows.length > 0) {
          district = districtRows[0].district_name_english;
        }
      }
        console.log('Event POST - Resolved district/state:', { district, state });
      } else {
        console.log('Event POST - District/state not provided or empty, keeping as null (global events)');
      }
      // If district/state not provided, they remain null (global events)
    } else if (scope.isDistrictAdmin && scope.adminId) {
      // District admins automatically get their district/state attached
      district = scope.districtName || null;
      state = scope.stateName || null;
      owner_admin_id = scope.adminId?.toString() || null;
      console.log('Event POST - District admin auto-assigned:', { district, state });
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
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
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
    const scope = await getAdminScope(request);
    
    // Check permissions for district admins
    if (!scope.isSuperAdmin && !ensurePermission(scope, ['edit_news_events', 'manage_news_events'])) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

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

    // For district admins, ensure the event belongs to their district/state
    // Allow editing any event in their district, not just ones they created
    // News editors can edit any event (like superadmin)
    if (!scope.isSuperAdmin && !scope.isNewsEditor && scope.isDistrictAdmin && scope.districtName && scope.stateName) {
      const [ownershipRows] = await pool.execute(
        `SELECT id FROM events WHERE id = ? AND district = ? AND state = ? LIMIT 1`,
        [id, scope.districtName, scope.stateName]
      ) as any[];
      
      if (!Array.isArray(ownershipRows) || ownershipRows.length === 0) {
        return NextResponse.json({ 
          success: false, 
          error: 'You can only edit events that you created' 
        }, { status: 403 });
      }
    }

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
    const scope = await getAdminScope(request);
    
    // Check permissions for district admins
    if (!scope.isSuperAdmin && !ensurePermission(scope, ['edit_news_events', 'manage_news_events'])) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Event ID is required' },
        { status: 400 }
      );
    }

    // For district admins, ensure the event belongs to their district/state
    // Allow editing any event in their district, not just ones they created
    // News editors can delete any event (like superadmin)
    if (!scope.isSuperAdmin && !scope.isNewsEditor && scope.isDistrictAdmin && scope.districtName && scope.stateName) {
      const [ownershipRows] = await pool.execute(
        `SELECT id FROM events WHERE id = ? AND district = ? AND state = ? LIMIT 1`,
        [id, scope.districtName, scope.stateName]
      ) as any[];
      
      if (!Array.isArray(ownershipRows) || ownershipRows.length === 0) {
        return NextResponse.json({ 
          success: false, 
          error: 'You can only delete events that you created' 
        }, { status: 403 });
      }
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