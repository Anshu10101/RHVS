import { NextRequest, NextResponse } from 'next/server';
import { ContentService } from '@/lib/content';
import { noCacheJsonResponse } from '@/lib/api-helpers';

export async function GET(_request: NextRequest) {
  try {
    // For the public store API, always show all products regardless of admin status
    // District filtering only applies to admin dashboard, not public store
    const filter = { unrestricted: true };

    const products = await ContentService.getProducts(filter);
    const categories = await ContentService.getProductCategories();

    return noCacheJsonResponse({ 
      success: true, 
      products, 
      categories 
    });
  } catch (error) {
    console.error('Error fetching store content:', error);
    return noCacheJsonResponse({ 
      success: false, 
      error: 'Failed to fetch store content' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { products, categories, updatedBy } = await request.json();

    if (!products || !categories) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    // TODO: Implement saveStoreContent method in ContentService
    // const success = await ContentService.saveStoreContent(products, categories, updatedBy || 'admin');

    return NextResponse.json({ 
      success: false, 
      error: 'Not implemented: saveStoreContent method is missing' 
    }, { status: 501 });
  } catch (error) {
    console.error('Error saving store content:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to save store content' 
    }, { status: 500 });
  }
}
