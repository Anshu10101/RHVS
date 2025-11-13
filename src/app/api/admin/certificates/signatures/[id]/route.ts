import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { getAdminScope } from '@/lib/admin-scope';
import { createHash } from 'crypto';

// GET - Get a single signature by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const scope = await getAdminScope(request);
    
    if (!scope.isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Superadmin access required' }, { status: 401 });
    }

    const { id } = await params;
    const signatureId = parseInt(id);

    if (isNaN(signatureId)) {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid signature ID' 
      }, { status: 400 });
    }

    const rows = await executeQuery(
      `SELECT 
        cs.id,
        cs.certificate_type,
        cs.name_en,
        cs.name_hi,
        cs.designation_en,
        cs.designation_hi,
        cs.signature_path,
        cs.display_order,
        cs.is_active,
        cs.member_id,
        cs.department_id,
        cs.post_id,
        CASE 
          WHEN cs.signature_blob IS NOT NULL THEN CONCAT('/api/media/certificate-signatures/', cs.id, '/signature')
          ELSE cs.signature_path
        END AS resolved_signature_path,
        m.name as member_name,
        m.member_reg_number,
        d.name_en as dept_name_en,
        d.name_hi as dept_name_hi,
        dp.name_en as post_name_en,
        dp.name_hi as post_name_hi
      FROM certificate_signatures cs
      LEFT JOIN members m ON cs.member_id = m.id
      LEFT JOIN departments d ON cs.department_id = d.id OR CAST(cs.department_id AS CHAR) = d.id
      LEFT JOIN department_posts dp ON cs.post_id = dp.id
      WHERE cs.id = ? AND cs.is_active = TRUE
      LIMIT 1`,
      [signatureId]
    ) as any[];

    if (rows.length === 0) {
      return NextResponse.json({ 
        success: false,
        error: 'Signature not found' 
      }, { status: 404 });
    }

    const sig = rows[0];
    return NextResponse.json({
      success: true,
      signature: {
        id: sig.id,
        certificateType: sig.certificate_type,
        nameEn: sig.name_en,
        nameHi: sig.name_hi,
        designationEn: sig.designation_en,
        designationHi: sig.designation_hi,
        signaturePath: sig.resolved_signature_path,
        displayOrder: sig.display_order,
        isActive: sig.is_active,
        memberId: sig.member_id,
        departmentId: sig.department_id,
        postId: sig.post_id,
        memberName: sig.member_name,
        memberRegNumber: sig.member_reg_number,
        deptNameEn: sig.dept_name_en,
        deptNameHi: sig.dept_name_hi,
        postNameEn: sig.post_name_en,
        postNameHi: sig.post_name_hi
      }
    });
  } catch (error) {
    console.error('Error fetching signature:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch signature' 
    }, { status: 500 });
  }
}

