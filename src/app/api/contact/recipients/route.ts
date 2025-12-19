import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { noCacheJsonResponse } from '@/lib/api-helpers';

export async function GET() {
  try {
    console.log('📞 Contact recipients API called');
    
    // Active superadmins (normally 1, but support multiple)
    const superadmins = await executeQuery(
      `SELECT id, 
              COALESCE(name, email) AS name, 
              email,
              is_active
       FROM superadmin
       WHERE is_active = 1
       ORDER BY id ASC`
    ) as Array<{ id: number; name: string | null; email: string; is_active: number }>;
    
    console.log('✅ Superadmins loaded:', superadmins.length);

    // Active + not expired district admins
    // Get state from districts table lookup (more reliable than checking if column exists)
    // Handle NULL districts gracefully
    const districtAdminsRaw = await executeQuery(
      `SELECT 
         da.id,
         COALESCE(m.name, da.email) AS name,
         da.email,
         da.district,
         (SELECT s.state_name_english 
          FROM districts d 
          JOIN states s ON d.state_code = s.state_code 
          WHERE d.district_name_english = da.district 
            AND da.district IS NOT NULL
            AND da.district != ''
          LIMIT 1) AS state,
         da.is_active,
         da.expires_at
       FROM district_admins da
       LEFT JOIN members m ON m.id = da.member_id
       WHERE da.is_active = 1
         AND (da.expires_at IS NULL OR da.expires_at > NOW())
       ORDER BY da.district ASC, da.id ASC`
    ) as Array<{
      id: number;
      name: string | null;
      email: string;
      district: string | null;
      state: string | null;
      is_active: number;
      expires_at: string | null;
    }>;
    
    const districtAdmins = districtAdminsRaw || [];
    
    console.log('✅ District admins loaded:', districtAdmins.length);
    console.log('📋 District admins sample:', districtAdmins.slice(0, 3).map(da => ({
      id: da.id,
      district: da.district,
      state: da.state
    })));
    
    const response = {
      success: true,
      data: {
        superadmins: superadmins.map(sa => ({
          id: sa.id,
          name: sa.name || sa.email,
          email: sa.email,
        })),
        districtAdmins: districtAdmins.map(da => ({
          id: da.id,
          name: da.name || da.email,
          email: da.email,
          district: da.district,
          state: da.state,
        })),
      },
    };
    
    console.log('📤 Sending response:', {
      success: response.success,
      superadminsCount: response.data.superadmins.length,
      districtAdminsCount: response.data.districtAdmins.length
    });
    
    return noCacheJsonResponse(response);
  } catch (error: any) {
    console.error('Error fetching contact recipients:', error);
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name
    });
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to load contact recipients',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}


