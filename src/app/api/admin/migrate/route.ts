import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

export async function POST(_request: NextRequest) {
  try {
    console.log('Starting database migration...');

    // Migration statements
    const migrations = [
      "ALTER TABLE members ADD COLUMN IF NOT EXISTS status ENUM('pending', 'verified', 'rejected') DEFAULT 'verified'",
      "ALTER TABLE members ADD COLUMN IF NOT EXISTS district VARCHAR(100)",
      "ALTER TABLE members ADD COLUMN IF NOT EXISTS department VARCHAR(100)",
      "ALTER TABLE members ADD COLUMN IF NOT EXISTS verified_by_member_id INT",
      "CREATE INDEX IF NOT EXISTS idx_members_status ON members(status)",
      "CREATE INDEX IF NOT EXISTS idx_members_district ON members(district)",
      "CREATE INDEX IF NOT EXISTS idx_members_verified_by ON members(verified_by_member_id)",
      "UPDATE members SET status = 'verified' WHERE status IS NULL"
    ];

    for (const migration of migrations) {
      try {
        console.log('Executing:', migration.substring(0, 50) + '...');
        await executeQuery(migration);
        console.log('✅ Success');
      } catch (error: unknown) {
        // Some statements might fail if columns already exist, that's okay
        if ((error as Error).message.includes('Duplicate column name') || 
            (error as Error).message.includes('already exists') ||
            (error as Error).message.includes('Duplicate key name')) {
          console.log('⚠️  Skipped (already exists)');
        } else {
          throw error;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully!'
    });
  } catch (error) {
    console.error('Migration failed:', error);
    return NextResponse.json(
      { success: false, error: 'Migration failed' },
      { status: 500 }
    );
  }
}
