import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminJwt, getAdminToken } from '@/lib/auth-jwt';
import { executeQuery } from '@/lib/database';
import { noCacheJsonResponse } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const token = getAdminToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const claims = await verifyAdminJwt(token);
    if (!claims) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to view logs
    // Only superadmins can view all logs, district admins can view their own logs
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;
    const action = searchParams.get('action') || null;
    const userId = searchParams.get('userId') || null;
    const dateFrom = searchParams.get('dateFrom') || null;
    const dateTo = searchParams.get('dateTo') || null;
    const search = searchParams.get('search') || null;

    // Build WHERE clause
    const whereConditions: string[] = [];
    const queryParams: (string | number)[] = [];

    // For district admins, only show their own logs
    if (claims.type === 'district_admin' && !claims.isSuperAdmin) {
      whereConditions.push('user_id = ? AND user_type = ?');
      queryParams.push(Number(claims.sub), 'district_admin');
    }

    // Filter by action
    if (action && action !== 'all') {
      whereConditions.push('action = ?');
      queryParams.push(action);
    }

    // Filter by user
    if (userId && userId !== 'all') {
      whereConditions.push('user_id = ?');
      queryParams.push(userId);
    }

    // Filter by date range
    if (dateFrom) {
      whereConditions.push('created_at >= ?');
      queryParams.push(dateFrom);
    }
    if (dateTo) {
      whereConditions.push('created_at <= ?');
      queryParams.push(`${dateTo} 23:59:59`);
    }

    // Search in details
    if (search) {
      whereConditions.push('(details LIKE ? OR user_name LIKE ?)');
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM activity_logs ${whereClause}`;
    const countResult = await executeQuery(countQuery, queryParams) as Array<{ total: number }>;
    const total = countResult[0]?.total || 0;

    // Get logs
    // user_name column exists but may be NULL, so we'll extract from details if needed
    const logsQuery = `
      SELECT 
        id,
        user_id,
        user_type,
        user_name,
        action,
        details,
        ip_address,
        created_at
      FROM activity_logs
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const logsResult = await executeQuery(logsQuery, [...queryParams, limit, offset]) as Array<{
      id: number;
      user_id: number;
      user_type: string;
      user_name: string;
      action: string;
      details: string | null;
      ip_address: string | null;
      created_at: string;
    }>;

    // Helper function to extract user name from details if user_name is NULL
    const extractUserName = (userName: string | null, details: string | null, userId: number, userType: string): string => {
      if (userName && userName.trim() && userName !== 'Unknown' && userName !== 'Unknown Admin') {
        return userName;
      }
      
      // Try to extract from details JSON
      if (details) {
        try {
          const parsed = JSON.parse(details);
          // Check if there's an admin email or name in the JSON
          if (parsed.adminEmail) {
            // Extract username from email (part before @)
            const emailParts = parsed.adminEmail.split('@');
            if (emailParts[0]) {
              return emailParts[0].charAt(0).toUpperCase() + emailParts[0].slice(1);
            }
          }
          if (parsed.adminName) {
            return parsed.adminName;
          }
        } catch {
          // Not JSON, try pattern matching
        }
        
        // Pattern: "District admin login: email@example.com (Name..."
        const emailMatch = details.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
        if (emailMatch) {
          const emailParts = emailMatch[1].split('@');
          if (emailParts[0]) {
            return emailParts[0].charAt(0).toUpperCase() + emailParts[0].slice(1);
          }
        }
        
        // Pattern: "Removed district admin ID X (email@example.com)"
        const emailMatch2 = details.match(/\(([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
        if (emailMatch2) {
          const emailParts = emailMatch2[1].split('@');
          if (emailParts[0]) {
            return emailParts[0].charAt(0).toUpperCase() + emailParts[0].slice(1);
          }
        }
        
        // Pattern: "by Name" or "Name performed..."
        const nameMatch = details.match(/(?:by|for)\s+([A-Za-z\s]+?)(?:\s|$|\(|:)/);
        if (nameMatch && nameMatch[1].trim().length > 2) {
          return nameMatch[1].trim();
        }
      }
      
      // Fallback based on user type
      if (userType === 'superadmin') {
        return 'Superadmin';
      }
      return `User ${userId}`;
    };

    const logs = logsResult.map(log => ({
      id: String(log.id),
      userId: String(log.user_id),
      userName: extractUserName(log.user_name, log.details, log.user_id, log.user_type),
      action: log.action,
      details: log.details || '',
      timestamp: new Date(log.created_at),
      ipAddress: log.ip_address || undefined,
    }));

    return noCacheJsonResponse({
      success: true,
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch activity logs',
    }, { status: 500 });
  }
}

