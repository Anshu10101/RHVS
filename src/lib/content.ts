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

// Event-Based Photo Management Interfaces

export interface PhotoEvent {
  id: string;
  eventName: string;
  eventDate: Date;
  eventType: 'meeting' | 'festival' | 'conference' | 'sports' | 'cultural' | 'workshop' | 'celebration' | 'other';
  location?: string;
  description?: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  isPublic: boolean;
  district?: string;
  state?: string;
  ownerAdminId?: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  photoCount?: number;
  galleryCount?: number;
}

export interface PhotoGallery {
  id: string;
  eventId?: string;
  galleryName: string;
  description?: string;
  coverPhoto?: string;
  photoCount: number;
  isPublic: boolean;
  isFeatured: boolean;
  sortOrder: number;
  district?: string;
  state?: string;
  ownerAdminId?: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  eventName?: string;
  eventDate?: Date;
}

export interface Photo {
  id: string;
  galleryId?: string;
  eventId?: string;
  filename: string;
  originalName?: string;
  filePath: string;
  thumbnailPath?: string;
  mediumPath?: string;
  fileSize?: number;
  dimensions?: string;
  fileType?: string;
  cameraInfo?: any;
  tags: string[];
  caption?: string;
  description?: string;
  photographer?: string;
  uploadSource: 'admin' | 'member' | 'bulk_import' | 'mobile';
  uploadSessionId?: string;
  isFeatured: boolean;
  isApproved: boolean;
  isVisible: boolean;
  sortOrder: number;
  viewCount: number;
  downloadCount: number;
  district?: string;
  state?: string;
  ownerAdminId?: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  // Related data
  eventName?: string;
  eventDate?: Date;
  eventType?: string;
  galleryName?: string;
}

export interface UploadSession {
  id: string;
  eventId?: string;
  galleryId?: string;
  adminId: number;
  sessionName?: string;
  status: 'active' | 'completed' | 'failed' | 'cancelled';
  totalFiles: number;
  uploadedFiles: number;
  failedFiles: number;
  totalSize: number;
  createdAt: Date;
  completedAt?: Date;
}

