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
    
    // Check if user is authenticated and is a superadmin or district admin
    if (!scope.isSuperAdmin && !scope.isDistrictAdmin) {
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

    // For district admins, enforce restrictions
    if (scope.isDistrictAdmin && !scope.isSuperAdmin) {
      const { ensurePermission } = await import('@/lib/admin-scope');
      if (!ensurePermission(scope, 'assign_members_to_departments')) {
        return NextResponse.json({ 
          error: 'Permission denied. You do not have permission to manage department assignments.' 
        }, { status: 403 });
      }
      
      // Block National Executive Department
      const department = await executeQuery(
        'SELECT is_national_executive FROM departments WHERE id = ?',
        [departmentId]
      ) as Array<{ is_national_executive: number }>;
      
      if (department.length > 0 && department[0].is_national_executive) {
        return NextResponse.json({ 
          error: 'Access denied. National Executive Department assignments are restricted to superadmins only.' 
        }, { status: 403 });
      }
      
      // Get district admin's state
      let adminState: string | null = null;
      if (scope.adminId) {
        const adminStateResult = await executeQuery(
          'SELECT m.state FROM district_admins da JOIN members m ON da.member_id = m.id WHERE da.id = ?',
          [scope.adminId]
        ) as Array<{ state: string }>;
        if (adminStateResult.length > 0 && adminStateResult[0].state) {
          adminState = adminStateResult[0].state;
        }
      }
      
      // Check if assignment belongs to admin's jurisdiction
      const assignmentLevel = assignment[0].level;
      const assignmentState = assignment[0].state;
      const assignmentDistrict = assignment[0].district;
      
      if (assignmentLevel === 'national') {
        return NextResponse.json({ 
          error: 'Access denied. District admins cannot remove national level assignments.' 
        }, { status: 403 });
      }
      
      if (assignmentLevel === 'state' && assignmentState !== adminState) {
        return NextResponse.json({ 
          error: 'Access denied. You can only remove assignments in your own state.' 
        }, { status: 403 });
      }
      
      if (assignmentLevel === 'district' && (assignmentState !== adminState)) {
        return NextResponse.json({ 
          error: 'Access denied. You can only remove assignments in your own state.' 
        }, { status: 403 });
      }
      
      if (assignmentLevel === 'divisional' && assignmentState !== adminState) {
        return NextResponse.json({ 
          error: 'Access denied. You can only remove assignments in your own state.' 
        }, { status: 403 });
      }
    }

    // Delete the assignment
    await executeQuery(
      'DELETE FROM department_members WHERE id = ? AND department_id = ?',
      [assignmentId, departmentId]
    );

    // Send removal notification email
    try {
      // Get member and assignment details for email
      const memberDetails = await executeQuery(
        `SELECT m.id, m.name, m.email, m.member_reg_number, m.state as member_state
         FROM members m
         WHERE m.id = ?`,
        [assignment[0].member_id]
      ) as Array<{
        id: number;
        name: string;
        email: string | null;
        member_reg_number: string;
        member_state: string | null;
      }>;
      
      if (memberDetails.length > 0 && memberDetails[0].email) {
        const member = memberDetails[0];
        
        // Get department and post details
        const deptPostDetails = await executeQuery(
          `SELECT d.name_en as dept_name_en, d.name_hi as dept_name_hi,
                  d.is_national_executive,
                  dp.name_en as post_name_en, dp.name_hi as post_name_hi,
                  dp.print_as_name_en, dp.print_as_name_hi
           FROM departments d
           JOIN department_posts dp ON d.id = dp.department_id
           WHERE d.id = ? AND dp.id = ?`,
          [departmentId, assignment[0].post_id]
        ) as Array<{
          dept_name_en: string | null;
          dept_name_hi: string | null;
          is_national_executive: number | boolean;
          post_name_en: string | null;
          post_name_hi: string | null;
          print_as_name_en: string | null;
          print_as_name_hi: string | null;
        }>;
        
        if (deptPostDetails.length > 0) {
          const deptPost = deptPostDetails[0];
          
          // Get language preference based on assignment state (or member state as fallback)
          const { getStateLanguagePreference } = await import('@/lib/language-preference');
          const languagePreference = await getStateLanguagePreference({
            stateName: assignment[0].state || member.member_state
          });
          
          const { sendRemovalEmail } = await import('@/lib/email-service');
          
          const removalEmailData = {
            to: member.email,
            memberName: member.name,
            memberRegNumber: member.member_reg_number,
            departmentName: languagePreference === 'hi'
              ? (deptPost.dept_name_hi || deptPost.dept_name_en || '')
              : (deptPost.dept_name_en || deptPost.dept_name_hi || ''),
            postName: languagePreference === 'hi'
              ? (deptPost.post_name_hi || deptPost.post_name_en || '')
              : (deptPost.post_name_en || deptPost.post_name_hi || ''),
            level: assignment[0].level,
            state: assignment[0].state || null,
            district: assignment[0].district || null,
            division: assignment[0].division || null,
            removalDate: new Date().toISOString().split('T')[0],
            removalReason: null, // Could be passed from frontend if needed
            language: languagePreference,
            printAsNameEn: deptPost.print_as_name_en || null,
            printAsNameHi: deptPost.print_as_name_hi || null,
            isNationalExecutive: deptPost.is_national_executive === 1 || deptPost.is_national_executive === true
          };
          
          console.log(`[Removal] Sending removal notification to ${member.email}...`);
          const emailResult = await sendRemovalEmail(removalEmailData);
          
          if (emailResult.success) {
            console.log(`✅ [Removal] Notification email sent successfully to ${member.email}`);
          } else {
            // Email failed - add to queue for retry
            console.error(`❌ [Removal] Failed to send notification email:`, emailResult.error);
            console.log(`[Removal] Adding failed email to queue for retry...`);
            
            const { addToEmailQueue } = await import('@/lib/email-queue');
            const queueId = await addToEmailQueue({
              recipient_email: member.email,
              recipient_name: member.name,
              email_type: 'removal_notification',
              email_subject: languagePreference === 'en'
                ? `Position Removal Notification - ${member.name} | Rashtriya Hindu Vahini Sangathan`
                : `पद मुक्ति सूचना - ${member.name} | राष्ट्रीय हिन्दू वाहिनी संगठन`,
              email_data: removalEmailData,
              status: 'pending',
              priority: 5,
              retry_count: 0,
              max_retries: 5,
              related_member_id: member.id,
              created_by_admin_id: scope.adminId
            });
            
            console.log(`[Removal] Added to queue with ID ${queueId}. Will retry automatically.`);
          }
        }
      } else {
        console.warn(`[Removal] Member has no email address, skipping notification`);
      }
    } catch (emailError) {
      console.error('[Removal] Error sending removal notification (non-fatal):', emailError);
      // Don't fail the removal if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Member assignment removed successfully'
    });
  } catch (error) {
    console.error('Error removing member assignment:', error);
    return NextResponse.json({ error: 'Failed to remove member assignment' }, { status: 500 });
  }
}
