import { NextRequest, NextResponse } from 'next/server';
import { ContentService } from '@/lib/content';

export async function GET() {
  try {
    const products = await ContentService.getProducts();
    const categories = await ContentService.getProductCategories();

    return NextResponse.json({ 
      success: true, 
      products, 
      categories 
    });
  } catch (error) {
    console.error('Error fetching store content:', error);
    return NextResponse.json({ 
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

    const success = await ContentService.saveStoreContent(products, categories, updatedBy || 'admin');

    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Store content saved successfully' 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to save store content' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error saving store content:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to save store content' 
    }, { status: 500 });
  }
}
