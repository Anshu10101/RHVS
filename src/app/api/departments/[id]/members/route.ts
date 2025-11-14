import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { getAdminScope } from '@/lib/admin-scope';
import { z } from 'zod';

// Schema for assigning a member to a post
const assignMemberSchema = z.object({
  post_id: z.number(),
  member_id: z.number(),
  level: z.enum(['national', 'state', 'district']),
  state: z.string().min(1).nullable().optional(),
  district: z.string().min(1).nullable().optional(),
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
    
    // Check if user is authenticated and is a superadmin
    if (!scope.isSuperAdmin) {
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

    const searchParams = request.nextUrl.searchParams;
    const requestedLevel = (searchParams.get('level') || '').toLowerCase();
    const validLevels = new Set(['national', 'state', 'district']);
    const stateFilter = searchParams.get('state')?.trim() || null;
    const districtFilter = searchParams.get('district')?.trim() || null;

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
    const members = await executeQuery(`
      SELECT dm.id, dm.post_id, dm.member_id, dm.assigned_at,
             dm.level, dm.state, dm.district,
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
      ORDER BY dp.position_order ASC
    `, queryParams) as any[];

    return NextResponse.json({ members });
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
    
    // Check if user is authenticated and is a superadmin
    if (!scope.isSuperAdmin) {
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

    // Parse and validate request body
    const body = await request.json();
    const validationResult = assignMemberSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ error: validationResult.error.format() }, { status: 400 });
    }

    const { post_id, member_id } = validationResult.data;

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

    const { level, state, district } = validationResult.data;
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

    // Check if this specific member is already assigned to this same post at this level/state/district
    const existingAssignment = await executeQuery(
      'SELECT * FROM department_members WHERE department_id = ? AND post_id = ? AND member_id = ? AND level = ? AND state <=> ? AND district <=> ?',
      [departmentId, post_id, member_id, level, normalizedState, normalizedDistrict]
    ) as any[];
    
    if (existingAssignment.length > 0) {
      return NextResponse.json({ 
        error: 'This member is already assigned to this post at this level.' 
      }, { status: 409 });
    }

    // Check if member is already assigned to another post in this department at this level/state/district
    const memberInDepartment = await executeQuery(
      'SELECT * FROM department_members WHERE department_id = ? AND member_id = ? AND level = ? AND state <=> ? AND district <=> ?',
      [departmentId, member_id, level, normalizedState, normalizedDistrict]
    ) as any[];
    
    if (memberInDepartment.length > 0) {
      return NextResponse.json({ 
        error: 'This member is already assigned to another post in this department at this level' 
      }, { status: 409 });
    }

    // Assign the member to the post
    const result = await executeQuery(
      'INSERT INTO department_members (department_id, post_id, member_id, level, state, district, assigned_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [departmentId, post_id, member_id, level, normalizedState, normalizedDistrict, scope.adminId]
    ) as any;

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
        // Get department and post details
        const departmentPost = await executeQuery(`
          SELECT d.name_en as dept_name_en, d.name_hi as dept_name_hi,
                 dp.name_en as post_name_en, dp.name_hi as post_name_hi
          FROM departments d
          JOIN department_posts dp ON d.id = dp.department_id
          WHERE d.id = ? AND dp.id = ?
        `, [departmentId, post_id]) as Array<{
          dept_name_en: string | null;
          dept_name_hi: string | null;
          post_name_en: string | null;
          post_name_hi: string | null;
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

          // Generate certificate
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
              post_name_hi: departmentPost[0].post_name_hi ?? ''
            },
            level,
            state,
            district,
            appointment_date: appointmentDate,
            certificate_number: certificateNumber,
            language: languagePreference
          });

          // Generate ID card
          let appointmentIdCardPath: string | null = null;
          try {
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
              postName: languagePreference === 'hi'
                ? (departmentPost[0].post_name_hi || departmentPost[0].post_name_en || undefined)
                : (departmentPost[0].post_name_en || departmentPost[0].post_name_hi || undefined),
              level,
              state,
              district,
              appointmentDate,
              language: languagePreference
            });
            appointmentIdCardPath = idCardResult.idCardPath;
          } catch (idCardError) {
            console.warn('ID card generation failed, continuing without it:', idCardError);
          }

          // Save certificate record
          const certResult = await executeQuery(`
            INSERT INTO certificates 
            (member_id, department_id, post_id, level, state, district, certificate_number, appointment_date, generated_by, certificate_path)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            member_id, departmentId, post_id, level, state, district, 
            certificateNumber, appointmentDate, scope.adminId, certificatePath
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

    return NextResponse.json({
      success: true,
      assignment_id: result.insertId,
      message: 'Member assigned to post successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error assigning member to department post:', error);
    return NextResponse.json({ error: 'Failed to assign member to department post' }, { status: 500 });
  }
}
