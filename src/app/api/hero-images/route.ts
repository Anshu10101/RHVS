import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';
import { getAdminScope } from '@/lib/admin-scope';
import { createHash } from 'crypto';
import { consumeStagedBlob } from '@/lib/blob-storage';

// GET - Fetch all active hero images
export async function GET(request: NextRequest) {
  try {
    const scope = await getAdminScope(request);
    
    // Build query based on admin scope
    let query = `
      SELECT 
        id,
        CASE
          WHEN image_blob IS NOT NULL THEN CONCAT('/api/media/hero-images/', id)
          ELSE image_path
        END AS resolved_image_path,
        alt_text,
        title,
        description,
        display_order,
        added_by,
        district_id,
        state_id,
        created_at,
        is_active
      FROM hero_images 
      WHERE is_active = TRUE
    `;
    const params: unknown[] = [];

    // If district admin, only show images from their district or global images
    if (scope.isDistrictAdmin && !scope.isSuperAdmin) {
      // For now, show all images
      // TODO: Implement proper district-based filtering when district_id is available
    }

    query += ` ORDER BY display_order ASC, created_at ASC`;

    const [rows] = await pool.execute(query, params);
    const images = Array.isArray(rows)
      ? rows.map((row: any) => {
          const { resolved_image_path, ...rest } = row;
          return {
            ...rest,
            image_path: resolved_image_path ?? rest.image_path ?? null
          };
        })
      : [];
    
    return NextResponse.json({
      success: true,
      images
    });

  } catch (error) {
    console.error('Error fetching hero images:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch hero images'
    }, { status: 500 });
  }
}

// POST - Add new hero image
export async function POST(request: NextRequest) {
  try {
    const scope = await getAdminScope(request);
    
    // Check permissions
    if (!scope.isSuperAdmin && !scope.permissions?.includes('manage_hero_images')) {
      return NextResponse.json({
        success: false,
        error: 'Insufficient permissions'
      }, { status: 403 });
    }

    // Check if request is FormData (file upload) or JSON
    const contentType = request.headers.get('content-type') || '';
    
    const fallbackDisplayOrder = 0;
    let altText: string | null = null;
    let title: string | null = null;
    let description: string | null = null;
    let displayOrder: number = fallbackDisplayOrder;
    let imagePath: string | null = null;
    let imageBuffer: Buffer | null = null;
    let imageMime: string | null = null;
    let imageHash: string | null = null;
    let imageSize: number | null = null;
    let imageOriginalName: string | null = null;
    
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      altText = (formData.get('alt_text') as string) || null;
      title = (formData.get('title') as string) || null;
      description = (formData.get('description') as string) || null;
      const displayOrderValue = formData.get('display_order') as string | null;
      if (displayOrderValue !== null && displayOrderValue !== undefined && displayOrderValue !== '') {
        const parsed = Number(displayOrderValue);
        displayOrder = Number.isNaN(parsed) ? fallbackDisplayOrder : parsed;
      } else {
        displayOrder = fallbackDisplayOrder;
      }

      if (!file) {
        return NextResponse.json({
          success: false,
          error: 'Image file is required'
        }, { status: 400 });
      }
      if (!altText) {
        altText = file.name;
      }

        const bytes = await file.arrayBuffer();
      imageBuffer = Buffer.from(bytes);
      imageMime = file.type || null;
      imageHash = createHash('sha256').update(imageBuffer).digest('hex');
      imageSize = file.size;
      imageOriginalName = file.name;
    } else {
      const body = await request.json();
      altText = body.alt_text || null;
      title = body.title || null;
      description = body.description || null;
      if (body.display_order !== undefined && body.display_order !== null && body.display_order !== '') {
        const parsed = Number(body.display_order);
        displayOrder = Number.isNaN(parsed) ? fallbackDisplayOrder : parsed;
      } else {
        displayOrder = fallbackDisplayOrder;
      }
      imagePath = body.image_path || null;

      if (imagePath && typeof imagePath === 'string' && imagePath.startsWith('/api/media/staged/')) {
        const assetId = imagePath.split('/').pop();
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
        imageBuffer = asset.data;
        imageMime = asset.mimeType;
        imageHash = asset.hash;
        imageSize = asset.size;
        imageOriginalName = asset.originalName;
        imagePath = null; // Will be replaced with media route after insert
      }
    }

    if (!altText) {
      return NextResponse.json({
        success: false,
        error: 'Alt text is required'
        }, { status: 400 });
      }

      const [result] = await pool.execute(
      `INSERT INTO hero_images (
          image_path,
          alt_text,
         title,
         description,
         display_order,
         added_by,
         district_id,
         state_id,
         image_blob,
         image_mime,
         image_hash,
         image_size,
         image_original_name,
         is_active
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
      [
        imagePath,
        altText,
        title,
        description,
        displayOrder,
          scope.adminId,
        null,
        null,
        imageBuffer,
        imageMime,
        imageHash,
        imageSize,
        imageOriginalName
      ]
    );

    const insertId = (result as { insertId?: number }).insertId ?? null;
    let finalImagePath = imagePath;

    if (imageBuffer && insertId != null) {
      finalImagePath = `/api/media/hero-images/${insertId}`;
      await pool.execute(
        'UPDATE hero_images SET image_path = ? WHERE id = ?',
        [finalImagePath, insertId]
      );
    }

      return NextResponse.json({
        success: true,
        message: 'Hero image added successfully',
      image_id: insertId,
      image_path: finalImagePath
      });

  } catch (error) {
    console.error('Error adding hero image:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to add hero image'
    }, { status: 500 });
  }
}
