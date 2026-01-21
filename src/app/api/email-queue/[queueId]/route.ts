import { NextRequest, NextResponse } from 'next/server';
import { getAdminScope } from '@/lib/admin-scope';
import { manualRetryEmail, cancelQueuedEmail } from '@/lib/email-queue';

/**
 * POST - Retry a failed email
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ queueId: string }> }
) {
  try {
    const params = await context.params;
    const scope = await getAdminScope(request);
    
    // Allow both superadmins and district admins to retry emails
    if (!scope.isSuperAdmin && !scope.isDistrictAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }
    
    const queueId = parseInt(params.queueId);
    if (isNaN(queueId)) {
      return NextResponse.json({ error: 'Invalid queue ID' }, { status: 400 });
    }
    
    await manualRetryEmail(queueId);
    
    return NextResponse.json({
      success: true,
      message: `Email ${queueId} has been reset and will be retried`
    });
    
  } catch (error) {
    console.error('[Email Queue API] Error retrying email:', error);
    return NextResponse.json({ 
      error: 'Failed to retry email',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * DELETE - Cancel a queued email
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ queueId: string }> }
) {
  try {
    const params = await context.params;
    const scope = await getAdminScope(request);
    
    // Allow both superadmins and district admins to cancel emails
    if (!scope.isSuperAdmin && !scope.isDistrictAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }
    
    const queueId = parseInt(params.queueId);
    if (isNaN(queueId)) {
      return NextResponse.json({ error: 'Invalid queue ID' }, { status: 400 });
    }
    
    await cancelQueuedEmail(queueId);
    
    return NextResponse.json({
      success: true,
      message: `Email ${queueId} has been cancelled`
    });
    
  } catch (error) {
    console.error('[Email Queue API] Error cancelling email:', error);
    return NextResponse.json({ 
      error: 'Failed to cancel email',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
