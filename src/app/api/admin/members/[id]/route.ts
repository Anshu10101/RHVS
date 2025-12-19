import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { consumeStagedBlob } from '@/lib/blob-storage';
import { getAdminScope } from '@/lib/admin-scope';
import { generateCertificate } from '@/lib/certificate';
import { getStateLanguagePreference } from '@/lib/language-preference';
import { sendWelcomeEmail } from '@/lib/email';
import { generateIDCard } from '@/lib/id-card-generator';

const retainCertificateFiles = process.env.RETAIN_CERTIFICATE_FILES !== 'false';

// GET - Fetch single member by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin authentication
    const scope = await getAdminScope(request);
    
    if (!scope.isSuperAdmin && !scope.isDistrictAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized access' },
        { status: 401 }
      );
    }

    const { id: memberId } = await params;

    const memberQuery = `
      SELECT 
        m.id,
        m.name,
        m.email,
        m.phone,
        m.address,
        m.father_husband_name,
        m.mother_wife_name,
        m.registration_date,
        m.existing_member_reg_number,
        CASE 
          WHEN m.profile_photo_blob IS NOT NULL THEN CONCAT('/api/media/members/', m.id, '/profile')
          ELSE m.profile_photo_path
        END AS profile_photo_path,
        m.member_reg_number,
        m.created_at,
        m.updated_at,
        m.status,
        m.district,
        m.state,
        s.state_name_hindi AS state_hi,
        m.verified_by_member_id,
        m.aadhar_card_number,
        -- English departments string (existing behaviour)
        GROUP_CONCAT(
          CONCAT(
            d.name_en,
            ' (',
            dp.name_en,
            ' - ',
            dm.level, 
            CASE 
              WHEN dm.level = 'district' THEN CONCAT(', ', dm.state, ', ', dm.district)
              WHEN dm.level = 'state' THEN CONCAT(', ', dm.state)
              ELSE ''
            END,
          ')')
          SEPARATOR ' | '
        ) as departments,
        -- Hindi departments string (if available; fallback to English parts)
        GROUP_CONCAT(
          CONCAT(
            COALESCE(d.name_hi, d.name_en),
            ' (',
            COALESCE(dp.name_hi, dp.name_en),
            ' - ',
            dm.level, 
            CASE 
              WHEN dm.level = 'district' THEN CONCAT(', ', dm.state, ', ', dm.district)
              WHEN dm.level = 'state' THEN CONCAT(', ', dm.state)
              ELSE ''
            END,
          ')')
          SEPARATOR ' | '
        ) as departments_hi
      FROM members m
      LEFT JOIN department_members dm ON m.id = dm.member_id
      LEFT JOIN departments d ON dm.department_id = d.id
      LEFT JOIN department_posts dp ON dm.post_id = dp.id
      LEFT JOIN states s ON s.state_name_english = m.state
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
    // Check admin authentication and permissions
    const scope = await getAdminScope(request);
    
    if (!scope.isSuperAdmin && !scope.isDistrictAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized access' },
        { status: 401 }
      );
    }

    // Check if admin has permission to manage members
    if (!scope.isSuperAdmin) {
      // For district admins, check permissions
      if (!scope.permissions.includes('manage_members') && !scope.permissions.includes('edit_members')) {
        return NextResponse.json(
          { success: false, error: 'Insufficient permissions to update members' },
          { status: 403 }
        );
      }
    }

    const { id: memberId } = await params;
    const body = await request.json();
    const {
      name, email, phone, address, father_husband_name, mother_wife_name,
      registration_date, existing_member_reg_number, profile_photo_path,
      district, department, status, aadhar_card_number
    } = body;

    // Check if member exists
    const existingMemberQuery = `
      SELECT 
        id,
        name,
        email,
        member_reg_number,
        registration_date,
        profile_photo_path,
        state,
        district,
        status
      FROM members 
      WHERE id = ?
      LIMIT 1
    `;
    const existingMemberResult = await executeQuery(existingMemberQuery, [memberId]) as Array<{
      id: number;
      name: string | null;
      email: string | null;
      member_reg_number: string;
      registration_date: string;
      profile_photo_path: string | null;
      state: string | null;
      district: string | null;
      status: string;
    }>;

    if (existingMemberResult.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Member not found' },
        { status: 404 }
      );
    }

    const existingMember = existingMemberResult[0];

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

    // Determine if name/email are changing (for certificate/email resend)
    const nameChanged = name !== undefined && name !== (existingMember.name ?? '');
    const emailChanged = email !== undefined && email !== (existingMember.email ?? '');
    const shouldResendCertificateEmail = (nameChanged || emailChanged) && existingMember.status === 'verified';

    const targetName = nameChanged ? (name as string) : (existingMember.name ?? '');
    const targetEmail = emailChanged ? (email as string) : (existingMember.email ?? '');

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
    if (aadhar_card_number !== undefined) {
      // Validate Aadhaar card number if provided
      if (aadhar_card_number && aadhar_card_number.trim() !== '') {
        if (!/^\d{12}$/.test(aadhar_card_number.trim())) {
          return NextResponse.json(
            { success: false, error: 'Aadhaar card number must be exactly 12 digits' },
            { status: 400 }
          );
        }
      }
      updateFields.push('aadhar_card_number = ?');
      updateValues.push(aadhar_card_number?.trim() || null);
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

    let membershipEmailSent = false;

    // If name/email changed for a verified member, regenerate and resend membership certificate + ID card email
    if (shouldResendCertificateEmail && targetEmail) {
      try {
        // Fetch latest member data after update to get current profile photo/state/etc.
        const updatedMemberQuery = `
          SELECT 
            id,
            name,
            email,
            member_reg_number,
            registration_date,
            profile_photo_path,
            state,
            district,
            address
          FROM members 
          WHERE id = ?
          LIMIT 1
        `;

        const updatedMembers = await executeQuery(updatedMemberQuery, [memberId]) as Array<{
          id: number;
          name: string | null;
          email: string | null;
          member_reg_number: string;
          registration_date: string;
          profile_photo_path: string | null;
          state: string | null;
          district: string | null;
          address: string | null;
        }>;

        if (updatedMembers.length > 0) {
          const updatedMember = updatedMembers[0];

          // Determine language preference based on state (fallback to Hindi)
          let languagePreference: 'hi' | 'en' = 'hi';
          try {
            if (updatedMember.state) {
              const pref = await getStateLanguagePreference({
                stateName: updatedMember.state
              });
              if (pref === 'hi' || pref === 'en') {
                languagePreference = pref;
              }
            }
          } catch (langError) {
            console.warn('Failed to resolve language preference for member certificate/ID card resend:', langError);
          }

          // Generate fresh membership certificate
          let certificatePath: string | null = null;
          let certificateNumber: string | null = null;
          let certificateRecordId: number | null = null;

          try {
            console.log('[Admin Members][PUT] Regenerating membership certificate for member:', updatedMember.member_reg_number);
            const certificateResult = await generateCertificate({
              memberId: updatedMember.id,
              memberName: targetName,
              memberRegNumber: updatedMember.member_reg_number,
              registrationDate: updatedMember.registration_date,
              profilePhotoPath: updatedMember.profile_photo_path ?? undefined,
              language: languagePreference
            });

            certificatePath = certificateResult.certificatePath;
            certificateNumber = certificateResult.certificateNumber;

            console.log('[Admin Members][PUT] ✅ Certificate regenerated:', certificateNumber, certificatePath);

            // Store certificate info in database
            const certificateInsertQuery = `
              INSERT INTO member_certificates (member_id, certificate_number, certificate_path, generated_by_admin_id)
              VALUES (?, ?, ?, ?)
            `;

            const certificateInsertResult = await executeQuery(certificateInsertQuery, [
              updatedMember.id,
              certificateNumber,
              certificatePath,
              scope.adminId
            ]) as { insertId: number };

            certificateRecordId = certificateInsertResult.insertId ?? null;
          } catch (certError) {
            console.error('[Admin Members][PUT] ❌ Error regenerating membership certificate:', certError);
          }

          // Generate fresh membership ID card
          let idCardPath: string | null = null;
          try {
            console.log('[Admin Members][PUT] Regenerating membership ID card for member:', updatedMember.member_reg_number);
            const idCardResult = await generateIDCard({
              memberId: updatedMember.id,
              memberName: targetName,
              memberRegNumber: updatedMember.member_reg_number,
              profilePhotoPath: updatedMember.profile_photo_path ?? undefined,
              address: updatedMember.address ?? undefined,
              designation: 'Member',
              cardType: 'membership',
              language: languagePreference,
              state: updatedMember.state,
              district: updatedMember.district
            });

            idCardPath = idCardResult.idCardPath;

            console.log('[Admin Members][PUT] ✅ Membership ID card regenerated:', idCardPath);
          } catch (idError) {
            console.error('[Admin Members][PUT] ❌ Error regenerating membership ID card:', idError);
          }

          // Send welcome/membership email with latest certificate + ID card
          try {
            console.log('[Admin Members][PUT] Sending updated membership email to:', targetEmail);
            const welcomeEmailResult = await sendWelcomeEmail(
              targetEmail,
              targetName,
              updatedMember.member_reg_number,
              certificatePath || undefined,
              idCardPath || undefined,
              languagePreference
            );

            if (welcomeEmailResult?.success) {
              membershipEmailSent = true;
              console.log('[Admin Members][PUT] ✅ Membership email (with certificate & ID card) sent successfully');

              // Optionally clean up stored file path if configured
              if (!retainCertificateFiles && certificateRecordId) {
                await executeQuery(
                  'UPDATE member_certificates SET certificate_path = NULL WHERE id = ?',
                  [certificateRecordId]
                );
              }
            } else {
              console.error('[Admin Members][PUT] ❌ Failed to send membership email:', welcomeEmailResult?.error);
            }
          } catch (emailError) {
            console.error('[Admin Members][PUT] ❌ Error sending membership email:', emailError);
          }
        }
      } catch (resendError) {
        console.error('[Admin Members][PUT] ❌ Error during membership certificate/ID card resend flow:', resendError);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Member updated successfully',
      membershipEmailSent
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
    // Check admin authentication and permissions
    const scope = await getAdminScope(request);
    
    if (!scope.isSuperAdmin && !scope.isDistrictAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized access' },
        { status: 401 }
      );
    }

    // Check if admin has permission to manage members
    if (!scope.isSuperAdmin) {
      // For district admins, check permissions
      if (!scope.permissions.includes('manage_members') && !scope.permissions.includes('delete_members')) {
        return NextResponse.json(
          { success: false, error: 'Insufficient permissions to delete members' },
          { status: 403 }
        );
      }
    }

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
