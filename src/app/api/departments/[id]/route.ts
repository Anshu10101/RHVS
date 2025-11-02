import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { getAdminScope } from '@/lib/admin-scope';
import { z } from 'zod';

// Schema for updating a department
const updateDepartmentSchema = z.object({
  name_en: z.string().min(3, 'English name is required and must be at least 3 characters').optional(),
  name_hi: z.string().min(3, 'Hindi name is required and must be at least 3 characters').optional(),
});

// PATCH - Update a department
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const scope = await getAdminScope(request);
    
    // Check if user is authenticated and is a superadmin
    if (!scope.isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Superadmin access required' }, { status: 401 });
    }

    const { id } = await params;
    const departmentId = parseInt(id);

    if (isNaN(departmentId)) {
      return NextResponse.json({ error: 'Invalid department ID' }, { status: 400 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateDepartmentSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validationResult.error.format() 
      }, { status: 400 });
    }

    const { name_en, name_hi } = validationResult.data;

    // Check if department exists
    const existingDepartment = await executeQuery(
      'SELECT * FROM departments WHERE id = ?',
      [departmentId]
    ) as any[];

    if (existingDepartment.length === 0) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    // Check if another department with the same name exists (if name is being updated)
    if (name_en) {
      const duplicateCheck = await executeQuery(
        'SELECT * FROM departments WHERE name_en = ? AND id != ?',
        [name_en, departmentId]
      ) as any[];

      if (duplicateCheck.length > 0) {
        return NextResponse.json({ error: 'Department with this English name already exists' }, { status: 409 });
      }
    }

    // Build update query dynamically
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (name_en !== undefined) {
      updateFields.push('name_en = ?');
      updateValues.push(name_en);
    }

    if (name_hi !== undefined) {
      updateFields.push('name_hi = ?');
      updateValues.push(name_hi);
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(departmentId);

    // Update the department
    await executeQuery(
      `UPDATE departments SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    return NextResponse.json({
      success: true,
      message: 'Department updated successfully'
    });
  } catch (error) {
    console.error('Error updating department:', error);
    return NextResponse.json({ 
      error: 'Failed to update department',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

