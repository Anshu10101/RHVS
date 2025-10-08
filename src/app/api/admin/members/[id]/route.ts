import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

// GET - Fetch single member by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: memberId } = await params;

    const memberQuery = `
      SELECT 
        id, name, email, phone, address, father_husband_name, mother_wife_name,
        registration_date, existing_member_reg_number, profile_photo_path,
        member_reg_number, created_at, updated_at, status, district, department,
        verified_by_member_id
      FROM members 
      WHERE id = ?
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
      updateFields.push('profile_photo_path = ?');
      updateValues.push(profile_photo_path);
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
