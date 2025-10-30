import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';
import { getAdminScope } from '@/lib/admin-scope';

// GET - Fetch hero image settings
export async function GET(request: NextRequest) {
  try {
    const [rows] = await pool.execute(
      'SELECT setting_key, setting_value FROM hero_image_settings ORDER BY setting_key'
    );

    const settings: Record<string, any> = {};
    (rows as any[]).forEach(row => {
      let value = row.setting_value;
      
      // Parse boolean values
      if (value === 'true') value = true;
      else if (value === 'false') value = false;
      // Parse numeric values
      else if (!isNaN(Number(value))) value = Number(value);
      
      settings[row.setting_key] = value;
    });

    return NextResponse.json({
      success: true,
      settings
    });

  } catch (error) {
    console.error('Error fetching hero settings:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch hero settings'
    }, { status: 500 });
  }
}

// PUT - Update hero image settings
export async function PUT(request: NextRequest) {
  try {
    const scope = await getAdminScope(request);
    
    // Check permissions
    if (!scope.isSuperAdmin && !scope.permissions.includes('manage_hero_settings')) {
      return NextResponse.json({
        success: false,
        error: 'Insufficient permissions'
      }, { status: 403 });
    }

    const body = await request.json();
    const { settings } = body;

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({
        success: false,
        error: 'Invalid settings data'
      }, { status: 400 });
    }

    await pool.execute('START TRANSACTION');

    try {
      for (const [key, value] of Object.entries(settings)) {
        await pool.execute(
          `INSERT INTO hero_image_settings (setting_key, setting_value, updated_by)
           VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE 
           setting_value = VALUES(setting_value),
           updated_by = VALUES(updated_by),
           updated_at = CURRENT_TIMESTAMP`,
          [key, String(value), scope.adminId]
        );
      }

      await pool.execute('COMMIT');

      return NextResponse.json({
        success: true,
        message: 'Hero settings updated successfully'
      });

    } catch (error) {
      await pool.execute('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Error updating hero settings:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update hero settings'
    }, { status: 500 });
  }
}
