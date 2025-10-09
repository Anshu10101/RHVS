import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { getAdminScope } from '@/lib/admin-scope';
import { z } from 'zod';

// Schema for creating a post
const createPostSchema = z.object({
  name_en: z.string().min(2, 'English name is required and must be at least 2 characters'),
  name_hi: z.string().min(2, 'Hindi name is required and must be at least 2 characters'),
  position_order: z.number().optional(), // Optional because it will be auto-assigned for new posts
});

// Schema for updating posts order
const updatePostsOrderSchema = z.array(
  z.object({
    id: z.number(),
    position_order: z.number(),
  })
);

// GET all posts for a department
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

    // Get all posts for the department, ordered by position
    const posts = await executeQuery(
      'SELECT * FROM department_posts WHERE department_id = ? ORDER BY position_order ASC',
      [departmentId]
    ) as any[];

    return NextResponse.json({ posts });
  } catch (error) {
    console.error('Error fetching department posts:', error);
    return NextResponse.json({ error: 'Failed to fetch department posts' }, { status: 500 });
  }
}

// POST create a new post in a department
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
    const validationResult = createPostSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ error: validationResult.error.format() }, { status: 400 });
    }

    const { name_en, name_hi } = validationResult.data;

    // Get the current max position_order
    const maxPositionResult = await executeQuery(
      'SELECT MAX(position_order) as max_position FROM department_posts WHERE department_id = ?',
      [departmentId]
    ) as any[];
    
    const maxPosition = maxPositionResult[0].max_position || 0;
    const newPosition = maxPosition + 1;

    // For the first post (president), ensure position_order is 1
    const isFirstPost = newPosition === 1;
    const position_order = isFirstPost ? 1 : newPosition;

    // Insert the new post
    const result = await executeQuery(
      'INSERT INTO department_posts (department_id, name_en, name_hi, position_order) VALUES (?, ?, ?, ?)',
      [departmentId, name_en, name_hi, position_order]
    ) as any;

    return NextResponse.json({
      success: true,
      post_id: result.insertId,
      position_order,
      message: 'Post created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating department post:', error);
    return NextResponse.json({ error: 'Failed to create department post' }, { status: 500 });
  }
}

// PUT update posts order
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  console.log('PUT /api/departments/[id]/posts - Starting');
  
  try {
    // Await params (Next.js 15 requirement)
    const params = await context.params;
    
    console.log('Getting admin scope...');
    const scope = await getAdminScope(request);
    console.log('Admin scope:', scope);
    
    // Check if user is authenticated and is a superadmin
    if (!scope.isSuperAdmin) {
      console.log('Unauthorized - not superadmin');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const departmentId = parseInt(params.id);
    console.log('Department ID:', departmentId);
    
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
    console.log('Received posts for reordering:', body);
    
    const validationResult = updatePostsOrderSchema.safeParse(body);

    if (!validationResult.success) {
      console.error('Validation failed:', validationResult.error);
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validationResult.error.format() 
      }, { status: 400 });
    }

    const posts = validationResult.data;

    // Check if president post (position_order 1) is being changed
    const presidentPost = await executeQuery(
      'SELECT id FROM department_posts WHERE department_id = ? AND position_order = 1',
      [departmentId]
    ) as any[];

    if (presidentPost.length > 0) {
      const presidentId = presidentPost[0].id;
      const presidentInUpdate = posts.find(post => post.id === presidentId);
      
      if (presidentInUpdate && presidentInUpdate.position_order !== 1) {
        return NextResponse.json({ 
          error: 'Cannot change the position of the president post' 
        }, { status: 400 });
      }
    }

    // First, move all positions to temporary negative values to avoid conflicts
    console.log('Moving to temporary positions...');
    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      await executeQuery(
        'UPDATE department_posts SET position_order = ? WHERE id = ? AND department_id = ?',
        [-(i + 1), post.id, departmentId]
      );
    }

    // Then update to final positions
    console.log('Updating to final positions...');
    for (const post of posts) {
      console.log(`Updating post ${post.id} to position ${post.position_order}`);
      await executeQuery(
        'UPDATE department_posts SET position_order = ? WHERE id = ? AND department_id = ?',
        [post.position_order, post.id, departmentId]
      );
    }

    console.log('Posts reordered successfully');
    return NextResponse.json({
      success: true,
      message: 'Posts order updated successfully'
    });
  } catch (error) {
    console.error('Error updating department posts order:', error);
    console.error('Error details:', error);
    return NextResponse.json({ 
      error: 'Failed to update department posts order',
      message: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
