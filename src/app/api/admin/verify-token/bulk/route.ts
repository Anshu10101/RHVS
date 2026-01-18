import { NextRequest, NextResponse } from 'next/server';
import { getAdminScope } from '@/lib/admin-scope';
import { executeQuery } from '@/lib/database';
import { getStateLanguagePreference } from '@/lib/language-preference';
import { noCacheJsonResponse } from '@/lib/api-helpers';
import { z } from 'zod';

const bulkVerifySchema = z.object({
  tokenIds: z.array(z.number().int().positive()).min(1).max(500), // Max 500 at a time
});

export async function POST(request: NextRequest) {
  try {
    const scope = await getAdminScope(request);

    if (!scope.isSuperAdmin && !scope.isDistrictAdmin) {
      return noCacheJsonResponse(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validationResult = bulkVerifySchema.safeParse(body);

    if (!validationResult.success) {
      return noCacheJsonResponse(
        {
          success: false,
          error: 'Validation failed',
          details: validationResult.error.format(),
        },
        { status: 400 }
      );
    }

    const { tokenIds } = validationResult.data;

    // Fetch all tokens
    const placeholders = tokenIds.map(() => '?').join(',');
    const tokens = await executeQuery(
      `SELECT 
        rt.id,
        rt.name,
        rt.email,
        rt.phone,
        rt.address,
        rt.state,
        rt.district,
        rt.aadhar_card_number,
        rt.father_husband_name,
        rt.mother_wife_name,
        rt.registration_date,
        rt.existing_member_reg_number,
        rt.profile_photo_path,
        rt.signature_path,
        rt.profile_photo_blob,
        rt.signature_blob,
        rt.department,
        m.member_reg_number as verifier_reg_number
      FROM registration_tokens rt
      LEFT JOIN members m ON m.member_reg_number = rt.existing_member_reg_number
      WHERE rt.id IN (${placeholders})
        AND rt.status = 'pending'
      ORDER BY rt.id ASC`,
      tokenIds
    ) as Array<{
      id: number;
      name: string;
      email: string;
      phone: string;
      address: string;
      state: string;
      district: string;
      aadhar_card_number: string;
      father_husband_name: string;
      mother_wife_name: string;
      registration_date: string;
      existing_member_reg_number: string;
      profile_photo_path: string | null;
      signature_path: string | null;
      profile_photo_blob: Buffer | null;
      signature_blob: Buffer | null;
      department: string | null;
      verifier_reg_number: string | null;
    }>;

    if (tokens.length === 0) {
      return noCacheJsonResponse(
        { success: false, error: 'No pending tokens found' },
        { status: 404 }
      );
    }

    // Generate member registration numbers and insert members
    const membersToQueue: Array<{
      memberId: number;
      memberName: string;
      memberRegNumber: string;
      email: string;
      registrationDate: string;
      profilePhotoPath?: string;
      address?: string;
      language: 'hi' | 'en';
      state?: string;
      district?: string;
      adminId?: number;
    }> = [];

    for (const tokenData of tokens) {
      try {
        // Generate member registration number
        const regNumberResult = await executeQuery(
          'SELECT COALESCE(MAX(CAST(SUBSTRING(member_reg_number, 5) AS UNSIGNED)), 0) + 1 AS next_num FROM members WHERE member_reg_number LIKE "RHVS%"',
          []
        ) as Array<{ next_num: number }>;

        const nextNum = regNumberResult[0]?.next_num || 1;
        const memberRegNumber = `RHVS${String(nextNum).padStart(6, '0')}`;

        // Get verifier ID
        const verifierResult = await executeQuery(
          'SELECT id FROM members WHERE member_reg_number = ? LIMIT 1',
          [tokenData.existing_member_reg_number]
        ) as Array<{ id: number }>;
        const verifierId = verifierResult[0]?.id || null;

        // Insert member
        const verifiedByAdminId = scope.isSuperAdmin ? scope.adminId : null;
        const insertResult = await executeQuery(
          `INSERT INTO members (
            member_reg_number, name, email, phone, address, state, district, aadhar_card_number,
            father_husband_name, mother_wife_name, registration_date, existing_member_reg_number,
            profile_photo_path, signature_path, department, verified_by_admin_id, verification_date,
            status, verified_by_member_id, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'verified', ?, NOW(), NOW())`,
          [
            memberRegNumber,
            tokenData.name,
            tokenData.email,
            tokenData.phone,
            tokenData.address,
            tokenData.state,
            tokenData.district,
            tokenData.aadhar_card_number,
            tokenData.father_husband_name,
            tokenData.mother_wife_name,
            tokenData.registration_date,
            tokenData.existing_member_reg_number,
            tokenData.profile_photo_path,
            tokenData.signature_path,
            tokenData.department,
            verifiedByAdminId,
            verifierId,
          ]
        ) as { insertId: number };

        const memberId = insertResult.insertId;

        // Handle profile photo blob if exists
        let profilePhotoPath = tokenData.profile_photo_path;
        if (tokenData.profile_photo_blob) {
          profilePhotoPath = `/api/media/members/${memberId}/profile`;
          await executeQuery(
            `UPDATE members 
             SET profile_photo_blob = ?, profile_photo_path = ?
             WHERE id = ?`,
            [tokenData.profile_photo_blob, profilePhotoPath, memberId]
          );
        }

        // Update token status
        await executeQuery(
          'UPDATE registration_tokens SET status = ?, verified_by_admin_id = ?, verified_at = NOW() WHERE id = ?',
          ['verified', scope.adminId, tokenData.id]
        );

        // Get language preference
        const languagePreference = await getStateLanguagePreference({
          stateName: tokenData.state,
        });

        // Add to queue
        membersToQueue.push({
          memberId,
          memberName: tokenData.name,
          memberRegNumber,
          email: tokenData.email,
          registrationDate: tokenData.registration_date,
          profilePhotoPath: profilePhotoPath || undefined,
          address: tokenData.address,
          language: languagePreference,
          state: tokenData.state,
          district: tokenData.district,
          adminId: scope.adminId || undefined,
        });
      } catch (error) {
        console.error(`[Bulk Verify] Error processing token ${tokenData.id}:`, error);
        // Continue with other tokens
      }
    }

    // Queue all members for PDF generation and email
    // Use internal API call to avoid importing Bull in this route (prevents Turbopack bundling)
    if (membersToQueue.length > 0) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                       (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
        const queueResponse = await fetch(`${baseUrl}/api/admin/queue-member-verification`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ members: membersToQueue }),
        });
        
        if (queueResponse.ok) {
          console.log(`[Bulk Verify] Queued ${membersToQueue.length} members for processing`);
        } else {
          throw new Error('Queue API failed');
        }
      } catch (queueError) {
        console.error('[Bulk Verify] Failed to queue jobs:', queueError);
        // Continue anyway - members are already verified in DB
      }
    }

    // Queue status - return default since we can't import getQueueStatus here
    const queueStatus = { waiting: 0, active: 0 };

    return noCacheJsonResponse({
      success: true,
      message: `Successfully verified ${membersToQueue.length} member(s). PDF generation and emails are being processed in the background.`,
      verified: membersToQueue.length,
      queued: membersToQueue.length,
      queueStatus: {
        waiting: queueStatus.waiting,
        active: queueStatus.active,
      },
    });
  } catch (error) {
    console.error('[Bulk Verify] Error:', error);
    return noCacheJsonResponse(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to bulk verify members',
      },
      { status: 500 }
    );
  }
}


