import { executeQuery } from './database';

/**
 * Track content creation by district admin
 * 
 * @param contentType Type of content (news, event, product, gallery, office)
 * @param contentId ID of the content item
 * @param districtId District ID
 * @param stateId State ID
 * @param adminId ID of the district admin who added the content
 */
export async function trackContentOrigin(
  contentType: 'news' | 'event' | 'product' | 'gallery' | 'office',
  contentId: number,
  districtId: string,
  stateId: string,
  adminId: number
) {
  try {
    await executeQuery(
      `INSERT INTO content_origin (
        content_type, 
        content_id, 
        district_id, 
        state_id, 
        added_by_admin_id
      ) VALUES (?, ?, ?, ?, ?)`,
      [contentType, contentId, districtId, stateId, adminId]
    );
    return true;
  } catch (error) {
    console.error(`Error tracking content origin: ${error}`);
    return false;
  }
}

/**
 * Get district information for content item
 * 
 * @param contentType Type of content (news, event, product, gallery, office)
 * @param contentId ID of the content item
 */
export async function getContentOrigin(
  contentType: 'news' | 'event' | 'product' | 'gallery' | 'office',
  contentId: number
) {
  try {
    const result = await executeQuery(
      `SELECT 
        co.district_id,
        co.state_id,
        co.added_at,
        da.member_id,
        m.name as added_by_name
      FROM content_origin co
      JOIN district_admins da ON co.added_by_admin_id = da.id
      JOIN members m ON da.member_id = m.id
      WHERE co.content_type = ? AND co.content_id = ?
      LIMIT 1`,
      [contentType, contentId]
    ) as Array<{ 
      district_id: string;
      state_id: string;
      added_at: string;
      member_id: number;
      added_by_name: string;
    }>;
    
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error(`Error getting content origin: ${error}`);
    return null;
  }
}

/**
 * Get all content from a specific district
 * 
 * @param contentType Type of content (news, event, product, gallery, office)
 * @param districtId District ID
 * @param stateId State ID (optional)
 */
export async function getContentByDistrict(
  contentType: 'news' | 'event' | 'product' | 'gallery' | 'office',
  districtId: string,
  stateId?: string
) {
  try {
    let query = `
      SELECT 
        c.*,
        co.district_id,
        co.state_id,
        co.added_at,
        m.name as added_by_name
      FROM ${contentType} c
      JOIN content_origin co ON c.id = co.content_id AND co.content_type = ?
      JOIN district_admins da ON co.added_by_admin_id = da.id
      JOIN members m ON da.member_id = m.id
      WHERE co.district_id = ?
    `;
    
    const params: (string | number)[] = [contentType, districtId];
    
    if (stateId) {
      query += ` AND co.state_id = ?`;
      params.push(stateId);
    }
    
    query += ` ORDER BY c.created_at DESC`;
    
    const result = await executeQuery(query, params);
    return result;
  } catch (error) {
    console.error(`Error getting content by district: ${error}`);
    return [];
  }
}

/**
 * Add district information to content items
 * 
 * @param contentItems Array of content items
 * @param contentType Type of content (news, event, product, gallery, office)
 */
export async function enrichContentWithDistrictInfo(
  contentItems: Array<{ id: number; [key: string]: unknown }>,
  contentType: 'news' | 'event' | 'product' | 'gallery' | 'office'
) {
  if (!contentItems || contentItems.length === 0) return contentItems;
  
  try {
    const contentIds = contentItems.map(item => item.id);
    
    const origins = await executeQuery(
      `SELECT 
        co.content_id,
        co.district_id,
        co.state_id,
        co.added_at,
        m.name as added_by_name
      FROM content_origin co
      JOIN district_admins da ON co.added_by_admin_id = da.id
      JOIN members m ON da.member_id = m.id
      WHERE co.content_type = ? AND co.content_id IN (?)`,
      [contentType, contentIds]
    ) as Array<{ content_id: number; district_id: string; state_id: string; added_by_name: string; added_at: string }>;
    
    // Create a map for quick lookup
    const originsMap = origins.reduce((map: { [key: string]: { content_id: number; district_id: string; state_id: string; added_by_name: string; added_at: string } }, origin: { content_id: number; district_id: string; state_id: string; added_by_name: string; added_at: string }) => {
      map[origin.content_id] = origin;
      return map;
    }, {} as { [key: string]: { content_id: number; district_id: string; state_id: string; added_by_name: string; added_at: string } });
    
    // Add district info to content items
    return contentItems.map((item: { id: number; [key: string]: unknown }) => ({
      ...item,
      district_id: originsMap[item.id]?.district_id || null,
      state_id: originsMap[item.id]?.state_id || null,
      added_by_name: originsMap[item.id]?.added_by_name || null,
      added_at: originsMap[item.id]?.added_at || null
    }));
  } catch (error) {
    console.error(`Error enriching content with district info: ${error}`);
    return contentItems;
  }
}
