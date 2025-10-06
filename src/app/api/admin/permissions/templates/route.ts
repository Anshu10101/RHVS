import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminJwt } from '@/lib/auth-jwt';
import { executeQuery } from '@/lib/database';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('admin_session')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const claims = await verifyAdminJwt(token);
    if (!claims || claims.type !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const templates = await executeQuery(`
      SELECT 
        id,
        name,
        description,
        permissions,
        is_active,
        created_at,
        updated_at
      FROM permission_templates
      WHERE is_active = true
      ORDER BY created_at DESC
    `);

    // Parse JSON permissions
    const parsedTemplates = templates.map(template => ({
      ...template,
      permissions: JSON.parse(template.permissions)
    }));

    return NextResponse.json(parsedTemplates);
  } catch (error) {
    console.error('Error fetching permission templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch permission templates' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('admin_session')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const claims = await verifyAdminJwt(token);
    if (!claims || claims.type !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { name, description, permissions } = await req.json();

    if (!name || !permissions || !Array.isArray(permissions)) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    // Get superadmin ID
    const superadmin = await executeQuery(
      'SELECT id FROM district_admins WHERE role = "superadmin" LIMIT 1'
    );
    const createdBy = superadmin[0]?.id || 1;

    const result = await executeQuery(`
      INSERT INTO permission_templates 
      (name, description, permissions, created_by, is_active)
      VALUES (?, ?, ?, ?, true)
    `, [name, description, JSON.stringify(permissions), createdBy]);

    return NextResponse.json({ 
      message: 'Template created successfully',
      template_id: result.insertId 
    });
  } catch (error) {
    console.error('Error creating permission template:', error);
    return NextResponse.json(
      { error: 'Failed to create permission template' },
      { status: 500 }
    );
  }
}
