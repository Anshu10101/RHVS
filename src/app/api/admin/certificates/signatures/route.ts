import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { getAdminScope } from '@/lib/admin-scope';
import { createHash } from 'crypto';

// GET - Fetch all certificate signatures
export async function GET(request: NextRequest) {
  try {
    const scope = await getAdminScope(request);
    
    if (!scope.isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Superadmin access required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const certificateType = searchParams.get('type') || null; // 'membership' or 'appointment'

    let query = `
      SELECT 
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
        cs.created_at,
        cs.updated_at,
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
      LEFT JOIN departments d ON cs.department_id = d.id
      LEFT JOIN department_posts dp ON cs.post_id = dp.id
      WHERE cs.is_active = TRUE
    `;

    const params: Array<string | number> = [];

    if (certificateType) {
      query += ' AND cs.certificate_type = ?';
      params.push(certificateType);
    }

    query += ' ORDER BY cs.certificate_type, cs.display_order ASC';

    const signatures = await executeQuery(query, params) as any[];

    return NextResponse.json({ 
      success: true,
      signatures: signatures.map(sig => ({
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
        postNameHi: sig.post_name_hi,
        createdAt: sig.created_at,
        updatedAt: sig.updated_at
      }))
    });
  } catch (error) {
    console.error('Error fetching certificate signatures:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch certificate signatures' 
    }, { status: 500 });
  }
}

// POST - Create a new certificate signature
export async function POST(request: NextRequest) {
  try {
    const scope = await getAdminScope(request);
    
    if (!scope.isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Superadmin access required' }, { status: 401 });
    }

    const formData = await request.formData();
    const certificateType = formData.get('certificate_type') as string;
    const method = formData.get('method') as string; // 'manual' or 'member'
    const signatureFile = formData.get('signature') as File | null;

    // Validate certificate type
    if (!certificateType || !['membership', 'appointment'].includes(certificateType)) {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid certificate type. Must be "membership" or "appointment"' 
      }, { status: 400 });
    }

    // Check current active signatures count
    const activeCount = await executeQuery(
      'SELECT COUNT(*) as count FROM certificate_signatures WHERE certificate_type = ? AND is_active = TRUE',
      [certificateType]
    ) as Array<{ count: number }>;

    if (activeCount[0].count >= 4) {
      return NextResponse.json({ 
        success: false,
        error: 'Maximum 4 signatures allowed per certificate type' 
      }, { status: 400 });
    }

    let nameEn = '';
    let nameHi = '';
    let designationEn = '';
    let designationHi = '';
    let memberId: number | null = null;
    let departmentId: string | null = null;
    let postId: number | null = null;
    let signatureBlob: Buffer | null = null;
    let signatureMime: string | null = null;
    let signatureSize: number | null = null;
    let signatureHash: string | null = null;
    let signatureOriginalName: string | null = null;
    let signaturePath: string | null = null;

    if (method === 'manual') {
      // Manual entry
      nameEn = formData.get('name_en') as string;
      nameHi = formData.get('name_hi') as string || '';
      designationEn = formData.get('designation_en') as string;
      designationHi = formData.get('designation_hi') as string || '';

      if (!nameEn || !designationEn) {
        return NextResponse.json({ 
          success: false,
          error: 'Name and designation are required' 
        }, { status: 400 });
      }

      if (!signatureFile) {
        return NextResponse.json({ 
          success: false,
          error: 'Signature file is required' 
        }, { status: 400 });
      }

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

    } else if (method === 'member') {
      // Member-based signature
      const memberIdStr = formData.get('member_id') as string;
      const departmentIdStr = formData.get('department_id') as string;
      const postIdStr = formData.get('post_id') as string;

      if (!memberIdStr || !departmentIdStr || !postIdStr) {
        return NextResponse.json({ 
          success: false,
          error: 'Member, department, and post are required' 
        }, { status: 400 });
      }

      memberId = parseInt(memberIdStr);
      departmentId = departmentIdStr;
      postId = parseInt(postIdStr);

      // Fetch member details
      const member = await executeQuery(
        `SELECT m.id, m.name, m.member_reg_number, m.signature_blob, m.signature_mime, 
                m.signature_size, m.signature_hash, m.signature_original_name, m.signature_path,
                d.name_en as dept_name_en, d.name_hi as dept_name_hi,
                dp.name_en as post_name_en, dp.name_hi as post_name_hi
         FROM members m
         JOIN department_members dm ON m.id = dm.member_id
         JOIN departments d ON (dm.department_id = d.id OR CAST(dm.department_id AS CHAR) = d.id)
         JOIN department_posts dp ON dm.post_id = dp.id
         WHERE m.id = ? AND (dm.department_id = ? OR CAST(dm.department_id AS CHAR) = ?) AND dm.post_id = ? AND m.status = 'verified'
         LIMIT 1`,
        [memberId, departmentId, departmentId, postId]
      ) as Array<{
        id: number;
        name: string;
        member_reg_number: string;
        signature_blob: Buffer | null;
        signature_mime: string | null;
        signature_size: number | null;
        signature_hash: string | null;
        signature_original_name: string | null;
        signature_path: string | null;
        dept_name_en: string;
        dept_name_hi: string | null;
        post_name_en: string;
        post_name_hi: string | null;
      }>;

      if (member.length === 0) {
        return NextResponse.json({ 
          success: false,
          error: 'Member not found or not assigned to the specified department/post' 
        }, { status: 404 });
      }

      const memberData = member[0];

      if (!memberData.signature_blob && !memberData.signature_path) {
        return NextResponse.json({ 
          success: false,
          error: 'Member does not have a signature on file' 
        }, { status: 400 });
      }

      nameEn = memberData.name;
      nameHi = memberData.name; // Use same name for Hindi if not available
      designationEn = `${memberData.dept_name_en} - ${memberData.post_name_en}`;
      designationHi = memberData.dept_name_hi && memberData.post_name_hi 
        ? `${memberData.dept_name_hi} - ${memberData.post_name_hi}`
        : designationEn;

      signatureBlob = memberData.signature_blob;
      signatureMime = memberData.signature_mime;
      signatureSize = memberData.signature_size;
      signatureHash = memberData.signature_hash;
      signatureOriginalName = memberData.signature_original_name;
      signaturePath = memberData.signature_path;

    } else {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid method. Must be "manual" or "member"' 
      }, { status: 400 });
    }

    // Get next display order
    const maxOrder = await executeQuery(
      'SELECT COALESCE(MAX(display_order), 0) as max_order FROM certificate_signatures WHERE certificate_type = ?',
      [certificateType]
    ) as Array<{ max_order: number }>;

    const displayOrder = maxOrder[0].max_order + 1;

    // Insert signature
    const result = await executeQuery(
      `INSERT INTO certificate_signatures 
       (certificate_type, name_en, name_hi, designation_en, designation_hi,
        signature_blob, signature_path, signature_mime, signature_size, signature_hash, signature_original_name,
        member_id, department_id, post_id, display_order, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        certificateType,
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
        memberId,
        departmentId,
        postId,
        displayOrder,
        scope.adminId
      ]
    ) as { insertId: number };

    // If signature is stored as blob, update path to API endpoint
    if (signatureBlob) {
      await executeQuery(
        'UPDATE certificate_signatures SET signature_path = ? WHERE id = ?',
        [`/api/media/certificate-signatures/${result.insertId}/signature`, result.insertId]
      );
    }

    return NextResponse.json({
      success: true,
      signatureId: result.insertId,
      message: 'Signature added successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating certificate signature:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to create certificate signature',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

