import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

// GET divisions by state
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const stateCode = searchParams.get('stateCode');
    const stateName = searchParams.get('stateName');
    const search = searchParams.get('search');
    
    // Build query - match divisions to states by finding the state first, then getting its divisions
    let query = '';
    const params: (string | number)[] = [];
    
    if (stateName) {
      // Method 1: Get state first, then match divisions by state_code pattern matching
      // Since state_code types might not match, we'll use a subquery approach
      query = `
        SELECT 
          d.id,
          d.division_code,
          d.division_name_english,
          d.division_name_hindi,
          d.state_code,
          s.state_name_english,
          s.state_name_hindi
        FROM divisions d
        CROSS JOIN states s
        WHERE s.state_name_english = ?
          AND (
            -- Try matching state_code directly (if types match)
            CAST(d.state_code AS CHAR) = CAST(s.state_code AS CHAR)
            OR
            -- Match by state name patterns as fallback
            (d.state_code = 'AR' AND s.state_name_english LIKE '%Arunachal%')
            OR (d.state_code = 'AS' AND s.state_name_english LIKE '%Assam%')
            OR (d.state_code = 'BR' AND s.state_name_english LIKE '%Bihar%')
            OR (d.state_code = 'CT' AND s.state_name_english LIKE '%Chhattisgarh%')
            OR (d.state_code = 'HR' AND s.state_name_english LIKE '%Haryana%')
            OR (d.state_code = 'HP' AND s.state_name_english LIKE '%Himachal%')
            OR (d.state_code = 'JH' AND s.state_name_english LIKE '%Jharkhand%')
            OR (d.state_code = 'KA' AND s.state_name_english LIKE '%Karnataka%')
            OR (d.state_code = 'MP' AND s.state_name_english LIKE '%Madhya%')
            OR (d.state_code = 'MH' AND s.state_name_english LIKE '%Maharashtra%')
            OR (d.state_code = 'ML' AND s.state_name_english LIKE '%Meghalaya%')
            OR (d.state_code = 'NL' AND s.state_name_english LIKE '%Nagaland%')
            OR (d.state_code = 'OD' AND (s.state_name_english LIKE '%Odisha%' OR s.state_name_english LIKE '%Orissa%'))
            OR (d.state_code = 'PB' AND s.state_name_english LIKE '%Punjab%')
            OR (d.state_code = 'RJ' AND s.state_name_english LIKE '%Rajasthan%')
            OR (d.state_code = 'UP' AND (s.state_name_english = 'Uttar Pradesh' OR s.state_name_english LIKE 'Uttar Pradesh%'))
            OR (d.state_code = 'UT' AND s.state_name_english LIKE '%Uttarakhand%')
            OR (d.state_code = 'WB' AND s.state_name_english LIKE '%West Bengal%')
          )
      `;
      params.push(stateName.trim());
      console.log(`[Divisions API] Filtering by state name: "${stateName.trim()}"`);
    } else if (stateCode) {
      // Fallback: filter by state code if provided
      query = `
        SELECT 
          d.id,
          d.division_code,
          d.division_name_english,
          d.division_name_hindi,
          d.state_code,
          s.state_name_english,
          s.state_name_hindi
        FROM divisions d
        LEFT JOIN states s ON CAST(d.state_code AS CHAR) = CAST(s.state_code AS CHAR)
        WHERE CAST(s.state_code AS CHAR) = ?
      `;
      params.push(String(stateCode));
    } else {
      // No filter - return all divisions
      query = `
        SELECT 
          d.id,
          d.division_code,
          d.division_name_english,
          d.division_name_hindi,
          d.state_code,
          s.state_name_english,
          s.state_name_hindi
        FROM divisions d
        LEFT JOIN states s ON CAST(d.state_code AS CHAR) = CAST(s.state_code AS CHAR)
        WHERE 1=1
      `;
    }
    
    // Add search filter if provided
    if (search && search.trim()) {
      query += ' AND (LOWER(d.division_name_english) LIKE LOWER(?) OR LOWER(d.division_name_hindi) LIKE LOWER(?))';
      const searchTerm = `%${search.trim()}%`;
      params.push(searchTerm, searchTerm);
    }
    
    query += ' ORDER BY d.division_name_english ASC';
    
    console.log(`[Divisions API] Executing query with params:`, params);
    console.log(`[Divisions API] Query:`, query);
    
    const divisions = await executeQuery(query, params) as Array<{
      id: number;
      division_code: string;
      division_name_english: string;
      division_name_hindi: string;
      state_code: string;
      state_name_english: string;
      state_name_hindi: string | null;
    }>;
    
    console.log(`[Divisions API] Found ${divisions.length} divisions for stateName: "${stateName}", stateCode: "${stateCode}"`);
    
    // If no divisions found, check if state exists and has divisions
    if (divisions.length === 0 && stateName) {
      const stateCheck = await executeQuery(
        'SELECT state_code, state_name_english FROM states WHERE state_name_english = ? LIMIT 1',
        [stateName.trim()]
      ) as Array<{ state_code: string | number; state_name_english: string }>;
      
      if (stateCheck.length > 0) {
        const stateCodeCheck = String(stateCheck[0].state_code);
        // Try to find divisions by matching state_code as strings
        const divisionCount = await executeQuery(
          'SELECT COUNT(*) as count FROM divisions WHERE CAST(state_code AS CHAR) = ?',
          [stateCodeCheck]
        ) as Array<{ count: number }>;
        
        console.log(`[Divisions API] State "${stateName}" exists with code "${stateCodeCheck}", has ${divisionCount[0]?.count || 0} divisions in database`);
        
        // If still no divisions found, try alternative: match by state name directly
        if (divisionCount[0]?.count === 0) {
          // Check if divisions table has any data at all
          const totalDivisions = await executeQuery(
            'SELECT COUNT(*) as count FROM divisions'
          ) as Array<{ count: number }>;
          console.log(`[Divisions API] Total divisions in database: ${totalDivisions[0]?.count || 0}`);
        }
      } else {
        console.warn(`[Divisions API] State "${stateName}" not found in states table`);
      }
    }
    
    return NextResponse.json({
      success: true,
      data: divisions
    });
  } catch (error) {
    console.error('Error fetching divisions:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch divisions',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

