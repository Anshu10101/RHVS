import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';
import { getAdminScope, ensurePermission } from '@/lib/admin-scope';
import { noCacheJsonResponse } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET - Fetch marquee (public or admin)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const district = searchParams.get('district');
    const state = searchParams.get('state');
    const admin = searchParams.get('admin') === 'true';

    let query = `
      SELECT 
        id,
        text,
        text_color,
        background_color,
        speed,
        is_active,
        is_global,
        district,
        state,
        created_by,
        created_by_type,
        created_at,
        updated_at
      FROM marquee
      WHERE is_active = TRUE
    `;

    let params: (string | number)[] = [];

    const listAll = searchParams.get('list') === 'true';

    if (admin && listAll) {
      // Admin panel: show all marquees (active and inactive) as a list
      // For district admins, filter by their district/state
      const scope = await getAdminScope(request);
      if (scope.isDistrictAdmin && !scope.isSuperAdmin && !scope.isNewsEditor) {
        query = query.replace('WHERE is_active = TRUE', 'WHERE 1=1');
        query += ` AND (is_global = FALSE) AND district = ? AND state = ?`;
        params.push(scope.districtName || '', scope.stateName || '');
      } else {
        query = query.replace('WHERE is_active = TRUE', 'WHERE 1=1');
      }
      query += ` ORDER BY created_at DESC`;
      const [rows] = await pool.execute(query, params);
      const marquees = Array.isArray(rows) ? rows : [];
      return noCacheJsonResponse({
        success: true,
        data: marquees,
      }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      });
    }

    if (admin) {
      // Admin panel: show all marquees (active and inactive)
      query = query.replace('WHERE is_active = TRUE', 'WHERE 1=1');
    } else {
      // Public: only show active marquees
      if (district && state) {
        // Prioritize district-specific marquees over global ones
        // Use case-insensitive matching to handle variations
        const districtTrimmed = district.trim();
        const stateTrimmed = state.trim();
        
        console.log('🔍 Marquee fetch - Looking for:', { district: districtTrimmed, state: stateTrimmed });
        
        // First, let's see what marquees exist in the database for debugging
        const [debugRows] = await pool.execute(
          'SELECT id, district, state, is_global, is_active, text FROM marquee WHERE is_active = TRUE'
        ) as any[];
        console.log('📋 All active marquees in DB:', debugRows.map((r: any) => ({
          id: r.id,
          district: r.district,
          state: r.state,
          is_global: r.is_global,
          text: r.text?.substring(0, 30)
        })));
        
        // Try to match district/state exactly (case-insensitive, trimmed)
        // Also handle NULL values properly
        query += ` AND (is_global = TRUE OR (
          is_global = FALSE AND 
          LOWER(TRIM(COALESCE(district, ''))) = LOWER(?) AND 
          LOWER(TRIM(COALESCE(state, ''))) = LOWER(?)
        ))`;
        params.push(districtTrimmed, stateTrimmed);
        // Order: district-specific first (is_global = FALSE comes before TRUE), then by date
        query += ` ORDER BY is_global ASC, created_at DESC LIMIT 1`;
      } else {
        // No district/state specified - try global first, then any district-specific
        console.log('🔍 Marquee fetch - No district/state provided, trying global first, then any district-specific');
        
        // First try to get a global marquee
        const [globalRows] = await pool.execute(
          'SELECT * FROM marquee WHERE is_active = TRUE AND is_global = TRUE ORDER BY created_at DESC LIMIT 1'
        ) as any[];
        
        if (globalRows.length > 0) {
          console.log('✅ Found global marquee, using it');
          // Build query for global marquee
          query = `
            SELECT 
              id,
              text,
              text_color,
              background_color,
              speed,
              is_active,
              is_global,
              district,
              state,
              created_by,
              created_by_type,
              created_at,
              updated_at
            FROM marquee
            WHERE is_active = TRUE AND is_global = TRUE
            ORDER BY created_at DESC LIMIT 1
          `;
          params = [];
        } else {
          // No global marquee, show any active district-specific marquee
          console.log('⚠️ No global marquee found, showing any active district-specific marquee');
          query = `
            SELECT 
              id,
              text,
              text_color,
              background_color,
              speed,
              is_active,
              is_global,
              district,
              state,
              created_by,
              created_by_type,
              created_at,
              updated_at
            FROM marquee
            WHERE is_active = TRUE AND is_global = FALSE
            ORDER BY created_at DESC LIMIT 1
          `;
          params = [];
        }
      }
    }

    // Only add ORDER BY if not already added above
    if (!query.includes('ORDER BY')) {
      query += ` ORDER BY created_at DESC LIMIT 1`;
    }

    console.log('📊 Marquee query:', query);
    console.log('📊 Marquee params:', params);
    
    const [rows] = await pool.execute(query, params);
    const marquees = (Array.isArray(rows) ? rows : []) as Array<{
      id: number;
      text: string | null;
      text_color: string | null;
      background_color: string | null;
      speed: number | null;
      is_active: boolean;
      is_global: boolean;
      district: string | null;
      state: string | null;
      created_by: number | null;
      created_by_type: string | null;
      created_at: string;
      updated_at: string;
    }>;
    
    console.log('📊 Marquee results:', marquees.length, marquees.length > 0 ? {
      id: marquees[0].id,
      text: marquees[0].text?.substring(0, 50),
      is_global: marquees[0].is_global,
      district: marquees[0].district,
      state: marquees[0].state
    } : 'No results');

    return noCacheJsonResponse({
      success: true,
      data: marquees.length > 0 ? marquees[0] : null,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    console.error('Error fetching marquee:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch marquee' },
      { status: 500 }
    );
  }
}

