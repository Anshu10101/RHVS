#!/usr/bin/env ts-node
/**
 * Script to generate mock registration tokens for testing queue functionality
 * 
 * Usage:
 *   npx tsx scripts/generate-mock-tokens.ts [count]
 *   Example: npx tsx scripts/generate-mock-tokens.ts 150
 * 
 * This will create mock tokens in the database that can be used to test
 * bulk verification and queue processing.
 */

import { executeQuery } from '../src/lib/database';
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

function generateMockToken(index: number) {
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
  
  // Generate unique token
  let token = '';
  for (let attempt = 0; attempt < 10; attempt++) {
    token = generateRegistrationToken(registrationDate.toISOString().split('T')[0]);
    // Check if token exists (we'll check in the insert query)
    break;
  }
  
  // Calculate expiry (10 days from now)
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
    existing_member_reg_number: 'RHVS000001', // Use a valid existing member reg number
    profile_photo_path: null,
    department,
    expires_at: expiresAt.toISOString().slice(0, 19).replace('T', ' '),
  };
}

async function getExistingMemberRegNumber(): Promise<string> {
  try {
    const result = await executeQuery(
      'SELECT member_reg_number FROM members WHERE member_reg_number IS NOT NULL LIMIT 1'
    ) as Array<{ member_reg_number: string }>;
    
    if (result.length > 0) {
      return result[0].member_reg_number;
    }
    
    // If no member exists, create one for testing
    console.log('⚠️  No existing member found. Creating a test member...');
    const testMemberResult = await executeQuery(
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
    ) as { insertId: number };
    
    console.log('✅ Created test member with reg number: RHVS000001');
    return 'RHVS000001';
  } catch (error) {
    console.error('Error getting/creating test member:', error);
    // Fallback to a hardcoded value
    return 'RHVS000001';
  }
}

async function main() {
  const count = process.argv[2] ? parseInt(process.argv[2], 10) : 100;
  
  if (isNaN(count) || count < 1) {
    console.error('❌ Invalid count. Please provide a number greater than 0.');
    console.log('Usage: npx tsx scripts/generate-mock-tokens.ts [count]');
    process.exit(1);
  }
  
  console.log(`🚀 Generating ${count} mock registration tokens...`);
  
  try {
    // Get or create existing member reg number
    const existingMemberRegNumber = await getExistingMemberRegNumber();
    console.log(`📋 Using existing member reg number: ${existingMemberRegNumber}`);
    
    // Generate mock tokens
    const tokens = [];
    for (let i = 1; i <= count; i++) {
      const tokenData = generateMockToken(i);
      tokenData.existing_member_reg_number = existingMemberRegNumber;
      tokens.push(tokenData);
    }
    
    console.log(`📦 Generated ${tokens.length} token records`);
    console.log('💾 Inserting into database...');
    
    // Insert tokens in batches of 50 to avoid overwhelming the database
    const batchSize = 50;
    let inserted = 0;
    let skipped = 0;
    
    for (let i = 0; i < tokens.length; i += batchSize) {
      const batch = tokens.slice(i, i + batchSize);
      
      for (const tokenData of batch) {
        try {
          // Try to insert, skip if token already exists (collision)
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
          // Skip duplicate token errors
          if (error?.code === 'ER_DUP_ENTRY' || error?.message?.includes('Duplicate entry')) {
            skipped++;
          } else {
            console.error(`❌ Error inserting token ${tokenData.token}:`, error.message);
          }
        }
      }
      
      console.log(`  Processed ${Math.min(i + batchSize, tokens.length)}/${tokens.length} tokens...`);
    }
    
    console.log('\n✅ Mock tokens generated successfully!');
    console.log(`   ✅ Inserted: ${inserted}`);
    console.log(`   ⚠️  Skipped (duplicates): ${skipped}`);
    console.log(`   📊 Total: ${inserted + skipped}`);
    
    // Verify count
    const countResult = await executeQuery(
      "SELECT COUNT(*) as count FROM registration_tokens WHERE status = 'pending' AND email LIKE 'test.member%@rhvs-test.com'"
    ) as Array<{ count: number }>;
    
    console.log(`\n📈 Current pending test tokens in database: ${countResult[0]?.count || 0}`);
    console.log('\n🎯 Next steps:');
    console.log('   1. Go to admin panel → Token Verification');
    console.log('   2. You should see the mock tokens listed');
    console.log('   3. Use bulk verify or verify them individually to test queue');
    console.log('   4. Monitor worker logs: pm2 logs rhvs-worker');
    
  } catch (error) {
    console.error('❌ Error generating mock tokens:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

main();

