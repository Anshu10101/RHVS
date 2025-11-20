import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminJwt } from '@/lib/auth-jwt';
import { executeQuery } from '@/lib/database';

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('admin_session')?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const claims = await verifyAdminJwt(token);
    if (!claims || claims.role !== 'superadmin') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const assetId = formData.get('assetId') as string | null;

    if (!file && !assetId) {
      return NextResponse.json({ success: false, message: 'No file or asset ID provided' }, { status: 400 });
    }

    let profilePhotoBlob: Buffer | null = null;

    // If assetId is provided, use staged blob
    if (assetId) {
      try {
        // Get staged blob and convert to buffer
        const stagedBlobResponse = await fetch(`${req.nextUrl.origin}/api/media/staged/${assetId}`);
        if (stagedBlobResponse.ok) {
          const blob = await stagedBlobResponse.blob();
          const arrayBuffer = await blob.arrayBuffer();
          profilePhotoBlob = Buffer.from(arrayBuffer);
        } else {
          return NextResponse.json({ success: false, message: 'Staged asset not found' }, { status: 404 });
        }
      } catch (error) {
        console.error('Error fetching staged blob:', error);
        return NextResponse.json({ success: false, message: 'Failed to fetch staged asset' }, { status: 500 });
      }
    } else if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        return NextResponse.json({ success: false, message: 'Only image files are allowed' }, { status: 400 });
      }

      // Validate file size (2MB max)
      if (file.size > 2 * 1024 * 1024) {
        return NextResponse.json({ success: false, message: 'File size must be less than 2MB' }, { status: 400 });
      }

      // Convert file to buffer
      const bytes = await file.arrayBuffer();
      profilePhotoBlob = Buffer.from(bytes);
    }

    // Update superadmin profile photo
    if (profilePhotoBlob && profilePhotoBlob.length > 0) {
      // Verify the blob before saving
      console.log('Saving profile photo:', {
        userId: claims.sub,
        blobSize: profilePhotoBlob.length,
        blobType: profilePhotoBlob.constructor.name
      });

      const result = await executeQuery(
        'UPDATE superadmin SET profile_photo_blob = ?, profile_photo_path = NULL, updated_at = NOW() WHERE id = ?',
        [profilePhotoBlob, claims.sub]
      ) as any;
      
      // Verify it was saved
      const verifyRows = await executeQuery(
        'SELECT LENGTH(profile_photo_blob) as blob_size FROM superadmin WHERE id = ?',
        [claims.sub]
      ) as Array<{ blob_size: number | null }>;
      
      console.log('Profile photo update result:', {
        userId: claims.sub,
        savedBlobSize: verifyRows[0]?.blob_size || 0,
        affectedRows: result?.affectedRows || 0
      });

      if (!verifyRows[0]?.blob_size || verifyRows[0].blob_size === 0) {
        return NextResponse.json({ success: false, message: 'Failed to save profile photo blob' }, { status: 500 });
      }
    } else {
      return NextResponse.json({ success: false, message: 'No valid photo data to save' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Profile photo updated successfully'
    });

  } catch (error) {
    console.error('Error updating profile photo:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update profile photo' },
      { status: 500 }
    );
  }
}

