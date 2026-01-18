import { NextRequest, NextResponse } from 'next/server';
import { getAdminScope } from '@/lib/admin-scope';
import { executeQuery } from '@/lib/database';
import { noCacheJsonResponse } from '@/lib/api-helpers';
import crypto from 'crypto';

// Generate a secure token (same format as real tokens)
function generateRegistrationToken(sourceDate?: string): string {
  const prefix = 'RHVS';
  const randomDigits = crypto.randomInt(10000, 100000).toString();
  const referenceDate = sourceDate && !Number.isNaN(Date.parse(sourceDate))
    ? new Date(sourceDate)
    : new Date();
  const day = referenceDate.getDate().toString().padStart(2, '0');
  const month = (referenceDate.getMonth() + 1).toString().padStart(2, '0');
  return `${prefix}-${randomDigits}-${day}${month}`;
}

// Mock data generators
const firstNames = ['Raj', 'Priya', 'Amit', 'Sunita', 'Vikram', 'Kavita', 'Suresh', 'Meera', 'Anil', 'Deepika'];
const lastNames = ['Sharma', 'Patel', 'Singh', 'Kumar', 'Verma', 'Gupta', 'Yadav', 'Mishra', 'Joshi', 'Reddy'];
const states = ['Uttar Pradesh', 'Bihar', 'Rajasthan', 'Madhya Pradesh', 'Maharashtra', 'Gujarat', 'Haryana'];
const districts = ['Lucknow', 'Varanasi', 'Kanpur', 'Allahabad', 'Agra', 'Meerut', 'Jaipur', 'Jodhpur'];
const departments = ['IT', 'HR', 'Finance', 'Marketing', 'Operations', 'Sales'];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function generateMockToken(index: number, existingMemberRegNumber: string) {
  const firstName = getRandomElement(firstNames);
  const lastName = getRandomElement(lastNames);
  const name = `${firstName} ${lastName} ${index}`;
  const email = `test.member${index}@rhvs-test.com`;
  const phone = `9${Math.floor(Math.random() * 9000000000) + 1000000000}`;
  const state = getRandomElement(states);
  const district = getRandomElement(districts);
  const address = `${Math.floor(Math.random() * 999) + 1} Test Street, ${district}, ${state}`;
  const fatherName = `${getRandomElement(firstNames)} ${lastName}`;
  const motherName = `${getRandomElement(firstNames)} ${lastName}`;
  const registrationDate = new Date(2020 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
  const aadhar = `${Math.floor(Math.random() * 9000) + 1000}${Math.floor(Math.random() * 9000) + 1000}${Math.floor(Math.random() * 9000) + 1000}${Math.floor(Math.random() * 9000) + 1000}`;
  const department = getRandomElement(departments);
  const token = generateRegistrationToken(registrationDate.toISOString().split('T')[0]);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 10);
  
  return {
    token,
    name,
    email,
    phone,
    address,
    state,
    district,
    aadhar_card_number: aadhar,
    father_husband_name: fatherName,
    mother_wife_name: motherName,
    registration_date: registrationDate.toISOString().split('T')[0],
    existing_member_reg_number: existingMemberRegNumber,
    profile_photo_path: null,
    department,
    expires_at: expiresAt.toISOString().slice(0, 19).replace('T', ' '),
  };
}

export async function POST(request: NextRequest) {
  try {
    const scope = await getAdminScope(request);
    
    if (!scope.isSuperAdmin) {
      return noCacheJsonResponse(
        { success: false, error: 'Unauthorized - Superadmin access required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const count = Math.min(Math.max(parseInt(body.count || '100', 10), 1), 500); // Between 1 and 500

    console.log(`[Test] Generating ${count} mock registration tokens...`);

    // Get or create existing member reg number
    let existingMemberRegNumber: string;
    try {
      const result = await executeQuery(
        'SELECT member_reg_number FROM members WHERE member_reg_number IS NOT NULL LIMIT 1'
      ) as Array<{ member_reg_number: string }>;
      
      if (result.length > 0) {
        existingMemberRegNumber = result[0].member_reg_number;
      } else {
        // Create a test member
        await executeQuery(
          `INSERT INTO members (
            name, email, phone, address, state, district,
            father_husband_name, mother_wife_name, registration_date,
            existing_member_reg_number, member_reg_number, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            'Test Member',
            'test@rhvs-test.com',
            '9876543210',
            'Test Address',
            'Uttar Pradesh',
            'Lucknow',
            'Test Father',
            'Test Mother',
            new Date().toISOString().split('T')[0],
            'TEST',
            'RHVS000001',
            'verified'
          ]
        );
        existingMemberRegNumber = 'RHVS000001';
      }
    } catch (error) {
      existingMemberRegNumber = 'RHVS000001'; // Fallback
    }

    // Generate mock tokens
    const tokens = [];
    for (let i = 1; i <= count; i++) {
      tokens.push(generateMockToken(i, existingMemberRegNumber));
    }

    // Insert tokens
    let inserted = 0;
    let skipped = 0;

    for (const tokenData of tokens) {
      try {
        await executeQuery(
          `INSERT INTO registration_tokens (
            token, name, email, phone, address, state, district, aadhar_card_number,
            father_husband_name, mother_wife_name, registration_date, existing_member_reg_number,
            profile_photo_path, department, expires_at, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
          [
            tokenData.token,
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
            tokenData.department,
            tokenData.expires_at,
          ]
        );
        inserted++;
      } catch (error: any) {
        if (error?.code === 'ER_DUP_ENTRY' || error?.message?.includes('Duplicate entry')) {
          skipped++;
        }
      }
    }

    // Get current count
    const countResult = await executeQuery(
      "SELECT COUNT(*) as count FROM registration_tokens WHERE status = 'pending' AND email LIKE 'test.member%@rhvs-test.com'"
    ) as Array<{ count: number }>;

    return noCacheJsonResponse({
      success: true,
      message: `Generated ${inserted} mock tokens (${skipped} skipped due to duplicates)`,
      inserted,
      skipped,
      totalPending: countResult[0]?.count || 0,
    });
  } catch (error) {
    console.error('[Test] Error generating mock tokens:', error);
    return noCacheJsonResponse(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate mock tokens',
      },
      { status: 500 }
    );
  }
}

