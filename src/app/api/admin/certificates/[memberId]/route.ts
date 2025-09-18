import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

// GET - Get certificate details for a member
export async function GET(
  request: NextRequest,
  { params }: { params: { memberId: string } }
) {
  try {
    const memberId = params.memberId;
    
    const query = `
      SELECT 
        mc.id,
        mc.certificate_number,
        mc.certificate_path,
        mc.generated_at,
        m.member_reg_number,
        m.name as member_name
      FROM member_certificates mc
      JOIN members m ON mc.member_id = m.id
      WHERE mc.member_id = ?
      ORDER BY mc.generated_at DESC
      LIMIT 1
    `;
    
    const certificates: any = await executeQuery(query, [memberId]);
    
    if (certificates.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Certificate not found' },
        { status: 404 }
      );
    }

    const certificate = certificates[0];
    
    return NextResponse.json({
      success: true,
      data: {
        id: certificate.id,
        certificateNumber: certificate.certificate_number,
        certificatePath: certificate.certificate_path,
        generatedAt: new Date(certificate.generated_at),
        memberRegNumber: certificate.member_reg_number,
        memberName: certificate.member_name
      }
    });
  } catch (error) {
    console.error('Error fetching certificate:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch certificate' },
      { status: 500 }
    );
  }
}