// POST - Create new marquee
export async function POST(request: NextRequest) {
  try {
    const scope = await getAdminScope(request);

    // Check permissions
    if (!scope.isSuperAdmin && !scope.isNewsEditor && !ensurePermission(scope, ['manage_marquee'])) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const {
      text,
      text_color = '#92400e',
      background_color = '#fef3c7',
      speed = 40,
      is_active = true,
      is_global = true,
      district = null,
      state = null,
    } = body;

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Marquee text is required' },
        { status: 400 }
      );
    }

    // For district admins, automatically set their district/state
    let finalDistrict = district;
    let finalState = state;
    let finalIsGlobal = is_global;

    if (scope.isDistrictAdmin && !scope.isSuperAdmin && !scope.isNewsEditor) {
      finalDistrict = scope.districtName || null;
      finalState = scope.stateName || null;
      finalIsGlobal = false; // District admins can't create global marquees
      
      console.log('📝 District Admin creating marquee:', { 
        districtName: scope.districtName, 
        stateName: scope.stateName,
        finalDistrict,
        finalState,
        adminId: scope.adminId
      });
      
      // If state is missing, try to get it from the member's district/state or from districts table
      if (!finalState && finalDistrict) {
        try {
          // Try to get state from districts table using district name
          const [districtRows] = await pool.execute(
            `SELECT d.state_name_english as state_name 
             FROM districts d 
             WHERE d.district_name_english = ? 
             LIMIT 1`,
            [finalDistrict]
          ) as any[];
          
          if (districtRows.length > 0) {
            finalState = districtRows[0].state_name;
            console.log('✅ Found state from districts table:', finalState);
          }
        } catch (e) {
          console.error('Error fetching state from districts:', e);
        }
      }
      
      if (!finalDistrict || !finalState) {
        console.error('❌ Missing district or state for district admin:', { finalDistrict, finalState });
        return NextResponse.json(
          { success: false, error: 'District admin must have district and state assigned. Please contact superadmin.' },
          { status: 400 }
        );
      }
    }

    // If superadmin/news editor sets district/state, validate they exist
    if ((scope.isSuperAdmin || scope.isNewsEditor) && district && state) {
      const [stateRows] = await pool.execute(
        'SELECT state_name_english FROM states WHERE state_name_english = ? LIMIT 1',
        [state]
      ) as any[];

      if (stateRows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Invalid state' },
          { status: 400 }
        );
      }

      const [districtRows] = await pool.execute(
        'SELECT district_name_english FROM districts WHERE district_name_english = ? AND state_code = (SELECT state_code FROM states WHERE state_name_english = ?) LIMIT 1',
        [district, state]
      ) as any[];

      if (districtRows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Invalid district for the selected state' },
          { status: 400 }
        );
      }
    }

    // Deactivate other marquees for the same scope (district/state or global)
    if (is_active) {
      if (finalIsGlobal) {
        await pool.execute(
          'UPDATE marquee SET is_active = FALSE WHERE is_global = TRUE'
        );
      } else if (finalDistrict && finalState) {
        await pool.execute(
          'UPDATE marquee SET is_active = FALSE WHERE district = ? AND state = ?',
          [finalDistrict, finalState]
        );
      }
    }

    // Ensure district and state are trimmed and normalized
    if (finalDistrict) finalDistrict = finalDistrict.trim();
    if (finalState) finalState = finalState.trim();
    
    console.log('💾 Inserting marquee with:', {
      text: text.substring(0, 50),
      is_active,
      is_global: finalIsGlobal,
      district: finalDistrict,
      state: finalState,
      userType: scope.isSuperAdmin ? 'superadmin' : scope.isNewsEditor ? 'news_editor' : 'district_admin'
    });

    const insertQuery = `
      INSERT INTO marquee (
        text, text_color, background_color, speed, is_active, is_global,
        district, state, created_by, created_by_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const userType = scope.isSuperAdmin ? 'superadmin' : 
                     scope.isNewsEditor ? 'news_editor' : 
                     'district_admin';

    const [result] = await pool.execute(insertQuery, [
      text.trim(),
      text_color,
      background_color,
      speed,
      is_active ? 1 : 0,
      finalIsGlobal ? 1 : 0,
      finalDistrict,
      finalState,
      scope.adminId,
      userType,
    ]) as any[];

    return noCacheJsonResponse({
      success: true,
      data: { id: result.insertId },
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    console.error('Error creating marquee:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create marquee' },
      { status: 500 }
    );
  }
}

// PUT - Update marquee
export async function PUT(request: NextRequest) {
  try {
    const scope = await getAdminScope(request);

    // Check permissions
    if (!scope.isSuperAdmin && !scope.isNewsEditor && !ensurePermission(scope, ['manage_marquee'])) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const {
      id,
      text,
      text_color,
      background_color,
      speed,
      is_active,
      is_global,
      district,
      state,
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Marquee ID is required' },
        { status: 400 }
      );
    }

    // Check if marquee exists and user has permission to edit it
    const [existingRows] = await pool.execute(
      'SELECT created_by, created_by_type, district, state, is_global FROM marquee WHERE id = ?',
      [id]
    ) as any[];

    if (existingRows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Marquee not found' },
        { status: 404 }
      );
    }

    const existing = existingRows[0];

    // District admins can edit any marquee for their district (if they have permission)
    if (!scope.isSuperAdmin && !scope.isNewsEditor && scope.isDistrictAdmin) {
      // Check if marquee belongs to their district/state
      if (existing.is_global || 
          existing.district !== scope.districtName || 
          existing.state !== scope.stateName) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized to edit this marquee. You can only edit marquees for your district.' },
          { status: 403 }
        );
      }
    }

    // Build update query
    const updateFields: string[] = [];
    const updateParams: (string | number | null)[] = [];

    if (text !== undefined) {
      updateFields.push('text = ?');
      updateParams.push(text.trim());
    }
    if (text_color !== undefined) {
      updateFields.push('text_color = ?');
      updateParams.push(text_color);
    }
    if (background_color !== undefined) {
      updateFields.push('background_color = ?');
      updateParams.push(background_color);
    }
    if (speed !== undefined) {
      updateFields.push('speed = ?');
      updateParams.push(speed);
    }
    if (is_active !== undefined) {
      updateFields.push('is_active = ?');
      updateParams.push(is_active ? 1 : 0);
    }
    if (is_global !== undefined && (scope.isSuperAdmin || scope.isNewsEditor)) {
      updateFields.push('is_global = ?');
      updateParams.push(is_global ? 1 : 0);
    }
    if (district !== undefined && (scope.isSuperAdmin || scope.isNewsEditor)) {
      updateFields.push('district = ?');
      updateParams.push(district);
    }
    if (state !== undefined && (scope.isSuperAdmin || scope.isNewsEditor)) {
      updateFields.push('state = ?');
      updateParams.push(state);
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      );
    }

    updateParams.push(id);

    const updateQuery = `UPDATE marquee SET ${updateFields.join(', ')} WHERE id = ?`;
    await pool.execute(updateQuery, updateParams);

    // If activating this marquee, deactivate others in the same scope
    if (is_active !== undefined && is_active) {
      // Use existing marquee's scope if district/state not provided in update
      const targetIsGlobal = is_global !== undefined ? is_global : existing.is_global;
      const targetDistrict = district !== undefined ? district : existing.district;
      const targetState = state !== undefined ? state : existing.state;
      
      if (targetIsGlobal) {
        await pool.execute(
          'UPDATE marquee SET is_active = FALSE WHERE is_global = TRUE AND id != ?',
          [id]
        );
      } else if (targetDistrict && targetState) {
        await pool.execute(
          'UPDATE marquee SET is_active = FALSE WHERE district = ? AND state = ? AND id != ?',
          [targetDistrict, targetState, id]
        );
      }
    }

    return noCacheJsonResponse({
      success: true,
      message: 'Marquee updated successfully',
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    console.error('Error updating marquee:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update marquee' },
      { status: 500 }
    );
  }
}

// DELETE - Delete marquee
export async function DELETE(request: NextRequest) {
  try {
    const scope = await getAdminScope(request);

    // Check permissions
    if (!scope.isSuperAdmin && !scope.isNewsEditor && !ensurePermission(scope, ['manage_marquee'])) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Marquee ID is required' },
        { status: 400 }
      );
    }

    // Check if marquee exists and user has permission to delete it
    const [existingRows] = await pool.execute(
      'SELECT created_by, district, state, is_global FROM marquee WHERE id = ?',
      [id]
    ) as any[];

    if (existingRows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Marquee not found' },
        { status: 404 }
      );
    }

    const existing = existingRows[0];

    // District admins can delete any marquee for their district (if they have permission)
    if (!scope.isSuperAdmin && !scope.isNewsEditor && scope.isDistrictAdmin) {
      // Check if marquee belongs to their district/state
      if (existing.is_global || 
          existing.district !== scope.districtName || 
          existing.state !== scope.stateName) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized to delete this marquee. You can only delete marquees for your district.' },
          { status: 403 }
        );
      }
    }

    await pool.execute('DELETE FROM marquee WHERE id = ?', [id]);

    return noCacheJsonResponse({
      success: true,
      message: 'Marquee deleted successfully',
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    console.error('Error deleting marquee:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete marquee' },
      { status: 500 }
    );
  }
}

