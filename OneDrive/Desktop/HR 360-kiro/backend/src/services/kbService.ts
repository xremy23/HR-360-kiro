/**
 * Knowledge Base Service
 * Manages KB guides, categories, and acknowledgments
 */

import { query } from '../config/database';
import { logger } from './monitoringService';
import { v4 as uuidv4 } from 'uuid';

export interface KBGuide {
  id: string;
  organizationId: string;
  title: string;
  content: string;
  category: string;
  isPublished: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface KBCategory {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  icon?: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface GuideAcknowledgment {
  id: string;
  userId: string;
  guideId: string;
  acknowledgedAt: Date;
}

export interface CreateGuideInput {
  organizationId: string;
  categoryId?: string;
  title: string;
  content: string;
  isPublished?: boolean;
}

export interface UpdateGuideInput {
  title?: string;
  content?: string;
  isPublished?: boolean;
  isArchived?: boolean;
}

export interface CreateCategoryInput {
  organizationId: string;
  name: string;
  description?: string;
  icon?: string;
  order?: number;
}

export interface UpdateCategoryInput {
  name?: string;
  description?: string;
  icon?: string;
  order?: number;
  isActive?: boolean;
}

class KBService {
  /**
   * Get all guides for organization
   */
  async getGuides(
    organizationId: string,
    options: {
      page?: number;
      pageSize?: number;
      search?: string;
      category?: string;
      isPublished?: boolean;
    } = {}
  ): Promise<{ guides: KBGuide[]; total: number }> {
    try {
      const { page = 1, pageSize = 20, search, category, isPublished = true } = options;
      const offset = (page - 1) * pageSize;

      let whereClause = 'WHERE kb_guides.organization_id = $1 AND kb_guides.is_archived = false';
      const params: any[] = [organizationId];
      let paramIndex = 2;

      if (isPublished !== undefined) {
        whereClause += ` AND kb_guides.is_published = $${paramIndex}`;
        params.push(isPublished);
        paramIndex++;
      }

      if (category) {
        whereClause += ` AND kb_guides.category = $${paramIndex}`;
        params.push(category);
        paramIndex++;
      }

      if (search) {
        whereClause += ` AND (kb_guides.title ILIKE $${paramIndex} OR kb_guides.content ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
      }

      // Get total count
      const countResult = await query(
        `SELECT COUNT(*) as count FROM kb_guides ${whereClause}`,
        params
      );
      const total = parseInt(countResult.rows[0].count, 10);

      // Get guides
      const result = await query(
        `
        SELECT 
          kb_guides.id,
          kb_guides.organization_id as organizationId,
          kb_guides.title,
          kb_guides.content,
          kb_guides.category,
          kb_guides.is_published as isPublished,
          kb_guides.version,
          kb_guides.created_at as createdAt,
          kb_guides.updated_at as updatedAt
        FROM kb_guides
        ${whereClause}
        ORDER BY kb_guides.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `,
        [...params, pageSize, offset]
      );

      const guides = result.rows.map(this.mapGuideRow);
      return { guides, total };
    } catch (error) {
      logger.error('Failed to get guides', { organizationId, error });
      throw error;
    }
  }

  /**
   * Get guide by ID
   */
  async getGuideById(guideId: string): Promise<KBGuide | null> {
    try {
      const result = await query(
        `
        SELECT 
          id,
          organization_id as organizationId,
          title,
          content,
          category,
          is_published as isPublished,
          version,
          created_at as createdAt,
          updated_at as updatedAt
        FROM kb_guides
        WHERE kb_guides.id = $1
        `,
        [guideId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapGuideRow(result.rows[0]);
    } catch (error) {
      logger.error('Failed to get guide', { error, guideId });
      throw error;
    }
  }

  /**
   * Create guide
   */
  async createGuide(input: CreateGuideInput): Promise<KBGuide> {
    try {
      const id = uuidv4();
      const now = new Date();

      const result = await query(
        `
        INSERT INTO kb_guides (
          id, organization_id, category, title, content, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, organization_id as "organizationId", category, title, content, created_at as "createdAt", updated_at as "updatedAt", version, is_published as "isPublished"
        `,
        [
          id,
          input.organizationId,
          input.categoryId || 'general',
          input.title,
          input.content,
          now,
          now,
        ]
      );

      logger.info('Guide created', { guideId: id, organizationId: input.organizationId });

      return this.mapGuideRow(result.rows[0]);
    } catch (error) {
      logger.error('Failed to create guide', { error, input });
      throw error;
    }
  }

  /**
   * Update guide
   */
  async updateGuide(guideId: string, input: UpdateGuideInput): Promise<KBGuide | null> {
    try {
      const updates: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (input.title !== undefined) {
        updates.push(`title = $${paramIndex}`);
        params.push(input.title);
        paramIndex++;
      }

      if (input.content !== undefined) {
        updates.push(`content = $${paramIndex}`);
        params.push(input.content);
        paramIndex++;
      }

      if (input.isPublished !== undefined) {
        updates.push(`is_published = $${paramIndex}`);
        params.push(input.isPublished);
        paramIndex++;
      }

      if (input.isArchived !== undefined) {
        updates.push(`is_archived = $${paramIndex}`);
        params.push(input.isArchived);
        paramIndex++;
      }

      if (updates.length === 0) {
        return this.getGuideById(guideId);
      }

      updates.push(`updated_at = $${paramIndex}`);
      params.push(new Date());
      paramIndex++;

      params.push(guideId);

      const result = await query(
        `
        UPDATE kb_guides
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
        `,
        params
      );

      if (result.rows.length === 0) {
        return null;
      }

      logger.info('Guide updated', { guideId });

      return this.mapGuideRow(result.rows[0]);
    } catch (error) {
      logger.error('Failed to update guide', { error, guideId });
      throw error;
    }
  }

  /**
   * Delete guide
   */
  async deleteGuide(guideId: string): Promise<void> {
    try {
      await query(
        `UPDATE kb_guides SET is_archived = true, updated_at = NOW() WHERE id = $1`,
        [guideId]
      );

      logger.info('Guide deleted', { guideId });
    } catch (error) {
      logger.error('Failed to delete guide', { error, guideId });
      throw error;
    }
  }

  /**
   * Get categories for organization
   */
  async getCategories(organizationId: string): Promise<KBCategory[]> {
    try {
      const result = await query(
        `
        SELECT * FROM kb_categories
        WHERE organization_id = $1 AND is_active = true
        ORDER BY "order" ASC
        `,
        [organizationId]
      );

      return result.rows.map(this.mapCategoryRow);
    } catch (error) {
      logger.error('Failed to get categories', { error, organizationId });
      throw error;
    }
  }

  /**
   * Create category
   */
  async createCategory(input: CreateCategoryInput): Promise<KBCategory> {
    try {
      const id = uuidv4();
      const now = new Date();

      const result = await query(
        `
        INSERT INTO kb_categories (
          id, organization_id, name, description, icon, "order", is_active, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
        `,
        [
          id,
          input.organizationId,
          input.name,
          input.description || null,
          input.icon || null,
          input.order || 0,
          true,
          now,
          now,
        ]
      );

      logger.info('Category created', { categoryId: id, organizationId: input.organizationId });

      return this.mapCategoryRow(result.rows[0]);
    } catch (error) {
      logger.error('Failed to create category', { error, input });
      throw error;
    }
  }

  /**
   * Acknowledge guide
   */
  async acknowledgeGuide(userId: string, guideId: string): Promise<GuideAcknowledgment> {
    try {
      const id = uuidv4();
      const now = new Date();

      // Check if already acknowledged
      const existing = await query(
        `SELECT * FROM guide_acknowledgments WHERE user_id = $1 AND guide_id = $2`,
        [userId, guideId]
      );

      if (existing.rows.length > 0) {
        return {
          id: existing.rows[0].id,
          userId: existing.rows[0].user_id,
          guideId: existing.rows[0].guide_id,
          acknowledgedAt: existing.rows[0].acknowledged_at,
        };
      }

      const result = await query(
        `
        INSERT INTO guide_acknowledgments (id, user_id, guide_id, acknowledged_at)
        VALUES ($1, $2, $3, $4)
        RETURNING *
        `,
        [id, userId, guideId, now]
      );

      logger.info('Guide acknowledged', { userId, guideId });

      return {
        id: result.rows[0].id,
        userId: result.rows[0].user_id,
        guideId: result.rows[0].guide_id,
        acknowledgedAt: result.rows[0].acknowledged_at,
      };
    } catch (error) {
      logger.error('Failed to acknowledge guide', { error, userId, guideId });
      throw error;
    }
  }

  /**
   * Get user acknowledgments
   */
  async getUserAcknowledgments(userId: string): Promise<GuideAcknowledgment[]> {
    try {
      const result = await query(
        `SELECT * FROM guide_acknowledgments WHERE user_id = $1 ORDER BY acknowledged_at DESC`,
        [userId]
      );

      return result.rows.map((row) => ({
        id: row.id,
        userId: row.user_id,
        guideId: row.guide_id,
        acknowledgedAt: row.acknowledged_at,
      }));
    } catch (error) {
      logger.error('Failed to get user acknowledgments', { error, userId });
      throw error;
    }
  }

  /**
   * Map database row to guide object
   */
  private mapGuideRow(row: any): KBGuide {
    return {
      id: row.id,
      organizationId: row.organizationId || row.organization_id,
      category: row.category,
      title: row.title,
      content: row.content,
      isPublished: row.isPublished || row.is_published,
      version: row.version,
      createdAt: row.createdAt || row.created_at,
      updatedAt: row.updatedAt || row.updated_at,
    };
  }

  /**
   * Map database row to category object
   */
  private mapCategoryRow(row: any): KBCategory {
    return {
      id: row.id,
      organizationId: row.organization_id,
      name: row.name,
      description: row.description,
      icon: row.icon,
      order: row.order,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const kbService = new KBService();
