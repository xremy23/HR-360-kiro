/**
 * Organization Entity
 * Represents an organization in the system
 */

import { query } from '../config/database';

export interface Organization {
  id: string;
  name: string;
  emailDomain?: string;
  logoUrl?: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export interface CreateOrganizationInput {
  name: string;
  emailDomain?: string;
  logoUrl?: string;
  description?: string;
  createdBy?: string;
}

export interface UpdateOrganizationInput {
  name?: string;
  emailDomain?: string;
  logoUrl?: string;
  description?: string;
  isActive?: boolean;
}

export class OrganizationEntity implements Organization {
  id: string;
  name: string;
  emailDomain?: string;
  logoUrl?: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;

  constructor(data: Organization) {
    this.id = data.id;
    this.name = data.name;
    this.emailDomain = data.emailDomain;
    this.logoUrl = data.logoUrl;
    this.description = data.description;
    this.isActive = data.isActive;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.createdBy = data.createdBy;
  }

  /**
   * Check if organization is active
   */
  isOrganizationActive(): boolean {
    return this.isActive;
  }

  /**
   * Check if email domain is configured
   */
  hasEmailDomain(): boolean {
    return !!this.emailDomain;
  }

  /**
   * Check if email matches organization domain
   */
  isEmailInDomain(email: string): boolean {
    if (!this.emailDomain) {
      return false;
    }

    const emailDomain = email.split('@')[1];
    return emailDomain === this.emailDomain;
  }

  /**
   * Convert to JSON
   */
  toJSON(): Organization {
    return {
      id: this.id,
      name: this.name,
      emailDomain: this.emailDomain,
      logoUrl: this.logoUrl,
      description: this.description,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      createdBy: this.createdBy,
    };
  }

  /**
   * Static database method: Find organization by ID
   */
  static async findById(id: string): Promise<OrganizationEntity | null> {
    const result = await query(
      `SELECT id, name, email_domain as "emailDomain", logo_url as "logoUrl", description, 
              is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt", created_by as "createdBy"
       FROM organizations WHERE id = $1`,
      [id]
    );
    return result.rows[0] ? new OrganizationEntity(result.rows[0]) : null;
  }

  /**
   * Static database method: Find organization by invite code
   */
  static async findByInviteCode(inviteCode: string): Promise<OrganizationEntity | null> {
    const result = await query(
      `SELECT o.id, o.name, o.email_domain as "emailDomain", o.logo_url as "logoUrl", o.description, 
              o.is_active as "isActive", o.created_at as "createdAt", o.updated_at as "updatedAt", o.created_by as "createdBy"
       FROM organizations o
       LEFT JOIN organization_invites oi ON o.id = oi.organization_id
       WHERE oi.code = $1 AND oi.is_active = true`,
      [inviteCode]
    );
    return result.rows[0] ? new OrganizationEntity(result.rows[0]) : null;
  }

  /**
   * Static database method: Create organization
   */
  static async create(data: CreateOrganizationInput): Promise<OrganizationEntity> {
    const { v4: uuidv4 } = await import('uuid');
    const id = uuidv4();
    const now = new Date();

    const result = await query(
      `INSERT INTO organizations (id, name, email_domain, logo_url, description, is_active, created_at, updated_at, created_by)
       VALUES ($1, $2, $3, $4, $5, true, $6, $7, $8)
       RETURNING id, name, email_domain as "emailDomain", logo_url as "logoUrl", description, 
                 is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt", created_by as "createdBy"`,
      [id, data.name, data.emailDomain || null, data.logoUrl || null, data.description || null, now, now, data.createdBy || null]
    );

    return new OrganizationEntity(result.rows[0]);
  }

  /**
   * Static database method: Update organization
   */
  static async update(id: string, data: UpdateOrganizationInput): Promise<OrganizationEntity | null> {
    const now = new Date();
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(data.name);
    }
    if (data.emailDomain !== undefined) {
      fields.push(`email_domain = $${paramCount++}`);
      values.push(data.emailDomain || null);
    }
    if (data.logoUrl !== undefined) {
      fields.push(`logo_url = $${paramCount++}`);
      values.push(data.logoUrl || null);
    }
    if (data.description !== undefined) {
      fields.push(`description = $${paramCount++}`);
      values.push(data.description || null);
    }
    if (data.isActive !== undefined) {
      fields.push(`is_active = $${paramCount++}`);
      values.push(data.isActive);
    }

    fields.push(`updated_at = $${paramCount++}`);
    values.push(now);
    values.push(id);

    const result = await query(
      `UPDATE organizations SET ${fields.join(', ')} WHERE id = $${paramCount}
       RETURNING id, name, email_domain as "emailDomain", logo_url as "logoUrl", description, 
                 is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt", created_by as "createdBy"`,
      values
    );

    return result.rows[0] ? new OrganizationEntity(result.rows[0]) : null;
  }
}