// PUT - Update a certificate signature
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const scope = await getAdminScope(request);
    
    if (!scope.isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Superadmin access required' }, { status: 401 });
    }

    const { id } = await params;
    const signatureId = parseInt(id);

    if (isNaN(signatureId)) {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid signature ID' 
      }, { status: 400 });
    }

    const formData = await request.formData();
    const nameEn = formData.get('name_en') as string;
    const nameHi = formData.get('name_hi') as string || '';
    const designationEn = formData.get('designation_en') as string;
    const designationHi = formData.get('designation_hi') as string || '';
    const signatureFile = formData.get('signature') as File | null;

    if (!nameEn || !designationEn) {
      return NextResponse.json({ 
        success: false,
        error: 'Name and designation are required' 
      }, { status: 400 });
    }

    let signatureBlob: Buffer | null = null;
    let signatureMime: string | null = null;
    let signatureSize: number | null = null;
    let signatureHash: string | null = null;
    let signatureOriginalName: string | null = null;
    let signaturePath: string | null = null;

    // If a new signature file is provided, process it
    if (signatureFile && signatureFile.size > 0) {
      // Validate file size (100KB = 102400 bytes)
      if (signatureFile.size > 102400) {
        return NextResponse.json({ 
          success: false,
          error: 'Signature file must be less than 100KB' 
        }, { status: 400 });
      }

      // Validate file type
      if (!signatureFile.type.startsWith('image/')) {
        return NextResponse.json({ 
          success: false,
          error: 'Signature must be an image file' 
        }, { status: 400 });
      }

      // Read file as buffer
      const arrayBuffer = await signatureFile.arrayBuffer();
      signatureBlob = Buffer.from(arrayBuffer);
      signatureMime = signatureFile.type;
      signatureSize = signatureFile.size;
      signatureHash = createHash('sha256').update(signatureBlob).digest('hex');
      signatureOriginalName = signatureFile.name;
    }

    // Get current signature to preserve path if not updating
    const currentSig = await executeQuery(
      'SELECT signature_path FROM certificate_signatures WHERE id = ?',
      [signatureId]
    ) as Array<{ signature_path: string | null }>;

    if (currentSig.length === 0) {
      return NextResponse.json({ 
        success: false,
        error: 'Signature not found' 
      }, { status: 404 });
    }

    // Update signature
    if (signatureBlob) {
      // New signature file provided
      signaturePath = `/api/media/certificate-signatures/${signatureId}/signature`;
      await executeQuery(
        `UPDATE certificate_signatures 
         SET name_en = ?, name_hi = ?, designation_en = ?, designation_hi = ?,
             signature_blob = ?, signature_path = ?, signature_mime = ?, 
             signature_size = ?, signature_hash = ?, signature_original_name = ?,
             updated_at = NOW()
         WHERE id = ?`,
        [
          nameEn,
          nameHi || null,
          designationEn,
          designationHi || null,
          signatureBlob,
          signaturePath,
          signatureMime,
          signatureSize,
          signatureHash,
          signatureOriginalName,
          signatureId
        ]
      );
    } else {
      // Only update text fields, keep existing signature
      await executeQuery(
        `UPDATE certificate_signatures 
         SET name_en = ?, name_hi = ?, designation_en = ?, designation_hi = ?,
             updated_at = NOW()
         WHERE id = ?`,
        [
          nameEn,
          nameHi || null,
          designationEn,
          designationHi || null,
          signatureId
        ]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Signature updated successfully'
    });

  } catch (error) {
    console.error('Error updating certificate signature:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to update certificate signature',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE - Delete a certificate signature
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const scope = await getAdminScope(request);
    
    if (!scope.isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Superadmin access required' }, { status: 401 });
    }

    const { id } = await params;
    const signatureId = parseInt(id);

    if (isNaN(signatureId)) {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid signature ID' 
      }, { status: 400 });
    }

    // Soft delete by setting is_active to false
    await executeQuery(
      'UPDATE certificate_signatures SET is_active = FALSE WHERE id = ?',
      [signatureId]
    );

    return NextResponse.json({
      success: true,
      message: 'Signature deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting certificate signature:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to delete certificate signature' 
    }, { status: 500 });
  }
}

// PATCH - Update signature display order
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const scope = await getAdminScope(request);
    
    if (!scope.isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Superadmin access required' }, { status: 401 });
    }

    const { id } = await params;
    const signatureId = parseInt(id);
    const body = await request.json();
    const { displayOrder } = body;

    if (isNaN(signatureId)) {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid signature ID' 
      }, { status: 400 });
    }

    if (typeof displayOrder !== 'number' || displayOrder < 1 || displayOrder > 4) {
      return NextResponse.json({ 
        success: false,
        error: 'Display order must be between 1 and 4' 
      }, { status: 400 });
    }

    await executeQuery(
      'UPDATE certificate_signatures SET display_order = ? WHERE id = ?',
      [displayOrder, signatureId]
    );

    return NextResponse.json({
      success: true,
      message: 'Signature order updated successfully'
    });

  } catch (error) {
    console.error('Error updating signature order:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to update signature order' 
    }, { status: 500 });
  }
}

