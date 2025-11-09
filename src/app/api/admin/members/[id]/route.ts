import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { consumeStagedBlob } from '@/lib/blob-storage';

// GET - Fetch single member by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: memberId } = await params;

    const memberQuery = `
      SELECT 
        m.id, m.name, m.email, m.phone, m.address, m.father_husband_name, m.mother_wife_name,
        m.registration_date, m.existing_member_reg_number,
        CASE 
          WHEN m.profile_photo_blob IS NOT NULL THEN CONCAT('/api/media/members/', m.id, '/profile')
          ELSE m.profile_photo_path
        END AS profile_photo_path,
        m.member_reg_number, m.created_at, m.updated_at, m.status, m.district, m.state,
        m.verified_by_member_id,
        GROUP_CONCAT(
          CONCAT(d.name_en, ' (', dp.name_en, ' - ', dm.level, 
            CASE 
              WHEN dm.level = 'district' THEN CONCAT(', ', dm.state, ', ', dm.district)
              WHEN dm.level = 'state' THEN CONCAT(', ', dm.state)
              ELSE ''
            END,
          ')')
          SEPARATOR ' | '
        ) as departments
      FROM members m
      LEFT JOIN department_members dm ON m.id = dm.member_id
      LEFT JOIN departments d ON dm.department_id = d.id
      LEFT JOIN department_posts dp ON dm.post_id = dp.id
      WHERE m.id = ?
      GROUP BY m.id
    `;

    const members = await executeQuery(memberQuery, [memberId]) as Array<Record<string, unknown>>;

    if (members.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Member not found' },
        { status: 404 }
      );
    }

    const member = members[0];

    // Get verifier name if exists
    let verifierName = null;
    if (member.verified_by_member_id) {
      const verifierQuery = 'SELECT name FROM members WHERE id = ?';
      const verifierResult = await executeQuery(verifierQuery, [member.verified_by_member_id]) as Array<{ name: string }>;
      if (verifierResult.length > 0) {
        verifierName = verifierResult[0].name;
      }
    }

    const memberWithVerifier = {
      ...member,
      verified_by_name: verifierName,
      created_at: new Date(member.created_at as string),
      updated_at: new Date(member.updated_at as string),
      registration_date: new Date(member.registration_date as string)
    };

    return NextResponse.json({
      success: true,
      data: memberWithVerifier
    });
  } catch (error) {
    console.error('Error fetching member:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch member' },
      { status: 500 }
    );
  }
}

// PUT - Update member
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: memberId } = await params;
    const body = await request.json();
    const {
      name, email, phone, address, father_husband_name, mother_wife_name,
      registration_date, existing_member_reg_number, profile_photo_path,
      district, department, status
    } = body;

    // Check if member exists
    const existingMemberQuery = 'SELECT id FROM members WHERE id = ?';
    const existingMember = await executeQuery(existingMemberQuery, [memberId]) as Array<{ id: number }>;
    if (existingMember.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Member not found' },
        { status: 404 }
      );
    }

    // Check if email already exists for another member
    if (email) {
      const emailCheckQuery = 'SELECT id FROM members WHERE email = ? AND id != ?';
      const emailCheck = await executeQuery(emailCheckQuery, [email, memberId]) as Array<{ id: number }>;
      if (emailCheck.length > 0) {
        return NextResponse.json(
          { success: false, error: 'Email already exists' },
          { status: 400 }
        );
      }
    }

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];

    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    if (email !== undefined) {
      updateFields.push('email = ?');
      updateValues.push(email);
    }
    if (phone !== undefined) {
      updateFields.push('phone = ?');
      updateValues.push(phone);
    }
    if (address !== undefined) {
      updateFields.push('address = ?');
      updateValues.push(address);
    }
    if (father_husband_name !== undefined) {
      updateFields.push('father_husband_name = ?');
      updateValues.push(father_husband_name);
    }
    if (mother_wife_name !== undefined) {
      updateFields.push('mother_wife_name = ?');
      updateValues.push(mother_wife_name);
    }
    if (registration_date !== undefined) {
      updateFields.push('registration_date = ?');
      updateValues.push(registration_date);
    }
    if (existing_member_reg_number !== undefined) {
      updateFields.push('existing_member_reg_number = ?');
      updateValues.push(existing_member_reg_number);
    }
    if (profile_photo_path !== undefined) {
      if (typeof profile_photo_path === 'string' && profile_photo_path.startsWith('/api/media/staged/')) {
        const assetId = profile_photo_path.split('/').pop();
        if (!assetId) {
          return NextResponse.json(
            { success: false, error: 'Invalid staged profile photo reference' },
            { status: 400 }
          );
        }
        const asset = await consumeStagedBlob(assetId);
        if (!asset) {
          return NextResponse.json(
            { success: false, error: 'Profile photo upload expired. Please re-upload.' },
            { status: 400 }
          );
        }
        updateFields.push('profile_photo_blob = ?');
        updateValues.push(asset.data);
        updateFields.push('profile_photo_mime = ?');
        updateValues.push(asset.mimeType || null);
        updateFields.push('profile_photo_hash = ?');
        updateValues.push(asset.hash || null);
        updateFields.push('profile_photo_size = ?');
        updateValues.push(asset.size ?? null);
        updateFields.push('profile_photo_original_name = ?');
        updateValues.push(asset.originalName || null);
        updateFields.push('profile_photo_path = ?');
        updateValues.push(`/api/media/members/${memberId}/profile`);
      } else {
        updateFields.push('profile_photo_path = ?');
        updateValues.push(profile_photo_path || null);
        if (!profile_photo_path) {
          updateFields.push('profile_photo_blob = NULL');
          updateFields.push('profile_photo_mime = NULL');
          updateFields.push('profile_photo_hash = NULL');
          updateFields.push('profile_photo_size = NULL');
          updateFields.push('profile_photo_original_name = NULL');
        }
      }
    }
    if (district !== undefined) {
      updateFields.push('district = ?');
      updateValues.push(district);
    }
    if (department !== undefined) {
      updateFields.push('department = ?');
      updateValues.push(department);
    }
    if (status !== undefined) {
      updateFields.push('status = ?');
      updateValues.push(status);
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      );
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(memberId);

    const updateQuery = `UPDATE members SET ${updateFields.join(', ')} WHERE id = ?`;
    await executeQuery(updateQuery, updateValues);

    return NextResponse.json({
      success: true,
      message: 'Member updated successfully'
    });
  } catch (error) {
    console.error('Error updating member:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update member' },
      { status: 500 }
    );
  }
}

// DELETE - Delete member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: memberId } = await params;

    // Check if member exists
    const existingMemberQuery = 'SELECT id, name FROM members WHERE id = ?';
    const existingMember = await executeQuery(existingMemberQuery, [memberId]) as Array<{ id: number; name: string }>;
    if (existingMember.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Member not found' },
        { status: 404 }
      );
    }

    // Delete member
    const deleteQuery = 'DELETE FROM members WHERE id = ?';
    await executeQuery(deleteQuery, [memberId]);

    return NextResponse.json({
      success: true,
      message: 'Member deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting member:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete member' },
      { status: 500 }
    );
  }
}
