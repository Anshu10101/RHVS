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

    // Get all members assigned to posts in this department
    const members = await executeQuery(`
      SELECT dm.id, dm.post_id, dm.member_id, dm.assigned_at,
             dm.level, dm.state, dm.district,
             dp.name_en as post_name_en, dp.name_hi as post_name_hi, dp.position_order,
             m.name as member_name, m.email as member_email, m.member_reg_number,
             m.profile_photo_path
      FROM department_members dm
      JOIN department_posts dp ON dm.post_id = dp.id
      JOIN members m ON dm.member_id = m.id
      WHERE dm.department_id = ?
      ORDER BY dp.position_order ASC
    `, [departmentId]) as any[];

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

    // Check if member exists
    const member = await executeQuery('SELECT * FROM members WHERE id = ?', [member_id]) as any[];
    
    if (member.length === 0) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const { level, state, district } = validationResult.data;

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

    // Check if post already has a member assigned at this level/state/district
    const existingAssignment = await executeQuery(
      'SELECT * FROM department_members WHERE department_id = ? AND post_id = ? AND level = ? AND (state = ? OR state IS NULL) AND (district = ? OR district IS NULL)',
      [departmentId, post_id, level, state, district]
    ) as any[];
    
    if (existingAssignment.length > 0) {
      return NextResponse.json({ 
        error: 'This post already has a member assigned at this level. Remove the current assignment first.' 
      }, { status: 409 });
    }

    // Check if member is already assigned to another post in this department at this level/state/district
    const memberInDepartment = await executeQuery(
      'SELECT * FROM department_members WHERE department_id = ? AND member_id = ? AND level = ? AND (state = ? OR state IS NULL) AND (district = ? OR district IS NULL)',
      [departmentId, member_id, level, state, district]
    ) as any[];
    
    if (memberInDepartment.length > 0) {
      return NextResponse.json({ 
        error: 'This member is already assigned to another post in this department at this level' 
      }, { status: 409 });
    }

    // Assign the member to the post
    const result = await executeQuery(
      'INSERT INTO department_members (department_id, post_id, member_id, level, state, district, assigned_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [departmentId, post_id, member_id, level, state, district, scope.adminId]
    ) as any;

    // Generate certificate automatically
    try {
      const certificateResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/certificates/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': request.headers.get('cookie') || '',
        },
        body: JSON.stringify({
          member_id,
          department_id: departmentId,
          post_id,
          level,
          state,
          district,
          appointment_date: new Date().toISOString().split('T')[0],
        }),
      });

      if (certificateResponse.ok) {
        const certificateData = await certificateResponse.json();
        console.log('Certificate generated automatically:', certificateData.certificate_id);
      } else {
        console.error('Failed to generate certificate automatically:', await certificateResponse.text());
      }
    } catch (error) {
      console.error('Error generating certificate automatically:', error);
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
