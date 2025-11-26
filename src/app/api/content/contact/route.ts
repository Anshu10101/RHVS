import { NextRequest, NextResponse } from 'next/server';
import { ContentService, ContactInfo, ContactOffice } from '@/lib/content';
import { noCacheJsonResponse } from '@/lib/api-helpers';

export async function GET() {
  try {
    const [contactInfo, offices] = await Promise.all([
      ContentService.getContactInfo(),
      ContentService.getContactOffices()
    ]);

    return noCacheJsonResponse({
      success: true,
      data: {
        contactInfo,
        offices
      }
    });
  } catch (error) {
    console.error('Error fetching contact content:', error);
    return noCacheJsonResponse(
      { success: false, error: 'Failed to fetch contact content' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contactInfo, offices, updatedBy } = body;

    if (!contactInfo || !offices || !updatedBy) {
      return noCacheJsonResponse(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const success = await ContentService.saveContactContent(
      contactInfo as ContactInfo[],
      offices as ContactOffice[],
      updatedBy
    );

    if (success) {
      return noCacheJsonResponse({
        success: true,
        message: 'Contact content saved successfully'
      });
    } else {
      return noCacheJsonResponse(
        { success: false, error: 'Failed to save contact content' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error saving contact content:', error);
    return noCacheJsonResponse(
      { success: false, error: 'Failed to save contact content' },
      { status: 500 }
    );
  }
}
