import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { getAdminScope } from '@/lib/admin-scope';

// DELETE a member assignment
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; assignmentId: string }> }
) {
  try {
    // Await params (Next.js 15 requirement)
    const params = await context.params;
    
    const scope = await getAdminScope(request);
    
    // Check if user is authenticated and is a superadmin
    if (!scope.isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const departmentId = parseInt(params.id);
    const assignmentId = parseInt(params.assignmentId);
    
    if (isNaN(departmentId) || isNaN(assignmentId)) {
      return NextResponse.json({ error: 'Invalid department or assignment ID' }, { status: 400 });
    }

    // Check if assignment exists
    const assignment = await executeQuery(
      'SELECT dm.*, dp.position_order FROM department_members dm JOIN department_posts dp ON dm.post_id = dp.id WHERE dm.id = ? AND dm.department_id = ?',
      [assignmentId, departmentId]
    ) as any[];
    
    if (assignment.length === 0) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Delete the assignment
    await executeQuery(
      'DELETE FROM department_members WHERE id = ? AND department_id = ?',
      [assignmentId, departmentId]
    );

    return NextResponse.json({
      success: true,
      message: 'Member assignment removed successfully'
    });
  } catch (error) {
    console.error('Error removing member assignment:', error);
    return NextResponse.json({ error: 'Failed to remove member assignment' }, { status: 500 });
  }
}
