import { executeQuery } from './database';

/**
 * Generates the next sequential member registration number
 * Maintains the sequential flow: RHVS0000007, RHVS0000008, etc.
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
    
    const countResult: any = await executeQuery(countQuery);
    const maxNumber = countResult[0].max_num || 0;
    const nextNumber = maxNumber + 1;
    
    // Format with 7 digits to maintain consistency
    const memberRegNumber = `RHVS${nextNumber.toString().padStart(7, '0')}`;
    
    // Double-check that the generated number doesn't already exist (safety check)
    const checkQuery = 'SELECT id FROM members WHERE member_reg_number = ?';
    const existingResult: any = await executeQuery(checkQuery, [memberRegNumber]);
    
    if (existingResult.length > 0) {
      // If somehow it exists, increment and try again
      const newNextNumber = nextNumber + 1;
      return `RHVS${newNextNumber.toString().padStart(7, '0')}`;
    }
    
    return memberRegNumber;
  } catch (error) {
    console.error('Error generating member registration number:', error);
    // Fallback to timestamp-based number if database query fails
    const timestamp = Date.now().toString().slice(-7);
    return `RHVS${timestamp}`;
  }
}
