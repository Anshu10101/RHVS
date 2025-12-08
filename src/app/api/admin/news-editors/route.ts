import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { verifyAdminJwt, getAdminToken } from '@/lib/auth-jwt';
import { hashPassword } from '@/lib/password';
import { noCacheJsonResponse } from '@/lib/api-helpers';
import { sendNewsEditorAppointmentEmail } from '@/lib/email';

// Get all news editors
export async function GET(req: NextRequest) {
  try {
    // Verify admin is authenticated and is a superadmin
    const token = getAdminToken(req);
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const claims = await verifyAdminJwt(token);
    if (!claims || claims.role !== 'superadmin') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    // Fetch all news editors with their details
    const query = `
      SELECT 
        id, 
        email,
        name,
        role,
        is_active AS isActive, 
        appointed_at AS appointmentDate,
        expires_at AS expiryDate,
        last_login AS lastLogin,
        created_at
      FROM news_editors
      ORDER BY created_at DESC
    `;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const editors = await executeQuery(query, []) as any[];
    
    // Map the editors to ensure consistent property names
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mappedEditors = editors.map((editor: any) => ({
      id: editor.id,
      name: editor.name || 'N/A',
      email: editor.email,
      role: editor.role,
      isActive: editor.isActive,
      appointmentDate: editor.appointmentDate,
      expiryDate: editor.expiryDate,
      lastLogin: editor.lastLogin,
    }));
    
    return noCacheJsonResponse({ success: true, editors: mappedEditors });
  } catch (error) {
    console.error('Error fetching news editors:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

// Create a new news editor
export async function POST(req: NextRequest) {
  try {
    // Verify admin is authenticated and is a superadmin
    const token = getAdminToken(req);
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const claims = await verifyAdminJwt(token);
    if (!claims || claims.role !== 'superadmin') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    // Get request body
    const { email, name, password, role, expiryDate } = await req.json();
    
    // Validate inputs
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    // Check if email already exists
    const emailCheckQuery = 'SELECT id FROM news_editors WHERE email = ?';
    const emailCheck = await executeQuery(emailCheckQuery, [email]) as Array<{ id: number }>;
    
    if (emailCheck.length > 0) {
      return NextResponse.json(
        { success: false, message: 'Email already registered as news editor' },
        { status: 409 }
      );
    }
    
    // Store plain text password for email (before hashing)
    const temporaryPassword = password;
    
    // Hash password
    const passwordHash = await hashPassword(password);
    
    if (!passwordHash) {
      console.error('❌ Failed to hash password for news editor');
      return NextResponse.json(
        { success: false, message: 'Failed to process password' },
        { status: 500 }
      );
    }
    
    console.log('🔐 Creating news editor:', {
      email,
      name,
      role: role || 'news_editor',
      passwordHashLength: passwordHash.length,
      hasPasswordHash: !!passwordHash
    });
    
    // Insert news editor
    const insertQuery = `
      INSERT INTO news_editors (
        email, name, password_hash, role, is_active, 
        appointed_by, appointed_at, expires_at
      ) VALUES (?, ?, ?, ?, 1, ?, NOW(), ?)
    `;
    
    const result = await executeQuery(insertQuery, [
      email,
      name || null,
      passwordHash,
      role || 'news_editor',
      claims.sub,
      expiryDate || null
    ]) as any; // eslint-disable-line @typescript-eslint/no-explicit-any
    
    const editorId = result.insertId;
    
    console.log('✅ News editor created with ID:', editorId);
    
    // Get superadmin name for logging
    const superadminRows = await executeQuery(
      'SELECT name, email FROM superadmin WHERE id = ? LIMIT 1',
      [claims.sub]
    ) as Array<{ name: string | null; email: string }>;
    const superadminName = superadminRows[0]?.name || superadminRows[0]?.email || 'Unknown';
    
    // Log the action
    const logQuery = `
      INSERT INTO activity_logs (user_id, user_type, user_name, action, details, ip_address)
      VALUES (?, 'superadmin', ?, 'create_news_editor', ?, ?)
    `;
    
    await executeQuery(logQuery, [
      claims.sub,
      superadminName,
      `Appointed ${email} as news editor`,
      req.headers.get('x-forwarded-for') || 'unknown'
    ]);
    
    // Send appointment email to the news editor
    try {
      // Use production URL for admin login in email
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                      process.env.BASE_URL || 
                      'https://rashtriyahinduvahinisangathan.in';
      const loginUrl = `${baseUrl}/admin/login`;
      
      const emailResult = await sendNewsEditorAppointmentEmail(
        email,
        name || 'News Editor',
        temporaryPassword,
        loginUrl
      );
      
      if (emailResult.success) {
        console.log('✅ Appointment email sent successfully to:', email);
      } else {
        console.warn('⚠️ Failed to send appointment email to:', email, emailResult.error);
        // Don't fail the request if email fails, just log it
      }
    } catch (emailError) {
      console.error('❌ Error sending appointment email:', emailError);
      // Don't fail the request if email fails, just log it
    }
    
    // Return the newly created editor
    const newEditor = {
      id: editorId,
      name: name || null,
      email,
      role: role || 'news_editor',
      isActive: true,
      appointmentDate: new Date().toISOString(),
      expiryDate: expiryDate || null,
      lastLogin: null,
      temporaryPassword // Include temp password in response for display
    };
    
    return noCacheJsonResponse({ success: true, editor: newEditor });
  } catch (error) {
    console.error('Error creating news editor:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

