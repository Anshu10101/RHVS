import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { generateOTP, sendSelfVerificationOtpEmail } from '@/lib/email';
import { sendWelcomeEmail } from '@/lib/email';
import { generateCertificate } from '@/lib/certificate';
import { generateIDCard } from '@/lib/id-card-generator';
import { getStateLanguagePreference } from '@/lib/language-preference';

const retainCertificateFiles = process.env.RETAIN_CERTIFICATE_FILES !== 'false';

// In-memory OTP store for self-verification (per email)
const selfOtpStore: Map<
  string,
  { otp: string; memberId: number; expiresAt: number; used: boolean }
> = new Map();

// In-memory name change counter for self-service edits (per member)
// NOTE: This is a fallback because the database currently has no name_change_count column.
// It resets on server restart/redeploy, but still enforces a practical cap in normal usage.
// DEPRECATED: Now using database column `name_change_count` in `members` table.
const selfNameChangeStore: Map<number, number> = new Map();

export async function POST(request: NextRequest) {
  try {
    const { action, data } = (await request.json()) as {
      action: 'send-otp' | 'verify-otp' | 'update-details';
      data: any;
    };

    if (action === 'send-otp') {
      const email = (data?.email || '').trim();
      if (!email) {
        return NextResponse.json(
          { success: false, message: 'Email is required' },
          { status: 400 }
        );
      }

      const memberRows = await executeQuery(
        `SELECT 
           id,
           name,
           email,
           member_reg_number,
           status,
           state
         FROM members
         WHERE email = ?
         LIMIT 1`,
        [email]
      ) as Array<{
        id: number;
        name: string;
        email: string;
        member_reg_number: string;
        status: string;
        state: string | null;
      }>;

      if (memberRows.length === 0) {
        return NextResponse.json(
          { success: false, message: 'This email is not registered as a member. If your email is not registered, please contact your respective admin via the Contact Us section on the main page.' },
          { status: 404 }
        );
      }

      const member = memberRows[0];

      // Only allow verified members to self-edit
      if (member.status !== 'verified') {
        return NextResponse.json(
          { success: false, message: 'Self-verification is only available for verified members' },
          { status: 400 }
        );
      }

      const otp = generateOTP();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

      selfOtpStore.set(email, {
        otp,
        memberId: member.id,
        expiresAt,
        used: false,
      });

      try {
        // Pick language based on member's state preference (default Hindi)
        let language: 'hi' | 'en' = 'hi';
        try {
          if (member.state) {
            const pref = await getStateLanguagePreference({ stateName: member.state });
            if (pref === 'hi' || pref === 'en') {
              language = pref;
            }
          }
        } catch (langErr) {
          console.warn('[Self Verification] Failed to resolve state language preference for OTP email:', langErr);
        }

        await sendSelfVerificationOtpEmail(
          member.email,
          otp,
          member.name,
          language
        );
      } catch (err) {
        console.error('[Self Verification] Failed to send OTP email (non-fatal):', err);
      }

      return NextResponse.json({
        success: true,
        message: 'OTP sent successfully',
      });
    }

    if (action === 'verify-otp') {
      const email = (data?.email || '').trim();
      const otp = (data?.otp || '').trim();

      if (!email || !otp) {
        return NextResponse.json(
          { success: false, message: 'Email and OTP are required' },
          { status: 400 }
        );
      }

      const record = selfOtpStore.get(email);
      if (!record || record.used || record.otp !== otp || Date.now() > record.expiresAt) {
        return NextResponse.json(
          { success: false, message: 'Invalid or expired OTP' },
          { status: 400 }
        );
      }

      // Mark OTP as used
      selfOtpStore.set(email, { ...record, used: true });

      // Fetch member details for display + editing
      const memberRows = await executeQuery(
        `SELECT 
           id,
           name,
           email,
           phone,
           address,
           father_husband_name,
           mother_wife_name,
           member_reg_number,
           registration_date,
           state,
           district,
           profile_photo_path,
           COALESCE(name_change_count, 0) as name_change_count
         FROM members
         WHERE id = ?
         LIMIT 1`,
        [record.memberId]
      ) as Array<{
        id: number;
        name: string;
        email: string;
        phone: string;
        address: string;
        father_husband_name: string;
        mother_wife_name: string;
        member_reg_number: string;
        registration_date: string;
        state: string | null;
        district: string | null;
        profile_photo_path: string | null;
        name_change_count: number;
      }>;

      if (memberRows.length === 0) {
        return NextResponse.json(
          { success: false, message: 'Member not found' },
          { status: 404 }
        );
      }

      const maxNameChanges = 3;
      const currentNameChangeCount = memberRows[0].name_change_count ?? 0;

      return NextResponse.json({
        success: true,
        member: {
          ...memberRows[0],
          name_change_count: currentNameChangeCount,
          max_name_changes: maxNameChanges,
        },
      });
    }

    if (action === 'update-details') {
      const {
        memberId,
        name,
        father_husband_name,
        mother_wife_name,
        phone,
        address,
      } = data ?? {};

      if (!memberId) {
        return NextResponse.json(
          { success: false, message: 'Member ID is required' },
          { status: 400 }
        );
      }

      const memberRows = await executeQuery(
        `SELECT 
           id,
           name,
           email,
           phone,
           address,
           father_husband_name,
           mother_wife_name,
           member_reg_number,
           registration_date,
           state,
           district,
           profile_photo_path,
           status,
           COALESCE(name_change_count, 0) as name_change_count
         FROM members
         WHERE id = ?
         LIMIT 1`,
        [memberId]
      ) as Array<{
        id: number;
        name: string;
        email: string;
        phone: string;
        address: string;
        father_husband_name: string;
        mother_wife_name: string;
        member_reg_number: string;
        registration_date: string;
        state: string | null;
        district: string | null;
        profile_photo_path: string | null;
        status: string;
        name_change_count: number;
      }>;

      if (memberRows.length === 0) {
        return NextResponse.json(
          { success: false, message: 'Member not found' },
          { status: 404 }
        );
      }

      const existing = memberRows[0];

      if (existing.status !== 'verified') {
        return NextResponse.json(
          { success: false, message: 'Only verified members can update their details' },
          { status: 400 }
        );
      }

      const maxNameChanges = 3;
      const trimmedNewName = (name ?? '').trim();
      const nameChanged = trimmedNewName && trimmedNewName !== existing.name;

      const existingNameChangeCount = existing.name_change_count ?? 0;

      if (nameChanged && existingNameChangeCount >= maxNameChanges) {
        return NextResponse.json(
          {
            success: false,
            message: `You have reached the maximum limit of ${maxNameChanges} name changes.`,
          },
          { status: 400 }
        );
      }

      const updateFields: string[] = [];
      const updateValues: any[] = [];

      if (name !== undefined && name !== null) {
        updateFields.push('name = ?');
        updateValues.push(trimmedNewName);
      }
      if (father_husband_name !== undefined && father_husband_name !== null) {
        updateFields.push('father_husband_name = ?');
        updateValues.push(father_husband_name);
      }
      if (mother_wife_name !== undefined && mother_wife_name !== null) {
        updateFields.push('mother_wife_name = ?');
        updateValues.push(mother_wife_name);
      }
      if (phone !== undefined && phone !== null) {
        updateFields.push('phone = ?');
        updateValues.push(phone);
      }
      if (address !== undefined && address !== null) {
        updateFields.push('address = ?');
        updateValues.push(address);
      }

      if (updateFields.length === 0) {
        return NextResponse.json(
          { success: false, message: 'No fields to update' },
          { status: 400 }
        );
      }

      // If name changed, increment name_change_count in the database
      if (nameChanged) {
        updateFields.push('name_change_count = COALESCE(name_change_count, 0) + 1');
      }

      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      updateValues.push(memberId);

      const updateQuery = `UPDATE members SET ${updateFields.join(', ')} WHERE id = ?`;
      await executeQuery(updateQuery, updateValues);

      let membershipEmailSent = false;
      let newNameChangeCount = existingNameChangeCount;

      if (nameChanged) {
        newNameChangeCount += 1;

        // Determine language preference
        let languagePreference: 'hi' | 'en' = 'hi';
        try {
          if (existing.state) {
            const pref = await getStateLanguagePreference({
              stateName: existing.state,
            });
            if (pref === 'hi' || pref === 'en') {
              languagePreference = pref;
            }
          }
        } catch (err) {
          console.warn(
            '[Self Verification] Failed to resolve language preference for certificate/ID card resend:',
            err
          );
        }

        // Regenerate membership certificate
        let certificatePath: string | null = null;
        let certificateNumber: string | null = null;
        let certificateRecordId: number | null = null;

        try {
          console.log(
            '[Self Verification] Regenerating membership certificate for member:',
            existing.member_reg_number
          );
          const certificateResult = await generateCertificate({
            memberId: existing.id,
            memberName: trimmedNewName,
            memberRegNumber: existing.member_reg_number,
            registrationDate: existing.registration_date,
            profilePhotoPath: existing.profile_photo_path ?? undefined,
            language: languagePreference,
          });

          certificatePath = certificateResult.certificatePath;
          certificateNumber = certificateResult.certificateNumber;

          console.log(
            '[Self Verification] ✅ Certificate regenerated:',
            certificateNumber,
            certificatePath
          );

          const certInsert = await executeQuery(
            `INSERT INTO member_certificates (member_id, certificate_number, certificate_path, generated_by_admin_id)
             VALUES (?, ?, ?, NULL)`,
            [existing.id, certificateNumber, certificatePath]
          ) as { insertId: number };

          certificateRecordId = certInsert.insertId ?? null;
        } catch (err) {
          console.error('[Self Verification] ❌ Error regenerating membership certificate:', err);
        }

        // Regenerate membership ID card
        let idCardPath: string | null = null;
        try {
          console.log(
            '[Self Verification] Regenerating membership ID card for member:',
            existing.member_reg_number
          );
          const idResult = await generateIDCard({
            memberId: existing.id,
            memberName: trimmedNewName,
            memberRegNumber: existing.member_reg_number,
            profilePhotoPath: existing.profile_photo_path ?? undefined,
            address: address ?? existing.address,
            designation: 'Member',
            cardType: 'membership',
            language: languagePreference,
            state: existing.state,
            district: existing.district,
          });

          idCardPath = idResult.idCardPath;
        } catch (err) {
          console.error('[Self Verification] ❌ Error regenerating membership ID card:', err);
        }

        // Send membership email
        try {
          console.log('[Self Verification] Sending updated membership email to:', existing.email);
          const emailResult = await sendWelcomeEmail(
            existing.email,
            trimmedNewName,
            existing.member_reg_number,
            certificatePath || undefined,
            idCardPath || undefined,
            languagePreference
          );

          if (emailResult?.success) {
            membershipEmailSent = true;

            if (!retainCertificateFiles && certificateRecordId) {
              await executeQuery(
                'UPDATE member_certificates SET certificate_path = NULL WHERE id = ?',
                [certificateRecordId]
              );
            }
          } else {
            console.error('[Self Verification] ❌ Failed to send membership email:', emailResult?.error);
          }
        } catch (err) {
          console.error('[Self Verification] ❌ Error sending membership email:', err);
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Member details updated successfully',
        membershipEmailSent,
        name_change_count: newNameChangeCount,
        max_name_changes: maxNameChanges,
      });
    }

    return NextResponse.json(
      { success: false, message: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[Self Verification] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}


