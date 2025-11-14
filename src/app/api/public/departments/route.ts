import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedLevel = (searchParams.get('level') || 'national').toLowerCase();
    const validLevels = new Set(['national', 'state', 'district']);
    const level = validLevels.has(requestedLevel) ? requestedLevel : 'national';
    const stateFilter = searchParams.get('state')?.trim() || null;
    const districtFilter = searchParams.get('district')?.trim() || null;

    // Require filters for state/district requests so UI can show guidance
    if (level === 'state' && !stateFilter) {
      return NextResponse.json({ success: true, departments: [] });
    }
    if (level === 'district' && (!stateFilter || !districtFilter)) {
      return NextResponse.json({ success: true, departments: [] });
    }

    const shouldFallbackToDefaults = level === 'national';

    const defaultDepartments = shouldFallbackToDefaults
      ? [
          {
            id: 'default-1',
            name_en: 'Cultural Affairs',
            name_hi: 'सांस्कृतिक मामले',
            post_name_en: 'President',
            post_name_hi: 'अध्यक्ष',
            president: null
          },
          {
            id: 'default-2',
            name_en: 'Youth Affairs',
            name_hi: 'युवा मामले',
            post_name_en: 'President',
            post_name_hi: 'अध्यक्ष',
            president: null
          },
          {
            id: 'default-3',
            name_en: "Women's Wing",
            name_hi: 'महिला मोर्चा',
            post_name_en: 'President',
            post_name_hi: 'अध्यक्ष',
            president: null
          },
          {
            id: 'default-4',
            name_en: 'Education & Research',
            name_hi: 'शिक्षा एवं अनुसंधान',
            post_name_en: 'President',
            post_name_hi: 'अध्यक्ष',
            president: null
          },
          {
            id: 'default-5',
            name_en: 'Social Service',
            name_hi: 'सामाजिक सेवा',
            post_name_en: 'President',
            post_name_hi: 'अध्यक्ष',
            president: null
          },
          {
            id: 'default-6',
            name_en: 'Media & Communication',
            name_hi: 'मीडिया एवं संचार',
            post_name_en: 'President',
            post_name_hi: 'अध्यक्ष',
            president: null
          }
        ]
      : [];

    const buildLevelClause = (alias: string) => {
      const clauses: string[] = [`${alias}.level = ?`];
      const params: string[] = [level];

      if (level === 'state') {
        clauses.push(`${alias}.state = ?`);
        params.push(stateFilter!);
      } else if (level === 'district') {
        clauses.push(`${alias}.state = ?`);
        clauses.push(`${alias}.district = ?`);
        params.push(stateFilter!);
        params.push(districtFilter!);
      }

      return {
        clause: clauses.join(' AND '),
        params
      };
    };

    // Try to get real departments from database
    try {
      // First, get all departments (exclude National Executive Department - it's shown separately)
      const departmentsQuery = `
        SELECT 
          d.id,
          d.name_en,
          d.name_hi,
          'President' as post_name_en,
          'अध्यक्ष' as post_name_hi
        FROM departments d
        WHERE d.name_en IS NOT NULL AND d.name_en != ''
          AND (d.is_national_executive IS NULL OR d.is_national_executive = FALSE)
        ORDER BY d.name_en
      `;

      const dbDepartments = await executeQuery(departmentsQuery, []) as Array<{
        id: number;
        name_en: string;
        name_hi: string;
        post_name_en: string;
        post_name_hi: string;
      }>;

      if (dbDepartments && dbDepartments.length > 0) {
        const levelJoin = buildLevelClause('dm');
        const levelSub = buildLevelClause('dm2');

        // Get presidents from department_members table for the requested level
        const presidentQuery = `
          SELECT 
            d.id,
            d.name_en,
            d.name_hi,
            dp.name_en as post_name_en,
            dp.name_hi as post_name_hi,
            m.id as member_id,
            m.name as member_name,
            CASE 
              WHEN m.profile_photo_blob IS NOT NULL THEN CONCAT('/api/media/members/', m.id, '/profile')
              ELSE m.profile_photo_path
            END AS profile_photo_path,
            m.member_reg_number,
            m.email as member_email
          FROM departments d
          LEFT JOIN department_posts dp ON d.id = dp.department_id AND dp.position_order = 1
          LEFT JOIN department_members dm ON d.id = dm.department_id 
            AND dp.id = dm.post_id 
            AND (${levelJoin.clause})
            AND dm.id = (
              SELECT dm2.id
              FROM department_members dm2
              WHERE dm2.department_id = d.id
                AND dm2.post_id = dp.id
                AND (${levelSub.clause})
              ORDER BY dm2.assigned_at ASC
              LIMIT 1
            )
          LEFT JOIN members m ON dm.member_id = m.id AND m.status = 'verified'
          WHERE d.name_en IS NOT NULL AND d.name_en != ''
            AND (d.is_national_executive IS NULL OR d.is_national_executive = FALSE)
        `;

        let presidentDepartments: Array<{
          id: number;
          name_en: string;
          name_hi: string;
          post_name_en: string | null;
          post_name_hi: string | null;
          member_id: number | null;
          member_name: string | null;
          profile_photo_path: string | null;
          member_reg_number: string | null;
          member_email: string | null;
        }> = [];

        try {
          const presidentParams = [...levelJoin.params, ...levelSub.params];
          presidentDepartments = await executeQuery(presidentQuery, presidentParams) as Array<{
            id: number;
            name_en: string;
            name_hi: string;
            post_name_en: string | null;
            post_name_hi: string | null;
            member_id: number | null;
            member_name: string | null;
            profile_photo_path: string | null;
            member_reg_number: string | null;
            member_email: string | null;
          }>;
        } catch (presError) {
          console.log('President query failed:', presError);
        }

        // Merge departments with their presidents
        const departmentMap = new Map();
        
        // Add all departments first
        dbDepartments.forEach(dept => {
          departmentMap.set(dept.id, {
            id: dept.id,
            name_en: dept.name_en,
            name_hi: dept.name_hi,
            post_name_en: dept.post_name_en,
            post_name_hi: dept.post_name_hi,
            president: null
          });
        });

        // Update with president appointments (only from department_members, president post)
        presidentDepartments.forEach(presDept => {
          if (presDept.member_id) {
            departmentMap.set(presDept.id, {
              id: presDept.id,
              name_en: presDept.name_en,
              name_hi: presDept.name_hi,
              post_name_en: presDept.post_name_en || 'President',
              post_name_hi: presDept.post_name_hi || 'अध्यक्ष',
              president: {
                id: presDept.member_id,
                name: presDept.member_name,
                photo_path: presDept.profile_photo_path,
                reg_number: presDept.member_reg_number,
                email: presDept.member_email
              }
            });
          }
        });

        const formattedDbDepartments = Array.from(departmentMap.values());

        return NextResponse.json({
          success: true,
          departments: formattedDbDepartments
        });
      }
    } catch (dbError) {
      console.log('Database query failed, using fallback data:', dbError);
    }

    // Return fallback departments if database query fails or level filters missing data
    return NextResponse.json({
      success: true,
      departments: defaultDepartments
    });

  } catch (error) {
    console.error('Error in departments API:', error);
    
    // Even on error, return default departments
    const fallbackDepartments = [
      {
        id: 'fallback-1',
        name_en: 'Cultural Affairs',
        name_hi: 'सांस्कृतिक मामले',
        post_name_en: 'President',
        post_name_hi: 'अध्यक्ष',
        president: null
      }
    ];

    return NextResponse.json({
      success: true,
      departments: fallbackDepartments
    });
  }
}
