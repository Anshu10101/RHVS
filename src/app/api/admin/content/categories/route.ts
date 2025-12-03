import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, getConnection } from '@/lib/database';
import { getAdminScope, ensurePermission } from '@/lib/admin-scope';
import { noCacheJsonResponse } from '@/lib/api-helpers';

// Force dynamic rendering to prevent Next.js caching
export const dynamic = 'force-dynamic';

// GET all categories (admin)
export async function GET() {
  try {
    const rows = await executeQuery(
      `SELECT id, name, description, isVisible, created_at, updated_at
       FROM product_categories
       ORDER BY name ASC`
    ) as Array<{ id: number; name: string; description: string; isVisible: boolean; created_at: string; updated_at: string }>;
    return noCacheJsonResponse({ success: true, categories: rows });
  } catch (e) {
    console.error('categories GET error', e);
    return noCacheJsonResponse({ success: false, message: 'Server error' }, { status: 500 });
  }
}

// CREATE category
export async function POST(req: NextRequest) {
  try {
    const scope = await getAdminScope(req);
    if (!scope.isSuperAdmin && !ensurePermission(scope, ['add_products','edit_store','manage_store'])) {
      return noCacheJsonResponse({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { id, name, description, isVisible } = body;
    
    console.log('[Category POST] Received request:', { id, name, description, isVisible });
    
    if (!id || !name) {
      console.error('[Category POST] Missing required fields:', { id, name });
      return noCacheJsonResponse({ success: false, message: 'Missing required fields: id and name are required' }, { status: 400 });
    }

    // Use explicit connection with transaction to ensure data is committed
    const connection = await getConnection();
    
    try {
      // Start transaction
      await connection.beginTransaction();
      
      // Check if category already exists
      const [existingRows] = await connection.execute(
        'SELECT id FROM product_categories WHERE id = ?',
        [id]
      ) as [Array<{ id: string }>, unknown];

      if (existingRows.length > 0) {
        console.log('[Category POST] Category already exists, updating:', id);
        // Update existing category
        await connection.execute(
          `UPDATE product_categories 
           SET name = ?, description = ?, isVisible = ?, updated_at = NOW()
           WHERE id = ?`,
          [name, description ?? null, isVisible ? 1 : 0, id]
        );
      } else {
        console.log('[Category POST] Creating new category:', id);
        // Insert new category
        await connection.execute(
          `INSERT INTO product_categories (id, name, description, isVisible, created_at, updated_at)
           VALUES (?, ?, ?, ?, NOW(), NOW())`,
          [id, name, description ?? null, isVisible ? 1 : 0]
        );
        console.log('[Category POST] Category inserted successfully');
      }

      // Commit the transaction
      await connection.commit();
      console.log('[Category POST] Transaction committed successfully');

      // Verify the category was created/updated (use a new query after commit)
      const [verifyRows] = await connection.execute(
        'SELECT id, name, description, isVisible FROM product_categories WHERE id = ?',
        [id]
      ) as [Array<{ id: string; name: string; description: string | null; isVisible: number }>, unknown];

      if (verifyRows.length === 0) {
        console.error('[Category POST] Category not found after insert/update:', id);
        return noCacheJsonResponse({ success: false, message: 'Failed to create category - category not found after insertion' }, { status: 500 });
      }

      console.log('[Category POST] Successfully created/updated category:', verifyRows[0]);
      return noCacheJsonResponse({ 
        success: true, 
        category: {
          id: verifyRows[0].id,
          name: verifyRows[0].name,
          description: verifyRows[0].description,
          isVisible: verifyRows[0].isVisible === 1
        }
      });
    } catch (transactionError) {
      // Rollback on error
      await connection.rollback();
      console.error('[Category POST] Transaction error, rolled back:', transactionError);
      throw transactionError;
    } finally {
      // Always release the connection
      connection.release();
    }
  } catch (e) {
    console.error('[Category POST] Error details:', e);
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    const errorStack = e instanceof Error ? e.stack : undefined;
    console.error('[Category POST] Error stack:', errorStack);
    return noCacheJsonResponse({ 
      success: false, 
      message: 'Server error',
      error: errorMessage
    }, { status: 500 });
  }
}

// UPDATE category
export async function PUT(req: NextRequest) {
  try {
    const scope = await getAdminScope(req);
    if (!scope.isSuperAdmin && !ensurePermission(scope, ['add_products','edit_store','manage_store'])) {
      return noCacheJsonResponse({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const { id, name, description, isVisible } = await req.json();
    if (!id) {
      return noCacheJsonResponse({ success: false, message: 'Category id is required' }, { status: 400 });
    }

    const connection = await getConnection();
    
    try {
      await connection.beginTransaction();
      
      await connection.execute(
        `UPDATE product_categories
         SET name = COALESCE(?, name),
             description = COALESCE(?, description),
             isVisible = COALESCE(?, isVisible),
             updated_at = NOW()
         WHERE id = ?`,
        [name ?? null, description ?? null, typeof isVisible === 'boolean' ? (isVisible ? 1 : 0) : null, id]
      );

      await connection.commit();
      
      // Verify update
      const [verifyRows] = await connection.execute(
        'SELECT id, name, description, isVisible FROM product_categories WHERE id = ?',
        [id]
      ) as [Array<{ id: string; name: string; description: string | null; isVisible: number }>, unknown];
      
      if (verifyRows.length === 0) {
        throw new Error('Category not found after update');
      }
      
      return noCacheJsonResponse({ 
        success: true,
        category: {
          id: verifyRows[0].id,
          name: verifyRows[0].name,
          description: verifyRows[0].description,
          isVisible: verifyRows[0].isVisible === 1
        }
      });
    } catch (transactionError) {
      await connection.rollback();
      throw transactionError;
    } finally {
      connection.release();
    }
  } catch (e) {
    console.error('[Category PUT] Error:', e);
    return noCacheJsonResponse({ success: false, message: 'Server error' }, { status: 500 });
  }
}

// DELETE category
export async function DELETE(req: NextRequest) {
  try {
    const scope = await getAdminScope(req);
    if (!scope.isSuperAdmin && !ensurePermission(scope, ['add_products','edit_store','manage_store'])) {
      return noCacheJsonResponse({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return noCacheJsonResponse({ success: false, message: 'Category id is required' }, { status: 400 });
    }

    const connection = await getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Optional: set products with this category to NULL to keep referential integrity
      try {
        await connection.execute(`UPDATE products SET category = NULL WHERE category = ?`, [id]);
      } catch {}

      await connection.execute(`DELETE FROM product_categories WHERE id = ?`, [id]);
      
      await connection.commit();
      
      return noCacheJsonResponse({ success: true });
    } catch (transactionError) {
      await connection.rollback();
      throw transactionError;
    } finally {
      connection.release();
    }
  } catch (e) {
    console.error('categories DELETE error', e);
    return noCacheJsonResponse({ success: false, message: 'Server error' }, { status: 500 });
  }
}


