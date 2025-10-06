import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { getAdminScope } from '@/lib/admin-scope';

export async function POST(req: NextRequest) {
  try {
    const scope = await getAdminScope(req);
    
    // Only superadmin can run this fix
    if (!scope.isSuperAdmin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    // Update all products with stock = 0 or NULL to have stock = 10
    const result = await executeQuery(
      'UPDATE products SET stock = 10 WHERE stock = 0 OR stock IS NULL'
    );

    // Get updated products count
    const [products] = await executeQuery('SELECT COUNT(*) as count FROM products WHERE stock > 0');
    const [zeroStock] = await executeQuery('SELECT COUNT(*) as count FROM products WHERE stock = 0 OR stock IS NULL');

    return NextResponse.json({ 
      success: true, 
      message: `Stock updated successfully! ${result.affectedRows} products updated.`,
      stats: {
        updated: result.affectedRows,
        inStock: products[0].count,
        outOfStock: zeroStock[0].count
      }
    });

  } catch (error) {
    console.error('Error updating stock:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to update stock',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
