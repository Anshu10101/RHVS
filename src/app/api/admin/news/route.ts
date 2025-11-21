import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { verifyAdminJwt, getAdminToken } from '@/lib/auth-jwt';
import { trackContentOrigin, enrichContentWithDistrictInfo } from '@/lib/content-tracking';

// GET all news items
export async function GET(req: NextRequest) {
  try {
    const token = getAdminToken(req);
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const claims = await verifyAdminJwt(token);
    if (!claims) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    // const district = searchParams.get('district');
    // const state = searchParams.get('state');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Build query based on admin type
    let query = '';
    let countQuery = '';
    let params: (string | number)[] = [];

    if (claims.type === 'superadmin') {
      // Superadmin can see all news
      query = `
        SELECT * FROM news
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `;
      countQuery = 'SELECT COUNT(*) as total FROM news';
      params = [limit, offset];
    } else {
      // District admin can only see news from their district
      const adminQuery = 'SELECT district, state FROM district_admins WHERE id = ?';
      const adminResult = await executeQuery(adminQuery, [claims.sub]) as any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
      
      if (adminResult.length === 0) {
        return NextResponse.json({ success: false, message: 'Admin not found' }, { status: 404 });
      }
      
      const adminDistrict = adminResult[0].district;
      const adminState = adminResult[0].state;
      
      // Extract district name (before comma if present)
      const districtName = adminDistrict.split(',')[0].trim();
      
      query = `
        SELECT n.* 
        FROM news n
        JOIN content_origin co ON n.id = co.content_id AND co.content_type = 'news'
        WHERE co.district_id = ? AND co.state_id = ?
        ORDER BY n.created_at DESC
        LIMIT ? OFFSET ?
      `;
      countQuery = `
        SELECT COUNT(*) as total 
        FROM news n
        JOIN content_origin co ON n.id = co.content_id AND co.content_type = 'news'
        WHERE co.district_id = ? AND co.state_id = ?
      `;
      params = [districtName, adminState, limit, offset];
    }

    // Execute queries
    const [newsResult, countResult] = await Promise.all([
      executeQuery(query, params),
      executeQuery(countQuery, params.slice(0, -2)) // Remove limit and offset
    ]);

    // Enrich news items with district information
    const enrichedNews = await enrichContentWithDistrictInfo(newsResult as any[], 'news'); // eslint-disable-line @typescript-eslint/no-explicit-any

    return NextResponse.json({
      success: true,
      news: enrichedNews,
      pagination: {
        total: (countResult as any[])[0].total, // eslint-disable-line @typescript-eslint/no-explicit-any
        page,
        limit,
        pages: Math.ceil((countResult as any[])[0].total / limit) // eslint-disable-line @typescript-eslint/no-explicit-any
      }
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch news' },
      { status: 500 }
    );
  }
}

// POST create a new news item
export async function POST(req: NextRequest) {
  try {
    const token = getAdminToken(req);
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const claims = await verifyAdminJwt(token);
    if (!claims) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Check if admin has permission to add news
    const permissionQuery = `
      SELECT 1 FROM district_admin_permissions
      WHERE district_admin_id = ? 
      AND permission = 'add_news'
      AND is_active = 1
      AND (expires_at IS NULL OR expires_at > NOW())
    `;
    const hasPermission = await executeQuery(permissionQuery, [claims.sub]) as any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
    
    if (hasPermission.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'You do not have permission to add news' 
      }, { status: 403 });
    }

    // Get admin's district and state
    const adminQuery = 'SELECT district, state FROM district_admins WHERE id = ?';
    const adminResult = await executeQuery(adminQuery, [claims.sub]) as any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
    
    if (adminResult.length === 0) {
      return NextResponse.json({ success: false, message: 'Admin not found' }, { status: 404 });
    }
    
    const adminDistrict = adminResult[0].district;
    const adminState = adminResult[0].state;
    
    // Extract district name (before comma if present)
    const districtName = adminDistrict.split(',')[0].trim();

    // Parse request body
    const { title, content, image_url, is_featured, is_published } = await req.json();

    // Validate required fields
    if (!title || !content) {
      return NextResponse.json({ 
        success: false, 
        message: 'Title and content are required' 
      }, { status: 400 });
    }

    // Insert news item
    const insertResult = await executeQuery(
      `INSERT INTO news (
        title, 
        content, 
        image_url, 
        is_featured, 
        is_published, 
        created_by, 
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [title, content, image_url || null, is_featured || false, is_published || true, claims.sub]
    ) as any; // eslint-disable-line @typescript-eslint/no-explicit-any

    const newsId = insertResult.insertId;

    // Track content origin (only for district admins - superadmins are not in district_admins table)
    if (claims.type === 'district_admin' && adminResult.length > 0) {
      await trackContentOrigin('news', newsId, districtName, adminState, parseInt(claims.sub));
    }

    // Get user name for logging
    let userName: string;
    if (claims.type === 'superadmin') {
      const superadminRows = await executeQuery(
        'SELECT name, email FROM superadmin WHERE id = ? LIMIT 1',
        [claims.sub]
      ) as Array<{ name: string | null; email: string }>;
      userName = superadminRows[0]?.name || superadminRows[0]?.email || 'Unknown';
    } else {
      const districtAdminRows = await executeQuery(
        'SELECT m.name, da.email FROM district_admins da JOIN members m ON da.member_id = m.id WHERE da.id = ? LIMIT 1',
        [claims.sub]
      ) as Array<{ name: string; email: string }>;
      userName = districtAdminRows[0]?.name || districtAdminRows[0]?.email || 'Unknown';
    }

    // Log activity
    await executeQuery(
      `INSERT INTO activity_logs (
        user_id, 
        user_type, 
        user_name,
        action, 
        details, 
        ip_address
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        claims.sub,
        claims.type === 'superadmin' ? 'superadmin' : 'district_admin',
        userName,
        'create_news',
        `Created news item: ${title}`,
        req.headers.get('x-forwarded-for') || 'unknown'
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'News item created successfully',
      news: {
        id: newsId,
        title,
        content,
        image_url,
        is_featured: is_featured || false,
        is_published: is_published || true,
        created_by: claims.sub,
        created_at: new Date().toISOString(),
        district_id: districtName,
        state_id: adminState
      }
    });
  } catch (error) {
    console.error('Error creating news:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create news item' },
      { status: 500 }
    );
  }
}
