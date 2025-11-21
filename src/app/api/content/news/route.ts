import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';
import { getAdminScope, ensurePermission } from '@/lib/admin-scope';
import { consumeStagedBlob } from '@/lib/blob-storage';

// GET - Fetch news
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const priority = searchParams.get('priority');
    const featured = searchParams.get('featured');
    const published = searchParams.get('published');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    // Check if this is an admin panel request (via query param or referer)
    const isAdminRequest = searchParams.get('admin') === 'true' || 
                          request.headers.get('referer')?.includes('/admin/') ||
                          request.headers.get('x-admin-context') === 'true';

    let query = `
      SELECT DISTINCT n.*, 
             CASE 
               WHEN n.image_blob IS NOT NULL THEN CONCAT('/api/media/news/', n.id)
               ELSE n.image_path
             END AS resolved_image_path,
             COALESCE(n.district, 'All Districts') as district,
             COALESCE(n.state, 'All States') as state
      FROM news n
      WHERE 1=1
    `;
    const params: (string | number)[] = [];
    
    // Only apply admin scoping if this is an admin panel request
    // Public website should always show all published news
    if (isAdminRequest) {
      const scope = await getAdminScope(request);
      // For district admins in admin panel, show ALL news for their district/state
      // This ensures continuity - new admins can see content created by previous admins
      if (!scope.isSuperAdmin && scope.isDistrictAdmin && scope.districtName && scope.stateName) {
        // Use LIKE to handle district names that might include comma-separated values
        // e.g., "District Name, State" should match "District Name"
        query += ` AND (n.district = ? OR n.district LIKE ?) AND n.state = ?`;
        params.push(scope.districtName, `${scope.districtName}%`, scope.stateName);
      }
    }

    const id = searchParams.get('id');
    if (id) {
      query += ` AND n.id = ?`;
      params.push(id);
    } else if (type && type !== 'all') {
      query += ` AND news_type = ?`;
      params.push(type);
    }

    if (priority && priority !== 'all') {
      query += ` AND priority = ?`;
      params.push(priority);
    }

    if (featured === 'true') {
      query += ` AND is_featured = TRUE`;
    }

    if (published !== 'false') {
      query += ` AND is_published = TRUE`;
    }

    // Get total count before pagination
    // Build count query with same WHERE conditions
    let countQuery = `SELECT COUNT(DISTINCT n.id) as total FROM news n WHERE 1=1`;
    const countParams: (string | number)[] = [];
    
    // Apply same filters for count
    if (isAdminRequest) {
      const scope = await getAdminScope(request);
      if (!scope.isSuperAdmin && scope.isDistrictAdmin && scope.districtName && scope.stateName) {
        // Use LIKE to handle district names that might include comma-separated values
        countQuery += ` AND (n.district = ? OR n.district LIKE ?) AND n.state = ?`;
        countParams.push(scope.districtName, `${scope.districtName}%`, scope.stateName);
      }
    }
    
    if (id) {
      countQuery += ` AND n.id = ?`;
      countParams.push(id);
    } else if (type && type !== 'all') {
      countQuery += ` AND news_type = ?`;
      countParams.push(type);
    }
    
    if (priority && priority !== 'all') {
      countQuery += ` AND priority = ?`;
      countParams.push(priority);
    }
    
    if (featured === 'true') {
      countQuery += ` AND is_featured = TRUE`;
    }
    
    if (published !== 'false') {
      countQuery += ` AND is_published = TRUE`;
    }
    
    const [countRows] = await pool.execute(countQuery, countParams);
    const total = Array.isArray(countRows) && countRows.length > 0 ? (countRows[0] as { total: number }).total : 0;

    query += ` ORDER BY published_at DESC, \`order\` ASC`;

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
    
    return NextResponse.json({ 
      success: true, 
      data,
      total,
      page: page || 1,
      pageSize,
      totalPages,
      hasMore: page < totalPages
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch news' },
      { status: 500 }
    );
  }
}

