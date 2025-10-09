import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

// Debug endpoint to check database structure
export async function GET(request: NextRequest) {
  try {
    // Check departments table structure
    const departmentsStructure = await executeQuery('DESCRIBE departments');
    
    // Check if department_posts table exists
    const postTableExists = await executeQuery(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name = 'department_posts'
    `);
    
    // Check if department_members table exists
    const memberTableExists = await executeQuery(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name = 'department_members'
    `);
    
    return NextResponse.json({
      success: true,
      departmentsStructure,
      postTableExists,
      memberTableExists
    });
  } catch (error) {
    console.error('Error checking department tables:', error);
    return NextResponse.json({ 
      error: 'Failed to check department tables',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
