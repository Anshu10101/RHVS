import { NextRequest, NextResponse } from 'next/server';
import { ContentService } from '@/lib/content';
import { getAdminScope, ensurePermission } from '@/lib/admin-scope';
import { noCacheJsonResponse } from '@/lib/api-helpers';

// GET - Fetch about page sections
export async function GET() {
  try {
    const sections = await ContentService.getAboutSections();
    return noCacheJsonResponse({ success: true, data: sections });
  } catch (error) {
    console.error('Error fetching about sections:', error);
    return noCacheJsonResponse(
      { success: false, error: 'Failed to fetch about sections' },
      { status: 500 }
    );
  }
}

// POST - Save about page sections
export async function POST(request: NextRequest) {
  try {
    const scope = await getAdminScope(request);
    
    // Check permissions for district admins
    if (!scope.isSuperAdmin && !ensurePermission(scope, ['edit_about', 'manage_about'])) {
      return noCacheJsonResponse({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { sections, updatedBy } = body;

    if (!sections || !Array.isArray(sections)) {
      return noCacheJsonResponse(
        { success: false, error: 'Invalid sections data' },
        { status: 400 }
      );
    }

    if (!updatedBy) {
      return noCacheJsonResponse(
        { success: false, error: 'Updated by user is required' },
        { status: 400 }
      );
    }

    const success = await ContentService.saveAboutSections(sections, updatedBy);
    
    if (success) {
      return noCacheJsonResponse({ 
        success: true, 
        message: 'About page sections saved successfully' 
      });
    } else {
      return noCacheJsonResponse(
        { success: false, error: 'Failed to save about sections' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error saving about sections:', error);
    return noCacheJsonResponse(
      { success: false, error: 'Failed to save about sections' },
      { status: 500 }
    );
  }
}
