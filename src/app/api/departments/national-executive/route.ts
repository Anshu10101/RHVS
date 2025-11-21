import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { getAdminScope } from '@/lib/admin-scope';
import { noCacheJsonResponse } from '@/lib/api-helpers';

// GET - Get the current National Executive Department
export async function GET(request: NextRequest) {
  try {
    const scope = await getAdminScope(request);
    
    // Check if user is authenticated and is a superadmin
    // District admins should not access this endpoint at all
    if (!scope.isSuperAdmin) {
      return NextResponse.json({ 
        error: 'Forbidden. National Executive Department is restricted to superadmins only.' 
      }, { status: 403 });
    }

    // Get the department marked as National Executive
    const query = `
      SELECT id, name_en, name_hi, level, state, district, is_national_executive
      FROM departments 
      WHERE is_national_executive = TRUE 
      LIMIT 1
    `;

    const result = await executeQuery(query, []) as Array<{
      id: number;
      name_en: string;
      name_hi: string;
      level: string;
      state: string | null;
      district: string | null;
      is_national_executive: boolean;
    }>;

    if (result.length === 0) {
    return noCacheJsonResponse({
      success: true,
      department: null,
      message: 'No National Executive Department set'
    });
    }

    return noCacheJsonResponse({
      success: true,
      department: result[0]
    });
  } catch (error) {
    console.error('Error fetching National Executive Department:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch National Executive Department' 
    }, { status: 500 });
  }
}

// PATCH - Set a department as National Executive Department
export async function PATCH(request: NextRequest) {
  try {
    const scope = await getAdminScope(request);
    
    // Check if user is authenticated and is a superadmin
    if (!scope.isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Superadmin access required' }, { status: 401 });
    }

    const body = await request.json();
    const { department_id } = body;

    if (!department_id || isNaN(parseInt(department_id))) {
      return NextResponse.json({ 
        error: 'Valid department_id is required' 
      }, { status: 400 });
    }

    const departmentId = parseInt(department_id);

    // Check if department exists
    const existingDepartment = await executeQuery(
      'SELECT * FROM departments WHERE id = ?',
      [departmentId]
    ) as Array<{
      id: number;
      name_en: string;
      name_hi: string;
      is_national_executive: boolean;
    }>;

    if (existingDepartment.length === 0) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    // First, unmark all other departments as National Executive
    // (MySQL doesn't allow updating the same table in a trigger)
    await executeQuery(
      'UPDATE departments SET is_national_executive = FALSE WHERE is_national_executive = TRUE AND id != ?',
      [departmentId]
    );

    // Then set this one as National Executive
    await executeQuery(
      'UPDATE departments SET is_national_executive = TRUE WHERE id = ?',
      [departmentId]
    );

    return NextResponse.json({
      success: true,
      message: 'National Executive Department set successfully',
      department: {
        id: existingDepartment[0].id,
        name_en: existingDepartment[0].name_en,
        name_hi: existingDepartment[0].name_hi
      }
    });
  } catch (error) {
    console.error('Error setting National Executive Department:', error);
    return NextResponse.json({ 
      error: 'Failed to set National Executive Department',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE - Unset the National Executive Department
export async function DELETE(request: NextRequest) {
  try {
    const scope = await getAdminScope(request);
    
    // Check if user is authenticated and is a superadmin
    if (!scope.isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Superadmin access required' }, { status: 401 });
    }

    // Unset all National Executive departments
    await executeQuery(
      'UPDATE departments SET is_national_executive = FALSE WHERE is_national_executive = TRUE',
      []
    );

    return NextResponse.json({
      success: true,
      message: 'National Executive Department unset successfully'
    });
  } catch (error) {
    console.error('Error unsetting National Executive Department:', error);
    return NextResponse.json({ 
      error: 'Failed to unset National Executive Department',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

