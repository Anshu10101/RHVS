import { NextRequest, NextResponse } from 'next/server';
import { getAdminScope } from '@/lib/admin-scope';
import { processEmailQueue } from '@/lib/email-queue-processor';

/**
 * POST - Process email queue manually
 * Useful for testing or manual triggering via admin panel
 */
export async function POST(request: NextRequest) {
  try {
    const scope = await getAdminScope(request);
    
    // Debug logging
    console.log('[Email Queue Process] Admin scope:', {
      isSuperAdmin: scope.isSuperAdmin,
      isDistrictAdmin: scope.isDistrictAdmin,
      adminId: scope.adminId
    });
    
    // Allow both superadmins and district admins to process queue
    if (!scope.isSuperAdmin && !scope.isDistrictAdmin) {
      console.log('[Email Queue Process] Access denied - not superadmin or district admin');
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }
    
    const body = await request.json();
    const maxEmails = body.maxEmails || 10;
    
    console.log(`[Email Queue API] Manual queue processing triggered by admin ${scope.adminId}`);
    
    const results = await processEmailQueue(maxEmails);
    
    return NextResponse.json({
      success: true,
      results
    });
    
  } catch (error) {
    console.error('[Email Queue API] Error processing queue:', error);
    return NextResponse.json({ 
      error: 'Failed to process email queue',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
