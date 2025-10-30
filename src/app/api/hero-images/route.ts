import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';
import { getAdminScope } from '@/lib/admin-scope';
import fs from 'fs';
import path from 'path';

// GET - Fetch all active hero images
export async function GET(request: NextRequest) {
  try {
    const scope = await getAdminScope(request);
    
    // Build query based on admin scope
    let query = `
      SELECT id, image_path, alt_text, title, description, display_order, 
             added_by, district_id, state_id, created_at
      FROM hero_images 
      WHERE is_active = TRUE
    `;
    const params: any[] = [];

    // If district admin, only show images from their district or global images
    if (scope.isDistrictAdmin && !scope.isSuperAdmin) {
      // For now, show all images
      // TODO: Implement proper district-based filtering when district_id is available
    }

    query += ` ORDER BY display_order ASC, created_at ASC`;

    const [rows] = await pool.execute(query, params);
    
    return NextResponse.json({
      success: true,
      images: rows
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
    if (!scope.isSuperAdmin && !scope.permissions.includes('manage_hero_images')) {
      return NextResponse.json({
        success: false,
        error: 'Insufficient permissions'
      }, { status: 403 });
    }

    // Check if request is FormData (file upload) or JSON
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('multipart/form-data')) {
      // Handle file upload
      const formData = await request.formData();
      const file = formData.get('file') as File;
      const alt_text = formData.get('alt_text') as string;
      const title = formData.get('title') as string;
      const description = formData.get('description') as string;
      const display_order = formData.get('display_order') as string;

      if (!file || !alt_text) {
        return NextResponse.json({
          success: false,
          error: 'File and alt text are required'
        }, { status: 400 });
      }

      try {
        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'hero-images');
        
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        // Generate unique filename
        const fileExtension = path.extname(file.name);
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}${fileExtension}`;
        const filePath = path.join(uploadsDir, fileName);
        const publicPath = `/uploads/hero-images/${fileName}`;

        // Convert file to buffer and save
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        fs.writeFileSync(filePath, buffer);

        // Insert new hero image
        const [result] = await pool.execute(
          `INSERT INTO hero_images 
           (image_path, alt_text, title, description, display_order, added_by, district_id, state_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            publicPath,
            alt_text,
            title || null,
            description || null,
            display_order ? parseInt(display_order) : 0,
            scope.adminId,
        null, // TODO: Add district_id when available
        null  // TODO: Add state_id when available
          ]
        );

        return NextResponse.json({
          success: true,
          message: 'Hero image added successfully',
          image_id: (result as any).insertId
        });

      } catch (fileError) {
        console.error('Error saving file:', fileError);
        return NextResponse.json({
          success: false,
          error: 'Failed to save image file'
        }, { status: 500 });
      }

    } else {
      // Handle JSON data
      const body = await request.json();
      const { image_path, alt_text, title, description, display_order } = body;

      if (!image_path || !alt_text) {
        return NextResponse.json({
          success: false,
          error: 'Image path and alt text are required'
        }, { status: 400 });
      }

      // Insert new hero image
      const [result] = await pool.execute(
        `INSERT INTO hero_images 
         (image_path, alt_text, title, description, display_order, added_by, district_id, state_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          image_path,
          alt_text,
          title || null,
          description || null,
          display_order || 0,
          scope.adminId,
        null, // TODO: Add district_id when available
        null  // TODO: Add state_id when available
        ]
      );

      return NextResponse.json({
        success: true,
        message: 'Hero image added successfully',
        image_id: (result as any).insertId
      });
    }

  } catch (error) {
    console.error('Error adding hero image:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to add hero image'
    }, { status: 500 });
  }
}
