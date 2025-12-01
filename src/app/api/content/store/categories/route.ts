import { NextResponse } from 'next/server';
import { ContentService } from '@/lib/content';
import { noCacheJsonResponse } from '@/lib/api-helpers';

// Force dynamic rendering to prevent Next.js caching
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const categories = await ContentService.getProductCategories();

    return noCacheJsonResponse({ 
      success: true, 
      categories 
    });
  } catch (error) {
    console.error('Error fetching product categories:', error);
    return noCacheJsonResponse({ 
      success: false, 
      error: 'Failed to fetch product categories' 
    }, { status: 500 });
  }
}
