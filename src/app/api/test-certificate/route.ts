import { NextRequest, NextResponse } from 'next/server';
import { generateAppointmentCertificate } from '@/lib/certificate-generator';

export async function GET(request: NextRequest) {
  try {
    // Test certificate generation with sample data
    const testData = {
      member: {
        id: 1,
        name: 'Test Member',
        member_reg_number: 'RHVS0000001',
        profile_photo_path: undefined, // No photo for test
        state: 'Uttar Pradesh',
        district: 'Lucknow'
      },
      department: {
        dept_name_en: 'Women Wing',
        dept_name_hi: 'महिला विंग',
        post_name_en: 'President',
        post_name_hi: 'अध्यक्ष'
      },
      level: 'state' as const,
      state: 'Uttar Pradesh',
      district: 'Lucknow',
      appointment_date: new Date().toISOString().split('T')[0],
      certificate_number: 'TEST-CERT-001'
    };

    const certificatePath = await generateAppointmentCertificate(testData);

    return NextResponse.json({
      success: true,
      message: 'Test certificate generated successfully',
      certificate_path: certificatePath
    });

  } catch (error) {
    console.error('Error generating test certificate:', error);
    return NextResponse.json({
      error: 'Failed to generate test certificate',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
