import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { getAdminScope } from '@/lib/admin-scope';
import { z } from 'zod';

// Schema for creating a department (level is determined when assigning members)
const createDepartmentSchema = z.object({
  name_en: z.string().min(3, 'English name is required and must be at least 3 characters'),
  name_hi: z.string().min(3, 'Hindi name is required and must be at least 3 characters'),
});

// GET all departments
export async function GET(request: NextRequest) {
  try {
    const scope = await getAdminScope(request);
    
    // Check if user is authenticated and is a superadmin
    if (!scope.isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const level = searchParams.get('level');
    const state = searchParams.get('state');
    const district = searchParams.get('district');

    // Build the query based on filters
    let query = 'SELECT * FROM departments WHERE 1=1';
    const params: any[] = [];

    if (level) {
      query += ' AND level = ?';
      params.push(level);
    }

    if (state) {
      query += ' AND state = ?';
      params.push(state);
    }

    if (district) {
      query += ' AND district = ?';
      params.push(district);
    }

    query += ' ORDER BY name_en ASC';

    // Execute the query
    const departments = await executeQuery(query, params) as any[];

    return NextResponse.json({ departments });
  } catch (error) {
    console.error('Error fetching departments:', error);
    return NextResponse.json({ error: 'Failed to fetch departments' }, { status: 500 });
  }
}

// POST create a new department
export async function POST(request: NextRequest) {
  try {
    const scope = await getAdminScope(request);
    
    // Check if user is authenticated and is a superadmin
    if (!scope.isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Superadmin access required' }, { status: 401 });
    }

    // Verify we have an adminId
    if (!scope.adminId) {
      return NextResponse.json({ error: 'Invalid admin session' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = createDepartmentSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validationResult.error.format() 
      }, { status: 400 });
    }

    const { name_en, name_hi } = validationResult.data;

    // Check if department with same name already exists
    const existingDepartment = await executeQuery(
      'SELECT * FROM departments WHERE name_en = ?',
      [name_en]
    ) as any[];

    if (existingDepartment.length > 0) {
      return NextResponse.json({ error: 'Department with this name already exists' }, { status: 409 });
    }

    // Debug the admin scope
    console.log('Admin scope:', scope);
    
    // Get the first superadmin ID as fallback
    let adminId = scope.adminId;
    if (!adminId) {
      const superadmins = await executeQuery('SELECT id FROM superadmin LIMIT 1') as any[];
      if (superadmins && superadmins.length > 0) {
        adminId = superadmins[0].id;
        console.log('Using fallback superadmin ID:', adminId);
      }
    }
    
    // Insert the new department (without level - will be determined when assigning members)
    const result = await executeQuery(
      'INSERT INTO departments (name_en, name_hi, created_by) VALUES (?, ?, ?)',
      [name_en, name_hi, adminId]
    ) as any;

    return NextResponse.json({
      success: true,
      department_id: result.insertId,
      message: 'Department created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating department:', error);
    return NextResponse.json({ 
      error: 'Failed to create department', 
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
    }, { status: 500 });
  }
}
