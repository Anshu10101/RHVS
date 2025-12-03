import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { getAdminScope } from '@/lib/admin-scope';
import { z } from 'zod';
import { noCacheJsonResponse } from '@/lib/api-helpers';

// Schema for assigning a member to a post
const assignMemberSchema = z.object({
  post_id: z.number(),
  member_id: z.number(),
  level: z.enum(['national', 'state', 'district']),
  state: z.string().min(1).nullable().optional(),
  district: z.string().min(1).nullable().optional(),
  valid_until: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), // Optional custom validity end date (YYYY-MM-DD), defaults to 1 year
});

// GET all members assigned to a department
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Await params (Next.js 15 requirement)
    const params = await context.params;
    
    const scope = await getAdminScope(request);
    
    // Check if user is authenticated and is a superadmin or district admin
    if (!scope.isSuperAdmin && !scope.isDistrictAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // For district admins, check permission
    if (scope.isDistrictAdmin && !scope.isSuperAdmin) {
      const { ensurePermission } = await import('@/lib/admin-scope');
      if (!ensurePermission(scope, 'assign_members_to_departments')) {
        return NextResponse.json({ error: 'Permission denied. You do not have permission to assign members to departments.' }, { status: 403 });
      }
    }

    const departmentId = parseInt(params.id);
    
    if (isNaN(departmentId)) {
      return NextResponse.json({ error: 'Invalid department ID' }, { status: 400 });
    }

    // Check if department exists
    const department = await executeQuery('SELECT * FROM departments WHERE id = ?', [departmentId]) as any[];
    
    if (department.length === 0) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const requestedLevel = (searchParams.get('level') || '').toLowerCase();
    const validLevels = new Set(['national', 'state', 'district']);
    const stateFilter = searchParams.get('state')?.trim() || null;
    const districtFilter = searchParams.get('district')?.trim() || null;
    
    // For district admins, check if this is National Executive department (block access)
    if (scope.isDistrictAdmin && !scope.isSuperAdmin) {
      const nationalExecDept = await executeQuery(
        'SELECT id FROM departments WHERE is_national_executive = 1 LIMIT 1'
      ) as Array<{ id: number }>;
      
      if (nationalExecDept.length > 0 && nationalExecDept[0].id === departmentId) {
        return NextResponse.json({ 
          error: 'Access denied. National Executive Department assignments are restricted to superadmins only.' 
        }, { status: 403 });
      }
      
      // Get state from district admin's member record
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
      
      // For district admins viewing assignments:
      // - If viewing district level: must match their district
      // - If viewing state level: must match their state
      // - If viewing national level: allowed (but not National Executive)
      if (requestedLevel === 'district') {
        if (stateFilter !== adminState || districtFilter !== scope.districtName) {
          return NextResponse.json({ 
            error: 'District admins can only view district-level assignments for their assigned district' 
          }, { status: 403 });
        }
      } else if (requestedLevel === 'state') {
        if (stateFilter !== adminState) {
          return NextResponse.json({ 
            error: 'District admins can only view state-level assignments for their assigned state' 
          }, { status: 403 });
        }
      }
      // National level is allowed (but National Executive is already blocked above)
    }

    let levelClause = '';
    const queryParams: Array<number | string> = [departmentId];

    if (requestedLevel) {
      if (!validLevels.has(requestedLevel as any)) {
        return NextResponse.json({ error: 'Invalid level filter' }, { status: 400 });
      }

      levelClause += ' AND dm.level = ?';
      queryParams.push(requestedLevel);

      if (requestedLevel === 'state') {
        if (!stateFilter) {
          return NextResponse.json({ error: 'State filter is required for state level' }, { status: 400 });
        }
        levelClause += ' AND dm.state = ?';
        queryParams.push(stateFilter);
      } else if (requestedLevel === 'district') {
        if (!stateFilter || !districtFilter) {
          return NextResponse.json({ error: 'State and district filters are required for district level' }, { status: 400 });
        }
        levelClause += ' AND dm.state = ? AND dm.district = ?';
        queryParams.push(stateFilter, districtFilter);
      }
    }

    // Get members assigned to posts in this department (optionally filtered)
    // Only show active assignments (valid_until IS NULL or valid_until >= today)
    const members = await executeQuery(`
      SELECT dm.id, dm.post_id, dm.member_id, dm.assigned_at,
             dm.level, dm.state, dm.district,
             dm.valid_from, dm.valid_until,
             dp.name_en as post_name_en, dp.name_hi as post_name_hi, dp.position_order,
             m.name as member_name, m.email as member_email, m.member_reg_number,
             CASE 
               WHEN m.profile_photo_blob IS NOT NULL THEN CONCAT('/api/media/members/', m.id, '/profile')
               ELSE m.profile_photo_path
             END AS profile_photo_path
      FROM department_members dm
      JOIN department_posts dp ON dm.post_id = dp.id
      JOIN members m ON dm.member_id = m.id
      WHERE dm.department_id = ?${levelClause}
        AND (dm.valid_until IS NULL OR dm.valid_until >= CURDATE())
      ORDER BY dp.position_order ASC
    `, queryParams) as any[];

    return noCacheJsonResponse({ members });
  } catch (error) {
    console.error('Error fetching department members:', error);
    return NextResponse.json({ error: 'Failed to fetch department members' }, { status: 500 });
  }
}

