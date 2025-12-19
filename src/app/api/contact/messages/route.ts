import { NextRequest } from 'next/server';
import { executeQuery } from '@/lib/database';
import { noCacheJsonResponse } from '@/lib/api-helpers';

interface CreateContactMessageBody {
  name: string;
  email: string;
  phone?: string;
  memberRegNumber?: string;
  topicKey:
    | 'membership'
    | 'certificate'
    | 'email_issue'
    | 'content_issue'
    | 'technical'
    | 'store_issue'
    | 'complaint'
    | 'feedback'
    | 'other';
  customTopic?: string;
  message: string;
  targetType?: 'superadmin' | 'district_admin';
  superadminId?: number | null;
  districtAdminId?: number | null;
  // For looking up district admin by location
  districtName?: string;
  stateName?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateContactMessageBody;

    const {
      name,
      email,
      phone,
      memberRegNumber,
      topicKey,
      customTopic,
      message,
      targetType = 'superadmin',
      superadminId,
      districtAdminId,
      districtName,
      stateName,
    } = body || {};

    if (!name || !email || !topicKey || !message) {
      return noCacheJsonResponse(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Resolve member_id from provided memberRegNumber or email (best-effort)
    let memberId: number | null = null;
    if (memberRegNumber || email) {
      try {
        const memberRows = (await executeQuery(
          `SELECT id FROM members 
           WHERE (${memberRegNumber ? 'member_reg_number = ? OR ' : ''} email = ?)
           LIMIT 1`,
          memberRegNumber ? [memberRegNumber, email] : [email]
        )) as Array<{ id: number }>;

        if (memberRows.length > 0) {
          memberId = memberRows[0].id;
        }
      } catch (err) {
        console.warn('Failed to resolve member_id for contact message:', err);
      }
    }

    let resolvedTargetType: 'superadmin' | 'district_admin' = targetType;
    let resolvedSuperadminId: number | null = superadminId ?? null;
    let resolvedDistrictAdminId: number | null =
      targetType === 'district_admin' ? districtAdminId ?? null : null;

    // If district_admin selected but no ID provided, try to find by district/state name
    if (targetType === 'district_admin' && !resolvedDistrictAdminId && districtName) {
      try {
        console.log(`🔍 Looking up district admin for district: "${districtName}", state: "${stateName}"`);
        
        // Look up admin by district name
        // Note: da.district should contain the English district name directly
        const adminLookup = (await executeQuery(
          `SELECT da.id, da.district
           FROM district_admins da
           WHERE da.is_active = 1
             AND (da.expires_at IS NULL OR da.expires_at > NOW())
             AND LOWER(TRIM(da.district)) = LOWER(TRIM(?))
           ORDER BY da.id ASC
           LIMIT 1`,
          [districtName]
        )) as Array<{ id: number; district: string }>;

        if (adminLookup.length > 0) {
          resolvedDistrictAdminId = adminLookup[0].id;
          console.log(`✅ Found district admin ID ${resolvedDistrictAdminId} for district "${adminLookup[0].district}"`);
        } else {
          console.log(`❌ No district admin found for district "${districtName}"`);
        }
      } catch (err) {
        console.warn('Failed to lookup district admin by name:', err);
      }
    }

    // Default: always have a valid superadmin id as fallback
    if (!resolvedSuperadminId) {
      try {
        const superRows = (await executeQuery(
          `SELECT id FROM superadmin WHERE is_active = 1 ORDER BY id ASC LIMIT 1`
        )) as Array<{ id: number }>;
        if (superRows.length > 0) {
          resolvedSuperadminId = superRows[0].id;
        } else {
          // Fallback to ID 1 if no active row found (old DBs)
          resolvedSuperadminId = 1;
        }
      } catch (err) {
        console.warn('Failed to resolve default superadmin for contact message:', err);
        resolvedSuperadminId = 1;
      }
    }

    // If district admin was selected but not provided, return error
    if (resolvedTargetType === 'district_admin' && !resolvedDistrictAdminId) {
      return noCacheJsonResponse(
        { 
          success: false, 
          error: `No active district admin found for ${districtName || 'the selected district'}. Please contact the super admin instead or select a different district.` 
        },
        { status: 400 }
      );
    }

    await executeQuery(
      `INSERT INTO contact_messages
       (member_id, sender_name, sender_email, sender_phone, sender_member_reg_number,
        topic_key, custom_topic, message,
        target_type, superadmin_id, district_admin_id,
        status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'unread', NOW(), NOW())`,
      [
        memberId,
        name.trim(),
        email.trim(),
        phone?.trim() || null,
        memberRegNumber?.trim() || null,
        topicKey,
        customTopic?.trim() || null,
        message.trim(),
        resolvedTargetType,
        resolvedTargetType === 'superadmin' ? resolvedSuperadminId : null,
        resolvedTargetType === 'district_admin' ? resolvedDistrictAdminId : null,
      ]
    );

    return noCacheJsonResponse({
      success: true,
      message: 'Your message has been sent successfully.',
    });
  } catch (error) {
    console.error('Error creating contact message:', error);
    return noCacheJsonResponse(
      { success: false, error: 'Failed to send message. Please try again later.' },
      { status: 500 }
    );
  }
}


