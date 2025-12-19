import { NextRequest } from 'next/server';
import { ContentService, ContactInfo, ContactOffice } from '@/lib/content';
import { getAdminScope, ensurePermission } from '@/lib/admin-scope';
import { noCacheJsonResponse } from '@/lib/api-helpers';

// GET - Public-ish: just returns current contact + office data
// Can be filtered by district/state if admin scope is provided
export async function GET(request: NextRequest) {
  try {
    // Try to get admin scope if this is an admin request
    let scope: Awaited<ReturnType<typeof getAdminScope>> | { unrestricted: true };
    try {
      scope = await getAdminScope(request);
    } catch {
      // Not an admin request, use public scope (unrestricted)
      scope = { unrestricted: true };
    }

    // For district admins, filter by their district
    // For superadmins and public, show all (or filter by query params)
    const { searchParams } = new URL(request.url);
    const districtParam = searchParams.get('district');
    const stateParam = searchParams.get('state');

    // Determine if this should be unrestricted (public or superadmin)
    const isUnrestricted = 'unrestricted' in scope ? scope.unrestricted : (scope.isSuperAdmin || false);

    // Use query params if provided (public filtering), otherwise use admin scope
    const district = districtParam || (isUnrestricted ? null : (('districtName' in scope ? scope.districtName : null) || null));
    const state = stateParam || (isUnrestricted ? null : (('stateName' in scope ? scope.stateName : null) || null));

    // Create content scope - if district/state params provided, filter by them
    // Otherwise, use admin scope if it's a district admin
    const contentScope = (isUnrestricted && !districtParam && !stateParam) ? undefined : {
      district: district || null,
      state: state || null,
      adminId: ('adminId' in scope ? scope.adminId : null) || null,
      unrestricted: isUnrestricted && !districtParam && !stateParam
    };

    const [contactInfo, offices] = await Promise.all([
      ContentService.getContactInfo(contentScope),
      ContentService.getContactOffices(contentScope),
    ]);

    return noCacheJsonResponse({
      success: true,
      data: {
        contactInfo,
        offices,
      },
    });
  } catch (error) {
    console.error('Error fetching contact content:', error);
    return noCacheJsonResponse(
      { success: false, error: 'Failed to fetch contact content' },
      { status: 500 },
    );
  }
}

// POST - Restricted: used by admin UI to edit contact info + offices
export async function POST(request: NextRequest) {
  try {
    const scope = await getAdminScope(request);

    // Superadmins always allowed; district admins need the unified permission
    if (
      !scope.isSuperAdmin &&
      !ensurePermission(scope, ['edit_offices', 'edit_contact'])
    ) {
      return noCacheJsonResponse(
        { success: false, error: 'Unauthorized' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { contactInfo, offices, updatedBy } = body;

    if (!contactInfo || !offices || !updatedBy) {
      return noCacheJsonResponse(
        { success: false, error: 'Missing required fields' },
        { status: 400 },
      );
    }

    // Create scope for saving - district admins can only save their district's data
    const contentScope = scope.isSuperAdmin ? { unrestricted: true } : {
      district: scope.districtName || null,
      state: scope.stateName || null,
      adminId: scope.adminId || null,
      unrestricted: false
    };

    const success = await ContentService.saveContactContent(
      contactInfo as ContactInfo[],
      offices as ContactOffice[],
      updatedBy,
      contentScope,
    );

    if (success) {
      return noCacheJsonResponse({
        success: true,
        message: 'Contact content saved successfully',
      });
    }

    return noCacheJsonResponse(
      { success: false, error: 'Failed to save contact content' },
      { status: 500 },
    );
  } catch (error) {
    console.error('Error saving contact content:', error);
    return noCacheJsonResponse(
      { success: false, error: 'Failed to save contact content' },
      { status: 500 },
    );
  }
}
