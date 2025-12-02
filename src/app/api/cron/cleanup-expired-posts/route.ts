import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import fs from 'fs';
import path from 'path';

/**
 * Daily cron job to clean up expired department post assignments
 * 
 * This job:
 * 1. Finds all department_members where valid_until < today
 * 2. Deletes related certificates
 * 3. Deletes related ID card files
 * 4. Deletes the department_members record
 * 
 * Should be called daily via Vercel Cron or server cron:
 * - Vercel: Add to vercel.json cron config
 * - Server: Setup cron to call this endpoint daily
 */
export async function GET(request: NextRequest) {
  try {
    // Optional: Add authentication/authorization check for cron endpoint
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Cron] Starting cleanup of expired department post assignments...');
    
    // Find all expired department_members (valid_until < today)
    const expiredAssignments = await executeQuery(`
      SELECT 
        dm.id,
        dm.department_id,
        dm.post_id,
        dm.member_id,
        dm.level,
        dm.state,
        dm.district,
        dm.valid_until,
        m.name as member_name,
        m.member_reg_number
      FROM department_members dm
      JOIN members m ON dm.member_id = m.id
      WHERE dm.valid_until IS NOT NULL
        AND dm.valid_until < CURDATE()
      ORDER BY dm.valid_until ASC
    `) as Array<{
      id: number;
      department_id: number;
      post_id: number;
      member_id: number;
      level: 'national' | 'state' | 'district';
      state: string | null;
      district: string | null;
      valid_until: string;
      member_name: string;
      member_reg_number: string;
    }>;

    if (expiredAssignments.length === 0) {
      console.log('[Cron] No expired assignments found.');
      return NextResponse.json({ 
        success: true, 
        message: 'No expired assignments found',
        deleted: 0 
      });
    }

    console.log(`[Cron] Found ${expiredAssignments.length} expired assignment(s) to clean up.`);

    let deletedCount = 0;
    let errorCount = 0;
    const errors: Array<{ assignment_id: number; error: string }> = [];

    for (const assignment of expiredAssignments) {
      try {
        console.log(`[Cron] Processing expired assignment ID ${assignment.id} (Member: ${assignment.member_name}, Expired: ${assignment.valid_until})`);

        // Find related certificates for this assignment
        const certificates = await executeQuery(`
          SELECT id, certificate_path, id_card_path
          FROM certificates
          WHERE member_id = ?
            AND department_id = ?
            AND post_id = ?
            AND level = ?
            AND (state <=> ?)
            AND (district <=> ?)
        `, [
          assignment.member_id,
          assignment.department_id,
          assignment.post_id,
          assignment.level,
          assignment.state,
          assignment.district
        ]) as Array<{
          id: number;
          certificate_path: string | null;
          id_card_path: string | null;
        }>;

        console.log(`[Cron] Found ${certificates.length} related certificate(s) for assignment ${assignment.id}`);

        // Delete ID card files
        for (const cert of certificates) {
          if (cert.id_card_path) {
            try {
              // Extract filename from path (e.g., /id-cards/appointment-id-card-XXX.pdf)
              const idCardFilename = cert.id_card_path.replace('/id-cards/', '').split('?')[0];
              
              if (idCardFilename && !idCardFilename.includes('..') && !idCardFilename.includes('/')) {
                const idCardFullPath = path.join(process.cwd(), 'public', 'id-cards', idCardFilename);
                
                if (fs.existsSync(idCardFullPath)) {
                  fs.unlinkSync(idCardFullPath);
                  console.log(`[Cron] Deleted ID card file: ${idCardFilename}`);
                } else {
                  console.log(`[Cron] ID card file not found (may have been deleted already): ${idCardFilename}`);
                }
              }
            } catch (fileError: any) {
              console.error(`[Cron] Error deleting ID card file for certificate ${cert.id}:`, fileError);
              // Continue with cleanup even if file deletion fails
            }
          }

          // Delete certificate file if exists
          if (cert.certificate_path) {
            try {
              // Certificate paths are usually like /certificates/XXX.pdf
              const certFilename = cert.certificate_path.split('/').pop()?.split('?')[0];
              
              if (certFilename && !certFilename.includes('..') && !certFilename.includes('/')) {
                // Try to find certificate in uploads/certificates or certificates folder
                const possiblePaths = [
                  path.join(process.cwd(), 'public', 'certificates', certFilename),
                  path.join(process.cwd(), 'public', 'uploads', 'certificates', certFilename),
                ];

                for (const certPath of possiblePaths) {
                  if (fs.existsSync(certPath)) {
                    fs.unlinkSync(certPath);
                    console.log(`[Cron] Deleted certificate file: ${certFilename}`);
                    break;
                  }
                }
              }
            } catch (fileError: any) {
              console.error(`[Cron] Error deleting certificate file for certificate ${cert.id}:`, fileError);
              // Continue with cleanup even if file deletion fails
            }
          }
        }

        // Delete certificates from database (CASCADE should handle related logs)
        if (certificates.length > 0) {
          const certIds = certificates.map(c => c.id);
          await executeQuery(`
            DELETE FROM certificates
            WHERE id IN (${certIds.map(() => '?').join(',')})
          `, certIds);
          console.log(`[Cron] Deleted ${certificates.length} certificate record(s) from database`);
        }

        // Finally, delete the department_members record
        await executeQuery(
          'DELETE FROM department_members WHERE id = ?',
          [assignment.id]
        );

        deletedCount++;
        console.log(`[Cron] ✅ Successfully cleaned up expired assignment ID ${assignment.id}`);
        
      } catch (error: any) {
        errorCount++;
        const errorMsg = error?.message || error?.toString() || 'Unknown error';
        errors.push({ assignment_id: assignment.id, error: errorMsg });
        console.error(`[Cron] ❌ Error cleaning up assignment ID ${assignment.id}:`, error);
        // Continue with other assignments even if one fails
      }
    }

    const result = {
      success: true,
      message: `Cleanup completed: ${deletedCount} deleted, ${errorCount} errors`,
      deleted: deletedCount,
      errors: errorCount,
      errorDetails: errors.length > 0 ? errors : undefined
    };

    console.log(`[Cron] Cleanup completed:`, result);
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('[Cron] Fatal error during cleanup:', error);
    return NextResponse.json({ 
      success: false, 
      error: error?.message || 'Failed to cleanup expired posts' 
    }, { status: 500 });
  }
}

