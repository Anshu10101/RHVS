import { NextRequest, NextResponse } from 'next/server';
import { ContentService, ContactInfo, ContactOffice } from '@/lib/content';

export async function GET() {
  try {
    const [contactInfo, offices] = await Promise.all([
      ContentService.getContactInfo(),
      ContentService.getContactOffices()
    ]);

    return NextResponse.json({
      success: true,
      data: {
        contactInfo,
        offices
      }
    });
  } catch (error) {
    console.error('Error fetching contact content:', error);
    return NextResponse.json(
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
      return NextResponse.json(
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
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to save contact content' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error saving contact content:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save contact content' },
      { status: 500 }
    );
  }
}
