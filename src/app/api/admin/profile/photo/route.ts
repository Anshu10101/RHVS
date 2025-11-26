import { NextRequest } from 'next/server';
import { verifyAdminJwt, getAdminToken } from '@/lib/auth-jwt';
import { executeQuery } from '@/lib/database';
import { noCacheJsonResponse } from '@/lib/api-helpers';

export async function POST(req: NextRequest) {
  try {
    const token = getAdminToken(req);
    if (!token) {
      return noCacheJsonResponse({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const claims = await verifyAdminJwt(token);
    if (!claims || claims.role !== 'superadmin') {
      return noCacheJsonResponse({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const assetId = formData.get('assetId') as string | null;

    if (!file && !assetId) {
      return noCacheJsonResponse({ success: false, message: 'No file or asset ID provided' }, { status: 400 });
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
          const errorText = await stagedBlobResponse.text().catch(() => 'Unknown error');
          console.error('Staged blob fetch failed:', {
            status: stagedBlobResponse.status,
            statusText: stagedBlobResponse.statusText,
            error: errorText
          });
          return noCacheJsonResponse({ success: false, message: 'Staged asset not found' }, { status: 404 });
        }
      } catch (error) {
        console.error('Error fetching staged blob:', error);
        return noCacheJsonResponse({ 
          success: false, 
          message: 'Failed to fetch staged asset',
          error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
      }
    } else if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        return noCacheJsonResponse({ success: false, message: 'Only image files are allowed' }, { status: 400 });
      }

      // Validate file size (2MB max)
      if (file.size > 2 * 1024 * 1024) {
        return noCacheJsonResponse({ 
          success: false, 
          message: `File size must be less than 2MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB` 
        }, { status: 400 });
      }

      // Convert file to buffer
      try {
        const bytes = await file.arrayBuffer();
        profilePhotoBlob = Buffer.from(bytes);
        
        if (!profilePhotoBlob || profilePhotoBlob.length === 0) {
          return noCacheJsonResponse({ success: false, message: 'Failed to read file data' }, { status: 400 });
        }
      } catch (error) {
        console.error('Error converting file to buffer:', error);
        return noCacheJsonResponse({ 
          success: false, 
          message: 'Failed to process file',
          error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
      }
    }

    // Update superadmin profile photo
    if (profilePhotoBlob && profilePhotoBlob.length > 0) {
      // Verify the blob before saving
      const userId = parseInt(claims.sub, 10);
      console.log('Saving profile photo:', {
        userId: userId,
        claimsSub: claims.sub,
        blobSize: profilePhotoBlob.length,
        blobType: profilePhotoBlob.constructor.name,
        isBuffer: Buffer.isBuffer(profilePhotoBlob)
      });

      try {
        // Validate userId (already converted above)
        if (isNaN(userId)) {
          console.error('Invalid user ID in token:', claims.sub);
          return noCacheJsonResponse({ success: false, message: 'Invalid user ID' }, { status: 400 });
        }

        // First verify the user exists
        const userCheck = await executeQuery(
          'SELECT id FROM superadmin WHERE id = ? LIMIT 1',
          [userId]
        ) as Array<{ id: number }>;

        if (!userCheck || userCheck.length === 0) {
          console.error('Superadmin not found:', { userId, claimsSub: claims.sub });
          return noCacheJsonResponse({ success: false, message: 'Superadmin record not found' }, { status: 404 });
        }

        const result = await executeQuery(
          'UPDATE superadmin SET profile_photo_blob = ?, profile_photo_path = NULL, updated_at = NOW() WHERE id = ?',
          [profilePhotoBlob, userId]
        ) as any;
        
        if (!result) {
          console.error('executeQuery returned null/undefined');
          return noCacheJsonResponse({ success: false, message: 'Database update returned no result' }, { status: 500 });
        }

        // mysql2 returns [ResultSetHeader] for UPDATE queries
        // ResultSetHeader has affectedRows property
        const affectedRows = Array.isArray(result) 
          ? (result[0] as any)?.affectedRows ?? 0
          : (result as any)?.affectedRows ?? 0;
        
        console.log('UPDATE result:', { 
          result, 
          affectedRows, 
          resultType: Array.isArray(result) ? 'array' : typeof result,
          resultKeys: result ? Object.keys(result) : []
        });
        
        if (affectedRows === 0) {
          console.error('No rows affected by UPDATE query', { userId, claimsSub: claims.sub });
          return noCacheJsonResponse({ 
            success: false, 
            message: 'No superadmin record found or no changes made' 
          }, { status: 404 });
        }
        
        // Verify it was saved
        const verifyRows = await executeQuery(
          'SELECT LENGTH(profile_photo_blob) as blob_size FROM superadmin WHERE id = ?',
          [userId]
        ) as Array<{ blob_size: number | null }>;
        
        console.log('Profile photo update result:', {
          userId: userId,
          savedBlobSize: verifyRows[0]?.blob_size || 0,
          affectedRows: affectedRows
        });

        if (!verifyRows || verifyRows.length === 0) {
          console.error('Verification query returned no rows');
          return noCacheJsonResponse({ success: false, message: 'Failed to verify profile photo save' }, { status: 500 });
        }

        if (!verifyRows[0]?.blob_size || verifyRows[0].blob_size === 0) {
          console.error('Blob size is 0 after save', { 
            userId: userId,
            blobSize: verifyRows[0]?.blob_size 
          });
          return noCacheJsonResponse({ success: false, message: 'Failed to save profile photo blob' }, { status: 500 });
        }
      } catch (dbError) {
        console.error('Database error during profile photo update:', dbError);
        return noCacheJsonResponse({ 
          success: false, 
          message: 'Database error while saving profile photo',
          error: dbError instanceof Error ? dbError.message : 'Unknown database error'
        }, { status: 500 });
      }
    } else {
      return noCacheJsonResponse({ success: false, message: 'No valid photo data to save' }, { status: 400 });
    }

    return noCacheJsonResponse({
      success: true,
      message: 'Profile photo updated successfully'
    });

  } catch (error) {
    console.error('Error updating profile photo:', error);
    return noCacheJsonResponse(
      { 
        success: false, 
        message: 'Failed to update profile photo',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

