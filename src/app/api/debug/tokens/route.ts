import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

// GET - Debug endpoint to list all tokens
export async function GET(request: NextRequest) {
  try {
    const query = `
      SELECT 
        id, token, name, email, status, expires_at, created_at,
        CASE 
          WHEN expires_at < NOW() THEN 'EXPIRED'
          WHEN status = 'pending' THEN 'PENDING'
          WHEN status = 'verified' THEN 'VERIFIED'
          WHEN status = 'rejected' THEN 'REJECTED'
          ELSE 'UNKNOWN'
        END as status_display
      FROM registration_tokens 
      ORDER BY created_at DESC
      LIMIT 20
    `;
    
    const tokens: any = await executeQuery(query, []);
    
    return NextResponse.json({
      success: true,
      data: tokens.map((token: any) => ({
        ...token,
        expires_at: new Date(token.expires_at).toISOString(),
        created_at: new Date(token.created_at).toISOString(),
      }))
    });
  } catch (error) {
    console.error('Error fetching tokens:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tokens' },
      { status: 500 }
    );
  }
}
