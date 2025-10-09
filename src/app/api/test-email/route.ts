import { NextRequest, NextResponse } from 'next/server';
import { testEmailService } from '@/lib/email-service';
import { getAdminScope } from '@/lib/admin-scope';
import { z } from 'zod';

const testEmailSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export async function POST(request: NextRequest) {
  try {
    const scope = await getAdminScope(request);
    
    if (!scope.isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Superadmin access required' }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = testEmailSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validationResult.error.format()
      }, { status: 400 });
    }

    const { email } = validationResult.data;

    const result = await testEmailService(email);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message
      });
    } else {
      return NextResponse.json({
        error: 'Failed to send test email',
        details: result.error
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error testing email service:', error);
    return NextResponse.json({
      error: 'Failed to test email service',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
