import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { getAdminScope, ensurePermission } from '@/lib/admin-scope';

// GET: get specific seller details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const scope = await getAdminScope(req);
    const { id: sellerId } = await params;

    let query = `
      SELECT 
        s.id, s.name, s.business_name, s.contact_phone, s.whatsapp_number,
        s.email, s.address, s.district, s.state, s.delivery_info,
        s.is_active, s.created_at, s.updated_at,
        da.id as admin_id, m.name as admin_name
      FROM sellers s
      LEFT JOIN district_admins da ON da.id = s.added_by_admin_id
      LEFT JOIN members m ON m.id = da.member_id
      WHERE s.id = ?
    `;

    const params_array = [sellerId];

    // District admin can only see their own sellers
    if (!scope.isSuperAdmin) {
      if (!ensurePermission(scope, ['manage_sellers', 'view_sellers'])) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
      }

      if (!scope.districtName || !scope.stateName || !scope.adminId) {
        return NextResponse.json({ success: false, message: 'Invalid admin scope' }, { status: 403 });
      }

      query += ` AND s.district = ? AND s.state = ? AND s.added_by_admin_id = ?`;
      params_array.push(scope.districtName, scope.stateName, String(scope.adminId));
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = await executeQuery(query, params_array) as any[];

    if (rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Seller not found' }, { status: 404 });
    }

    // Get seller's products count
    const productCount = await executeQuery(`
      SELECT COUNT(*) as count FROM products WHERE seller_id = ?
    `, [sellerId]) as any[]; // eslint-disable-line @typescript-eslint/no-explicit-any

    return NextResponse.json({ 
      success: true, 
      data: {
        ...rows[0],
        products_count: productCount[0]?.count || 0
      }
    });

  } catch (e) {
    console.error('seller GET error', e);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

// PUT: update seller
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const scope = await getAdminScope(req);
    const { id: sellerId } = await params;

    if (!scope.isSuperAdmin && !ensurePermission(scope, ['manage_sellers', 'edit_sellers'])) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    // For district admins, check scope
    if (!scope.isSuperAdmin) {
      if (!scope.districtName || !scope.stateName || !scope.adminId) {
        return NextResponse.json({ success: false, message: 'Invalid admin scope' }, { status: 403 });
      }
    }

    const { 
      name, business_name, contact_phone, whatsapp_number, email, 
      address, delivery_info, is_active 
    } = await req.json();

    if (!name || !contact_phone) {
      return NextResponse.json({ 
        success: false, 
        message: 'Name and contact phone are required' 
      }, { status: 400 });
    }

    // Check if seller exists and belongs to this admin
    let sellerQuery = `SELECT id FROM sellers WHERE id = ?`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sellerParams: any[] = [sellerId];
    
    if (!scope.isSuperAdmin) {
      sellerQuery += ` AND district = ? AND state = ? AND added_by_admin_id = ?`;
      sellerParams.push(scope.districtName, scope.stateName, String(scope.adminId));
    }
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existingSeller = await executeQuery(sellerQuery, sellerParams) as any[];

    if (existingSeller.length === 0) {
      return NextResponse.json({ success: false, message: 'Seller not found' }, { status: 404 });
    }

    await executeQuery(`
      UPDATE sellers SET 
        name = ?, business_name = ?, contact_phone = ?, whatsapp_number = ?,
        email = ?, address = ?, delivery_info = ?, is_active = ?,
        updated_at = NOW()
      WHERE id = ?
    `, [
      name,
      business_name || null,
      contact_phone,
      whatsapp_number || null,
      email || null,
      address || null,
      delivery_info || null,
      is_active !== undefined ? is_active : true,
      sellerId
    ]);

    return NextResponse.json({ 
      success: true, 
      message: 'Seller updated successfully' 
    });

  } catch (e) {
    console.error('seller PUT error', e);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

// DELETE: delete seller
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const scope = await getAdminScope(req);
    const { id: sellerId } = await params;

    if (!scope.isSuperAdmin && !ensurePermission(scope, ['manage_sellers', 'delete_sellers'])) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    // For district admins, check scope
    if (!scope.isSuperAdmin) {
      if (!scope.districtName || !scope.stateName || !scope.adminId) {
        return NextResponse.json({ success: false, message: 'Invalid admin scope' }, { status: 403 });
      }
    }

    // Check if seller has products
    const products = await executeQuery(`
      SELECT COUNT(*) as count FROM products WHERE seller_id = ?
    `, [sellerId]) as any[]; // eslint-disable-line @typescript-eslint/no-explicit-any

    if (products[0]?.count > 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'Cannot delete seller with existing products. Please remove products first or deactivate seller.' 
      }, { status: 400 });
    }

    // Check if seller exists and belongs to this admin
    let sellerQuery = `SELECT id FROM sellers WHERE id = ?`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sellerParams: any[] = [sellerId];
    
    if (!scope.isSuperAdmin) {
      sellerQuery += ` AND district = ? AND state = ? AND added_by_admin_id = ?`;
      sellerParams.push(scope.districtName, scope.stateName, String(scope.adminId));
    }
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existingSeller = await executeQuery(sellerQuery, sellerParams) as any[];

    if (existingSeller.length === 0) {
      return NextResponse.json({ success: false, message: 'Seller not found' }, { status: 404 });
    }

    await executeQuery(`DELETE FROM sellers WHERE id = ?`, [sellerId]);

    return NextResponse.json({ 
      success: true, 
      message: 'Seller deleted successfully' 
    });

  } catch (e) {
    console.error('seller DELETE error', e);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
