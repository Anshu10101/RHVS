import { NextResponse } from 'next/server';
import { ContentService } from '@/lib/content';

export async function GET() {
  try {
    const categories = await ContentService.getProductCategories();

    return NextResponse.json({ 
      success: true, 
      categories 
    });
  } catch (error) {
    console.error('Error fetching product categories:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch product categories' 
    }, { status: 500 });
  }
}
