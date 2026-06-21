import { query } from '../config/database';

export interface KBGuide {
  id: string;
  orgId: string;
  title: string;
  category: 'general' | 'org-specific';
  type: string;
  content: string;
  mediaUrls?: string[];
  isRequired: boolean;
  isArchived: boolean;
  version: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  updatedBy: string;
}

export class KBGuideEntity {
  static async create(data: Omit<KBGuide, 'id' | 'version' | 'createdAt' | 'updatedAt'>): Promise<KBGuide> {
    const result = await query(
      `INSERT INTO kb_guides (org_id, title, category, type, content, media_urls, is_required, created_by, updated_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, org_id as "orgId", title, category, type, content, media_urls as "mediaUrls", is_required as "isRequired",
                 version, created_by as "createdBy", created_at as "createdAt", updated_at as "updatedAt", updated_by as "updatedBy"`,
      [data.orgId, data.title, data.category, data.type, data.content, data.mediaUrls, data.isRequired, data.createdBy, data.updatedBy]
    );
    return result.rows[0];
  }

  static async findById(id: string): Promise<KBGuide | null> {
    const result = await query(
      `SELECT id, org_id as "orgId", title, category, type, content, media_urls as "mediaUrls", is_required as "isRequired",
              version, created_by as "createdBy", created_at as "createdAt", updated_at as "updatedAt", updated_by as "updatedBy"
       FROM kb_guides WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  static async findByOrgId(orgId: string, category?: string, type?: string, limit: number = 50, offset: number = 0): Promise<KBGuide[]> {
    let sql = `SELECT id, org_id as "orgId", title, category, type, content, media_urls as "mediaUrls", is_required as "isRequired", is_archived as "isArchived",
                      version, created_by as "createdBy", created_at as "createdAt", updated_at as "updatedAt", updated_by as "updatedBy"
               FROM kb_guides WHERE org_id = $1 AND is_archived = false`;
    const params: any[] = [orgId];
    let paramCount = 2;

    if (category) {
      sql += ` AND category = $${paramCount++}`;
      params.push(category);
    }
    if (type) {
      sql += ` AND type = $${paramCount++}`;
      params.push(type);
    }

    sql += ` ORDER BY created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    params.push(limit, offset);

    const result = await query(sql, params);
    return result.rows;
  }

  static async countByOrgId(orgId: string, category?: string, type?: string): Promise<number> {
    let sql = `SELECT COUNT(*) as count FROM kb_guides WHERE org_id = $1`;
    const params: any[] = [orgId];
    let paramCount = 2;

    if (category) {
      sql += ` AND category = $${paramCount++}`;
      params.push(category);
    }
    if (type) {
      sql += ` AND type = $${paramCount++}`;
      params.push(type);
    }

    const result = await query(sql, params);
    return parseInt(result.rows[0].count);
  }

  static async update(id: string, data: Partial<KBGuide>, updatedBy: string): Promise<KBGuide | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.title) {
      updates.push(`title = $${paramCount++}`);
      values.push(data.title);
    }
    if (data.content) {
      updates.push(`content = $${paramCount++}`);
      values.push(data.content);
    }
    if (data.isRequired !== undefined) {
      updates.push(`is_required = $${paramCount++}`);
      values.push(data.isRequired);
    }
    if (data.isArchived !== undefined) {
      updates.push(`is_archived = $${paramCount++}`);
      values.push(data.isArchived);
    }

    if (updates.length === 0) return this.findById(id);

    updates.push(`version = version + 1`);
    updates.push(`updated_by = $${paramCount++}`);
    values.push(updatedBy);
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await query(
      `UPDATE kb_guides SET ${updates.join(', ')} WHERE id = $${paramCount}
       RETURNING id, org_id as "orgId", title, category, type, content, media_urls as "mediaUrls", is_required as "isRequired", is_archived as "isArchived",
                 version, created_by as "createdBy", created_at as "createdAt", updated_at as "updatedAt", updated_by as "updatedBy"`,
      values
    );
    return result.rows[0] || null;
  }

  static async delete(id: string): Promise<boolean> {
    const result = await query(`DELETE FROM kb_guides WHERE id = $1`, [id]);
    return result.rowCount! > 0;
  }
}