// POST - Add new news
export async function POST(request: NextRequest) {
  try {
    const scope = await getAdminScope(request);
    
    // Check permissions for district admins
    if (!scope.isSuperAdmin && !ensurePermission(scope, ['edit_news_events', 'manage_news_events'])) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      title,
      title_hindi,
      content,
      excerpt,
      image_path: imageInput,
      news_type,
      priority,
      is_featured,
      is_published,
      order,
      created_by
    } = body;

    const id = `news_${Date.now()}`;
    
    // Convert undefined values to null for MySQL
    const safeValue = (val: unknown) => val === undefined ? null : val;

    let imageAsset: ResolvedAsset;
    try {
      imageAsset = await resolveAssetFromInput(imageInput, 'News image');
    } catch (assetError) {
      return NextResponse.json(
        { success: false, error: (assetError as Error).message },
        { status: 400 }
      );
    }
    
    // Get district and state information based on admin scope
    let district = null;
    let state = null;
    let owner_admin_id = null;
    
    if (!scope.isSuperAdmin && scope.isDistrictAdmin && scope.adminId) {
      district = scope.districtName;
      state = scope.stateName;
      owner_admin_id = scope.adminId;
    }
    
    await pool.execute(
      `INSERT INTO news 
       (id, title, title_hindi, content, excerpt, image_path, image_blob, image_mime, image_hash, image_size, image_original_name,
        news_type, priority, is_featured, is_published, \`order\`, district, state, owner_admin_id, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, 
        safeValue(title), 
        safeValue(title_hindi), 
        safeValue(content), 
        safeValue(excerpt), 
        imageAsset.url,
        imageAsset.blob,
        imageAsset.mime,
        imageAsset.hash,
        imageAsset.size,
        imageAsset.originalName,
        safeValue(news_type), 
        safeValue(priority),
        safeValue(is_featured), 
        safeValue(is_published), 
        safeValue(order), 
        safeValue(district),
        safeValue(state),
        safeValue(owner_admin_id),
        safeValue(created_by)
      ]
    );

    if (imageAsset.blob) {
      await pool.execute(
        'UPDATE news SET image_path = ? WHERE id = ?',
        [`/api/media/news/${id}`, id]
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'News added successfully',
      data: { id }
    });
  } catch (error) {
    console.error('Error adding news:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add news' },
      { status: 500 }
    );
  }
}

// PUT - Update news
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
      content,
      excerpt,
      image_path: imageInput,
      news_type,
      priority,
      is_featured,
      is_published,
      order
    } = body;

    // Convert undefined values to null for MySQL
    const safeValue = (val: unknown) => val === undefined ? null : val;
    
    const updateFields: string[] = [
      'title = ?',
      'title_hindi = ?',
      'content = ?',
      'excerpt = ?',
      'news_type = ?',
      'priority = ?',
      'is_featured = ?',
      'is_published = ?',
      '`order` = ?'
    ];
    const updateParams: unknown[] = [
        safeValue(title), 
        safeValue(title_hindi), 
        safeValue(content), 
        safeValue(excerpt), 
        safeValue(news_type), 
        safeValue(priority),
        safeValue(is_featured), 
        safeValue(is_published), 
      safeValue(order)
    ];

    if (imageInput !== undefined) {
      let imageAsset: ResolvedAsset;
      try {
        imageAsset = await resolveAssetFromInput(imageInput, 'News image');
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
        updateParams.push(`/api/media/news/${id}`);
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

    // For district admins, ensure the news belongs to their district/state
    // Allow editing any news in their district, not just ones they created
    if (!scope.isSuperAdmin && scope.isDistrictAdmin && scope.districtName && scope.stateName) {
      const [ownershipRows] = await pool.execute(
        `SELECT id FROM news WHERE id = ? AND district = ? AND state = ? LIMIT 1`,
        [id, scope.districtName, scope.stateName]
      ) as any[];
      
      if (!Array.isArray(ownershipRows) || ownershipRows.length === 0) {
        return NextResponse.json({ 
          success: false, 
          error: 'You can only edit news items that you created' 
        }, { status: 403 });
      }
    }

    const updateSql = `UPDATE news SET ${updateFields.join(', ')} WHERE id = ?`;
    await pool.execute(updateSql, updateParams);

    return NextResponse.json({ 
      success: true, 
      message: 'News updated successfully'
    });
  } catch (error) {
    console.error('Error updating news:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update news' },
      { status: 500 }
    );
  }
}

// DELETE - Delete news
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
        { success: false, error: 'News ID is required' },
        { status: 400 }
      );
    }

    // For district admins, ensure the news belongs to their district/state
    // Allow editing any news in their district, not just ones they created
    if (!scope.isSuperAdmin && scope.isDistrictAdmin && scope.districtName && scope.stateName) {
      const [ownershipRows] = await pool.execute(
        `SELECT id FROM news WHERE id = ? AND district = ? AND state = ? LIMIT 1`,
        [id, scope.districtName, scope.stateName]
      ) as any[];
      
      if (!Array.isArray(ownershipRows) || ownershipRows.length === 0) {
        return NextResponse.json({ 
          success: false, 
          error: 'You can only delete news items that you created' 
        }, { status: 403 });
      }
    }

    await pool.execute('DELETE FROM news WHERE id = ?', [id]);

    return NextResponse.json({ 
      success: true, 
      message: 'News deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting news:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete news' },
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
