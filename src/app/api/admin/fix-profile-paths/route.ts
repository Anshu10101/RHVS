import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    // Fix members table - add leading slash to paths that don't have it
    const updateMembersQuery = `
      UPDATE members 
      SET profile_photo_path = CONCAT('/', profile_photo_path)
      WHERE profile_photo_path IS NOT NULL 
        AND profile_photo_path != '' 
        AND profile_photo_path != '/uploads/default-avatar.svg'
        AND NOT profile_photo_path LIKE 'http%'
        AND NOT profile_photo_path LIKE '/%'
    `;
    
    const membersResult = await executeQuery(updateMembersQuery, []);
    
    // Fix registration_tokens table - add leading slash to paths that don't have it
    const updateTokensQuery = `
      UPDATE registration_tokens 
      SET profile_photo_path = CONCAT('/', profile_photo_path)
      WHERE profile_photo_path IS NOT NULL 
        AND profile_photo_path != '' 
        AND profile_photo_path != '/uploads/default-avatar.svg'
        AND NOT profile_photo_path LIKE 'http%'
        AND NOT profile_photo_path LIKE '/%'
    `;
    
    const tokensResult = await executeQuery(updateTokensQuery, []);
    
    // Get updated paths to verify
    const membersCheck = await executeQuery(
      'SELECT id, name, profile_photo_path FROM members WHERE profile_photo_path IS NOT NULL',
      []
    );
    
    const tokensCheck = await executeQuery(
      'SELECT id, name, profile_photo_path FROM registration_tokens WHERE profile_photo_path IS NOT NULL',
      []
    );

    return NextResponse.json({
      success: true,
      message: 'Profile photo paths fixed successfully',
      data: {
        members: membersCheck,
        tokens: tokensCheck,
        membersUpdated: membersResult.affectedRows || 0,
        tokensUpdated: tokensResult.affectedRows || 0
      }
    });

  } catch (error) {
    console.error('Error fixing profile photo paths:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fix profile photo paths' },
      { status: 500 }
    );
  }
}
