import { query } from '../config/database';

export interface CommunityReport {
  id: string;
  orgId: string;
  userId: string;
  title: string;
  description: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  category: 'natural_disaster' | 'hazard' | 'safety_concern' | 'infrastructure' | 'other';
  severity: 'low' | 'medium' | 'high';
  imageUrls?: string[];
  status: 'active' | 'resolved' | 'archived';
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date; // Auto-purge after 7 days
  upvotes: number;
  upvotedBy?: string[]; // User IDs who upvoted
}

export class CommunityReportEntity {
  static async create(
    data: Omit<CommunityReport, 'id' | 'createdAt' | 'updatedAt' | 'expiresAt' | 'upvotes' | 'upvotedBy' | 'status'>
  ): Promise<CommunityReport> {
    // Calculate expiration date (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const result = await query(
      `INSERT INTO community_reports 
       (org_id, user_id, title, description, location, category, severity, image_urls, status, expires_at, upvotes, upvoted_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id, org_id as "orgId", user_id as "userId", title, description, location, category, severity, 
                 image_urls as "imageUrls", status, created_at as "createdAt", updated_at as "updatedAt", 
                 expires_at as "expiresAt", upvotes, upvoted_by as "upvotedBy"`,
      [
        data.orgId,
        data.userId,
        data.title,
        data.description,
        JSON.stringify(data.location || null),
        data.category,
        data.severity,
        JSON.stringify(data.imageUrls || []),
        'active',
        expiresAt,
        0,
        JSON.stringify([]),
      ]
    );

