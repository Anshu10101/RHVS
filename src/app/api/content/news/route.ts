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

    let query = `
      SELECT n.*, 
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

    query += ` ORDER BY published_at DESC, \`order\` ASC`;

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
