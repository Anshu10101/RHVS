import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { getAdminScope } from '@/lib/admin-scope';

// GET - Fetch system settings
export async function GET(request: NextRequest) {
  try {
    const scope = await getAdminScope(request);
    
    if (!scope.isSuperAdmin) {
      return NextResponse.json({ error: 'Only superadmin can access system settings' }, { status: 403 });
    }

    const settings = await executeQuery(
      `SELECT setting_key, setting_value, setting_type, description, updated_at
       FROM system_settings
       ORDER BY setting_key`
    ) as Array<{
      setting_key: string;
      setting_value: string | null;
      setting_type: string;
      description: string | null;
      updated_at: string;
    }>;

    // Convert to a more usable format
    const settingsMap: Record<string, { value: boolean | string | number; type: string; description: string | null; updatedAt: string }> = {};
    
    for (const setting of settings) {
      let value: boolean | string | number = setting.setting_value || '';
      
      if (setting.setting_type === 'boolean') {
        value = setting.setting_value === 'true';
      } else if (setting.setting_type === 'number') {
        value = Number(setting.setting_value) || 0;
      }
      
      settingsMap[setting.setting_key] = {
        value,
        type: setting.setting_type,
        description: setting.description,
        updatedAt: setting.updated_at
      };
    }

    return NextResponse.json({
      success: true,
      data: settingsMap
    });
  } catch (error) {
    console.error('Error fetching system settings:', error);
    return NextResponse.json({ error: 'Failed to fetch system settings' }, { status: 500 });
  }
}

// PUT - Update a system setting
export async function PUT(request: NextRequest) {
  try {
    const scope = await getAdminScope(request);
    
    if (!scope.isSuperAdmin) {
      return NextResponse.json({ error: 'Only superadmin can modify system settings' }, { status: 403 });
    }

    const body = await request.json();
    const { key, value } = body;

    if (!key) {
      return NextResponse.json({ error: 'Setting key is required' }, { status: 400 });
    }

    // Check if setting exists
    const existing = await executeQuery(
      'SELECT id, setting_type FROM system_settings WHERE setting_key = ?',
      [key]
    ) as Array<{ id: number; setting_type: string }>;

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Setting not found' }, { status: 404 });
    }

    // Convert value to string for storage
    let stringValue: string;
    if (typeof value === 'boolean') {
      stringValue = value ? 'true' : 'false';
    } else if (typeof value === 'object') {
      stringValue = JSON.stringify(value);
    } else {
      stringValue = String(value);
    }

    await executeQuery(
      `UPDATE system_settings 
       SET setting_value = ?, updated_by_admin_id = ?, updated_at = NOW()
       WHERE setting_key = ?`,
      [stringValue, scope.adminId, key]
    );

    return NextResponse.json({
      success: true,
      message: 'Setting updated successfully'
    });
  } catch (error) {
    console.error('Error updating system setting:', error);
    return NextResponse.json({ error: 'Failed to update system setting' }, { status: 500 });
  }
}
