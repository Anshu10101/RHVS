import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';
import { getAdminScope } from '@/lib/admin-scope';
import fs from 'fs';
import path from 'path';

// PUT - Update hero image
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const scope = await getAdminScope(request);
    const { id } = await params;
    
    // Check permissions
    if (!scope.isSuperAdmin && !scope.permissions.includes('manage_hero_images')) {
      return NextResponse.json({
        success: false,
        error: 'Insufficient permissions'
      }, { status: 403 });
    }

    const body = await request.json();
    const { image_path, alt_text, title, description, display_order, is_active } = body;

    // Check if image exists and user has permission to edit it
    const [existingRows] = await pool.execute(
      'SELECT id, added_by, district_id FROM hero_images WHERE id = ?',
      [id]
    );

    if ((existingRows as any[]).length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Hero image not found'
      }, { status: 404 });
    }

    const existingImage = (existingRows as any[])[0];

    // District admins can only edit their own images or global images
    if (scope.isDistrictAdmin && !scope.isSuperAdmin) {
      // For now, allow district admins to edit any image
      // TODO: Implement proper district-based filtering when district_id is available
    }

    // Update the image
    await pool.execute(
      `UPDATE hero_images 
       SET image_path = COALESCE(?, image_path),
           alt_text = COALESCE(?, alt_text),
           title = ?,
           description = ?,
           display_order = COALESCE(?, display_order),
           is_active = COALESCE(?, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        image_path,
        alt_text,
        title || null,
        description || null,
        display_order,
        is_active,
        id
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Hero image updated successfully'
    });

  } catch (error) {
    console.error('Error updating hero image:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update hero image'
    }, { status: 500 });
  }
}

// DELETE - Delete hero image
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const scope = await getAdminScope(request);
    const { id } = await params;
    
    // Check permissions
    if (!scope.isSuperAdmin && !scope.permissions.includes('manage_hero_images')) {
      return NextResponse.json({
        success: false,
        error: 'Insufficient permissions'
      }, { status: 403 });
    }

    // Check if image exists and user has permission to delete it
    const [existingRows] = await pool.execute(
      'SELECT id, added_by, district_id FROM hero_images WHERE id = ?',
      [id]
    );

    if ((existingRows as any[]).length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Hero image not found'
      }, { status: 404 });
    }

    const existingImage = (existingRows as any[])[0];

    // District admins can only delete their own images or global images
    if (scope.isDistrictAdmin && !scope.isSuperAdmin) {
      // For now, allow district admins to delete any image
      // TODO: Implement proper district-based filtering when district_id is available
    }

    // Get the image path before deleting
    const [imageRows] = await pool.execute(
      'SELECT image_path FROM hero_images WHERE id = ?',
      [id]
    );

    // Soft delete the image
    await pool.execute(
      'UPDATE hero_images SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );

    // Optionally delete the physical file
    if ((imageRows as any[]).length > 0) {
      const imagePath = (imageRows as any[])[0].image_path;
      if (imagePath && imagePath.startsWith('/uploads/')) {
        try {
          const fullPath = path.join(process.cwd(), 'public', imagePath);
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
          }
        } catch (fileError) {
          console.error('Error deleting file:', fileError);
          // Don't fail the request if file deletion fails
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Hero image deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting hero image:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete hero image'
    }, { status: 500 });
  }
}
