import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminJwt, getAdminToken } from '@/lib/auth-jwt';
import { executeQuery } from '@/lib/database';
import fs from 'fs';
import path from 'path';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin authentication
    const token = getAdminToken(request);
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const admin = await verifyAdminJwt(token);
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id: photoId } = await params;

    // Get photo details before deletion
    const photoResult = await executeQuery(
      'SELECT file_path, thumbnail_path, medium_path, event_id FROM photos WHERE id = ?',
      [photoId]
    );

    if (!photoResult || !Array.isArray(photoResult) || photoResult.length === 0) {
      return NextResponse.json({ success: false, error: 'Photo not found' }, { status: 404 });
    }

    const photo = photoResult[0] as { file_path?: string; thumbnail_path?: string; medium_path?: string; event_id?: string };

    // Delete the photo record from database
    await executeQuery(
      'DELETE FROM photos WHERE id = ?',
      [photoId]
    );

    // Update photo_events photo count if this photo belonged to a photo event
    // Note: The 'events' table doesn't have photo_count, but 'photo_events' table might
    // We'll skip this update since photo counts can be calculated on-the-fly
    // If you need photo counts, add a photo_count column to photo_events table or calculate dynamically

    // Delete physical files
    try {
      if (photo.file_path) {
        const filePath = path.join(process.cwd(), 'public', photo.file_path);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      
      if (photo.thumbnail_path) {
        const thumbnailPath = path.join(process.cwd(), 'public', photo.thumbnail_path);
        if (fs.existsSync(thumbnailPath)) {
          fs.unlinkSync(thumbnailPath);
        }
      }
      
      if (photo.medium_path) {
        const mediumPath = path.join(process.cwd(), 'public', photo.medium_path);
        if (fs.existsSync(mediumPath)) {
          fs.unlinkSync(mediumPath);
        }
      }
    } catch (fileError) {
      console.error('Error deleting physical files:', fileError);
      // Continue even if file deletion fails
    }

    return NextResponse.json({
      success: true,
      message: 'Photo deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting photo:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete photo'
    }, { status: 500 });
  }
}
