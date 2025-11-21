import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { getAdminScope, ensurePermission } from '@/lib/admin-scope';
import { consumeStagedBlob } from '@/lib/blob-storage';

// GET: list products (scoped)
export async function GET(req: NextRequest) {
  try {
    const scope = await getAdminScope(req);
    console.log('Admin scope in products GET:', {
      isSuperAdmin: scope.isSuperAdmin,
      isDistrictAdmin: scope.isDistrictAdmin,
      districtName: scope.districtName,
      stateName: scope.stateName,
      adminId: scope.adminId,
      permissions: scope.permissions
    });

    // Superadmin sees all
    if (scope.isSuperAdmin) {
      const rows = await executeQuery(`
        SELECT DISTINCT
          p.id, p.name, p.description, p.price, p.original_price, p.category, p.seller_id,
          CASE 
            WHEN p.image_blob IS NOT NULL THEN CONCAT('/api/media/products/', p.id, '?v=', UNIX_TIMESTAMP(p.updated_at))
            ELSE p.image_path
          END AS image_url,
          p.isVisible, p.is_featured, p.stock, p.tags,
          p.district_id, p.state_id, p.added_by, p.owner_admin_id,
          p.created_at, p.updated_at, p.updated_by,
          co.district_id AS origin_district_id, co.state_id AS origin_state_id, m.name AS added_by_name,
          s.name AS seller_name, s.contact_phone AS seller_phone, s.whatsapp_number AS seller_whatsapp, s.email AS seller_email
        FROM products p
        LEFT JOIN content_origin co ON co.content_type = 'product' AND co.content_id = p.id
        LEFT JOIN district_admins da ON da.id = co.added_by_admin_id
        LEFT JOIN members m ON m.id = da.member_id
        LEFT JOIN sellers s ON s.id = p.seller_id
        ORDER BY p.created_at DESC
      `);
      return NextResponse.json({ success: true, data: rows });
    }

    // If admin has add_products permission, they can view and manage all products
    if (!ensurePermission(scope, 'add_products')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    if (!scope.districtName || !scope.stateName || !scope.adminId) {
      console.error('Invalid admin scope:', {
        isSuperAdmin: scope.isSuperAdmin,
        districtName: scope.districtName,
        stateName: scope.stateName,
        adminId: scope.adminId,
        permissions: scope.permissions
      });
      return NextResponse.json({ success: false, message: 'Invalid admin scope' }, { status: 403 });
    }

    console.log('District admin filtering products for:', {
      districtName: scope.districtName,
      stateName: scope.stateName,
      adminId: scope.adminId,
      isSuperAdmin: scope.isSuperAdmin,
      isDistrictAdmin: scope.isDistrictAdmin
    });
    
    // For district admins, show ALL products for their district/state
    // This ensures continuity - new admins can see content created by previous admins
    // Filter by district and state from products table or content_origin table
    // Extract district name (before comma) for matching, as district field may contain multiple districts
    const districtNameForMatch = scope.districtName?.split(',')[0]?.trim() || scope.districtName;
    const rows = await executeQuery(`
      SELECT DISTINCT
        p.id, p.name, p.description, p.price, p.original_price, p.category, p.seller_id,
        CASE 
          WHEN p.image_blob IS NOT NULL THEN CONCAT('/api/media/products/', p.id, '?v=', UNIX_TIMESTAMP(p.updated_at))
          ELSE p.image_path
        END AS image_url,
        p.isVisible, p.is_featured, p.stock, p.tags,
        p.district_id, p.state_id, p.added_by, p.owner_admin_id,
        p.created_at, p.updated_at, p.updated_by,
        COALESCE(p.district, p.district_id, co.district_id) AS district,
        COALESCE(p.state, p.state_id, co.state_id) AS state,
        co.district_id AS origin_district_id, co.state_id AS origin_state_id, m.name AS added_by_name,
        s.name AS seller_name, s.contact_phone AS seller_phone, s.whatsapp_number AS seller_whatsapp, s.email AS seller_email
      FROM products p
      LEFT JOIN content_origin co ON co.content_type = 'product' AND co.content_id = p.id
      LEFT JOIN district_admins da ON da.id = p.owner_admin_id
      LEFT JOIN members m ON m.id = da.member_id
      LEFT JOIN sellers s ON s.id = p.seller_id
      WHERE (
        (COALESCE(p.district, p.district_id, co.district_id) = ? OR 
         COALESCE(p.district, p.district_id, co.district_id) LIKE ? OR
         SUBSTRING_INDEX(COALESCE(p.district, p.district_id, co.district_id), ',', 1) = ?)
        AND COALESCE(p.state, p.state_id, co.state_id) = ?
      )
      ORDER BY p.created_at DESC
    `, [districtNameForMatch, `${districtNameForMatch},%`, districtNameForMatch, scope.stateName]) as Array<Record<string, unknown>>;
    
    console.log(`Found ${rows.length} products for district admin:`, {
      districtName: scope.districtName,
      stateName: scope.stateName,
      adminId: scope.adminId,
      productIds: rows.map((r: Record<string, unknown>) => ({ 
        id: r.id, 
        name: r.name, 
        district_id: r.district_id, 
        state_id: r.state_id, 
        owner_admin_id: r.owner_admin_id,
        added_by: r.added_by,
        origin_district_id: r.origin_district_id,
        origin_state_id: r.origin_state_id,
        added_by_admin_id: r.added_by_admin_id
      }))
    });
    
    return NextResponse.json({ success: true, data: rows });
  } catch (e) {
    console.error('products GET error', e);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

// POST: create product (scoped to district admin)
export async function POST(req: NextRequest) {
  try {
    const scope = await getAdminScope(req);

    console.log('Product creation - Admin scope:', {
      isSuperAdmin: scope.isSuperAdmin,
      isDistrictAdmin: scope.isDistrictAdmin,
      adminId: scope.adminId,
      permissions: scope.permissions,
      hasAddProducts: scope.permissions.includes('add_products')
    });

    // If admin has add_products permission, they can do everything with products
    if (scope.isSuperAdmin === false && !ensurePermission(scope, 'add_products')) {
      console.log('❌ Permission denied for product creation:', {
        adminId: scope.adminId,
        currentPermissions: scope.permissions,
        requiredPermission: 'add_products'
      });
      return NextResponse.json({ 
        success: false, 
        message: 'You do not have permission to manage products. Please contact superadmin to grant "add_products" permission.' 
      }, { status: 403 });
    }

    const { 
      name,
      price,
      image_url,
      description,
      category,
      original_price,
      stock,
      is_featured,
      tags,
      images,
      features,
      specifications,
      seller_id
    } = await req.json();
    
    console.log('Creating product with data:', { name, price, images, features, specifications });
    
    if (!name || price == null) {
      return NextResponse.json({ success: false, message: 'Missing fields' }, { status: 400 });
    }
    if (Number(price) < 0 || (original_price != null && Number(original_price) < 0)) {
      return NextResponse.json({ success: false, message: 'Price cannot be negative' }, { status: 400 });
    }

    const stagedAssetCache = new Map<string, ResolvedAsset>();
    let mainAsset: ResolvedAsset;
    try {
      mainAsset = await resolveAssetFromInput(image_url, 'Main product image');
      if (typeof image_url === 'string' && image_url.startsWith('/api/media/staged/')) {
        stagedAssetCache.set(image_url, mainAsset);
      }
    } catch (assetError) {
      return NextResponse.json(
        { success: false, message: (assetError as Error).message },
        { status: 400 }
      );
    }

    const galleryAssets: ResolvedAsset[] = [];
    if (Array.isArray(images)) {
      for (let i = 0; i < images.length; i++) {
        const value = images[i];
        if (value === null || value === undefined || value === '') {
          continue;
        }

        let asset: ResolvedAsset | undefined = undefined;
        if (typeof value === 'string' && stagedAssetCache.has(value)) {
          asset = stagedAssetCache.get(value);
        } else {
          try {
            asset = await resolveAssetFromInput(value, `Product gallery image ${i + 1}`);
            if (typeof value === 'string' && value.startsWith('/api/media/staged/')) {
              stagedAssetCache.set(value, asset);
            }
          } catch (assetError) {
            return NextResponse.json(
              { success: false, message: (assetError as Error).message },
              { status: 400 }
            );
          }
        }

        if (asset && (asset.url || asset.blob)) {
          galleryAssets.push(asset);
        }
      }
    }

    // Detect products.id definition to decide inserting strategy
    const idCol = await executeQuery(`SHOW COLUMNS FROM products LIKE 'id'`) as Array<{ Type: string; Extra: string }>;
    const idType = String(idCol?.[0]?.Type || '').toLowerCase();
    const idExtra = String(idCol?.[0]?.Extra || '').toLowerCase();

    let createdId: string | number | null = null;
    // Prefer explicit ID when table isn't auto-incrementing
    const needsStringId = !idType.includes('int') || idExtra.indexOf('auto_increment') === -1;
    if (needsStringId) {
      const ts = Date.now();
      const rnd = Math.floor(Math.random() * 1000);
      const genId = `p${ts}${rnd}`;
      const productParams = [
        name,
        description ?? '',
        price,
        original_price ?? null,
        category ?? 'default',
        seller_id || null,
        mainAsset.url,
        mainAsset.blob,
        mainAsset.mime,
        mainAsset.hash,
        mainAsset.size,
        mainAsset.originalName,
        is_featured ? 1 : 0,
        stock ?? 0,
        tags ? JSON.stringify(tags) : null,
        features ? JSON.stringify(features) : null,
        specifications ? JSON.stringify(specifications) : null,
        scope.districtName || null,
        scope.stateName || null,
        scope.adminId || null,
        // Only set owner_admin_id for district admins (superadmins are not in district_admins table)
        (!scope.isSuperAdmin && scope.isDistrictAdmin && scope.adminId) ? scope.adminId : null,
        scope.adminId ? scope.adminId.toString() : 'admin'
      ];

      await executeQuery(
        `
        INSERT INTO products 
          (id, name, description, price, original_price, category, seller_id,
           image_path, image_blob, image_mime, image_hash, image_size, image_original_name,
           isVisible, is_featured, stock, tags, features, specifications,
           district_id, state_id, added_by, owner_admin_id, \`order\`, created_at, updated_at, updated_by)
        VALUES (
          ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          1, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, 0, NOW(), NOW(), ?
        )
      `,
        [
          genId,
          ...productParams
        ]
      );
      createdId = genId;
    } else {
      // Auto-increment path
      const productParams = [
        name,
        description ?? '',
        price,
        original_price ?? null,
        category ?? 'default',
        seller_id || null,
        mainAsset.url,
        mainAsset.blob,
        mainAsset.mime,
        mainAsset.hash,
        mainAsset.size,
        mainAsset.originalName,
        is_featured ? 1 : 0,
        stock ?? 0,
        tags ? JSON.stringify(tags) : null,
        features ? JSON.stringify(features) : null,
        specifications ? JSON.stringify(specifications) : null,
        scope.districtName || null,
        scope.stateName || null,
        scope.adminId || null,
        // Only set owner_admin_id for district admins (superadmins are not in district_admins table)
        (!scope.isSuperAdmin && scope.isDistrictAdmin && scope.adminId) ? scope.adminId : null,
        scope.adminId ? scope.adminId.toString() : 'admin'
      ];

      const insert = await executeQuery(
        `
        INSERT INTO products 
          (name, description, price, original_price, category, seller_id,
           image_path, image_blob, image_mime, image_hash, image_size, image_original_name,
           isVisible, is_featured, stock, tags, features, specifications,
           district_id, state_id, added_by, owner_admin_id, \`order\`, created_at, updated_at, updated_by)
        VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          1, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, 0, NOW(), NOW(), ?
        )
      `,
        productParams
      );
      createdId = (insert as { insertId: number }).insertId ?? null;
    }

    // Track origin if district admin
    if (!scope.isSuperAdmin && scope.districtName && scope.stateName && scope.adminId && createdId != null) {
      try {
        await executeQuery(`
          INSERT INTO content_origin (content_type, content_id, district_id, state_id, added_by_admin_id)
          VALUES ('product', ?, ?, ?, ?)
        `, [createdId as number, scope.districtName, scope.stateName, scope.adminId]);
      } catch (_e) {
        // If schema mismatch (e.g., INT vs VARCHAR), skip tracking rather than failing the creation
        console.warn('content_origin tracking skipped for product id', createdId);
      }
    }

    if (mainAsset.blob && createdId != null) {
      const mediaUrl = `/api/media/products/${createdId}`;
      await executeQuery(
        'UPDATE products SET image_path = ? WHERE id = ?',
        [mediaUrl, createdId]
      );
    }

    // Save multiple images if provided
    if (galleryAssets.length > 0 && createdId != null) {
      try {
        console.log(`Saving ${galleryAssets.length} images for product ${createdId}`);
        for (let i = 0; i < galleryAssets.length && i < 6; i++) {
          const asset = galleryAssets[i];
          if (!asset.url && !asset.blob) {
            continue;
          }

          const insertImage = await executeQuery(
            `
              INSERT INTO product_images (
                product_id,
                image_url,
                image_blob,
                image_mime,
                image_hash,
                image_size,
                image_original_name,
                is_primary,
                sort_order
              )
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
            createdId as number,
              asset.url,
              asset.blob,
              asset.mime,
              asset.hash,
              asset.size,
              asset.originalName,
              i === 0 ? 1 : 0,
              i
            ]
          );

          const imageId = (insertImage as { insertId?: number }).insertId ?? null;
          if (asset.blob && imageId != null) {
            const imageMediaUrl = `/api/media/product-images/${imageId}`;
            await executeQuery(
              'UPDATE product_images SET image_url = ? WHERE id = ?',
              [imageMediaUrl, imageId]
            );
          }
        }
        console.log('All images saved successfully');
      } catch (e) {
        console.error('Failed to save product images:', e);
        // Don't fail the product creation if images fail
      }
    }

    return NextResponse.json({ success: true, id: createdId });
  } catch (e) {
    console.error('products POST error', e);
    console.error('Error details:', {
      message: (e as Error).message,
      code: (e as { code?: string }).code,
      sqlState: (e as { sqlState?: string }).sqlState,
      sqlMessage: (e as { sqlMessage?: string }).sqlMessage
    });
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

// PUT: update product (scoped to district admin)
export async function PUT(req: NextRequest) {
  try {
    const scope = await getAdminScope(req);
    const { id, name, price, image_url, description, category, original_price, stock, is_featured, tags, isVisible, images, seller_id, features, specifications } = await req.json();
    
    if (!id) {
      return NextResponse.json({ success: false, message: 'Product ID is required' }, { status: 400 });
    }

    // If admin has add_products permission, they can do everything with products
    if (scope.isSuperAdmin === false && !ensurePermission(scope, 'add_products')) {
      return NextResponse.json({ success: false, message: 'You do not have permission to edit products. Please contact superadmin to grant "add_products" permission.' }, { status: 403 });
    }

    // For district admins, ensure the product belongs to their district/state
    // Allow editing any product in their district, not just ones they created
    if (!scope.isSuperAdmin) {
      const districtNameForMatch = scope.districtName?.split(',')[0]?.trim() || scope.districtName;
      const ownershipCheck = await executeQuery(
        `SELECT p.id FROM products p
         LEFT JOIN content_origin co ON co.content_type = 'product' AND co.content_id = p.id
         WHERE p.id = ? AND (
           (COALESCE(p.district, p.district_id, co.district_id) = ? OR 
            COALESCE(p.district, p.district_id, co.district_id) LIKE ? OR
            SUBSTRING_INDEX(COALESCE(p.district, p.district_id, co.district_id), ',', 1) = ?)
           AND COALESCE(p.state, p.state_id, co.state_id) = ?
         )
         LIMIT 1`,
        [id, districtNameForMatch, `${districtNameForMatch},%`, districtNameForMatch, scope.stateName]
      ) as Array<Record<string, unknown>>;
      
      if (!ownershipCheck.length) {
        return NextResponse.json({ success: false, message: 'You can only edit products from your district' }, { status: 403 });
      }
    }

    if (Number(price) < 0 || (original_price != null && Number(original_price) < 0)) {
      return NextResponse.json({ success: false, message: 'Price cannot be negative' }, { status: 400 });
    }

    const updateFields: string[] = [
      'name = ?',
      'description = ?',
      'price = ?',
      'original_price = ?',
      'category = ?',
      'seller_id = ?',
      'isVisible = ?',
      'is_featured = ?',
      'stock = ?',
      'tags = ?',
      'features = ?',
      'specifications = ?'
    ];
    const updateParams: unknown[] = [
      name,
      description ?? '',
      price,
      original_price ?? null,
      category ?? 'default',
      seller_id || null,
      isVisible ? 1 : 0,
      is_featured ? 1 : 0,
      stock ?? 0,
      tags ? JSON.stringify(tags) : null,
      features ? JSON.stringify(features) : null,
      specifications ? JSON.stringify(specifications) : null
    ];

    let resolvedImageAsset: ResolvedAsset | null = null;
    const stagedCache = new Map<string, ResolvedAsset>();

    if (image_url !== undefined) {
      try {
        resolvedImageAsset = await resolveAssetFromInput(image_url, 'Main product image');
        if (typeof image_url === 'string' && image_url.startsWith('/api/media/staged/')) {
          stagedCache.set(image_url, resolvedImageAsset);
        }
      } catch (assetError) {
        return NextResponse.json(
          { success: false, message: (assetError as Error).message },
          { status: 400 }
        );
      }
    }

    if (resolvedImageAsset) {
      if (resolvedImageAsset.blob) {
        // New blob uploaded - replace old blob and set new path
        updateFields.push('image_blob = ?');
        updateParams.push(resolvedImageAsset.blob);
        updateFields.push('image_mime = ?');
        updateParams.push(resolvedImageAsset.mime);
        updateFields.push('image_hash = ?');
        updateParams.push(resolvedImageAsset.hash);
        updateFields.push('image_size = ?');
        updateParams.push(resolvedImageAsset.size);
        updateFields.push('image_original_name = ?');
        updateParams.push(resolvedImageAsset.originalName);
        updateFields.push('image_path = ?');
        updateParams.push(`/api/media/products/${id}`);
      } else if (resolvedImageAsset.url) {
        // URL provided - clear blob fields and set URL path
        updateFields.push('image_path = ?');
        updateParams.push(resolvedImageAsset.url);
        updateFields.push('image_blob = NULL');
        updateFields.push('image_mime = NULL');
        updateFields.push('image_hash = NULL');
        updateFields.push('image_size = NULL');
        updateFields.push('image_original_name = NULL');
      } else {
        // Empty/null - clear everything
        updateFields.push('image_path = NULL');
          updateFields.push('image_blob = NULL');
          updateFields.push('image_mime = NULL');
          updateFields.push('image_hash = NULL');
          updateFields.push('image_size = NULL');
          updateFields.push('image_original_name = NULL');
      }
    }

    updateFields.push('updated_at = NOW()');
    updateFields.push('updated_by = ?');
    updateParams.push(scope.adminId ? scope.adminId.toString() : 'admin');
    updateParams.push(id);

    const updateSql = `UPDATE products SET ${updateFields.join(', ')} WHERE id = ?`;
    await executeQuery(updateSql, updateParams);

    // Save gallery images if provided
    // Only update gallery images if images array is explicitly provided
    // If images is undefined, preserve existing images
    if (images !== undefined) {
      // First, fetch existing images from database
      const existingImageRows = await executeQuery(
        `SELECT id, image_blob, image_mime, image_hash, image_size, image_original_name, image_url, sort_order
         FROM product_images 
         WHERE product_id = ?
         ORDER BY is_primary DESC, sort_order ASC`,
        [id]
      ) as Array<{
        id: number;
        image_blob: Buffer | null;
        image_mime: string | null;
        image_hash: string | null;
        image_size: number | null;
        image_original_name: string | null;
        image_url: string | null;
        sort_order: number;
      }>;
      
      // Create a map of existing image URLs/IDs to their database records
      const existingImageMap = new Map<string, typeof existingImageRows[0]>();
      for (const row of existingImageRows) {
        const mediaUrl = `/api/media/product-images/${row.id}`;
        existingImageMap.set(mediaUrl, row);
        if (row.image_url) {
          existingImageMap.set(row.image_url, row);
        }
      }
      
      // Process new images array
      const imagesToKeep = new Set<number>(); // Track which existing image IDs to keep
      const imagesToInsert: Array<{ asset: ResolvedAsset; sortOrder: number }> = [];
      let firstImageId: number | null = null; // Track the first image ID (for is_primary)
      
      if (Array.isArray(images)) {
        for (let i = 0; i < images.length && i < 6; i++) {
        const value = images[i];
        if (value === null || value === undefined || value === '') continue;

          // Check if it's an existing product image URL
          if (typeof value === 'string' && value.startsWith('/api/media/product-images/')) {
            const existingRow = existingImageMap.get(value);
            if (existingRow) {
              // This is an existing image - keep it, just update sort_order if needed
              imagesToKeep.add(existingRow.id);
              if (i === 0) {
                firstImageId = existingRow.id; // First image should be primary
              }
              if (existingRow.sort_order !== i) {
                await executeQuery(
                  'UPDATE product_images SET sort_order = ? WHERE id = ?',
                  [i, existingRow.id]
                );
              }
              continue; // Skip adding to insert list
            }
          }
          
          // This is a new image or changed image - resolve it
        let asset: ResolvedAsset | undefined = undefined;
        if (typeof value === 'string' && stagedCache.has(value)) {
          asset = stagedCache.get(value);
        } else {
          try {
            asset = await resolveAssetFromInput(value, `Product gallery image ${i + 1}`);
            if (typeof value === 'string' && value.startsWith('/api/media/staged/')) {
              stagedCache.set(value, asset);
            }
          } catch (assetError) {
            return NextResponse.json(
              { success: false, message: (assetError as Error).message },
              { status: 400 }
            );
          }
        }

        if (asset && (asset.url || asset.blob)) {
            imagesToInsert.push({ asset, sortOrder: i });
        }
      }
      }

      // Delete images that are no longer in the list
      if (imagesToKeep.size > 0) {
        const keepIds = Array.from(imagesToKeep);
        const placeholders = keepIds.map(() => '?').join(',');
        await executeQuery(
          `DELETE FROM product_images WHERE product_id = ? AND id NOT IN (${placeholders})`,
          [id, ...keepIds]
        );
      } else {
        // No existing images to keep, delete all
      await executeQuery('DELETE FROM product_images WHERE product_id = ?', [id]);
      }

      // Insert new images
      for (const { asset, sortOrder } of imagesToInsert) {
        const insertImage = await executeQuery(
          `
            INSERT INTO product_images (
              product_id,
              image_url,
              image_blob,
              image_mime,
              image_hash,
              image_size,
              image_original_name,
              is_primary,
              sort_order
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            id,
            asset.url,
            asset.blob,
            asset.mime,
            asset.hash,
            asset.size,
            asset.originalName,
            0, // Will set primary after all inserts
            sortOrder
          ]
        );

        const imageId = (insertImage as { insertId?: number }).insertId ?? null;
        if (asset.blob && imageId != null) {
          const imageMediaUrl = `/api/media/product-images/${imageId}`;
          await executeQuery(
            'UPDATE product_images SET image_url = ? WHERE id = ?',
            [imageMediaUrl, imageId]
        );
        }
        
        // Track first inserted image if no existing image is first
        if (sortOrder === 0 && !firstImageId && imageId != null) {
          firstImageId = imageId;
      }
    }
      
      // Update is_primary flag for the first image
      if (firstImageId) {
        // Set first image as primary and unset all others
        await executeQuery(
          'UPDATE product_images SET is_primary = 0 WHERE product_id = ?',
          [id]
        );
        await executeQuery(
          'UPDATE product_images SET is_primary = 1 WHERE id = ?',
          [firstImageId]
        );
      }
    }
    // If images is undefined, do nothing - preserve existing gallery images

    return NextResponse.json({ success: true, message: 'Product updated successfully' });
  } catch (e) {
    console.error('products PUT error', e);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

// DELETE: delete product if it belongs to district admin
export async function DELETE(req: NextRequest) {
  try {
    const scope = await getAdminScope(req);
    console.log('DELETE request - Admin scope:', {
      isSuperAdmin: scope.isSuperAdmin,
      isDistrictAdmin: scope.isDistrictAdmin,
      adminId: scope.adminId,
      permissions: scope.permissions
    });
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    console.log('DELETE request - received ID:', id, 'URL:', req.url);
    console.log('DELETE request - searchParams:', Object.fromEntries(searchParams.entries()));
    console.log('DELETE request - all params:', searchParams.toString());
    if (!id) return NextResponse.json({ success: false, message: 'Missing id' }, { status: 400 });

    if (scope.isSuperAdmin) {
      console.log('Superadmin deleting product with ID:', id);
      try {
        await executeQuery('DELETE FROM products WHERE id = ?', [id]);
        console.log('Successfully deleted from products table');
        await executeQuery('DELETE FROM product_images WHERE product_id = ?', [id]);
        console.log('Successfully deleted related product images');
        await executeQuery('DELETE FROM content_origin WHERE content_type = "product" AND content_id = ?', [id]);
        console.log('Successfully deleted from content_origin table');
        return NextResponse.json({ success: true });
      } catch (dbError) {
        console.error('Database error during delete:', dbError);
        return NextResponse.json({ success: false, message: 'Database error during delete' }, { status: 500 });
      }
    }

    // If admin has add_products permission, they can do everything with products (including delete)
    if (!ensurePermission(scope, 'add_products')) {
      return NextResponse.json({ success: false, message: 'You do not have permission to delete products. Please contact superadmin to grant "add_products" permission.' }, { status: 403 });
    }

    // Ensure the product belongs to their district/state
    // Allow deleting any product in their district, not just ones they created
    if (!scope.isSuperAdmin) {
      const districtNameForMatch = scope.districtName?.split(',')[0]?.trim() || scope.districtName;
    const rows = await executeQuery(
      `SELECT p.id FROM products p
       LEFT JOIN content_origin co ON co.content_type = 'product' AND co.content_id = p.id
       WHERE p.id = ? AND (
           (COALESCE(p.district, p.district_id, co.district_id) = ? OR 
            COALESCE(p.district, p.district_id, co.district_id) LIKE ? OR
            SUBSTRING_INDEX(COALESCE(p.district, p.district_id, co.district_id), ',', 1) = ?)
           AND COALESCE(p.state, p.state_id, co.state_id) = ?
       )
       LIMIT 1`,
        [id, districtNameForMatch, `${districtNameForMatch},%`, districtNameForMatch, scope.stateName]
    ) as Array<{ id: number }>;
      if (!rows.length) return NextResponse.json({ success: false, message: 'You can only delete products from your district' }, { status: 403 });
    }

    await executeQuery('DELETE FROM products WHERE id = ?', [id]);
    await executeQuery('DELETE FROM product_images WHERE product_id = ?', [id]);
    await executeQuery('DELETE FROM content_origin WHERE content_type = "product" AND content_id = ?', [id]);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('products DELETE error', e);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

type ResolvedAsset = {
  url: string | null;
  blob: Buffer | null;
  mime: string | null;
  hash: string | null;
  size: number | null;
  originalName: string | null;
};

async function resolveAssetFromInput(value: unknown, label: string): Promise<ResolvedAsset> {
  if (typeof value !== 'string' || value.trim() === '') {
    return {
      url: null,
      blob: null,
      mime: null,
      hash: null,
      size: null,
      originalName: null
    };
  }

  if (value.startsWith('/api/media/staged/')) {
    const assetId = value.split('/').pop();
    if (!assetId) {
      throw new Error(`${label}: invalid staged asset reference`);
    }
    const asset = await consumeStagedBlob(assetId);
    if (!asset) {
      throw new Error(`${label}: staged upload expired. Please re-upload.`);
    }
    return {
      url: null,
      blob: asset.data,
      mime: asset.mimeType || null,
      hash: asset.hash || null,
      size: asset.size ?? null,
      originalName: asset.originalName || null
    };
  }

  return {
    url: value,
    blob: null,
    mime: null,
    hash: null,
    size: null,
    originalName: null
  };
}
