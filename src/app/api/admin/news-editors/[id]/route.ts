import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { verifyAdminJwt, getAdminToken } from '@/lib/auth-jwt';
import { noCacheJsonResponse } from '@/lib/api-helpers';

// Update or delete a news editor
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = getAdminToken(req);
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const claims = await verifyAdminJwt(token);
    if (!claims || claims.role !== 'superadmin') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const { is_active, expires_at } = await req.json();
    const { id: editorId } = await params;

    // Update news editor
    const updateQuery = `
      UPDATE news_editors 
      SET is_active = ?, expires_at = ?, updated_at = NOW()
      WHERE id = ?
    `;
    
    await executeQuery(updateQuery, [
      is_active !== undefined ? is_active : true,
      expires_at || null,
      editorId
    ]);

    // Log the action
    const superadminRows = await executeQuery(
      'SELECT name, email FROM superadmin WHERE id = ? LIMIT 1',
      [claims.sub]
    ) as Array<{ name: string | null; email: string }>;
    const superadminName = superadminRows[0]?.name || superadminRows[0]?.email || 'Unknown';

    await executeQuery(
      `INSERT INTO activity_logs (user_id, user_type, user_name, action, details, ip_address)
       VALUES (?, 'superadmin', ?, 'update_news_editor', ?, ?)`,
      [
        claims.sub,
        superadminName,
        `Updated news editor ID ${editorId}`,
        req.headers.get('x-forwarded-for') || 'unknown'
      ]
    );

    return noCacheJsonResponse({ success: true });
  } catch (error) {
    console.error('Error updating news editor:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

// Delete a news editor
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = getAdminToken(req);
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const claims = await verifyAdminJwt(token);
    if (!claims || claims.role !== 'superadmin') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const { id: editorId } = await params;

    // Delete news editor
    await executeQuery('DELETE FROM news_editors WHERE id = ?', [editorId]);

    // Log the action
    const superadminRows = await executeQuery(
      'SELECT name, email FROM superadmin WHERE id = ? LIMIT 1',
      [claims.sub]
    ) as Array<{ name: string | null; email: string }>;
    const superadminName = superadminRows[0]?.name || superadminRows[0]?.email || 'Unknown';

    await executeQuery(
      `INSERT INTO activity_logs (user_id, user_type, user_name, action, details, ip_address)
       VALUES (?, 'superadmin', ?, 'delete_news_editor', ?, ?)`,
      [
        claims.sub,
        superadminName,
        `Deleted news editor ID ${editorId}`,
        req.headers.get('x-forwarded-for') || 'unknown'
      ]
    );

    return noCacheJsonResponse({ success: true });
  } catch (error) {
    console.error('Error deleting news editor:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

