import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { getAdminScope } from '@/lib/admin-scope';
import { noCacheJsonResponse } from '@/lib/api-helpers';

// GET - Fetch OTP settings
// Public endpoint - registration page needs to check OTP settings
export async function GET(request: NextRequest) {
  try {
    const settings = await executeQuery(
      'SELECT setting_key, setting_value FROM otp_settings ORDER BY setting_key'
    ) as Array<{ setting_key: string; setting_value: string }>;

    const settingsObj: Record<string, any> = {};
    settings.forEach(row => {
      let value: string | boolean | number = row.setting_value;
      
      // Parse boolean values
      if (value === 'true') value = true;
      else if (value === 'false') value = false;
      // Parse numeric values
      else if (!isNaN(Number(value))) value = Number(value);
      
      settingsObj[row.setting_key] = value;
    });

    return noCacheJsonResponse({
      success: true,
      settings: settingsObj
    });

  } catch (error) {
    console.error('Error fetching OTP settings:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch OTP settings' },
      { status: 500 }
    );
  }
}

// PUT - Update OTP settings
export async function PUT(request: NextRequest) {
  try {
    const scope = await getAdminScope(request);
    
    // Only superadmin can update OTP settings
    if (!scope.isSuperAdmin) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized access' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { otp_verification_enabled } = body;

    if (typeof otp_verification_enabled !== 'boolean') {
      return NextResponse.json(
        { success: false, message: 'Invalid setting value' },
        { status: 400 }
      );
    }

    await executeQuery(
      `INSERT INTO otp_settings (setting_key, setting_value, description, updated_by)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
       setting_value = VALUES(setting_value),
       updated_by = VALUES(updated_by),
       updated_at = CURRENT_TIMESTAMP`,
      [
        'otp_verification_enabled',
        otp_verification_enabled.toString(),
        'Enable/disable OTP verification for member registration. When disabled, members can register directly without OTP, and superadmin (RHVS000000) will be set as the default initiator.',
        scope.adminId
      ]
    );

    return noCacheJsonResponse({
      success: true,
      message: 'OTP settings updated successfully'
    });

  } catch (error) {
    console.error('Error updating OTP settings:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update OTP settings' },
      { status: 500 }
    );
  }
}

