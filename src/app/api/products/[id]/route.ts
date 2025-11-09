import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await context.params;
    console.log('Fetching product with ID:', productId);

    if (!productId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Product ID is required' 
      }, { status: 400 });
    }

    // Get product details with images and seller information
    const productRows = await executeQuery(`
      SELECT DISTINCT
        p.id, p.name, p.description, p.price, p.original_price, p.category, p.seller_id,
        CASE 
          WHEN p.image_blob IS NOT NULL THEN CONCAT('/api/media/products/', p.id)
          ELSE p.image_path
        END AS image_url,
        p.isVisible, p.is_featured, p.stock, p.tags,
        p.features, p.specifications, p.rating, p.reviews_count,
        p.district_id, p.state_id, p.added_by, p.owner_admin_id,
        p.created_at, p.updated_at, p.updated_by,
        co.district_id AS origin_district_id, co.state_id AS origin_state_id, 
        m.name AS added_by_name,
        s.name AS seller_name, s.business_name AS seller_business_name,
        s.contact_phone AS seller_phone, s.whatsapp_number AS seller_whatsapp,
        s.email AS seller_email, s.delivery_info AS seller_delivery_info
      FROM products p
      LEFT JOIN content_origin co ON co.content_type = 'product' AND co.content_id = p.id
      LEFT JOIN district_admins da ON da.id = COALESCE(p.owner_admin_id, co.added_by_admin_id)
      LEFT JOIN members m ON m.id = da.member_id
      LEFT JOIN sellers s ON s.id = p.seller_id
      WHERE p.id = ? AND p.isVisible = 1
    `, [productId]) as any[]; // eslint-disable-line @typescript-eslint/no-explicit-any

    if (!productRows || productRows.length === 0) {
      console.log('No product found with ID:', productId);
      // Let's check what products exist
      const allProducts = await executeQuery('SELECT id, name FROM products LIMIT 5') as any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
      console.log('Available products:', allProducts);
      return NextResponse.json({ 
        success: false, 
        error: 'Product not found' 
      }, { status: 404 });
    }

    const product = productRows[0];

    // Get product images
    const imageRows = await executeQuery(`
      SELECT 
        CASE 
          WHEN image_blob IS NOT NULL THEN CONCAT('/api/media/product-images/', id)
          ELSE image_url
        END AS image_url,
        is_primary,
        sort_order
      FROM product_images 
      WHERE product_id = ? 
      ORDER BY is_primary DESC, sort_order ASC
    `, [productId]) as any[]; // eslint-disable-line @typescript-eslint/no-explicit-any

    // Transform product data
    const transformedProduct = {
      id: product.id,
      name: product.name,
      description: product.description,
      price: Number(product.price),
      originalPrice: product.original_price ? Number(product.original_price) : null,
      category: product.category,
      seller_id: product.seller_id,
      imageUrl: product.image_url,
      images: imageRows.length > 0 
        ? imageRows.map((img: { image_url: string }) => img.image_url)
        : [product.image_url],
      isVisible: Boolean(product.isVisible),
      isFeatured: Boolean(product.is_featured),
      stock: Number(product.stock),
      tags: product.tags ? JSON.parse(product.tags) : [],
      features: product.features ? JSON.parse(product.features) : [],
      specifications: product.specifications ? JSON.parse(product.specifications) : {},
      rating: product.rating ? Number(product.rating) : 0,
      reviews: product.reviews_count ? Number(product.reviews_count) : 0,
      createdAt: new Date(product.created_at),
      updatedAt: new Date(product.updated_at),
      addedBy: product.added_by_name || 'Admin',
      // Seller information
      seller_name: product.seller_name,
      seller_business_name: product.seller_business_name,
      seller_phone: product.seller_phone,
      seller_whatsapp: product.seller_whatsapp,
      seller_email: product.seller_email,
      seller_delivery_info: product.seller_delivery_info
    };

    return NextResponse.json({ 
      success: true, 
      product: transformedProduct 
    });

  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch product' 
    }, { status: 500 });
  }
}
