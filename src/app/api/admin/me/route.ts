import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminJwt, getAdminToken } from '@/lib/auth-jwt';
import { executeQuery } from '@/lib/database';

export async function GET(req: NextRequest) {
  // CRITICAL: Always prefer Authorization header over cookie to avoid stale sessions
  // This ensures that when a new login happens, the new token is used, not the old cookie
  const token = getAdminToken(req);
  
  if (!token) {
    return NextResponse.json({ authenticated: false }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  }

  const claims = await verifyAdminJwt(token);
  if (!claims) {
    return NextResponse.json({ authenticated: false }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  }

  // Handle different user types
  const userType = claims.type || 'superadmin';
  
  if (userType === 'news_editor') {
    // Fetch news editor details
    const rows = await executeQuery(
      `SELECT 
        id, 
        email, 
        name,
        role, 
        is_active, 
        created_at, 
        updated_at,
        profile_photo_path,
        LENGTH(profile_photo_blob) as blob_size
      FROM news_editors WHERE id = ? LIMIT 1`, 
      [claims.sub]
    ) as Array<{ id: number; email: string; name: string | null; role: string; is_active: boolean; created_at: string; updated_at: string; profile_photo_path: string | null; blob_size: number | null }>;
    
    if (rows.length === 0) return NextResponse.json({ authenticated: false }, { status: 200 });
    
    const user = rows[0];
    
    // Check if account is active
    if (!user.is_active) {
      return NextResponse.json({ authenticated: false, message: 'Account disabled' }, { status: 403 });
    }
    
    // Determine profile photo URL - prefer blob over path
    let profilePhoto: string | null = null;
    if (user.blob_size && user.blob_size > 0) {
      // Add timestamp for cache busting
      profilePhoto = `/api/media/news-editors/${user.id}/profile?t=${Date.now()}`;
    } else if (user.profile_photo_path) {
      profilePhoto = user.profile_photo_path;
    }
    
    // News editors have full access to news and events (like superadmin for news/events)
    return NextResponse.json({ 
      authenticated: true, 
      user: {
        id: user.id,
        email: user.email,
        name: user.name || user.email,
        role: user.role,
        is_active: user.is_active,
        created_at: user.created_at,
        updated_at: user.updated_at,
        profile_photo: profilePhoto,
        type: 'news_editor',
        permissions: ['edit_news_events', 'add_news', 'edit_news', 'delete_news', 'add_events', 'edit_events', 'delete_events']
      }
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  }
  
  if (userType === 'superadmin') {
    // Fetch superadmin details
    const rows = await executeQuery(
      `SELECT 
        id, 
        email, 
        name, 
        role, 
        is_active, 
        created_at, 
        updated_at,
        profile_photo_path,
        LENGTH(profile_photo_blob) as blob_size
      FROM superadmin WHERE id = ? LIMIT 1`, 
      [claims.sub]
    ) as Array<{ id: number; email: string; name: string | null; role: string; is_active: boolean; created_at: string; updated_at: string; profile_photo_path: string | null; blob_size: number | null }>;
    
    if (rows.length === 0) return NextResponse.json({ authenticated: false }, { status: 200 });
    
    const user = rows[0];
    // Use name from database, or fallback to formatted email name
    const displayName = user.name || (() => {
    const emailName = user.email.split('@')[0];
      return emailName
      .split(/[._-]/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
    })();
    
    // Determine profile photo URL - prefer blob over path
    let profilePhoto: string | null = null;
    if (user.blob_size && user.blob_size > 0) {
      // Add timestamp for cache busting
      profilePhoto = `/api/media/superadmin/${user.id}/profile?t=${Date.now()}`;
    } else if (user.profile_photo_path) {
      profilePhoto = user.profile_photo_path;
    }
    
    return NextResponse.json({ 
      authenticated: true, 
      user: {
        id: user.id,
        email: user.email,
        name: displayName,
        role: user.role,
        is_active: user.is_active,
        created_at: user.created_at,
        updated_at: user.updated_at,
        profile_photo: profilePhoto,
        type: 'superadmin',
        permissions: ['all']
      }
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } 
  else if (userType === 'district_admin') {
    // Fetch district admin details
    const rows = await executeQuery(
      `SELECT 
        da.id, 
        da.member_id, 
        m.name,
        da.email, 
        da.district, 
        m.state,
        CASE 
          WHEN m.profile_photo_blob IS NOT NULL THEN CONCAT('/api/media/members/', m.id, '/profile')
          ELSE m.profile_photo_path
        END AS profile_photo,
        da.role, 
        da.is_active, 
        da.created_at, 
        da.updated_at
       FROM district_admins da
       JOIN members m ON da.member_id = m.id
       WHERE da.id = ? LIMIT 1`, 
      [claims.sub]
    ) as Array<{ id: number; member_id: number; name: string; email: string; district: string; state: string; profile_photo: string; role: string; is_active: boolean; created_at: string; updated_at: string }>;
    
    if (rows.length === 0) return NextResponse.json({ authenticated: false }, { status: 200 });
    
    // Check if account is active
    if (!rows[0].is_active) {
      return NextResponse.json({ authenticated: false, message: 'Account disabled' }, { status: 403 });
    }
    
    // Fetch admin permissions
    const permissionsRows = await executeQuery(
      `SELECT permission
       FROM district_admin_permissions
       WHERE district_admin_id = ? 
         AND is_active = 1
         AND (expires_at IS NULL OR expires_at > NOW())`,
      [claims.sub]
    ) as Array<{ permission: string }>;
    
    // Fetch temporary permissions (permissions with expiry dates)
    const temporaryPermissionsRows = await executeQuery(
      `SELECT permission, expires_at
       FROM district_admin_permissions
       WHERE district_admin_id = ? 
         AND is_active = 1
         AND expires_at IS NOT NULL
         AND expires_at > NOW()`,
      [claims.sub]
    ) as Array<{ permission: string; expires_at: string }>;
    
    const user = {
      ...rows[0],
      type: 'district_admin',
      permissions: permissionsRows.map(p => p.permission),
      temporaryPermissions: temporaryPermissionsRows.map(p => ({
        permission: p.permission,
        expiresAt: new Date(p.expires_at)
      }))
    };
    
    return NextResponse.json({ authenticated: true, user }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  }
  
  // Invalid user type
  return NextResponse.json({ authenticated: false }, { status: 200 });
}