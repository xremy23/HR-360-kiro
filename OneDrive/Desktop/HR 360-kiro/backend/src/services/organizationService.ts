/**
 * Organization Service
 * Handles organization-related business logic
 */

import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database';
import { Organization, OrganizationEntity, CreateOrganizationInput, UpdateOrganizationInput } from '../entities/Organization';
import { logger } from './monitoringService';

class OrganizationService {
  /**
   * Create a new organization
   */
  async createOrganization(input: CreateOrganizationInput): Promise<Organization> {
    try {
      const id = uuidv4();
      const now = new Date();

      const result = await query(
        `INSERT INTO organizations (
          id, name, email_domain, logo_url, description, is_active, created_by, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [
          id,
          input.name,
          input.emailDomain || null,
          input.logoUrl || null,
          input.description || null,
          true,
          input.createdBy || null,
          now,
          now,
        ]
      );

      if (result.rows.length === 0) {
        throw new Error('Failed to create organization');
      }

      return this.mapRowToOrganization(result.rows[0]);
    } catch (error) {
      logger.error('Failed to create organization', { name: input.name, error });
      throw error;
    }
  }

  /**
   * Get organization by ID
   */
  async getOrganizationById(id: string): Promise<Organization | null> {
    try {
      const result = await query('SELECT * FROM organizations WHERE id = $1', [id]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToOrganization(result.rows[0]);
    } catch (error) {
      logger.error('Failed to get organization by ID', { id, error });
      throw error;
    }
  }

  /**
   * Get organization by name
   */
  async getOrganizationByName(name: string): Promise<Organization | null> {
    try {
      const result = await query('SELECT * FROM organizations WHERE name = $1', [name]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToOrganization(result.rows[0]);
    } catch (error) {
      logger.error('Failed to get organization by name', { name, error });
      throw error;
    }
  }

  /**
   * Get organization by email domain
   */
  async getOrganizationByEmailDomain(emailDomain: string): Promise<Organization | null> {
    try {
      const result = await query(
        'SELECT * FROM organizations WHERE email_domain = $1 AND is_active = true',
        [emailDomain]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToOrganization(result.rows[0]);
    } catch (error) {
      logger.error('Failed to get organization by email domain', { emailDomain, error });
      throw error;
    }
  }

  /**
   * Update organization
   */
  async updateOrganization(id: string, input: UpdateOrganizationInput): Promise<Organization> {
    try {
      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (input.name !== undefined) {
        updates.push(`name = $${paramCount++}`);
        values.push(input.name);
      }

      if (input.emailDomain !== undefined) {
        updates.push(`email_domain = $${paramCount++}`);
        values.push(input.emailDomain);
      }

      if (input.logoUrl !== undefined) {
        updates.push(`logo_url = $${paramCount++}`);
        values.push(input.logoUrl);
      }

      if (input.description !== undefined) {
        updates.push(`description = $${paramCount++}`);
        values.push(input.description);
      }

      if (input.isActive !== undefined) {
        updates.push(`is_active = $${paramCount++}`);
        values.push(input.isActive);
      }

      if (updates.length === 0) {
        return this.getOrganizationById(id) as Promise<Organization>;
      }

      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(id);

      const result = await query(
        `UPDATE organizations SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        throw new Error('Organization not found');
      }

      return this.mapRowToOrganization(result.rows[0]);
    } catch (error) {
      logger.error('Failed to update organization', { id, error });
      throw error;
    }
  }

  /**
   * Get all active organizations
   */
  async getAllOrganizations(options?: {
    page?: number;
    pageSize?: number;
    search?: string;
  }): Promise<{ organizations: Organization[]; total: number }> {
    try {
      const page = options?.page || 1;
      const pageSize = options?.pageSize || 20;
      const offset = (page - 1) * pageSize;

      let whereClause = 'WHERE is_active = true';
      const params: any[] = [];
      let paramCount = 1;

      if (options?.search) {
        whereClause += ` AND (name ILIKE $${paramCount} OR email_domain ILIKE $${paramCount})`;
        params.push(`%${options.search}%`);
        paramCount++;
      }

      // Get total count
      const countResult = await query(
        `SELECT COUNT(*) as count FROM organizations ${whereClause}`,
        params
      );
      const total = parseInt(countResult.rows[0].count, 10);

      // Get paginated results
      const result = await query(
        `SELECT * FROM organizations ${whereClause} ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
        [...params, pageSize, offset]
      );

      const organizations = result.rows.map(row => this.mapRowToOrganization(row));

      return { organizations, total };
    } catch (error) {
      logger.error('Failed to get all organizations', { error });
      throw error;
    }
  }

  /**
   * Get organization user count
   */
  async getOrganizationUserCount(organizationId: string): Promise<number> {
    try {
      const result = await query(
        'SELECT COUNT(*) as count FROM users WHERE organization_id = $1 AND is_active = true',
        [organizationId]
      );

      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      logger.error('Failed to get organization user count', { organizationId, error });
      throw error;
    }
  }

  /**
   * Get organization team count
   */
  async getOrganizationTeamCount(organizationId: string): Promise<number> {
    try {
      const result = await query(
        'SELECT COUNT(*) as count FROM teams WHERE organization_id = $1 AND is_active = true',
        [organizationId]
      );

      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      logger.error('Failed to get organization team count', { organizationId, error });
      throw error;
    }
  }

  /**
   * Get organization department count
   */
  async getOrganizationDepartmentCount(organizationId: string): Promise<number> {
    try {
      const result = await query(
        'SELECT COUNT(*) as count FROM departments WHERE organization_id = $1 AND is_active = true',
        [organizationId]
      );

      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      logger.error('Failed to get organization department count', { organizationId, error });
      throw error;
    }
  }

  /**
   * Delete organization (soft delete)
   */
  async deleteOrganization(id: string): Promise<void> {
    try {
      await query(
        'UPDATE organizations SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [id]
      );
    } catch (error) {
      logger.error('Failed to delete organization', { id, error });
      throw error;
    }
  }

  /**
   * Check if organization exists
   */
  async organizationExists(name: string): Promise<boolean> {
    try {
      const result = await query(
        'SELECT id FROM organizations WHERE name = $1 LIMIT 1',
        [name]
      );

      return result.rows.length > 0;
    } catch (error) {
      logger.error('Failed to check if organization exists', { name, error });
      throw error;
    }
  }

  /**
   * Map database row to Organization entity
   */
  private mapRowToOrganization(row: any): Organization {
    return new OrganizationEntity({
      id: row.id,
      name: row.name,
      emailDomain: row.email_domain,
      logoUrl: row.logo_url,
      description: row.description,
      isActive: row.is_active,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      createdBy: row.created_by,
    });
  }
}

export const organizationService = new OrganizationService();
