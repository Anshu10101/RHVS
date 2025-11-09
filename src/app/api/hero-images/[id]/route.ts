import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';
import { getAdminScope } from '@/lib/admin-scope';
import { consumeStagedBlob } from '@/lib/blob-storage';

// PUT - Update hero image
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const scope = await getAdminScope(request);
    const { id } = await params;
    
    // Check permissions
    if (!scope.isSuperAdmin && !scope.permissions?.includes('manage_hero_images')) {
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

    const updates: string[] = [];
    const paramsList: unknown[] = [];

    if (alt_text !== undefined) {
      updates.push('alt_text = ?');
      paramsList.push(alt_text);
    }
    if (title !== undefined) {
      updates.push('title = ?');
      paramsList.push(title || null);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      paramsList.push(description || null);
    }
    if (display_order !== undefined) {
      updates.push('display_order = ?');
      paramsList.push(display_order);
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      paramsList.push(is_active);
    }

    if (image_path !== undefined) {
      if (typeof image_path === 'string' && image_path.startsWith('/api/media/staged/')) {
        const assetId = image_path.split('/').pop();
        if (!assetId) {
          return NextResponse.json({
            success: false,
            error: 'Invalid staged asset reference'
          }, { status: 400 });
        }
        const asset = await consumeStagedBlob(assetId);
        if (!asset) {
          return NextResponse.json({
            success: false,
            error: 'Staged asset expired. Please re-upload.'
          }, { status: 400 });
        }
        updates.push('image_blob = ?');
        paramsList.push(asset.data);
        updates.push('image_mime = ?');
        paramsList.push(asset.mimeType || null);
        updates.push('image_hash = ?');
        paramsList.push(asset.hash || null);
        updates.push('image_size = ?');
        paramsList.push(asset.size ?? null);
        updates.push('image_original_name = ?');
        paramsList.push(asset.originalName || null);
        updates.push('image_path = ?');
        paramsList.push(`/api/media/hero-images/${id}`);
      } else {
        updates.push('image_path = ?');
        paramsList.push(image_path || null);
        if (!image_path) {
          updates.push('image_blob = NULL');
          updates.push('image_mime = NULL');
          updates.push('image_hash = NULL');
          updates.push('image_size = NULL');
          updates.push('image_original_name = NULL');
        }
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No changes applied'
      });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    const updateSql = `UPDATE hero_images SET ${updates.join(', ')} WHERE id = ?`;
    paramsList.push(id);
    await pool.execute(updateSql, paramsList);

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
    if (!scope.isSuperAdmin && !scope.permissions?.includes('manage_hero_images')) {
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

    // Soft delete the image
    await pool.execute(
      `UPDATE hero_images 
       SET is_active = FALSE,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [id]
    );

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
