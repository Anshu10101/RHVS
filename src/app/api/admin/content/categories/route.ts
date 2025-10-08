import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { getAdminScope, ensurePermission } from '@/lib/admin-scope';

// GET all categories (admin)
export async function GET() {
  try {
    const rows = await executeQuery(
      `SELECT id, name, description, isVisible, created_at, updated_at
       FROM product_categories
       ORDER BY name ASC`
    ) as Array<{ id: number; name: string; description: string; isVisible: boolean; created_at: string; updated_at: string }>;
    return NextResponse.json({ success: true, categories: rows });
  } catch (e) {
    console.error('categories GET error', e);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

// CREATE category
export async function POST(req: NextRequest) {
  try {
    const scope = await getAdminScope(req);
    if (!scope.isSuperAdmin && !ensurePermission(scope, ['add_products','edit_store','manage_store'])) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const { id, name, description, isVisible } = await req.json();
    if (!id || !name) {
      return NextResponse.json({ success: false, message: 'Missing fields' }, { status: 400 });
    }

    await executeQuery(
      `INSERT INTO product_categories (id, name, description, isVisible, created_at, updated_at)
       VALUES (?, ?, ?, ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description), isVisible=VALUES(isVisible), updated_at=NOW()`,
      [id, name, description ?? null, isVisible ? 1 : 0]
    );

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('categories POST error', e);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

// UPDATE category
export async function PUT(req: NextRequest) {
  try {
    const scope = await getAdminScope(req);
    if (!scope.isSuperAdmin && !ensurePermission(scope, ['add_products','edit_store','manage_store'])) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const { id, name, description, isVisible } = await req.json();
    if (!id) {
      return NextResponse.json({ success: false, message: 'Category id is required' }, { status: 400 });
    }

    await executeQuery(
      `UPDATE product_categories
       SET name = COALESCE(?, name),
           description = COALESCE(?, description),
           isVisible = COALESCE(?, isVisible),
           updated_at = NOW()
       WHERE id = ?`,
      [name ?? null, description ?? null, typeof isVisible === 'boolean' ? (isVisible ? 1 : 0) : null, id]
    );

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('categories PUT error', e);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

// DELETE category
export async function DELETE(req: NextRequest) {
  try {
    const scope = await getAdminScope(req);
    if (!scope.isSuperAdmin && !ensurePermission(scope, ['add_products','edit_store','manage_store'])) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, message: 'Category id is required' }, { status: 400 });
    }

    // Optional: set products with this category to NULL to keep referential integrity in some schemas
    try {
      await executeQuery(`UPDATE products SET category = NULL WHERE category = ?`, [id]);
    } catch {}

    await executeQuery(`DELETE FROM product_categories WHERE id = ?`, [id]);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('categories DELETE error', e);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}


