import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { getAdminScope, ensurePermission } from '@/lib/admin-scope';

// GET: list sellers (scoped to district admin)
export async function GET(req: NextRequest) {
  try {
    const scope = await getAdminScope(req);

    // Superadmin sees all sellers
    if (scope.isSuperAdmin) {
      const rows = await executeQuery(`
        SELECT 
          s.id, s.name, s.business_name, s.contact_phone, s.whatsapp_number,
          s.email, s.address, s.district, s.state, s.delivery_info,
          s.is_active, s.created_at, s.updated_at,
          da.id as admin_id, m.name as admin_name,
          COALESCE(p.product_count, 0) as products_count
        FROM sellers s
        LEFT JOIN district_admins da ON da.id = s.added_by_admin_id
        LEFT JOIN members m ON m.id = da.member_id
        LEFT JOIN (
          SELECT seller_id, COUNT(*) as product_count
          FROM products 
          GROUP BY seller_id
        ) p ON p.seller_id = s.id
        ORDER BY s.created_at DESC
      `);
      return NextResponse.json({ success: true, data: rows });
    }

    // District admin must have seller management permission
    if (!scope.isSuperAdmin && !ensurePermission(scope, ['manage_sellers', 'add_sellers', 'edit_sellers'])) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    // For district admins, check scope
    if (!scope.isSuperAdmin) {
      if (!scope.districtName || !scope.stateName || !scope.adminId) {
        console.error('Invalid admin scope:', {
          isSuperAdmin: scope.isSuperAdmin,
          isDistrictAdmin: scope.isDistrictAdmin,
          adminId: scope.adminId,
          districtName: scope.districtName,
          stateName: scope.stateName,
          permissions: scope.permissions
        });
        return NextResponse.json({ 
          success: false, 
          message: 'Invalid admin scope. Please ensure you are logged in as a district admin with proper district assignment.',
          debug: {
            isSuperAdmin: scope.isSuperAdmin,
            isDistrictAdmin: scope.isDistrictAdmin,
            adminId: scope.adminId,
            districtName: scope.districtName,
            stateName: scope.stateName
          }
        }, { status: 403 });
      }

      // District admin sees only their district's sellers
      const rows = await executeQuery(`
        SELECT 
          s.id, s.name, s.business_name, s.contact_phone, s.whatsapp_number,
          s.email, s.address, s.district, s.state, s.delivery_info,
          s.is_active, s.created_at, s.updated_at,
          COALESCE(p.product_count, 0) as products_count
        FROM sellers s
        LEFT JOIN (
          SELECT seller_id, COUNT(*) as product_count
          FROM products 
          GROUP BY seller_id
        ) p ON p.seller_id = s.id
        WHERE s.district = ? AND s.state = ? AND s.added_by_admin_id = ?
        ORDER BY s.created_at DESC
      `, [scope.districtName, scope.stateName, scope.adminId]);
      
      return NextResponse.json({ success: true, data: rows });
    }

    // Superadmin sees all sellers (already handled above)
    return NextResponse.json({ success: true, data: [] });
  } catch (e) {
    console.error('sellers GET error', e);
    
    // Check if it's a table doesn't exist error
    if (e instanceof Error && e.message.includes("doesn't exist")) {
      return NextResponse.json({ 
        success: false, 
        message: 'Sellers table not found. Please run the database setup first.',
        error: 'TABLE_NOT_FOUND'
      }, { status: 500 });
    }
    
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

// POST: create new seller (scoped to district admin)
export async function POST(req: NextRequest) {
  try {
    const scope = await getAdminScope(req);

    if (!ensurePermission(scope, ['manage_sellers', 'add_sellers'])) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    if (!scope.districtName || !scope.stateName || !scope.adminId) {
      console.error('Invalid admin scope:', {
        isSuperAdmin: scope.isSuperAdmin,
        isDistrictAdmin: scope.isDistrictAdmin,
        adminId: scope.adminId,
        districtName: scope.districtName,
        stateName: scope.stateName,
        permissions: scope.permissions
      });
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid admin scope. Please ensure you are logged in as a district admin with proper district assignment.',
        debug: {
          isSuperAdmin: scope.isSuperAdmin,
          isDistrictAdmin: scope.isDistrictAdmin,
          adminId: scope.adminId,
          districtName: scope.districtName,
          stateName: scope.stateName
        }
      }, { status: 403 });
    }

    const { 
      name, business_name, contact_phone, whatsapp_number, email, 
      address, delivery_info, district, state 
    } = await req.json();

    if (!name || !contact_phone) {
      return NextResponse.json({ 
        success: false, 
        message: 'Name and contact phone are required' 
      }, { status: 400 });
    }

    // Determine district and state
    let sellerDistrict, sellerState, addedByAdminId;
    
    if (scope.isSuperAdmin) {
      // Superadmin can specify district/state or use defaults
      sellerDistrict = district || 'Default District';
      sellerState = state || 'Default State';
      addedByAdminId = scope.adminId || 1; // Use adminId or default to 1
    } else {
      // District admin uses their assigned district/state
      sellerDistrict = scope.districtName;
      sellerState = scope.stateName;
      addedByAdminId = scope.adminId;
    }

    // Generate unique seller ID
    const sellerId = `seller_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const insertResult = await executeQuery(`
      INSERT INTO sellers (
        id, name, business_name, contact_phone, whatsapp_number,
        email, address, district, state, delivery_info, added_by_admin_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      sellerId,
      name,
      business_name || null,
      contact_phone,
      whatsapp_number || null,
      email || null,
      address || null,
      sellerDistrict,
      sellerState,
      delivery_info || null,
      addedByAdminId
    ]);

    return NextResponse.json({ 
      success: true, 
      message: 'Seller created successfully',
      data: { id: sellerId }
    });

  } catch (e) {
    console.error('sellers POST error', e);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
