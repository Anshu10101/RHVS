import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { getAdminScope, ensurePermission } from '@/lib/admin-scope';

// GET: list products (scoped)
export async function GET(req: NextRequest) {
  try {
    const scope = await getAdminScope(req);
    console.log('Admin scope in products GET:', {
      isSuperAdmin: scope.isSuperAdmin,
      isDistrictAdmin: scope.isDistrictAdmin,
      districtName: scope.districtName,
      stateName: scope.stateName,
      adminId: scope.adminId,
      permissions: scope.permissions
    });

    // Superadmin sees all
    if (scope.isSuperAdmin) {
      const rows = await executeQuery(`
        SELECT DISTINCT
          p.id, p.name, p.description, p.price, p.original_price, p.category, p.seller_id,
          p.image_path AS image_url, p.isVisible, p.is_featured, p.stock, p.tags,
          p.district_id, p.state_id, p.added_by, p.owner_admin_id,
          p.created_at, p.updated_at, p.updated_by,
          co.district_id AS origin_district_id, co.state_id AS origin_state_id, m.name AS added_by_name,
          s.name AS seller_name, s.contact_phone AS seller_phone, s.whatsapp_number AS seller_whatsapp, s.email AS seller_email
        FROM products p
        LEFT JOIN content_origin co ON co.content_type = 'product' AND co.content_id = p.id
        LEFT JOIN district_admins da ON da.id = co.added_by_admin_id
        LEFT JOIN members m ON m.id = da.member_id
        LEFT JOIN sellers s ON s.id = p.seller_id
        ORDER BY p.created_at DESC
      `);
      return NextResponse.json({ success: true, data: rows });
    }

    // District admin must have any product permission
    if (!ensurePermission(scope, ['edit_store','add_products','edit_products','delete_products'])) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    if (!scope.districtName || !scope.stateName || !scope.adminId) {
      console.error('Invalid admin scope:', {
        isSuperAdmin: scope.isSuperAdmin,
        districtName: scope.districtName,
        stateName: scope.stateName,
        adminId: scope.adminId,
        permissions: scope.permissions
      });
      return NextResponse.json({ success: false, message: 'Invalid admin scope' }, { status: 403 });
    }

    console.log('District admin filtering products for:', {
      districtName: scope.districtName,
      stateName: scope.stateName,
      adminId: scope.adminId
    });

    const rows = await executeQuery(`
      SELECT DISTINCT
        p.id, p.name, p.description, p.price, p.original_price, p.category, p.seller_id,
        p.image_path AS image_url, p.isVisible, p.is_featured, p.stock, p.tags,
        p.district_id, p.state_id, p.added_by, p.owner_admin_id,
        p.created_at, p.updated_at, p.updated_by,
        co.district_id AS origin_district_id, co.state_id AS origin_state_id, m.name AS added_by_name,
        s.name AS seller_name, s.contact_phone AS seller_phone, s.whatsapp_number AS seller_whatsapp, s.email AS seller_email
      FROM products p
      LEFT JOIN content_origin co ON co.content_type = 'product' AND co.content_id = p.id
      LEFT JOIN district_admins da ON da.id = co.added_by_admin_id
      LEFT JOIN members m ON m.id = da.member_id
      LEFT JOIN sellers s ON s.id = p.seller_id
      WHERE (
        (p.district_id = ? AND p.state_id = ? AND p.owner_admin_id = ? AND p.district_id IS NOT NULL AND p.state_id IS NOT NULL AND p.owner_admin_id IS NOT NULL) OR 
        (co.district_id = ? AND co.state_id = ? AND co.added_by_admin_id = ? AND co.district_id IS NOT NULL AND co.state_id IS NOT NULL AND co.added_by_admin_id IS NOT NULL)
      )
      ORDER BY p.created_at DESC
    `, [scope.districtName, scope.stateName, scope.adminId, scope.districtName, scope.stateName, scope.adminId]);
    
    console.log(`Found ${rows.length} products for district admin:`, {
      districtName: scope.districtName,
      stateName: scope.stateName,
      adminId: scope.adminId,
      productIds: rows.map((r: any) => ({ id: r.id, name: r.name, district_id: r.district_id, state_id: r.state_id, owner_admin_id: r.owner_admin_id }))
    });
    
    return NextResponse.json({ success: true, data: rows });
  } catch (e) {
    console.error('products GET error', e);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

// POST: create product (scoped to district admin)
export async function POST(req: NextRequest) {
  try {
    const scope = await getAdminScope(req);

    if (scope.isSuperAdmin === false && !ensurePermission(scope, ['add_products','edit_store'])) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const { 
      name, price, image_url, description, category, original_price, stock, is_featured, tags,
      images, features, specifications, seller_id 
    } = await req.json();
    
    console.log('Creating product with data:', { name, price, images, features, specifications });
    
    if (!name || price == null) {
      return NextResponse.json({ success: false, message: 'Missing fields' }, { status: 400 });
    }
    if (Number(price) < 0 || (original_price != null && Number(original_price) < 0)) {
      return NextResponse.json({ success: false, message: 'Price cannot be negative' }, { status: 400 });
    }

    // Detect products.id definition to decide inserting strategy
    const idCol: any[] = await executeQuery(`SHOW COLUMNS FROM products LIKE 'id'`);
    const idType = String(idCol?.[0]?.Type || '').toLowerCase();
    const idExtra = String(idCol?.[0]?.Extra || '').toLowerCase();

    let createdId: string | number | null = null;
    try {
      // Try simple insert assuming auto-increment numeric id
      const insert = await executeQuery(`
        INSERT INTO products 
          (name, description, price, original_price, category, seller_id, image_path, isVisible, is_featured, stock, tags, features, specifications, district_id, state_id, added_by, owner_admin_id, \`order\`, created_at, updated_at, updated_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NOW(), NOW(), ?)
      `, [
        name,
        (description ?? ''),
        price,
        original_price ?? null,
        category ?? 'default',
        seller_id || null,
        image_url || null,
        is_featured ? 1 : 0,
        stock ?? 0,
        tags ? JSON.stringify(tags) : null,
        features ? JSON.stringify(features) : null,
        specifications ? JSON.stringify(specifications) : null,
        scope.districtName || null,
        scope.stateName || null,
        scope.adminId || null,
        scope.adminId || null,
        scope.adminId ? scope.adminId.toString() : 'admin'
      ]);
      createdId = (insert as any).insertId ?? null;
    } catch (err: any) {
      // If id is a VARCHAR primary key with default '' (no auto inc), generate our own id and insert with explicit id
      if (String(err?.code) === 'ER_DUP_ENTRY' || String(err?.sqlMessage || '').includes("for key 'PRIMARY'")) {
        // Generate a compact id (timestamp-based) to stay within varchar and allow INT content_origin if small
        const ts = Date.now();
        const rnd = Math.floor(Math.random() * 1000);
        const genId = `p${ts}${rnd}`; // string id
        await executeQuery(`
          INSERT INTO products 
            (id, name, description, price, original_price, category, seller_id, image_path, isVisible, is_featured, stock, tags, features, specifications, district_id, state_id, added_by, owner_admin_id, \`order\`, created_at, updated_at, updated_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NOW(), NOW(), ?)
        `, [
          genId,
          name,
          (description ?? ''),
          price,
          original_price ?? null,
          category ?? 'default',
          seller_id || null,
          image_url || null,
          is_featured ? 1 : 0,
          stock ?? 0,
          tags ? JSON.stringify(tags) : null,
          features ? JSON.stringify(features) : null,
          specifications ? JSON.stringify(specifications) : null,
          scope.districtName || null,
          scope.stateName || null,
          scope.adminId || null,
          scope.adminId || null,
          scope.adminId ? scope.adminId.toString() : 'admin'
        ]);
        createdId = genId;
      } else {
        throw err;
      }
    }

    // Track origin if district admin
    if (!scope.isSuperAdmin && scope.districtName && scope.stateName && scope.adminId && createdId != null) {
      try {
        await executeQuery(`
          INSERT INTO content_origin (content_type, content_id, district_id, state_id, added_by_admin_id)
          VALUES ('product', ?, ?, ?, ?)
        `, [createdId as any, scope.districtName, scope.stateName, scope.adminId]);
      } catch (e) {
        // If schema mismatch (e.g., INT vs VARCHAR), skip tracking rather than failing the creation
        console.warn('content_origin tracking skipped for product id', createdId);
      }
    }

    // Save multiple images if provided
    if (images && Array.isArray(images) && images.length > 0 && createdId != null) {
      try {
        console.log(`Saving ${images.length} images for product ${createdId}`);
        for (let i = 0; i < images.length; i++) {
          console.log(`Saving image ${i + 1}: ${images[i]}`);
          await executeQuery(`
            INSERT INTO product_images (product_id, image_url, is_primary, sort_order)
            VALUES (?, ?, ?, ?)
          `, [
            createdId as any,
            images[i],
            i === 0 ? 1 : 0, // First image is primary
            i
          ]);
        }
        console.log('All images saved successfully');
      } catch (e) {
        console.error('Failed to save product images:', e);
        // Don't fail the product creation if images fail
      }
    }

    return NextResponse.json({ success: true, id: createdId });
  } catch (e) {
    console.error('products POST error', e);
    console.error('Error details:', {
      message: e.message,
      code: e.code,
      sqlState: e.sqlState,
      sqlMessage: e.sqlMessage
    });
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

// PUT: update product (scoped to district admin)
export async function PUT(req: NextRequest) {
  try {
    const scope = await getAdminScope(req);
    const { id, name, price, image_url, description, category, original_price, stock, is_featured, tags, isVisible, images, seller_id } = await req.json();
    
    if (!id) {
      return NextResponse.json({ success: false, message: 'Product ID is required' }, { status: 400 });
    }

    if (scope.isSuperAdmin === false && !ensurePermission(scope, ['edit_products','edit_store','add_products'])) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    // For district admins, ensure ownership
    if (!scope.isSuperAdmin) {
      const ownershipCheck = await executeQuery(
        `SELECT p.id FROM products p
         LEFT JOIN content_origin co ON co.content_type = 'product' AND co.content_id = p.id
         WHERE p.id = ? AND (
           (p.district_id = ? AND p.state_id = ? AND p.owner_admin_id = ?) OR
           (co.district_id = ? AND co.state_id = ? AND co.added_by_admin_id = ?)
         )
         LIMIT 1`,
        [id, scope.districtName, scope.stateName, scope.adminId, scope.districtName, scope.stateName, scope.adminId]
      );
      
      if (!ownershipCheck.length) {
        return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
      }
    }

    if (Number(price) < 0 || (original_price != null && Number(original_price) < 0)) {
      return NextResponse.json({ success: false, message: 'Price cannot be negative' }, { status: 400 });
    }

    await executeQuery(`
      UPDATE products SET 
        name = ?, description = ?, price = ?, original_price = ?, category = ?, seller_id = ?,
        image_path = ?, isVisible = ?, is_featured = ?, stock = ?, tags = ?,
        updated_at = NOW(), updated_by = ?
      WHERE id = ?
    `, [
      name,
      description ?? '',
      price,
      original_price ?? null,
      category ?? 'default',
      seller_id || null,
      image_url || null,
      isVisible ? 1 : 0,
      is_featured ? 1 : 0,
      stock ?? 0,
      tags ? JSON.stringify(tags) : null,
      scope.adminId ? scope.adminId.toString() : 'admin',
      id
    ]);

    // Save gallery images if provided
    if (Array.isArray(images) && images.length > 0) {
      // replace existing
      await executeQuery('DELETE FROM product_images WHERE product_id = ?', [id]);
      for (let i = 0; i < images.length && i < 4; i++) {
        await executeQuery(
          `INSERT INTO product_images (product_id, image_url, is_primary, sort_order) VALUES (?, ?, ?, ?)`,
          [id, images[i], i === 0 ? 1 : 0, i]
        );
      }
    }

    return NextResponse.json({ success: true, message: 'Product updated successfully' });
  } catch (e) {
    console.error('products PUT error', e);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

// DELETE: delete product if it belongs to district admin
export async function DELETE(req: NextRequest) {
  try {
    const scope = await getAdminScope(req);
    console.log('DELETE request - Admin scope:', {
      isSuperAdmin: scope.isSuperAdmin,
      isDistrictAdmin: scope.isDistrictAdmin,
      adminId: scope.adminId,
      permissions: scope.permissions
    });
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    console.log('DELETE request - received ID:', id, 'URL:', req.url);
    console.log('DELETE request - searchParams:', Object.fromEntries(searchParams.entries()));
    console.log('DELETE request - all params:', searchParams.toString());
    if (!id) return NextResponse.json({ success: false, message: 'Missing id' }, { status: 400 });

    if (scope.isSuperAdmin) {
      console.log('Superadmin deleting product with ID:', id);
      try {
        await executeQuery('DELETE FROM products WHERE id = ?', [id]);
        console.log('Successfully deleted from products table');
        await executeQuery('DELETE FROM content_origin WHERE content_type = "product" AND content_id = ?', [id]);
        console.log('Successfully deleted from content_origin table');
        return NextResponse.json({ success: true });
      } catch (dbError) {
        console.error('Database error during delete:', dbError);
        return NextResponse.json({ success: false, message: 'Database error during delete' }, { status: 500 });
      }
    }

    if (!ensurePermission(scope, ['delete_products','edit_store','edit_products','add_products'])) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    // Ensure ownership - check both direct product fields and content_origin
    const rows: any[] = await executeQuery(
      `SELECT p.id FROM products p
       LEFT JOIN content_origin co ON co.content_type = 'product' AND co.content_id = p.id
       WHERE p.id = ? AND (
         (p.district_id = ? AND p.state_id = ? AND p.owner_admin_id = ?) OR
         (co.district_id = ? AND co.state_id = ? AND co.added_by_admin_id = ?)
       )
       LIMIT 1`,
      [id, scope.districtName, scope.stateName, scope.adminId, scope.districtName, scope.stateName, scope.adminId]
    );
    if (!rows.length) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });

    await executeQuery('DELETE FROM products WHERE id = ?', [id]);
    await executeQuery('DELETE FROM content_origin WHERE content_type = "product" AND content_id = ?', [id]);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('products DELETE error', e);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}


