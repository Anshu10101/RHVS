import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { getAdminScope } from '@/lib/admin-scope';
import { z } from 'zod';

// Schema for updating a post
const updatePostSchema = z.object({
  name_en: z.string().min(2, 'English name is required and must be at least 2 characters'),
  name_hi: z.string().min(2, 'Hindi name is required and must be at least 2 characters'),
  print_as_name_en: z.string().optional().nullable(), // Optional print-as name in English
  print_as_name_hi: z.string().optional().nullable(), // Optional print-as name in Hindi
});

// GET a specific post
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string; postId: string }> }
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
    const postId = parseInt(params.postId);
    
    if (isNaN(departmentId) || isNaN(postId)) {
      return NextResponse.json({ error: 'Invalid department or post ID' }, { status: 400 });
    }

    // Get the post
    const post = await executeQuery(
      'SELECT * FROM department_posts WHERE id = ? AND department_id = ?',
      [postId, departmentId]
    ) as any[];
    
    if (post.length === 0) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({ post: post[0] });
  } catch (error) {
    console.error('Error fetching department post:', error);
    return NextResponse.json({ error: 'Failed to fetch department post' }, { status: 500 });
  }
}

// PATCH update a post
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; postId: string }> }
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
    const postId = parseInt(params.postId);
    
    if (isNaN(departmentId) || isNaN(postId)) {
      return NextResponse.json({ error: 'Invalid department or post ID' }, { status: 400 });
    }

    // Check if post exists
    const postCheck = await executeQuery(
      'SELECT * FROM department_posts WHERE id = ? AND department_id = ?',
      [postId, departmentId]
    ) as any[];
    
    if (postCheck.length === 0) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updatePostSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ error: validationResult.error.format() }, { status: 400 });
    }

    const { name_en, name_hi, print_as_name_en, print_as_name_hi } = validationResult.data;

    // Update the post (print_as fields can be NULL to use default format)
    await executeQuery(
      'UPDATE department_posts SET name_en = ?, name_hi = ?, print_as_name_en = ?, print_as_name_hi = ? WHERE id = ? AND department_id = ?',
      [name_en, name_hi, print_as_name_en?.trim() || null, print_as_name_hi?.trim() || null, postId, departmentId]
    );

    return NextResponse.json({
      success: true,
      message: 'Post updated successfully'
    });
  } catch (error) {
    console.error('Error updating department post:', error);
    return NextResponse.json({ error: 'Failed to update department post' }, { status: 500 });
  }
}

// DELETE a post
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; postId: string }> }
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
    const postId = parseInt(params.postId);
    
    if (isNaN(departmentId) || isNaN(postId)) {
      return NextResponse.json({ error: 'Invalid department or post ID' }, { status: 400 });
    }

    // Check if post exists
    const post = await executeQuery(
      'SELECT * FROM department_posts WHERE id = ? AND department_id = ?',
      [postId, departmentId]
    ) as any[];
    
    if (post.length === 0) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Check if this is the president post (position_order = 1)
    if (post[0].position_order === 1) {
      return NextResponse.json({ 
        error: 'Cannot delete the president post' 
      }, { status: 400 });
    }

    // Check if post has an assigned member
    const assignedMember = await executeQuery(
      'SELECT * FROM department_members WHERE post_id = ?',
      [postId]
    ) as any[];
    
    if (assignedMember.length > 0) {
      // Remove the member assignment first
      await executeQuery(
        'DELETE FROM department_members WHERE post_id = ?',
        [postId]
      );
    }

    // Delete the post
    await executeQuery(
      'DELETE FROM department_posts WHERE id = ? AND department_id = ?',
      [postId, departmentId]
    );

    // Reorder the remaining posts to ensure continuity
    const remainingPosts = await executeQuery(
      'SELECT id, position_order FROM department_posts WHERE department_id = ? ORDER BY position_order ASC',
      [departmentId]
    ) as any[];

    // Update each post's position
    for (let i = 0; i < remainingPosts.length; i++) {
      const newOrder = i + 1;
      if (remainingPosts[i].position_order !== newOrder) {
        await executeQuery(
          'UPDATE department_posts SET position_order = ? WHERE id = ?',
          [newOrder, remainingPosts[i].id]
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting department post:', error);
    return NextResponse.json({ error: 'Failed to delete department post' }, { status: 500 });
  }
}
