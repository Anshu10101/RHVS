import pool from './database';

export interface AboutSection {
  id: string;
  type: 'hero' | 'card' | 'quote' | 'paragraph' | 'heading';
  title?: string;
  content: string;
  order: number;
  isVisible: boolean;
  styling?: {
    textAlign?: 'left' | 'center' | 'right';
    fontSize?: 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
    fontWeight?: 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold';
    color?: 'gray' | 'orange' | 'red' | 'blue' | 'green';
  };
  createdAt: Date;
  updatedAt: Date;
  updatedBy: string;
}

export interface GalleryImage {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  albumId: string;
  order: number;
  isVisible: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  updatedBy: string;
}

export interface GalleryAlbum {
  id: string;
  name: string;
  description?: string;
  coverImageUrl?: string;
  order: number;
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
  updatedBy: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  imageUrl: string;
  isVisible: boolean;
  isFeatured: boolean;
  stock: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  updatedBy: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  description: string;
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContactInfo {
  id: string;
  contactType: 'phone' | 'email' | 'address' | 'social' | 'emergency' | 'office';
  title: string;
  value: string;
  description?: string | null;
  order: number;
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface ContactOffice {
  id: string;
  name: string;
  nameHindi: string | null;
  address: string;
  city: string;
  state: string;
  pincode?: string | null;
  phone?: string | null;
  email?: string | null;
  officeType: 'head' | 'regional' | 'branch';
  order: number;
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export class ContentService {
  // Get all about page sections
  static async getAboutSections(): Promise<AboutSection[]> {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM about_sections ORDER BY `order` ASC'
      );
      return (rows as any[]).map(row => ({
        ...row,
        styling: row.styling ? JSON.parse(row.styling) : undefined,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        updatedBy: row.updated_by
      }));
    } catch (error) {
      console.error('Error fetching about sections:', error);
      return [];
    }
  }

  // Save about page sections
  static async saveAboutSections(sections: AboutSection[], updatedBy: string): Promise<boolean> {
    try {
      // Start transaction
      await pool.execute('START TRANSACTION');

      // Clear existing sections
      await pool.execute('DELETE FROM about_sections');

      // Insert new sections
      for (const section of sections) {
        await pool.execute(
          `INSERT INTO about_sections 
           (id, type, title, content, \`order\`, isVisible, styling, created_at, updated_at, updated_by) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            section.id,
            section.type,
            section.title || null,
            section.content,
            section.order,
            section.isVisible,
            section.styling ? JSON.stringify(section.styling) : null,
            section.createdAt,
            new Date(),
            updatedBy
          ]
        );
      }

      // Commit transaction
      await pool.execute('COMMIT');
      return true;
    } catch (error) {
      console.error('Error saving about sections:', error);
      await pool.execute('ROLLBACK');
      return false;
    }
  }

  // Get a single about section
  static async getAboutSection(id: string): Promise<AboutSection | null> {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM about_sections WHERE id = ?',
        [id]
      );
      const row = (rows as any[])[0];
      if (!row) return null;

      return {
        ...row,
        styling: row.styling ? JSON.parse(row.styling) : undefined,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        updatedBy: row.updated_by
      };
    } catch (error) {
      console.error('Error fetching about section:', error);
      return null;
    }
  }

  // Update a single about section
  static async updateAboutSection(id: string, updates: Partial<AboutSection>, updatedBy: string): Promise<boolean> {
    try {
      const setClause = [];
      const values = [];

      if (updates.type !== undefined) {
        setClause.push('type = ?');
        values.push(updates.type);
      }
      if (updates.title !== undefined) {
        setClause.push('title = ?');
        values.push(updates.title);
      }
      if (updates.content !== undefined) {
        setClause.push('content = ?');
        values.push(updates.content);
      }
      if (updates.order !== undefined) {
        setClause.push('`order` = ?');
        values.push(updates.order);
      }
      if (updates.isVisible !== undefined) {
        setClause.push('isVisible = ?');
        values.push(updates.isVisible);
      }
      if (updates.styling !== undefined) {
        setClause.push('styling = ?');
        values.push(updates.styling ? JSON.stringify(updates.styling) : null);
      }

      setClause.push('updated_at = ?');
      values.push(new Date());
      setClause.push('updated_by = ?');
      values.push(updatedBy);

      values.push(id);

      await pool.execute(
        `UPDATE about_sections SET ${setClause.join(', ')} WHERE id = ?`,
        values
      );

      return true;
    } catch (error) {
      console.error('Error updating about section:', error);
      return false;
    }
  }

  // Delete a about section
  static async deleteAboutSection(id: string): Promise<boolean> {
    try {
      await pool.execute('DELETE FROM about_sections WHERE id = ?', [id]);
      return true;
    } catch (error) {
      console.error('Error deleting about section:', error);
      return false;
    }
  }

  // Gallery Methods
  // Get all gallery albums
  static async getGalleryAlbums(): Promise<GalleryAlbum[]> {
    try {
      const [rows] = await pool.execute('SELECT * FROM gallery_albums ORDER BY `order` ASC');
      return (rows as any[]).map(row => ({
        ...row,
        coverImageUrl: row.cover_image,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        updatedBy: 'admin' // Default value since albums don't have uploaded_by
      }));
    } catch (error) {
      console.error('Error fetching gallery albums:', error);
      return [];
    }
  }

  // Get all gallery images
  static async getGalleryImages(): Promise<GalleryImage[]> {
    try {
      const [rows] = await pool.execute('SELECT * FROM gallery_images ORDER BY album_id, `order` ASC');
      return (rows as any[]).map(row => ({
        ...row,
        imageUrl: row.image_path,
        tags: row.tags ? JSON.parse(row.tags) : [],
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        updatedBy: row.uploaded_by
      }));
    } catch (error) {
      console.error('Error fetching gallery images:', error);
      return [];
    }
  }

  // Save gallery content (albums and images)
  static async saveGalleryContent(albums: GalleryAlbum[], images: GalleryImage[], updatedBy: string): Promise<boolean> {
    try {
      await pool.execute('START TRANSACTION');

      // Clear existing albums and images
      await pool.execute('DELETE FROM gallery_images');
      await pool.execute('DELETE FROM gallery_albums');

      // Insert new albums
      for (const album of albums) {
        await pool.execute(
          `INSERT INTO gallery_albums 
           (id, name, description, cover_image, \`order\`, isVisible, created_at, updated_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            album.id || null,
            album.name || 'Untitled Album',
            album.description || null,
            album.coverImageUrl || null,
            album.order || 0,
            album.isVisible !== undefined ? album.isVisible : true,
            album.createdAt || new Date(),
            new Date()
          ]
        );
      }

      // Insert new images
      for (const image of images) {
        const values = [
          image.id || null,
          image.title || 'Untitled Image',
          image.description || null,
          image.imageUrl || null,
          image.albumId || null,
          image.order || 0,
          image.isVisible !== undefined ? image.isVisible : true,
          image.tags ? JSON.stringify(image.tags) : null,
          image.createdAt || new Date(),
          new Date(),
          updatedBy || 'admin'
        ];
        
        await pool.execute(
          `INSERT INTO gallery_images 
           (id, title, description, image_path, album_id, \`order\`, isVisible, tags, created_at, updated_at, uploaded_by) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          values
        );
      }

      // Commit transaction
      await pool.execute('COMMIT');
      return true;
    } catch (error) {
      console.error('Error saving gallery content:', error);
      await pool.execute('ROLLBACK');
      return false;
    }
  }

  // Get a specific gallery album
  static async getGalleryAlbum(id: string): Promise<GalleryAlbum | null> {
    try {
      const [rows] = await pool.execute('SELECT * FROM gallery_albums WHERE id = ?', [id]);
      const row = (rows as any[])[0];
      if (!row) return null;

      return {
        ...row,
        coverImageUrl: row.cover_image,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        updatedBy: 'admin' // Default value since albums don't have uploaded_by
      };
    } catch (error) {
      console.error('Error fetching gallery album:', error);
      return null;
    }
  }

  // Get a specific gallery image
  static async getGalleryImage(id: string): Promise<GalleryImage | null> {
    try {
      const [rows] = await pool.execute('SELECT * FROM gallery_images WHERE id = ?', [id]);
      const row = (rows as any[])[0];
      if (!row) return null;

      return {
        ...row,
        imageUrl: row.image_path,
        tags: row.tags ? JSON.parse(row.tags) : [],
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        updatedBy: row.uploaded_by
      };
    } catch (error) {
      console.error('Error fetching gallery image:', error);
      return null;
    }
  }

  // Update a gallery album
  static async updateGalleryAlbum(id: string, updates: Partial<GalleryAlbum>, updatedBy: string): Promise<boolean> {
    try {
      const setClause: string[] = [];
      const values: any[] = [];

      if (updates.name !== undefined) {
        setClause.push('name = ?');
        values.push(updates.name);
      }
      if (updates.description !== undefined) {
        setClause.push('description = ?');
        values.push(updates.description);
      }
      if (updates.coverImageUrl !== undefined) {
        setClause.push('cover_image = ?');
        values.push(updates.coverImageUrl);
      }
      if (updates.order !== undefined) {
        setClause.push('`order` = ?');
        values.push(updates.order);
      }
      if (updates.isVisible !== undefined) {
        setClause.push('isVisible = ?');
        values.push(updates.isVisible);
      }

      setClause.push('updated_at = ?');
      values.push(new Date());
      setClause.push('updated_by = ?');
      values.push(updatedBy);

      values.push(id);

      await pool.execute(
        `UPDATE gallery_albums SET ${setClause.join(', ')} WHERE id = ?`,
        values
      );
      return true;
    } catch (error) {
      console.error('Error updating gallery album:', error);
      return false;
    }
  }

  // Update a gallery image
  static async updateGalleryImage(id: string, updates: Partial<GalleryImage>, updatedBy: string): Promise<boolean> {
    try {
      const setClause: string[] = [];
      const values: any[] = [];

      if (updates.title !== undefined) {
        setClause.push('title = ?');
        values.push(updates.title);
      }
      if (updates.description !== undefined) {
        setClause.push('description = ?');
        values.push(updates.description);
      }
      if (updates.imageUrl !== undefined) {
        setClause.push('image_path = ?');
        values.push(updates.imageUrl);
      }
      if (updates.albumId !== undefined) {
        setClause.push('album_id = ?');
        values.push(updates.albumId);
      }
      if (updates.order !== undefined) {
        setClause.push('`order` = ?');
        values.push(updates.order);
      }
      if (updates.isVisible !== undefined) {
        setClause.push('isVisible = ?');
        values.push(updates.isVisible);
      }
      if (updates.tags !== undefined) {
        setClause.push('tags = ?');
        values.push(JSON.stringify(updates.tags));
      }

      setClause.push('updated_at = ?');
      values.push(new Date());
      setClause.push('updated_by = ?');
      values.push(updatedBy);

      values.push(id);

      await pool.execute(
        `UPDATE gallery_images SET ${setClause.join(', ')} WHERE id = ?`,
        values
      );
      return true;
    } catch (error) {
      console.error('Error updating gallery image:', error);
      return false;
    }
  }

  // Delete a gallery album
  static async deleteGalleryAlbum(id: string): Promise<boolean> {
    try {
      await pool.execute('START TRANSACTION');
      await pool.execute('DELETE FROM gallery_images WHERE album_id = ?', [id]);
      await pool.execute('DELETE FROM gallery_albums WHERE id = ?', [id]);
      await pool.execute('COMMIT');
      return true;
    } catch (error) {
      console.error('Error deleting gallery album:', error);
      await pool.execute('ROLLBACK');
      return false;
    }
  }

  // Delete a gallery image
  static async deleteGalleryImage(id: string): Promise<boolean> {
    try {
      await pool.execute('DELETE FROM gallery_images WHERE id = ?', [id]);
      return true;
    } catch (error) {
      console.error('Error deleting gallery image:', error);
      return false;
    }
  }

  // Get all products
  static async getProducts(): Promise<Product[]> {
    try {
      const [rows] = await pool.execute(`
        SELECT id, name, description, price, original_price as originalPrice, 
               category, image_path as imageUrl, isVisible, is_featured as isFeatured, 
               COALESCE(stock, 0) as stock, tags, created_at as createdAt, updated_at as updatedAt, 
               COALESCE(updated_by, 'admin') as updatedBy
        FROM products 
        ORDER BY \`order\` ASC, created_at DESC
      `);
      
      return (rows as any[]).map(row => ({
        ...row,
        tags: row.tags ? JSON.parse(row.tags) : [],
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt)
      }));
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  }

  // Get all product categories
  static async getProductCategories(): Promise<ProductCategory[]> {
    try {
      const [rows] = await pool.execute(`
        SELECT id, name, description, isVisible, created_at as createdAt, updated_at as updatedAt
        FROM product_categories 
        ORDER BY name ASC
      `);
      
      return (rows as any[]).map(row => ({
        ...row,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt)
      }));
    } catch (error) {
      console.error('Error fetching product categories:', error);
      return [];
    }
  }

  // Save store content (products and categories)
  static async saveStoreContent(products: Product[], categories: ProductCategory[], updatedBy: string): Promise<boolean> {
    try {
      await pool.execute('START TRANSACTION');

      // Create product_categories table if it doesn't exist
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS product_categories (
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          isVisible BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);

      // Add stock column to products table if it doesn't exist
      try {
        await pool.execute('ALTER TABLE products ADD COLUMN stock INT DEFAULT 0');
      } catch (error) {
        // Column might already exist, ignore error
        console.log('Stock column might already exist');
      }

      // Add updated_by column to products table if it doesn't exist
      try {
        await pool.execute('ALTER TABLE products ADD COLUMN updated_by VARCHAR(255) DEFAULT "admin"');
      } catch (error) {
        // Column might already exist, ignore error
        console.log('Updated_by column might already exist');
      }

      // Clear existing products and categories
      await pool.execute('DELETE FROM products');
      await pool.execute('DELETE FROM product_categories');

      // Insert new categories
      for (const category of categories) {
        await pool.execute(
          `INSERT INTO product_categories 
           (id, name, description, isVisible, created_at, updated_at) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            category.id || null,
            category.name || 'Untitled Category',
            category.description || null,
            category.isVisible !== undefined ? category.isVisible : true,
            category.createdAt || new Date(),
            new Date()
          ]
        );
      }

      // Insert new products
      for (const product of products) {
        // Ensure product has a valid category - use first available category if none selected
        let productCategory = product.category;
        if (!productCategory && categories.length > 0) {
          productCategory = categories[0].id;
        }
        
        const values = [
          product.id || null,
          product.name || 'Untitled Product',
          // Some schemas have description NOT NULL; use empty string instead of NULL
          (product.description !== undefined && product.description !== null) ? product.description : '',
          product.price || 0,
          product.originalPrice || null,
          productCategory || (categories.length > 0 ? categories[0].id : 'default'),
          product.imageUrl || null,
          product.isVisible !== undefined ? product.isVisible : true,
          product.isFeatured !== undefined ? product.isFeatured : false,
          product.stock || 0,
          product.tags ? JSON.stringify(product.tags) : null,
          product.createdAt || new Date(),
          new Date(),
          updatedBy || 'admin'
        ];
        
        // Check if updated_by column exists by trying to insert without it first
        try {
          await pool.execute(
            `INSERT INTO products 
             (id, name, description, price, original_price, category, image_path, 
              isVisible, is_featured, stock, tags, created_at, updated_at, updated_by) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            values
          );
        } catch (err: any) {
          // If updated_by column doesn't exist, insert without it
          if (err?.code === 'ER_BAD_FIELD_ERROR' && String(err?.sqlMessage || '').includes('updated_by')) {
            const valuesWithoutUpdatedBy = values.slice(0, -1); // Remove last element (updated_by)
            await pool.execute(
              `INSERT INTO products 
               (id, name, description, price, original_price, category, image_path, 
                isVisible, is_featured, stock, tags, created_at, updated_at) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              valuesWithoutUpdatedBy
            );
          } else {
            throw err; // Re-throw if it's a different error
          }
        }
      }

      // Commit transaction
      await pool.execute('COMMIT');
      return true;
    } catch (err: any) {
      console.error('Error saving store content:', err);
      await pool.execute('ROLLBACK');
      return false;
    }
  }

  // Contact Content Methods
  // Get all contact information
  static async getContactInfo(): Promise<ContactInfo[]> {
    try {
      const [rows] = await pool.execute('SELECT * FROM contact_info ORDER BY `order` ASC');
      return (rows as any[]).map(row => ({
        ...row,
        contactType: row.contact_type,
        description: row.description || null,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        createdBy: row.created_by
      }));
    } catch (error) {
      console.error('Error fetching contact info:', error);
      return [];
    }
  }

  // Get all contact offices
  static async getContactOffices(): Promise<ContactOffice[]> {
    try {
      const [rows] = await pool.execute('SELECT * FROM offices ORDER BY `order` ASC');
      return (rows as any[]).map(row => ({
        ...row,
        nameHindi: row.name_hindi || null,
        pincode: row.pincode || null,
        phone: row.phone || null,
        email: row.email || null,
        officeType: row.office_type,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        createdBy: row.created_by
      }));
    } catch (error) {
      console.error('Error fetching contact offices:', error);
      return [];
    }
  }

  // Save contact content (info and offices)
  static async saveContactContent(info: ContactInfo[], offices: ContactOffice[], updatedBy: string): Promise<boolean> {
    try {
      await pool.execute('START TRANSACTION');

      // Clear existing contact info and offices
      await pool.execute('DELETE FROM contact_info');
      await pool.execute('DELETE FROM offices');

      // Insert new contact info
      for (const item of info) {
        await pool.execute(
          `INSERT INTO contact_info 
           (id, contact_type, title, value, description, \`order\`, isVisible, created_at, updated_at, created_by) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            item.id,
            item.contactType,
            item.title,
            item.value,
            item.description || null,
            item.order || 0,
            item.isVisible !== undefined ? item.isVisible : true,
            item.createdAt || new Date(),
            new Date(),
            updatedBy
          ]
        );
      }

      // Insert new offices
      for (const office of offices) {
        await pool.execute(
          `INSERT INTO offices 
           (id, name, name_hindi, address, city, state, pincode, phone, email, office_type, \`order\`, isVisible, created_at, updated_at, created_by) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            office.id,
            office.name,
            office.nameHindi || null,
            office.address,
            office.city,
            office.state,
            office.pincode || null,
            office.phone || null,
            office.email || null,
            office.officeType,
            office.order || 0,
            office.isVisible !== undefined ? office.isVisible : true,
            office.createdAt || new Date(),
            new Date(),
            updatedBy
          ]
        );
      }

      // Commit transaction
      await pool.execute('COMMIT');
      return true;
    } catch (error) {
      console.error('Error saving contact content:', error);
      await pool.execute('ROLLBACK');
      return false;
    }
  }

  // Get a specific contact info item
  static async getContactInfoItem(id: string): Promise<ContactInfo | null> {
    try {
      const [rows] = await pool.execute('SELECT * FROM contact_info WHERE id = ?', [id]);
      const row = (rows as any[])[0];
      if (!row) return null;

      return {
        ...row,
        contactType: row.contact_type,
        description: row.description || null,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        createdBy: row.created_by
      };
    } catch (error) {
      console.error('Error fetching contact info item:', error);
      return null;
    }
  }

  // Get a specific contact office
  static async getContactOffice(id: string): Promise<ContactOffice | null> {
    try {
      const [rows] = await pool.execute('SELECT * FROM offices WHERE id = ?', [id]);
      const row = (rows as any[])[0];
      if (!row) return null;

      return {
        ...row,
        nameHindi: row.name_hindi || null,
        pincode: row.pincode || null,
        phone: row.phone || null,
        email: row.email || null,
        officeType: row.office_type,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        createdBy: row.created_by
      };
    } catch (error) {
      console.error('Error fetching contact office:', error);
      return null;
    }
  }

  // Update a contact info item
  static async updateContactInfoItem(id: string, updates: Partial<ContactInfo>, updatedBy: string): Promise<boolean> {
    try {
      const setClause: string[] = [];
      const values: any[] = [];

      if (updates.contactType !== undefined) {
        setClause.push('contact_type = ?');
        values.push(updates.contactType);
      }
      if (updates.title !== undefined) {
        setClause.push('title = ?');
        values.push(updates.title);
      }
      if (updates.value !== undefined) {
        setClause.push('value = ?');
        values.push(updates.value);
      }
      if (updates.description !== undefined) {
        setClause.push('description = ?');
        values.push(updates.description);
      }
      if (updates.order !== undefined) {
        setClause.push('`order` = ?');
        values.push(updates.order);
      }
      if (updates.isVisible !== undefined) {
        setClause.push('isVisible = ?');
        values.push(updates.isVisible);
      }

      setClause.push('updated_at = ?');
      values.push(new Date());
      values.push(id);

      await pool.execute(
        `UPDATE contact_info SET ${setClause.join(', ')} WHERE id = ?`,
        values
      );
      return true;
    } catch (error) {
      console.error('Error updating contact info item:', error);
      return false;
    }
  }

  // Update a contact office
  static async updateContactOffice(id: string, updates: Partial<ContactOffice>, updatedBy: string): Promise<boolean> {
    try {
      const setClause: string[] = [];
      const values: any[] = [];

      if (updates.name !== undefined) {
        setClause.push('name = ?');
        values.push(updates.name);
      }
      if (updates.nameHindi !== undefined) {
        setClause.push('name_hindi = ?');
        values.push(updates.nameHindi);
      }
      if (updates.address !== undefined) {
        setClause.push('address = ?');
        values.push(updates.address);
      }
      if (updates.city !== undefined) {
        setClause.push('city = ?');
        values.push(updates.city);
      }
      if (updates.state !== undefined) {
        setClause.push('state = ?');
        values.push(updates.state);
      }
      if (updates.pincode !== undefined) {
        setClause.push('pincode = ?');
        values.push(updates.pincode);
      }
      if (updates.phone !== undefined) {
        setClause.push('phone = ?');
        values.push(updates.phone);
      }
      if (updates.email !== undefined) {
        setClause.push('email = ?');
        values.push(updates.email);
      }
      if (updates.officeType !== undefined) {
        setClause.push('office_type = ?');
        values.push(updates.officeType);
      }
      if (updates.order !== undefined) {
        setClause.push('`order` = ?');
        values.push(updates.order);
      }
      if (updates.isVisible !== undefined) {
        setClause.push('isVisible = ?');
        values.push(updates.isVisible);
      }

      setClause.push('updated_at = ?');
      values.push(new Date());
      values.push(id);

      await pool.execute(
        `UPDATE offices SET ${setClause.join(', ')} WHERE id = ?`,
        values
      );
      return true;
    } catch (error) {
      console.error('Error updating contact office:', error);
      return false;
    }
  }

  // Delete a contact info item
  static async deleteContactInfoItem(id: string): Promise<boolean> {
    try {
      await pool.execute('DELETE FROM contact_info WHERE id = ?', [id]);
      return true;
    } catch (error) {
      console.error('Error deleting contact info item:', error);
      return false;
    }
  }

  // Delete a contact office
  static async deleteContactOffice(id: string): Promise<boolean> {
    try {
      await pool.execute('DELETE FROM offices WHERE id = ?', [id]);
      return true;
    } catch (error) {
      console.error('Error deleting contact office:', error);
      return false;
    }
  }
}
