import { NextRequest, NextResponse } from 'next/server';
import { getAdminScope } from '@/lib/admin-scope';
import { 
  getEmailQueueStats, 
  getFailedEmails, 
  getPendingEmails 
} from '@/lib/email-queue';

/**
 * GET - Get email queue statistics and status
 */
export async function GET(request: NextRequest) {
  try {
    const scope = await getAdminScope(request);
    
    // Debug logging
    console.log('[Email Queue] Admin scope:', {
      isSuperAdmin: scope.isSuperAdmin,
      isDistrictAdmin: scope.isDistrictAdmin,
      adminId: scope.adminId
    });
    
    // Only admins can view queue status
    if (!scope.isSuperAdmin && !scope.isDistrictAdmin) {
      console.log('[Email Queue] Access denied - not superadmin or district admin');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const searchParams = request.nextUrl.searchParams;
    const view = searchParams.get('view') || 'stats';
    
    if (view === 'stats') {
      // Get overall statistics
      const stats = await getEmailQueueStats();
      return NextResponse.json({ success: true, stats });
      
    } else if (view === 'failed') {
      // Get failed emails
      const limit = parseInt(searchParams.get('limit') || '50');
      const failedEmails = await getFailedEmails(limit);
      return NextResponse.json({ success: true, failedEmails });
      
    } else if (view === 'pending') {
      // Get pending emails
      const limit = parseInt(searchParams.get('limit') || '50');
      const pendingEmails = await getPendingEmails(limit);
      return NextResponse.json({ success: true, pendingEmails });
      
    } else {
      return NextResponse.json({ error: 'Invalid view parameter' }, { status: 400 });
    }
    
  } catch (error) {
    console.error('[Email Queue API] Error getting queue status:', error);
    return NextResponse.json({ 
      error: 'Failed to get queue status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
