import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { verifyAdminJwt } from '@/lib/auth-jwt';
import { hashPassword } from '@/lib/password';
import { sendAdminAssignmentEmail } from '@/lib/email';

// Get all district admins
export async function GET(req: NextRequest) {
  try {
    // Verify admin is authenticated and is a superadmin
    const token = req.cookies.get('admin_session')?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const claims = await verifyAdminJwt(token);
    if (!claims || claims.role !== 'superadmin') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    // Fetch all district admins with their details
    const query = `
      SELECT 
        da.id, 
        da.member_id AS memberId,
        COALESCE(m.name, 'N/A') as name,
        da.email, 
        da.district,
        da.state,
        da.is_active AS isActive, 
        da.appointed_at AS appointmentDate,
        da.expires_at AS expiryDate,
        da.last_login AS lastLogin,
        da.created_at
      FROM district_admins da
      LEFT JOIN members m ON da.member_id = m.id
      ORDER BY da.created_at DESC
    `;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admins = await executeQuery(query, []) as any[];
    
     
    for (const admin of admins) {
      const permissionsQuery = `
        SELECT permission
        FROM district_admin_permissions
        WHERE district_admin_id = ? AND (expires_at IS NULL OR expires_at > NOW()) AND is_active = 1
      `;
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const permissions = await executeQuery(permissionsQuery, [admin.id]) as any[];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      admin.permissions = permissions.map((p: any) => p.permission);
    }

    // Map the admins to ensure consistent property names
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mappedAdmins = admins.map((admin: any) => ({
      id: admin.id,
      memberId: admin.memberId,
      name: admin.name || 'N/A',
      email: admin.email,
      district: admin.district || 'N/A',
      state: admin.state || 'N/A',
      isActive: admin.isActive,
      appointmentDate: admin.appointmentDate,
      expiryDate: admin.expiryDate,
      lastLogin: admin.lastLogin,
      permissions: admin.permissions || []
    }));
    
    return NextResponse.json({ success: true, admins: mappedAdmins });
  } catch (error) {
    console.error('Error fetching district admins:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

// Create a new district admin
export async function POST(req: NextRequest) {
  try {
    // Verify admin is authenticated and is a superadmin
    const token = req.cookies.get('admin_session')?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const claims = await verifyAdminJwt(token);
    if (!claims || claims.role !== 'superadmin') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    // Get request body
    const { memberId, state, district, password, expiryDate, permissions } = await req.json();
    
    // Validate inputs
    if (!memberId || !state || !district || !password) {
      return NextResponse.json(
        { success: false, message: 'Member ID, state, district, and password are required' },
        { status: 400 }
      );
    }
    
    // Check if member exists and get name
    const memberCheckQuery = 'SELECT id, email, name FROM members WHERE id = ?';
    const memberCheck = await executeQuery(memberCheckQuery, [memberId]) as any[]; // eslint-disable-line @typescript-eslint/no-explicit-any

    if (!memberCheck.length) {
      return NextResponse.json(
        { success: false, message: 'Member not found' },
        { status: 404 }
      );
    }
    
    // Check if member is already an admin
    const adminCheckQuery = 'SELECT id FROM district_admins WHERE member_id = ?';
    const adminCheck = await executeQuery(adminCheckQuery, [memberId]) as any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
    
    if (adminCheck.length > 0) {
      return NextResponse.json(
        { success: false, message: 'Member is already a district admin' },
        { status: 409 }
      );
    }
    
    // Store plain text password for email (before hashing)
    const temporaryPassword = password;
    
    // Hash password
    const passwordHash = await hashPassword(password);
    
    if (!passwordHash) {
      console.error('❌ Failed to hash password for district admin');
      return NextResponse.json(
        { success: false, message: 'Failed to process password' },
        { status: 500 }
      );
    }
    
    console.log('🔐 Creating district admin:', {
      memberId,
      email: memberCheck[0].email,
      district,
      state,
      passwordHashLength: passwordHash.length,
      hasPasswordHash: !!passwordHash
    });
    
    // Insert district admin
    const insertQuery = `
      INSERT INTO district_admins (
        member_id, email, district, state, password_hash, role, is_active, 
        appointed_by, appointed_at, expires_at
      ) VALUES (?, ?, ?, ?, ?, 'admin', 1, ?, NOW(), ?)
    `;
    
    const result = await executeQuery(insertQuery, [
      memberId,
      memberCheck[0].email,
      district,
      state,
      passwordHash,
      claims.sub,
      expiryDate || null
    ]) as any; // eslint-disable-line @typescript-eslint/no-explicit-any
    
    const adminId = result.insertId;
    
    console.log('✅ District admin created with ID:', adminId);
    
    // Add default permanent permissions for all district admins
    // These are always granted and never expire
    const defaultPermanentPermissions = [
      'verify_tokens',                    // Can verify tokens for their district
      'view_members',                     // Can view all members
      'add_members',                      // Can add new members
      'assign_members_to_departments'     // Can assign members to department posts
    ];
    
    // Combine default permissions with any provided permissions (avoid duplicates)
    // Note: seller permissions are NOT stored - they are automatically implied by add_products in admin-scope.ts
    const allPermissions = [...new Set([...defaultPermanentPermissions, ...(permissions || [])])];
    
    // Filter out seller permissions if they were provided - they should not be stored
    // Seller permissions are automatically granted when add_products is present (handled in admin-scope.ts)
    const sellerPermissions = ['manage_sellers', 'add_sellers', 'edit_sellers', 'delete_sellers', 'view_sellers'];
    const finalPermissions = allPermissions.filter(p => !sellerPermissions.includes(p));
    
    // Add all permissions (check if exists first to avoid duplicates)
    for (const permission of finalPermissions) {
        // First, deactivate any existing expired or inactive permissions for this admin+permission
        await executeQuery(
          'UPDATE district_admin_permissions SET is_active = 0 WHERE district_admin_id = ? AND permission = ? AND (is_active = 0 OR expires_at < NOW())',
          [adminId, permission]
        );
        
        // Check if there's already an active permission
        const existing = await executeQuery(
          'SELECT id FROM district_admin_permissions WHERE district_admin_id = ? AND permission = ? AND is_active = 1 AND (expires_at IS NULL OR expires_at > NOW())',
          [adminId, permission]
        ) as Array<{ id: number }>;
        
        // Only insert if no active permission exists
        // Default permissions are permanent (expires_at = NULL)
        const isDefaultPermission = defaultPermanentPermissions.includes(permission);
        if (existing.length === 0) {
          await executeQuery(
            'INSERT INTO district_admin_permissions (district_admin_id, permission, granted_by, is_active, expires_at) VALUES (?, ?, ?, 1, ?)',
            [adminId, permission, claims.sub, isDefaultPermission ? null : null]
        );
        }
    }
    
    // Get superadmin name for logging
    const superadminRows = await executeQuery(
      'SELECT name, email FROM superadmin WHERE id = ? LIMIT 1',
      [claims.sub]
    ) as Array<{ name: string | null; email: string }>;
    const superadminName = superadminRows[0]?.name || superadminRows[0]?.email || 'Unknown';
    
    // Log the action
    const logQuery = `
      INSERT INTO activity_logs (user_id, user_type, user_name, action, details, ip_address)
      VALUES (?, 'superadmin', ?, 'create_district_admin', ?, ?)
    `;
    
    await executeQuery(logQuery, [
      claims.sub,
      superadminName,
      `Appointed member ID ${memberId} as admin for ${district} district`,
      req.headers.get('x-forwarded-for') || 'unknown'
    ]);
    
    // Get state language preference for email
    let language: 'hi' | 'en' = 'hi';
    
    try {
      // Get state language preference
      const stateQuery = 'SELECT language_pref FROM states WHERE state_name_english = ? LIMIT 1';
      const stateResult = await executeQuery(stateQuery, [state]) as Array<{ language_pref: number | null }>;
      if (stateResult.length > 0) {
        language = stateResult[0].language_pref === 0 ? 'en' : 'hi';
      }
    } catch (error) {
      console.warn('Error fetching state language preference for email:', error);
      // Continue with default (Hindi)
    }
    
    // Send admin assignment email
    try {
      // Use production login URL
      const loginUrl = 'https://rashtriyahinduvahinisangathan.in/admin/login';
      
      console.log('📧 Attempting to send admin assignment email:', {
        email: memberCheck[0].email,
        name: memberCheck[0].name || 'Admin',
        district,
        language
      });
      
      const emailResult = await sendAdminAssignmentEmail(
        memberCheck[0].email,
        memberCheck[0].name || 'Admin',
        district, // Use district name as-is from database
        temporaryPassword, // temporary password (plain text)
        loginUrl,
        language
      );
      
      if (emailResult.success) {
        console.log('✅ Admin assignment email sent successfully:', emailResult.messageId);
      } else {
        console.error('❌ Failed to send admin assignment email:', emailResult.error);
        // Don't fail the admin creation if email fails
      }
    } catch (emailError) {
      console.error('❌ Error sending admin assignment email:', emailError);
      // Log the full error stack
      if (emailError instanceof Error) {
        console.error('Error stack:', emailError.stack);
      }
      // Don't fail the admin creation if email fails
    }
    
    // Return the newly created admin
    const newAdmin = {
      id: adminId,
      memberId,
      name: memberCheck[0].name,
      email: memberCheck[0].email,
      district,
      isActive: true,
      appointmentDate: new Date().toISOString(),
      expiryDate: expiryDate || null,
      lastLogin: null,
      permissions: permissions || []
    };
    
    return NextResponse.json({ success: true, admin: newAdmin });
  } catch (error) {
    console.error('Error creating district admin:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}
