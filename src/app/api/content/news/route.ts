import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';
import { getAdminScope, ensurePermission } from '@/lib/admin-scope';

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
             COALESCE(n.district, 'All Districts') as district,
             COALESCE(n.state, 'All States') as state
      FROM news n
      WHERE 1=1
    `;
    const params: any[] = [];

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
    return NextResponse.json({ success: true, data: rows });
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
      title, title_hindi, content, excerpt, image_path, news_type, priority,
      is_featured, is_published, order, created_by 
    } = body;

    const id = `news_${Date.now()}`;
    
    // Convert undefined values to null for MySQL
    const safeValue = (val: any) => val === undefined ? null : val;
    
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
       (id, title, title_hindi, content, excerpt, image_path, news_type, priority,
        is_featured, is_published, \`order\`, district, state, owner_admin_id, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, 
        safeValue(title), 
        safeValue(title_hindi), 
        safeValue(content), 
        safeValue(excerpt), 
        safeValue(image_path), 
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
      id, title, title_hindi, content, excerpt, image_path, news_type, priority,
      is_featured, is_published, order
    } = body;

    // Convert undefined values to null for MySQL
    const safeValue = (val: any) => val === undefined ? null : val;
    
    await pool.execute(
      `UPDATE news SET 
       title = ?, title_hindi = ?, content = ?, excerpt = ?, image_path = ?, 
       news_type = ?, priority = ?, is_featured = ?, is_published = ?, 
       \`order\` = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        safeValue(title), 
        safeValue(title_hindi), 
        safeValue(content), 
        safeValue(excerpt), 
        safeValue(image_path), 
        safeValue(news_type), 
        safeValue(priority),
        safeValue(is_featured), 
        safeValue(is_published), 
        safeValue(order), 
        safeValue(id)
      ]
    );

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
