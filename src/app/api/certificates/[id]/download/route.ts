import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { getAdminScope } from '@/lib/admin-scope';
import fs from 'fs';
import path from 'path';

// GET - Download certificate
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: certificateId } = await params;
    const scope = await getAdminScope(request);
    
    if (!scope.isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Superadmin access required' }, { status: 401 });
    }

    // Get certificate details
    const certificates = await executeQuery(
      'SELECT * FROM certificates WHERE id = ?',
      [certificateId]
    ) as any[];

    if (certificates.length === 0) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
    }

    const certificate = certificates[0];

    // Check if certificate file exists
    const certificatePath = path.join(process.cwd(), 'public', certificate.certificate_path);
    
    if (!fs.existsSync(certificatePath)) {
      return NextResponse.json({ error: 'Certificate file not found' }, { status: 404 });
    }

    // Read the certificate file
    const fileBuffer = fs.readFileSync(certificatePath);

    // Update status to downloaded
    await executeQuery(
      'UPDATE certificates SET status = "downloaded" WHERE id = ?',
      [certificateId]
    );

    // Log download
    await executeQuery(`
      INSERT INTO certificate_generation_logs (certificate_id, action, performed_by, notes)
      VALUES (?, 'downloaded', ?, 'Certificate downloaded')
    `, [certificateId, scope.adminId]);

    // Return the certificate file
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="certificate-${certificate.certificate_number}.png"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Error downloading certificate:', error);
    return NextResponse.json({ error: 'Failed to download certificate' }, { status: 500 });
  }
}