    return result.rows[0];
  }

  static async findById(id: string): Promise<CommunityReport | null> {
    const result = await query(
      `SELECT id, org_id as "orgId", user_id as "userId", title, description, location, category, severity, 
              image_urls as "imageUrls", status, created_at as "createdAt", updated_at as "updatedAt", 
              expires_at as "expiresAt", upvotes, upvoted_by as "upvotedBy"
       FROM community_reports WHERE id = $1 AND status != 'archived'`,
      [id]
    );
    if (!result.rows[0]) return null;

    return {
      ...result.rows[0],
      location: result.rows[0].location ? JSON.parse(result.rows[0].location) : undefined,
      imageUrls: result.rows[0].imageUrls ? JSON.parse(result.rows[0].imageUrls) : [],
      upvotedBy: result.rows[0].upvotedBy ? JSON.parse(result.rows[0].upvotedBy) : [],
    };
  }

  static async findByOrgId(
    orgId: string,
    category?: string,
    severity?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<CommunityReport[]> {
    let sql = `SELECT id, org_id as "orgId", user_id as "userId", title, description, location, category, severity, 
                      image_urls as "imageUrls", status, created_at as "createdAt", updated_at as "updatedAt", 
                      expires_at as "expiresAt", upvotes, upvoted_by as "upvotedBy"
               FROM community_reports WHERE org_id = $1 AND status != 'archived'`;
    const params: any[] = [orgId];
    let paramCount = 2;

    if (category) {
      sql += ` AND category = $${paramCount++}`;
      params.push(category);
    }

    if (severity) {
      sql += ` AND severity = $${paramCount++}`;
      params.push(severity);
    }

    sql += ` ORDER BY upvotes DESC, created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    params.push(limit, offset);

    const result = await query(sql, params);
    return result.rows.map((row: any) => ({
      ...row,
      location: row.location ? JSON.parse(row.location) : undefined,
      imageUrls: row.imageUrls ? JSON.parse(row.imageUrls) : [],
      upvotedBy: row.upvotedBy ? JSON.parse(row.upvotedBy) : [],
    }));
  }

  static async findByUserId(userId: string, limit: number = 50, offset: number = 0): Promise<CommunityReport[]> {
    const result = await query(
      `SELECT id, org_id as "orgId", user_id as "userId", title, description, location, category, severity, 
              image_urls as "imageUrls", status, created_at as "createdAt", updated_at as "updatedAt", 
              expires_at as "expiresAt", upvotes, upvoted_by as "upvotedBy"
       FROM community_reports WHERE user_id = $1 AND status != 'archived'
       ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return result.rows.map((row: any) => ({
      ...row,
      location: row.location ? JSON.parse(row.location) : undefined,
      imageUrls: row.imageUrls ? JSON.parse(row.imageUrls) : [],
      upvotedBy: row.upvotedBy ? JSON.parse(row.upvotedBy) : [],
    }));
  }

  static async update(
    id: string,
    data: Partial<Omit<CommunityReport, 'id' | 'createdAt' | 'expiresAt' | 'userId' | 'orgId'>>
  ): Promise<CommunityReport | null> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramCount = 1;

    if (data.title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      params.push(data.title);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      params.push(data.description);
    }
    if (data.severity !== undefined) {
      updates.push(`severity = $${paramCount++}`);
      params.push(data.severity);
    }
    if (data.category !== undefined) {
      updates.push(`category = $${paramCount++}`);
      params.push(data.category);
    }
    if (data.status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      params.push(data.status);
    }
    if (data.location !== undefined) {
      updates.push(`location = $${paramCount++}`);
      params.push(JSON.stringify(data.location));
    }
    if (data.imageUrls !== undefined) {
      updates.push(`image_urls = $${paramCount++}`);
      params.push(JSON.stringify(data.imageUrls));
    }
    if (data.upvotes !== undefined) {
      updates.push(`upvotes = $${paramCount++}`);
      params.push(data.upvotes);
    }
    if (data.upvotedBy !== undefined) {
      updates.push(`upvoted_by = $${paramCount++}`);
      params.push(JSON.stringify(data.upvotedBy));
    }

    if (updates.length === 0) return this.findById(id);

    updates.push(`updated_at = NOW()`);
    params.push(id);

    const result = await query(
      `UPDATE community_reports SET ${updates.join(', ')} WHERE id = $${paramCount}
       RETURNING id, org_id as "orgId", user_id as "userId", title, description, location, category, severity, 
                 image_urls as "imageUrls", status, created_at as "createdAt", updated_at as "updatedAt", 
                 expires_at as "expiresAt", upvotes, upvoted_by as "upvotedBy"`,
      params
    );

    if (!result.rows[0]) return null;

    return {
      ...result.rows[0],
      location: result.rows[0].location ? JSON.parse(result.rows[0].location) : undefined,
      imageUrls: result.rows[0].imageUrls ? JSON.parse(result.rows[0].imageUrls) : [],
      upvotedBy: result.rows[0].upvotedBy ? JSON.parse(result.rows[0].upvotedBy) : [],
    };
  }

  static async delete(id: string): Promise<boolean> {
    const result = await query(`DELETE FROM community_reports WHERE id = $1`, [id]);
    return result.rowCount ? result.rowCount > 0 : false;
  }

  static async countByOrgId(orgId: string): Promise<number> {
    const result = await query(
      `SELECT COUNT(*) as count FROM community_reports WHERE org_id = $1 AND status != 'archived'`,
      [orgId]
    );
    return parseInt(result.rows[0].count);
  }

  static async purgeExpired(): Promise<number> {
    const result = await query(
      `UPDATE community_reports SET status = 'archived' WHERE expires_at <= NOW() AND status = 'active'`
    );
    return result.rowCount || 0;
  }

  static async upvote(id: string, userId: string): Promise<CommunityReport | null> {
    const report = await this.findById(id);
    if (!report) return null;

    const upvotedBy = report.upvotedBy || [];
    if (!upvotedBy.includes(userId)) {
      upvotedBy.push(userId);
    }

    return this.update(id, {
      upvotes: upvotedBy.length,
      upvotedBy,
    });
  }

  static async removeUpvote(id: string, userId: string): Promise<CommunityReport | null> {
    const report = await this.findById(id);
    if (!report) return null;

    const upvotedBy = (report.upvotedBy || []).filter((uid) => uid !== userId);

    return this.update(id, {
      upvotes: upvotedBy.length,
      upvotedBy,
    });
  }
}
