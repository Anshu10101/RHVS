import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { getAdminScope } from '@/lib/admin-scope';

export async function POST(_request: NextRequest) {
  try {
    const scope = await getAdminScope(_request);
    
    if (!scope.isSuperAdmin) {
      return NextResponse.json({ 
        error: 'Unauthorized - Superadmin access required' 
      }, { status: 401 });
    }

    console.log('Starting migration to remove unique_member_in_dept_level constraint...');

    try {
      // Check if the constraint exists first
      const checkConstraint = await executeQuery(
        `SELECT COUNT(*) as count 
         FROM information_schema.STATISTICS 
         WHERE table_schema = DATABASE() 
         AND table_name = 'department_members' 
         AND index_name = 'unique_member_in_dept_level'`
      ) as Array<{ count: number }>;

      if (checkConstraint[0]?.count === 0) {
        return NextResponse.json({
          success: true,
          message: 'Constraint does not exist - migration not needed'
        });
      }

      // Remove the constraint
      await executeQuery(
        'ALTER TABLE department_members DROP INDEX IF EXISTS unique_member_in_dept_level'
      );

      console.log('✅ Successfully removed unique_member_in_dept_level constraint');

      return NextResponse.json({
        success: true,
        message: 'Migration completed successfully! The unique constraint has been removed. Members can now be assigned to multiple posts in the same department at national executive, national, and state levels.'
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Migration failed:', errorMessage);
      
      // Check if it's a "doesn't exist" error (which is fine)
      if (errorMessage.includes('doesn\'t exist') || errorMessage.includes('Unknown key')) {
        return NextResponse.json({
          success: true,
          message: 'Constraint does not exist - migration not needed'
        });
      }
      
      return NextResponse.json({
        success: false,
        error: 'Migration failed',
        details: errorMessage
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in migration endpoint:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to run migration' },
      { status: 500 }
    );
  }
}

