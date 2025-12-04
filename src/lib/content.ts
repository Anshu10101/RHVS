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
  filePath?: string;
  fileUrl?: string;
  youtubeVideoUrl?: string;
  isVideo?: boolean;
  thumbnailPath?: string;
  mediumPath?: string;
  fileSize?: number;
  dimensions?: string;
  fileType?: string;
  fileHash?: string;
  hasBlob?: boolean;
  cameraInfo?: { [key: string]: unknown };
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

export interface PhotoCreateInput {
  id?: string;
  galleryId?: string;
  eventId?: string;
  filename: string;
  originalName?: string;
  filePath?: string;
  youtubeVideoUrl?: string;
  isVideo?: boolean;
  thumbnailPath?: string;
  mediumPath?: string;
  fileSize?: number;
  dimensions?: string;
  fileType?: string;
  fileHash?: string;
  fileBuffer?: Buffer | null;
  thumbnailBuffer?: Buffer | null;
  mediumBuffer?: Buffer | null;
  cameraInfo?: { [key: string]: unknown };
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
  district?: string;
  state?: string;
  ownerAdminId?: number;
  createdBy: string;
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (rows as any[]).map((row: any) => ({
        id: row.id,
        type: row.type,
        title: row.title,
        content: row.content,
        order: row.order,
        isVisible: Boolean(row.isVisible),
        styling: row.styling ? JSON.parse(row.styling) : undefined,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        updatedBy: String(row.updated_by)
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (rows as any[]).map((row: any) => ({
        id: row.id,
        contactType: row.contact_type,
        title: row.title,
        value: row.value,
        description: row.description,
        order: row.order,
        isVisible: Boolean(row.isVisible),
        createdAt: new Date(row.created_at as string),
        updatedAt: new Date(row.updated_at as string),
        createdBy: String(row.created_by)
      }));
    } catch (error) {
      console.error('Error fetching contact info:', error);
      return [];
    }
  }

  static async getContactOffices(): Promise<ContactOffice[]> {
    try {
      const [rows] = await pool.execute('SELECT * FROM offices ORDER BY `order` ASC');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (rows as any[]).map((row: any) => ({
        id: row.id,
        name: row.name,
        nameHindi: row.name_hindi,
        address: row.address,
        city: row.city,
        state: row.state,
        pincode: row.pincode,
        phone: row.phone,
        email: row.email,
        officeType: row.office_type,
        order: row.order,
        isVisible: Boolean(row.isVisible),
        createdAt: new Date(row.created_at as string),
        updatedAt: new Date(row.updated_at as string),
        createdBy: String(row.created_by)
      }));
    } catch (error) {
      console.error('Error fetching contact offices:', error);
      return [];
    }
  }

  static async saveContactContent(
    contactInfo: ContactInfo[],
    offices: ContactOffice[],
    updatedBy: string
  ): Promise<boolean> {
    try {
      // Helper function to convert Date to MySQL datetime format
      const toMySQLDateTime = (date: Date | undefined): string => {
        if (!date) return new Date().toISOString().slice(0, 19).replace('T', ' ');
        const d = date instanceof Date ? date : new Date(date);
        return d.toISOString().slice(0, 19).replace('T', ' ');
      };

      await pool.execute('START TRANSACTION');
      
      // Clear existing contact info
      await pool.execute('DELETE FROM contact_info');
      
      // Insert new contact info
      for (const info of contactInfo) {
        // Title is NOT NULL in database, so provide a default if missing
        const title = info.title?.trim() || info.contactType || 'Contact';
        await pool.execute(
          `INSERT INTO contact_info (id, contact_type, title, value, description, \`order\`, isVisible, created_at, updated_at, created_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
          [
            info.id,
            info.contactType,
            title,
            info.value,
            info.description || null,
            info.order,
            info.isVisible ? 1 : 0,
            toMySQLDateTime(info.createdAt),
            updatedBy
          ]
        );
      }
      
      // Clear existing offices
      await pool.execute('DELETE FROM offices');
      
      // Insert new offices
      for (const office of offices) {
        await pool.execute(
          `INSERT INTO offices (id, name, name_hindi, address, city, state, pincode, phone, email, office_type, \`order\`, isVisible, created_at, updated_at, created_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
          [
            office.id,
            office.name,
            office.nameHindi || null,
            office.address,
            office.city || null,
            office.state || null,
            office.pincode || null,
            office.phone || null,
            office.email || null,
            office.officeType,
            office.order,
            office.isVisible ? 1 : 0,
            toMySQLDateTime(office.createdAt),
            updatedBy
          ]
        );
      }
      
      await pool.execute('COMMIT');
      return true;
    } catch (error) {
      console.error('Error saving contact content:', error);
      await pool.execute('ROLLBACK');
      return false;
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
      const params: (string | number)[] = [];
      const conditions: string[] = [];

      // Handle district admin scope restrictions - filter by district/state only
      // This ensures continuity - new admins can see content created by previous admins
      if (scope && !scope.unrestricted && scope.district) {
        // Extract district name (before comma) for matching, as district field may contain multiple districts
        const districtNameForMatch = scope.district.split(',')[0]?.trim() || scope.district;
        conditions.push('(e.district = ? OR e.district LIKE ? OR SUBSTRING_INDEX(e.district, ",", 1) = ?)');
        params.push(districtNameForMatch, `${districtNameForMatch},%`, districtNameForMatch);
        // Also filter by state if available
        if (scope.state) {
          conditions.push('e.state = ?');
          params.push(scope.state);
        }
      }

      // Handle superadmin filters
      if (scope && scope.unrestricted) {
        if (scope.state) {
          conditions.push('e.state = ?');
          params.push(scope.state);
        }
        
        if (scope.district) {
          conditions.push('e.district = ?');
          params.push(scope.district);
        }
      }

      // Add WHERE clause if we have conditions
      if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
      }

      sql += ' GROUP BY e.id ORDER BY e.event_date DESC, e.created_at DESC';

      const [rows] = await pool.execute(sql, params);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (rows as any[]).map((row: any) => ({
        id: row.id,
        eventName: String(row.event_name),
        eventDate: new Date(row.event_date as string),
        eventType: row.event_type,
        location: row.location,
        description: row.description,
        status: row.status,
        isPublic: Boolean(row.is_public),
        district: row.district,
        state: row.state,
        ownerAdminId: row.owner_admin_id,
        createdBy: String(row.created_by),
        createdAt: new Date(row.created_at as string),
        updatedAt: new Date(row.updated_at as string),
        photoCount: parseInt(String(row.photo_count)) || 0,
        galleryCount: parseInt(String(row.gallery_count)) || 0
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
      const params: (string | number)[] = [];

      const conditions = [];
      // Filter by district/state only (not owner_admin_id)
      // This ensures continuity - new admins can see content created by previous admins
      if (scope && !scope.unrestricted && scope.district) {
        // Extract district name (before comma) for matching, as district field may contain multiple districts
        const districtNameForMatch = scope.district.split(',')[0]?.trim() || scope.district;
        conditions.push('(g.district = ? OR g.district LIKE ? OR SUBSTRING_INDEX(g.district, ",", 1) = ?)');
        params.push(districtNameForMatch, `${districtNameForMatch},%`, districtNameForMatch);
        // Also filter by state if available
        if (scope.state) {
          conditions.push('g.state = ?');
          params.push(scope.state);
        }
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (rows as any[]).map((row: any) => ({
        id: row.id,
        eventId: row.event_id,
        galleryName: String(row.gallery_name),
        description: row.description,
        coverPhoto: row.cover_photo,
        photoCount: row.photo_count || 0,
        isPublic: Boolean(row.is_public),
        isFeatured: Boolean(row.is_featured),
        sortOrder: row.sort_order,
        district: row.district,
        state: row.state,
        ownerAdminId: row.owner_admin_id,
        createdBy: String(row.created_by),
        createdAt: new Date(row.created_at as string),
        updatedAt: new Date(row.updated_at as string),
        eventName: row.event_name,
        eventDate: row.event_date ? new Date(row.event_date as string) : undefined
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
        SELECT 
          p.id,
          p.gallery_id,
          p.event_id,
          p.filename,
          p.original_name,
          CASE 
            WHEN p.file_blob IS NOT NULL THEN CONCAT('/api/media/photos/', p.id, '?v=', UNIX_TIMESTAMP(p.updated_at))
            ELSE p.file_path
          END AS resolved_file_path,
          p.youtube_video_url,
          p.is_video,
          p.thumbnail_path,
          p.medium_path,
          p.file_size,
          p.dimensions,
          p.file_type,
          p.file_hash,
          (p.file_blob IS NOT NULL) AS has_file_blob,
          p.camera_info,
          p.tags,
          p.caption,
          p.description,
          p.photographer,
          p.upload_source,
          p.upload_session_id,
          p.is_featured,
          p.is_approved,
          p.is_visible,
          p.sort_order,
          p.view_count,
          p.download_count,
          p.district,
          p.state,
          p.owner_admin_id,
          p.created_by,
          p.created_at,
          p.updated_at,
          e.event_name,
          e.event_date,
          e.event_type,
          g.gallery_name
        FROM photos p
        LEFT JOIN photo_events e ON p.event_id = e.id
        LEFT JOIN photo_galleries g ON p.gallery_id = g.id
      `;
      const params: (string | number | boolean)[] = [];
      const conditions = [];

      // Scope filtering - filter by district/state only (not owner_admin_id)
      // This ensures continuity - new admins can see content created by previous admins
      if (scope && !scope.unrestricted && scope.district) {
        // Extract district name (before comma) for matching, as district field may contain multiple districts
        const districtNameForMatch = scope.district.split(',')[0]?.trim() || scope.district;
        conditions.push('(p.district = ? OR p.district LIKE ? OR SUBSTRING_INDEX(p.district, ",", 1) = ?)');
        params.push(districtNameForMatch, `${districtNameForMatch},%`, districtNameForMatch);
        // Also filter by state if available
        if (scope.state) {
          conditions.push('p.state = ?');
          params.push(scope.state);
        }
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (rows as any[]).map((row: any) => ({
        id: row.id,
        galleryId: row.gallery_id,
        eventId: row.event_id,
        filename: row.filename,
        originalName: row.original_name,
        filePath: row.resolved_file_path ?? undefined,
        fileUrl: row.resolved_file_path ?? undefined,
        youtubeVideoUrl: row.youtube_video_url ?? undefined,
        isVideo: Boolean(row.is_video),
        thumbnailPath: row.thumbnail_path,
        mediumPath: row.medium_path,
        fileSize: row.file_size,
        dimensions: row.dimensions,
        fileType: row.file_type,
        fileHash: row.file_hash ?? undefined,
        hasBlob: Boolean(row.has_file_blob),
        cameraInfo: row.camera_info ? JSON.parse(String(row.camera_info)) : undefined,
        tags: row.tags ? JSON.parse(String(row.tags)) : [],
        caption: row.caption,
        description: row.description,
        photographer: row.photographer,
        uploadSource: row.upload_source,
        uploadSessionId: row.upload_session_id,
        isFeatured: Boolean(row.is_featured),
        isApproved: Boolean(row.is_approved),
        isVisible: Boolean(row.is_visible),
        sortOrder: row.sort_order,
        viewCount: row.view_count,
        downloadCount: row.download_count,
        district: row.district,
        state: row.state,
        ownerAdminId: row.owner_admin_id,
        createdBy: String(row.created_by),
        createdAt: new Date(row.created_at as string),
        updatedAt: new Date(row.updated_at as string),
        eventName: row.event_name,
        eventDate: row.event_date ? new Date(row.event_date as string) : undefined,
        eventType: row.event_type,
        galleryName: row.gallery_name
      }));
    } catch (error) {
      console.error('Error fetching photos:', error);
      return [];
    }
  }

  static async createPhoto(photo: PhotoCreateInput): Promise<string> {
    try {
      const id = photo.id || `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      console.log('[ContentService] Creating photo:', {
        id,
        isVideo: photo.isVideo,
        youtubeVideoUrl: photo.youtubeVideoUrl,
        filename: photo.filename
      });
      
        await pool.execute(
        `INSERT INTO photos (
          id,
          gallery_id,
          event_id,
          filename,
          original_name,
          file_path,
          youtube_video_url,
          is_video,
          thumbnail_path,
          medium_path,
          file_size,
          dimensions,
          file_type,
          file_hash,
          file_blob,
          thumbnail_blob,
          medium_blob,
          camera_info,
          tags,
          caption,
          description,
          photographer,
          upload_source,
          upload_session_id,
          is_featured,
          is_approved,
          is_visible,
          sort_order,
          district,
          state,
          owner_admin_id,
          created_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          photo.galleryId || null,
          photo.eventId || null,
          photo.filename,
          photo.originalName || null,
          photo.filePath || null,
          photo.youtubeVideoUrl || null,
          photo.isVideo || false,
          photo.thumbnailPath || null,
          photo.mediumPath || null,
          photo.fileSize ?? null,
          photo.dimensions || null,
          photo.fileType || null,
          photo.fileHash || null,
          photo.fileBuffer ?? null,
          photo.thumbnailBuffer ?? null,
          photo.mediumBuffer ?? null,
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

      console.log('[ContentService] Photo created successfully:', id);
      
      // Verify the photo was created with YouTube URL if it's a video
      if (photo.isVideo && photo.youtubeVideoUrl) {
        const verifyQuery = await pool.execute(
          'SELECT id, youtube_video_url, is_video FROM photos WHERE id = ?',
          [id]
        ) as any;
        const verifyResult = verifyQuery[0] as any[];
        if (verifyResult.length > 0) {
          console.log('[ContentService] Verified photo in database:', {
            id: verifyResult[0].id,
            youtube_video_url: verifyResult[0].youtube_video_url,
            is_video: verifyResult[0].is_video
          });
        }
      }

      return id;
    } catch (error) {
      console.error('[ContentService] Error creating photo:', error);
      if (error instanceof Error) {
        console.error('[ContentService] Error message:', error.message);
        console.error('[ContentService] Error stack:', error.stack);
        
        // Check for database column errors
        if (error.message.includes('Unknown column') || error.message.includes('youtube_video_url') || error.message.includes('is_video')) {
          const dbError = new Error(`Database migration not run. The columns 'youtube_video_url' and 'is_video' do not exist. Please run the migration: database/add-youtube-video-to-photos.sql`);
          console.error('[ContentService] Database migration error:', dbError.message);
          throw dbError;
        }
      }
      throw error;
    }
  }

  // ==========================================
  // PRODUCT MANAGEMENT METHODS
  // ==========================================

  static async getProducts(scope?: ContentScopeFilter): Promise<Product[]> {
    try {
      // Use subquery to get unique content_origin per product (take first one if multiple exist)
      let sql = `
        SELECT DISTINCT 
               p.*,
               CASE 
                 WHEN p.image_blob IS NOT NULL THEN CONCAT('/api/media/products/', p.id, '?v=', UNIX_TIMESTAMP(p.updated_at))
                 ELSE p.image_path
               END AS resolved_image_path,
               COALESCE(p.district_id, co.district_id) as district_id,
               COALESCE(p.state_id, co.state_id) as state_id,
               COALESCE(p.state_id, co.state_id, s.state_name_english) as state,
               COALESCE(p.district_id, co.district_id, d.district_name_english) as district,
               m.name AS added_by_name
        FROM products p
        LEFT JOIN (
          SELECT 
            content_id, 
            MAX(district_id) as district_id, 
            MAX(state_id) as state_id, 
            MAX(added_by_admin_id) as added_by_admin_id
          FROM content_origin
          WHERE content_type = 'product'
          GROUP BY content_id
        ) co ON co.content_id = p.id
        LEFT JOIN district_admins da ON da.id = COALESCE(p.owner_admin_id, co.added_by_admin_id)
        LEFT JOIN members m ON m.id = da.member_id
        LEFT JOIN states s ON s.state_name_english = COALESCE(p.state_id, co.state_id)
        LEFT JOIN districts d ON d.district_name_english = COALESCE(p.district_id, co.district_id)
      `;
      const params: (string | number)[] = [];
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (rows as any[]).map((row: any) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        price: row.price,
        imageUrl: row.resolved_image_path ?? row.image_path,
        originalPrice: row.original_price,
        category: row.category,
        isVisible: Boolean(row.isVisible),
        isFeatured: Boolean(row.is_featured),
        stock: row.stock,
        tags: row.tags ? JSON.parse(String(row.tags)) : [],
        state: row.state,
        district: row.district,
        createdAt: new Date(row.created_at as string),
        updatedAt: new Date(row.updated_at as string),
        updatedBy: String(row.updated_by)
      }));
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  }

  static async getProductCategories(): Promise<ProductCategory[]> {
    try {
      const [rows] = await pool.execute('SELECT * FROM product_categories WHERE isVisible = TRUE ORDER BY name ASC');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (rows as any[]).map((row: any) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        isVisible: Boolean(row.isVisible),
        createdAt: new Date(row.created_at as string),
        updatedAt: new Date(row.updated_at as string)
      }));
    } catch (error) {
      console.error('Error fetching product categories:', error);
      return [];
    }
  }
}