export interface PhotoAnalytics {
  id: number;
  photoId: string;
  actionType: 'view' | 'download' | 'share' | 'like';
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
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
  state?: string;
  district?: string;
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

export interface ContentScopeFilter {
  district?: string | null;
  state?: string | null;
  adminId?: number | null;
  unrestricted?: boolean;
}

export class ContentService {
  // About Methods
  static async getAboutSections(): Promise<AboutSection[]> {
    try {
      const [rows] = await pool.execute('SELECT * FROM about_sections ORDER BY `order` ASC');
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

  static async saveAboutSections(sections: AboutSection[], updatedBy: string): Promise<boolean> {
    try {
      await pool.execute('START TRANSACTION');
      
      // Clear existing sections
      await pool.execute('DELETE FROM about_sections');
      
      // Insert new sections
      for (const section of sections) {
        await pool.execute(
          `INSERT INTO about_sections (id, type, title, content, \`order\`, isVisible, styling, created_at, updated_at, updated_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), ?)`,
          [
            section.id,
            section.type,
            section.title || null,
            section.content,
            section.order,
            section.isVisible,
            section.styling ? JSON.stringify(section.styling) : null,
            updatedBy
          ]
        );
      }
      
      await pool.execute('COMMIT');
      return true;
    } catch (error) {
      console.error('Error saving about sections:', error);
      await pool.execute('ROLLBACK');
      return false;
    }
  }

  // Contact Content Methods
  static async getContactInfo(): Promise<ContactInfo[]> {
    try {
      const [rows] = await pool.execute('SELECT * FROM contact_info ORDER BY `order` ASC');
      return (rows as any[]).map(row => ({
        ...row,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        createdBy: row.created_by
      }));
    } catch (error) {
      console.error('Error fetching contact info:', error);
      return [];
    }
  }

  static async getContactOffices(): Promise<ContactOffice[]> {
    try {
      const [rows] = await pool.execute('SELECT * FROM offices ORDER BY `order` ASC');
      return (rows as any[]).map(row => ({
        ...row,
        nameHindi: row.name_hindi,
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

  // ==========================================
  // EVENT-BASED PHOTO MANAGEMENT METHODS
  // ==========================================

  // Photo Events Methods
  static async getPhotoEvents(scope?: ContentScopeFilter): Promise<PhotoEvent[]> {
    try {
      let sql = `
        SELECT e.*, 
               COUNT(DISTINCT g.id) as gallery_count,
               COUNT(DISTINCT p.id) as photo_count
        FROM photo_events e
        LEFT JOIN photo_galleries g ON e.id = g.event_id
        LEFT JOIN photos p ON e.id = p.event_id AND p.is_visible = TRUE
      `;
      const params: any[] = [];
      const conditions: string[] = [];

      // Handle district admin scope restrictions
      if (scope && !scope.unrestricted && (scope.district || scope.adminId)) {
        conditions.push('(e.district = ? OR e.owner_admin_id = ?)');
        params.push(scope.district || '');
        params.push(scope.adminId || 0);
      }

      // Handle superadmin filters
      if (scope && scope.unrestricted) {
        if (scope.state) {
          conditions.push('e.state = ?');
          params.push(scope.state);
          console.log('ContentService - Adding state filter:', scope.state);
        }
        
        if (scope.district) {
          conditions.push('e.district = ?');
          params.push(scope.district);
          console.log('ContentService - Adding district filter:', scope.district);
        }
      }

      // Add WHERE clause if we have conditions
      if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
      }

      sql += ' GROUP BY e.id ORDER BY e.event_date DESC, e.created_at DESC';

      console.log('ContentService - Final SQL:', sql);
      console.log('ContentService - Params:', params);

      const [rows] = await pool.execute(sql, params);
      return (rows as any[]).map(row => ({
        ...row,
        eventName: row.event_name,
        eventDate: new Date(row.event_date),
        eventType: row.event_type,
        isPublic: Boolean(row.is_public),
        ownerAdminId: row.owner_admin_id,
        createdBy: row.created_by,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        photoCount: parseInt(row.photo_count) || 0,
        galleryCount: parseInt(row.gallery_count) || 0
      }));
    } catch (error) {
      console.error('Error fetching photo events:', error);
      return [];
    }
  }

  static async createPhotoEvent(event: Omit<PhotoEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const id = `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      await pool.execute(
        `INSERT INTO photo_events (id, event_name, event_date, event_type, location, description, status, is_public, district, state, owner_admin_id, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          event.eventName,
          event.eventDate,
          event.eventType,
          event.location || null,
          event.description || null,
          event.status,
          event.isPublic,
          event.district || null,
          event.state || null,
          event.ownerAdminId || null,
          event.createdBy
        ]
      );

      return id;
    } catch (error) {
      console.error('Error creating photo event:', error);
      throw error;
    }
  }

  // Photo Galleries Methods
  static async getPhotoGalleries(scope?: ContentScopeFilter, eventId?: string): Promise<PhotoGallery[]> {
    try {
      let sql = `
        SELECT g.*, e.event_name, e.event_date
        FROM photo_galleries g
        LEFT JOIN photo_events e ON g.event_id = e.id
      `;
      const params: any[] = [];

      const conditions = [];
      if (scope && !scope.unrestricted && (scope.district || scope.adminId)) {
        conditions.push('(g.district = ? OR g.owner_admin_id = ?)');
        params.push(scope.district || '');
        params.push(scope.adminId || 0);
      }

      if (eventId) {
        conditions.push('g.event_id = ?');
        params.push(eventId);
      }

      if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
      }

      sql += ' ORDER BY g.sort_order ASC, g.created_at DESC';

      const [rows] = await pool.execute(sql, params);
      return (rows as any[]).map(row => ({
        ...row,
        galleryName: row.gallery_name,
        coverPhoto: row.cover_photo,
        isPublic: Boolean(row.is_public),
        isFeatured: Boolean(row.is_featured),
        sortOrder: row.sort_order,
        ownerAdminId: row.owner_admin_id,
        createdBy: row.created_by,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        eventName: row.event_name,
        eventDate: row.event_date ? new Date(row.event_date) : undefined
      }));
    } catch (error) {
      console.error('Error fetching photo galleries:', error);
      return [];
    }
  }

  static async createPhotoGallery(gallery: Omit<PhotoGallery, 'id' | 'createdAt' | 'updatedAt' | 'photoCount'>): Promise<string> {
    try {
      const id = `gallery-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      await pool.execute(
        `INSERT INTO photo_galleries (id, event_id, gallery_name, description, cover_photo, is_public, is_featured, sort_order, district, state, owner_admin_id, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          gallery.eventId || null,
          gallery.galleryName,
          gallery.description || null,
          gallery.coverPhoto || null,
          gallery.isPublic,
          gallery.isFeatured,
          gallery.sortOrder,
          gallery.district || null,
          gallery.state || null,
          gallery.ownerAdminId || null,
          gallery.createdBy
        ]
      );

      return id;
    } catch (error) {
      console.error('Error creating photo gallery:', error);
      throw error;
    }
  }

  // Photos Methods
  static async getPhotos(scope?: ContentScopeFilter, filters?: {
    eventId?: string;
    galleryId?: string;
    isFeatured?: boolean;
    isApproved?: boolean;
    isVisible?: boolean;
    search?: string;
    state?: string;
    district?: string;
    event?: string;
    tags?: string[];
  }): Promise<Photo[]> {
    try {
      let sql = `
        SELECT p.*, e.event_name, e.event_date, e.event_type, g.gallery_name
        FROM photos p
        LEFT JOIN photo_events e ON p.event_id = e.id
        LEFT JOIN photo_galleries g ON p.gallery_id = g.id
      `;
      const params: any[] = [];
      const conditions = [];

      // Scope filtering
      if (scope && !scope.unrestricted && (scope.district || scope.adminId)) {
        conditions.push('(p.district = ? OR p.owner_admin_id = ?)');
        params.push(scope.district || '');
        params.push(scope.adminId || 0);
      }

      // Additional filters
      if (filters?.eventId) {
        conditions.push('p.event_id = ?');
        params.push(filters.eventId);
      }

      if (filters?.galleryId) {
        conditions.push('p.gallery_id = ?');
        params.push(filters.galleryId);
      }

      if (filters?.isFeatured !== undefined) {
        conditions.push('p.is_featured = ?');
        params.push(filters.isFeatured);
      }

      if (filters?.isApproved !== undefined) {
        conditions.push('p.is_approved = ?');
        params.push(filters.isApproved);
      }

      if (filters?.isVisible !== undefined) {
        conditions.push('p.is_visible = ?');
        params.push(filters.isVisible);
      }

      if (filters?.search) {
        conditions.push('(p.caption LIKE ? OR p.photographer LIKE ? OR e.event_name LIKE ?)');
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      if (filters?.state) {
        conditions.push('p.state = ?');
        params.push(filters.state);
      }

      if (filters?.district) {
        conditions.push('p.district = ?');
        params.push(filters.district);
      }

      if (filters?.event) {
        conditions.push('e.event_name = ?');
        params.push(filters.event);
      }

      if (filters?.tags && filters.tags.length > 0) {
        const tagConditions = filters.tags.map(() => 'JSON_SEARCH(p.tags, "one", ?) IS NOT NULL');
        conditions.push(`(${tagConditions.join(' OR ')})`);
        params.push(...filters.tags);
      }

      if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
      }

      sql += ' ORDER BY p.sort_order ASC, p.created_at DESC';

      const [rows] = await pool.execute(sql, params);
      return (rows as any[]).map(row => ({
        ...row,
        filePath: row.file_path,
        thumbnailPath: row.thumbnail_path,
        mediumPath: row.medium_path,
        fileSize: row.file_size,
        fileType: row.file_type,
        cameraInfo: row.camera_info ? JSON.parse(row.camera_info) : undefined,
        tags: row.tags ? JSON.parse(row.tags) : [],
        uploadSource: row.upload_source,
        uploadSessionId: row.upload_session_id,
        isFeatured: Boolean(row.is_featured),
        isApproved: Boolean(row.is_approved),
        isVisible: Boolean(row.is_visible),
        sortOrder: row.sort_order,
        viewCount: row.view_count,
        downloadCount: row.download_count,
        ownerAdminId: row.owner_admin_id,
        createdBy: row.created_by,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        eventName: row.event_name,
        eventDate: row.event_date ? new Date(row.event_date) : undefined,
        eventType: row.event_type,
        galleryName: row.gallery_name
      }));
    } catch (error) {
      console.error('Error fetching photos:', error);
      return [];
    }
  }

  static async createPhoto(photo: Omit<Photo, 'id' | 'createdAt' | 'updatedAt' | 'viewCount' | 'downloadCount'>): Promise<string> {
    try {
      const id = `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
        await pool.execute(
        `INSERT INTO photos (id, gallery_id, event_id, filename, original_name, file_path, thumbnail_path, medium_path, file_size, dimensions, file_type, camera_info, tags, caption, description, photographer, upload_source, upload_session_id, is_featured, is_approved, is_visible, sort_order, district, state, owner_admin_id, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          photo.galleryId || null,
          photo.eventId || null,
          photo.filename,
          photo.originalName || null,
          photo.filePath,
          photo.thumbnailPath || null,
          photo.mediumPath || null,
          photo.fileSize || null,
          photo.dimensions || null,
          photo.fileType || null,
          photo.cameraInfo ? JSON.stringify(photo.cameraInfo) : null,
          JSON.stringify(photo.tags || []),
          photo.caption || null,
          photo.description || null,
          photo.photographer || null,
          photo.uploadSource,
          photo.uploadSessionId || null,
          photo.isFeatured,
          photo.isApproved,
          photo.isVisible,
          photo.sortOrder,
          photo.district || null,
          photo.state || null,
          photo.ownerAdminId || null,
          photo.createdBy
        ]
      );

      // Update photo count in gallery
      if (photo.galleryId) {
        await pool.execute(
          'UPDATE photo_galleries SET photo_count = (SELECT COUNT(*) FROM photos WHERE gallery_id = ? AND is_visible = TRUE) WHERE id = ?',
          [photo.galleryId, photo.galleryId]
        );
      }

      return id;
    } catch (error) {
      console.error('Error creating photo:', error);
      throw error;
    }
  }

  // ==========================================
  // PRODUCT MANAGEMENT METHODS
  // ==========================================

  static async getProducts(scope?: ContentScopeFilter): Promise<Product[]> {
    try {
      let sql = `
        SELECT DISTINCT p.*, 
               COALESCE(p.district_id, co.district_id) as district_id,
               COALESCE(p.state_id, co.state_id) as state_id,
               COALESCE(p.state_id, co.state_id, s.state_name_english) as state,
               COALESCE(p.district_id, co.district_id, d.district_name_english) as district,
               m.name AS added_by_name
        FROM products p
        LEFT JOIN content_origin co ON co.content_type = 'product' AND co.content_id = p.id
        LEFT JOIN district_admins da ON da.id = COALESCE(p.owner_admin_id, co.added_by_admin_id)
        LEFT JOIN members m ON m.id = da.member_id
        LEFT JOIN states s ON s.state_name_english = COALESCE(p.state_id, co.state_id)
        LEFT JOIN districts d ON d.district_name_english = COALESCE(p.district_id, co.district_id)
      `;
      const params: any[] = [];
      const conditions: string[] = [];

      // Handle district admin scope restrictions
      if (scope && !scope.unrestricted && (scope.district || scope.adminId)) {
        conditions.push('(p.district_id = ? OR co.district_id = ? OR p.owner_admin_id = ? OR co.added_by_admin_id = ?)');
        params.push(scope.district || '', scope.district || '', scope.adminId || 0, scope.adminId || 0);
      }

      // Handle superadmin filters
      if (scope && scope.unrestricted) {
        if (scope.state) {
          conditions.push('(p.state_id = ? OR co.state_id = ?)');
          params.push(scope.state, scope.state);
        }
        
        if (scope.district) {
          conditions.push('(p.district_id = ? OR co.district_id = ?)');
          params.push(scope.district, scope.district);
        }
      }

      // Add WHERE clause if we have conditions
      if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
      }

      sql += ' ORDER BY p.created_at DESC';

      const [rows] = await pool.execute(sql, params);
      return (rows as any[]).map(row => ({
        ...row,
        imageUrl: row.image_path,
        originalPrice: row.original_price,
        isVisible: Boolean(row.isVisible),
        isFeatured: Boolean(row.is_featured),
        tags: row.tags ? JSON.parse(row.tags) : [],
        state: row.state,
        district: row.district,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        updatedBy: row.updated_by
      }));
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  }

  static async getProductCategories(): Promise<ProductCategory[]> {
    try {
      const [rows] = await pool.execute('SELECT * FROM product_categories WHERE isVisible = TRUE ORDER BY name ASC');
      return (rows as any[]).map(row => ({
        ...row,
        isVisible: Boolean(row.isVisible),
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      }));
    } catch (error) {
      console.error('Error fetching product categories:', error);
      return [];
    }
  }
}
