import { executeQuery } from './database';

/**
 * Generates the next sequential member registration number
 * New members start from RHVS1111111 going forward
 * Maintains the sequential flow: RHVS1111111, RHVS1111112, etc.
 * 
 * @returns Promise<string> - Next registration number in sequence
 */
export async function generateMemberRegistrationNumber(): Promise<string> {
  try {
    // Get the highest existing registration number
    const countQuery = `
      SELECT MAX(CAST(SUBSTRING(member_reg_number, 5) AS UNSIGNED)) as max_num 
      FROM members 
      WHERE member_reg_number REGEXP "^RHVS[0-9]+$"
    `;
    
    const countResult: Array<{ max_num: number }> = await executeQuery(countQuery) as Array<{ max_num: number }>;
    const maxNumber = countResult[0].max_num || 0;
    
    // Start new registrations from 1111111 if max number is less than that
    // Otherwise continue from max number + 1
    const startNumber = 1111111;
    const nextNumber = maxNumber < startNumber ? startNumber : maxNumber + 1;
    
    // Format with 7 digits to maintain consistency
    const memberRegNumber = `RHVS${nextNumber.toString().padStart(7, '0')}`;
    
    // Double-check that the generated number doesn't already exist (safety check)
    const checkQuery = 'SELECT id FROM members WHERE member_reg_number = ?';
    const existingResult: Array<{ id: number }> = await executeQuery(checkQuery, [memberRegNumber]) as Array<{ id: number }>;
    
    if (existingResult.length > 0) {
      // If somehow it exists, increment and try again
      const newNextNumber = nextNumber + 1;
      return `RHVS${newNextNumber.toString().padStart(7, '0')}`;
    }
    
    return memberRegNumber;
  } catch (error) {
    console.error('Error generating member registration number:', error);
    // Fallback to start from 1111111 if database query fails
    return 'RHVS1111111';
  }
}