// POST assign a member to a post
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
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
    
    if (isNaN(departmentId)) {
      return NextResponse.json({ error: 'Invalid department ID' }, { status: 400 });
    }

    // Check if department exists
    const department = await executeQuery('SELECT * FROM departments WHERE id = ?', [departmentId]) as any[];
    
    if (department.length === 0) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }
    
    // For district admins, check if this is National Executive department (not allowed)
    if (scope.isDistrictAdmin && !scope.isSuperAdmin) {
      if (department[0].is_national_executive) {
        return NextResponse.json({ 
          error: 'District admins cannot access National Executive Department' 
        }, { status: 403 });
      }
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = assignMemberSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ error: validationResult.error.format() }, { status: 400 });
    }

    const { post_id, member_id, valid_until: customValidUntil } = validationResult.data;
    
    // Calculate validity dates: default to 1 year from now, or use custom date
    const assignedAt = new Date();
    const validFrom = assignedAt.toISOString().split('T')[0]; // YYYY-MM-DD
    
    let validUntil: string;
    if (customValidUntil) {
      // Validate custom date is in the future
      const customDate = new Date(customValidUntil);
      if (customDate <= assignedAt) {
        return NextResponse.json({ 
          error: 'valid_until must be a future date' 
        }, { status: 400 });
      }
      validUntil = customValidUntil;
    } else {
      // Default: 1 year from assignment date
      const oneYearLater = new Date(assignedAt);
      oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
      validUntil = oneYearLater.toISOString().split('T')[0]; // YYYY-MM-DD
    }

    // Check if post exists and belongs to this department
    const post = await executeQuery(
      'SELECT * FROM department_posts WHERE id = ? AND department_id = ?',
      [post_id, departmentId]
    ) as any[];
    
    if (post.length === 0) {
      return NextResponse.json({ error: 'Post not found in this department' }, { status: 404 });
    }

    const postData = post[0];
    const isPresidentPost = postData.position_order === 1;

    // Check if member exists
    const member = await executeQuery('SELECT * FROM members WHERE id = ?', [member_id]) as any[];
    
    if (member.length === 0) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    let { level, state, district } = validationResult.data;
    
    // For district admins, check permission and enforce restrictions
    if (scope.isDistrictAdmin && !scope.isSuperAdmin) {
      const { ensurePermission } = await import('@/lib/admin-scope');
      if (!ensurePermission(scope, 'assign_members_to_departments')) {
        return NextResponse.json({ 
          error: 'Permission denied. You do not have permission to assign members to departments.' 
        }, { status: 403 });
      }
      
      // Block National Executive Department assignments
      const nationalExecDept = await executeQuery(
        'SELECT id FROM departments WHERE is_national_executive = 1 LIMIT 1'
      ) as Array<{ id: number }>;
      
      if (nationalExecDept.length > 0 && nationalExecDept[0].id === departmentId) {
        return NextResponse.json({ 
          error: 'Access denied. National Executive Department assignments are restricted to superadmins only.' 
        }, { status: 403 });
      }
      
      // Get state from district admin's member record
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
      
      // Enforce level-specific restrictions for district admins
      if (level === 'district') {
        // Must be their district
        if (scope.districtName && district !== scope.districtName) {
          return NextResponse.json({ 
            error: 'District admins can only assign members to their assigned district' 
          }, { status: 403 });
        }
        if (adminState && state !== adminState) {
          return NextResponse.json({ 
            error: 'District admins can only assign members to their assigned state' 
          }, { status: 403 });
        }
        // Override with district admin's assigned district and state
        if (scope.districtName) {
          district = scope.districtName;
        }
        if (adminState) {
          state = adminState;
        }
      } else if (level === 'state') {
        // Must be their state
        if (adminState && state !== adminState) {
          return NextResponse.json({ 
            error: 'District admins can only assign members to their assigned state' 
          }, { status: 403 });
        }
        // Override with district admin's state
        if (adminState) {
          state = adminState;
        }
        // District must be null for state level
        district = null;
      } else if (level === 'national') {
        // National level is allowed (but not National Executive, which is already blocked above)
        state = null;
        district = null;
      }
    }
    
    const normalizedState = level === 'national' ? null : (state ?? null);
    const normalizedDistrict = level === 'district' ? (district ?? null) : null;

    // For President post: only allow ONE member assignment. Must remove existing before assigning new one.
    if (isPresidentPost) {
      const existingPresidentAssignment = await executeQuery(
        'SELECT * FROM department_members WHERE department_id = ? AND post_id = ? AND level = ? AND state <=> ? AND district <=> ?',
        [departmentId, post_id, level, normalizedState, normalizedDistrict]
      ) as any[];
      
      if (existingPresidentAssignment.length > 0) {
        // Check if trying to assign the same member (allowed for replacement)
        const isSameMember = existingPresidentAssignment[0].member_id === member_id;
        if (!isSameMember) {
          return NextResponse.json({ 
            error: 'President post can only have one member. Please remove the existing president assignment before assigning a new member.' 
          }, { status: 409 });
        }
      }
    }

    // Validate level-specific requirements
    if (level === 'national' && (state || district)) {
      return NextResponse.json({ 
        error: 'National level assignments cannot have state or district' 
      }, { status: 400 });
    }

    if (level === 'state' && (!state || district)) {
      return NextResponse.json({ 
        error: 'State level assignments require state but cannot have district' 
      }, { status: 400 });
    }

    if (level === 'district' && (!state || !district)) {
      return NextResponse.json({ 
        error: 'District level assignments require both state and district' 
      }, { status: 400 });
    }

    // Check if member belongs to the specified state/district
    if (level === 'state' || level === 'district') {
      const memberLocation = await executeQuery(
        'SELECT state, district FROM members WHERE id = ?',
        [member_id]
      ) as any[];

      if (memberLocation[0].state !== state) {
        return NextResponse.json({ 
          error: 'Member does not belong to the specified state' 
        }, { status: 400 });
      }

      if (level === 'district' && memberLocation[0].district !== district) {
        return NextResponse.json({ 
          error: 'Member does not belong to the specified district' 
        }, { status: 400 });
      }
    }

    // Check if this specific member is already assigned to this SAME post at this EXACT level/state/district
    // This prevents duplicate assignments to the exact same post (regardless of department type or level)
    // Members can be assigned to DIFFERENT posts in the same department, but NOT to the same post twice
    const existingAssignment = await executeQuery(
      'SELECT * FROM department_members WHERE department_id = ? AND post_id = ? AND member_id = ? AND level = ? AND state <=> ? AND district <=> ?',
      [departmentId, post_id, member_id, level, normalizedState, normalizedDistrict]
    ) as any[];
    
    if (existingAssignment.length > 0) {
      return NextResponse.json({ 
        error: 'This member is already assigned to this specific post at this level. A member cannot be assigned to the same post twice. You can assign them to a different post in the same department instead.' 
      }, { status: 409 });
    }
    
    console.log(`[Appointment] Member ${member_id} is not assigned to post ${post_id} at ${level} level - proceeding with assignment check`);

    // Check if member is already assigned to another post in this department at this EXACT level/state/district
    // Allow multiple post assignments for same member in same department ONLY at:
    // - National Executive departments (is_national_executive = 1)
    // - National level
    // - State level
    // District level: Only one post per member per department (restriction remains)
    const isNationalExecutive = department[0].is_national_executive === 1 || department[0].is_national_executive === true || department[0].is_national_executive === '1';
    const allowsMultiplePosts = isNationalExecutive || level === 'national' || level === 'state';
    
    console.log(`[Appointment] Department ID: ${departmentId}, is_national_executive: ${department[0].is_national_executive}, level: ${level}, allowsMultiplePosts: ${allowsMultiplePosts}`);
    
    if (!allowsMultiplePosts) {
      // For district level (and non-National Executive departments), enforce one post per member per department
    const memberInDepartment = await executeQuery(
      'SELECT * FROM department_members WHERE department_id = ? AND member_id = ? AND level = ? AND state <=> ? AND district <=> ?',
      [departmentId, member_id, level, normalizedState, normalizedDistrict]
    ) as any[];
    
    if (memberInDepartment.length > 0) {
      return NextResponse.json({ 
          error: 'This member is already assigned to another post in this department at this level. Multiple post assignments are only allowed at national level, state level, or in National Executive departments.' 
      }, { status: 409 });
      }
    } else {
      // If allowsMultiplePosts is true, explicitly allow multiple post assignments
      // Only check that it's not the exact same post (already checked above)
      console.log(`[Appointment] Allowing multiple post assignments for member ${member_id} in department ${departmentId} at ${level} level`);
    }

    // Assign the member to the post
    // assigned_by must be a district_admin ID (FK constraint), so set to NULL for superadmins
    const assignedById = scope.isSuperAdmin ? null : scope.adminId;
    
    let result: any;
    try {
      result = await executeQuery(
      'INSERT INTO department_members (department_id, post_id, member_id, level, state, district, assigned_by, valid_from, valid_until) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [departmentId, post_id, member_id, level, normalizedState, normalizedDistrict, assignedById, validFrom, validUntil]
    ) as any;
      
      console.log(`[Appointment] Successfully assigned member ${member_id} to post ${post_id} in department ${departmentId} at ${level} level`);
    } catch (insertError: any) {
      console.error(`[Appointment] Error inserting assignment:`, insertError);
      
      // Check if it's a duplicate key error from the database constraint
      const errorMessage = insertError?.message || insertError?.toString() || '';
      const isDuplicateError = insertError?.code === 'ER_DUP_ENTRY' || 
                               errorMessage.includes('Duplicate entry') || 
                               errorMessage.includes('unique_member_in_dept_level') ||
                               errorMessage.includes('Duplicate key');
      
      if (isDuplicateError) {
        // Check if it's a duplicate of the same post (unique_member_assignment constraint)
        // vs duplicate member in department (unique_member_in_dept_level constraint)
        if (errorMessage.includes('unique_member_assignment')) {
          // This is the constraint on (department_id, post_id, level, state, district)
          // which prevents assigning the same member to the same post twice - this is correct behavior
          return NextResponse.json({ 
            error: 'This member is already assigned to this specific post at this level. A member cannot be assigned to the same post twice. You can assign them to a different post in the same department instead.' 
          }, { status: 409 });
        }
        
        // If we're allowing multiple posts but still getting a duplicate error from unique_member_in_dept_level,
        // it means the database constraint still exists and needs to be removed
        if (allowsMultiplePosts) {
          return NextResponse.json({ 
            error: 'Database constraint error: The unique constraint on department_members table still exists. Please run the migration script to remove it: ALTER TABLE department_members DROP INDEX IF EXISTS unique_member_in_dept_level;',
            details: errorMessage,
            hint: 'Run this SQL: ALTER TABLE department_members DROP INDEX IF EXISTS unique_member_in_dept_level;'
          }, { status: 500 });
        } else {
          return NextResponse.json({ 
            error: 'This member is already assigned to another post in this department at this level. Multiple post assignments are only allowed at national level, state level, or in National Executive departments.' 
          }, { status: 409 });
        }
      }
      
      // Re-throw other errors
      throw insertError;
    }

    // Generate certificate automatically
    try {
      // Import certificate generation function directly instead of HTTP call
      const { generateAppointmentCertificate } = await import('@/lib/certificate-generator');
      const { sendCertificateEmail } = await import('@/lib/email-service');
      const { generateIDCard } = await import('@/lib/id-card-generator');
      const { getStateLanguagePreference } = await import('@/lib/language-preference');
      
      // Get member details
      const member = await executeQuery(
        'SELECT * FROM members WHERE id = ? AND status = "verified"',
        [member_id]
      ) as Array<{
        id: number;
        name: string;
        member_reg_number: string;
        email: string;
        address: string | null;
        profile_photo_path: string | null;
        state: string | null;
      }>;

      if (member.length === 0) {
        console.warn('Member not found or not verified, skipping certificate generation');
        // Continue to return success response below
      } else {
        // Get department and post details (including is_national_executive flag and print_as fields)
        // print_as contains the complete designation (post + department) if provided
        const departmentPost = await executeQuery(`
          SELECT d.name_en as dept_name_en, d.name_hi as dept_name_hi,
                 dp.name_en as post_name_en, dp.name_hi as post_name_hi,
                 dp.print_as_name_en, dp.print_as_name_hi,
                 d.is_national_executive
          FROM departments d
          JOIN department_posts dp ON d.id = dp.department_id
          WHERE d.id = ? AND dp.id = ?
        `, [departmentId, post_id]) as Array<{
          dept_name_en: string | null;
          dept_name_hi: string | null;
          post_name_en: string | null;
          post_name_hi: string | null;
          print_as_name_en: string | null;
          print_as_name_hi: string | null;
          is_national_executive: number | boolean | null;
        }>;

        if (departmentPost.length === 0) {
          console.warn('Department or post not found, skipping certificate generation');
        } else {
          // Generate certificate number
          const certificateNumber = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
          const appointmentDate = new Date().toISOString().split('T')[0];

          // Get language preference
          const languagePreference = await getStateLanguagePreference({
            stateName: member[0].state ?? state ?? null
          });

          // Generate certificate (with validity dates)
          const certificatePath = await generateAppointmentCertificate({
            member: {
              ...member[0],
              profile_photo_path: member[0].profile_photo_path ?? undefined,
              state: member[0].state ?? undefined,
              district: undefined
            },
            department: {
              dept_name_en: departmentPost[0].dept_name_en ?? '',
              dept_name_hi: departmentPost[0].dept_name_hi ?? '',
              post_name_en: departmentPost[0].post_name_en ?? '',
              post_name_hi: departmentPost[0].post_name_hi ?? '',
              print_as_name_en: departmentPost[0].print_as_name_en,
              print_as_name_hi: departmentPost[0].print_as_name_hi,
              is_national_executive: departmentPost[0].is_national_executive === 1 || departmentPost[0].is_national_executive === true
            },
            level,
            state,
            district,
            appointment_date: appointmentDate,
            certificate_number: certificateNumber,
            language: languagePreference,
            valid_from: validFrom,
            valid_until: validUntil
          });

          // Generate ID card
          let appointmentIdCardPath: string | null = null;
          try {
            // Determine print_as value if available
            const printAsName = languagePreference === 'hi'
              ? (departmentPost[0].print_as_name_hi?.trim() || null)
              : (departmentPost[0].print_as_name_en?.trim() || null);
            
            const idCardResult = await generateIDCard({
              memberId: member_id,
              memberName: member[0].name,
              memberRegNumber: member[0].member_reg_number,
              profilePhotoPath: member[0].profile_photo_path ?? undefined,
              address: member[0].address ?? undefined,
              designation: languagePreference === 'hi'
                ? (departmentPost[0].post_name_hi || departmentPost[0].post_name_en || undefined)
                : (departmentPost[0].post_name_en || departmentPost[0].post_name_hi || undefined),
              cardType: 'appointment',
              departmentName: languagePreference === 'hi'
                ? (departmentPost[0].dept_name_hi || departmentPost[0].dept_name_en || undefined)
                : (departmentPost[0].dept_name_en || departmentPost[0].dept_name_hi || undefined),
              isNationalExecutive: departmentPost[0].is_national_executive === 1 || departmentPost[0].is_national_executive === true,
              postName: languagePreference === 'hi'
                ? (departmentPost[0].post_name_hi || departmentPost[0].post_name_en || undefined)
                : (departmentPost[0].post_name_en || departmentPost[0].post_name_hi || undefined),
              printAsName: printAsName || undefined,
              level,
              state,
              district,
              appointmentDate,
              language: languagePreference,
              valid_from: validFrom,
              valid_until: validUntil
            });
            appointmentIdCardPath = idCardResult.idCardPath;
          } catch (idCardError) {
            console.warn('ID card generation failed, continuing without it:', idCardError);
          }

          // Save certificate record (including ID card path)
          const certResult = await executeQuery(`
            INSERT INTO certificates 
            (member_id, department_id, post_id, level, state, district, certificate_number, appointment_date, generated_by, certificate_path, id_card_path)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            member_id, departmentId, post_id, level, state, district, 
            certificateNumber, appointmentDate, scope.adminId, certificatePath, appointmentIdCardPath
          ]) as { insertId: number };

          // Send email
          try {
            const emailData = {
              to: member[0].email,
              memberName: member[0].name,
              memberRegNumber: member[0].member_reg_number,
              departmentName: languagePreference === 'hi'
                ? (departmentPost[0].dept_name_hi || departmentPost[0].dept_name_en || '')
                : (departmentPost[0].dept_name_en || departmentPost[0].dept_name_hi || ''),
              postName: languagePreference === 'hi'
                ? (departmentPost[0].post_name_hi || departmentPost[0].post_name_en || '')
                : (departmentPost[0].post_name_en || departmentPost[0].post_name_hi || ''),
              level,
              state: state || undefined,
              district: district || undefined,
              certificatePath,
              appointmentDate,
              certificateNumber,
              idCardPath: appointmentIdCardPath || undefined,
              language: languagePreference,
            };

            const emailResult = await sendCertificateEmail(emailData);
            if (emailResult.success) {
              console.log('✅ Certificate email sent automatically:', emailResult.messageId);
              await executeQuery(`
                UPDATE certificates 
                SET email_status = 'sent', email_sent_at = NOW(), status = 'emailed'
                WHERE id = ?
              `, [certResult.insertId]);
            } else {
              console.error('❌ Failed to send certificate email:', emailResult.error);
            }
          } catch (emailError) {
            console.error('❌ Error sending certificate email:', emailError);
          }

          console.log('✅ Certificate generated automatically:', certResult.insertId);
        }
      }
    } catch (error) {
      console.error('❌ Error generating certificate automatically:', error);
      // Don't fail the assignment if certificate generation fails
    }

    return noCacheJsonResponse({
      success: true,
      assignment_id: result.insertId,
      message: 'Member assigned to post successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error assigning member to department post:', error);
    return NextResponse.json({ error: 'Failed to assign member to department post' }, { status: 500 });
  }
}
