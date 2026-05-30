import { query } from '../config/database';

export interface Organization {
  id: string;
  name: string;
  emailDomain?: string;
  inviteCode?: string;
  logo?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class OrganizationEntity {
  static async create(data: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>): Promise<Organization> {
    const result = await query(
      `INSERT INTO organizations (name, email_domain, invite_code, logo)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email_domain as "emailDomain", invite_code as "inviteCode", logo, created_at as "createdAt", updated_at as "updatedAt"`,
      [data.name, data.emailDomain, data.inviteCode, data.logo]
    );
    return result.rows[0];
  }

  static async findById(id: string): Promise<Organization | null> {
    const result = await query(
      `SELECT id, name, email_domain as "emailDomain", invite_code as "inviteCode", logo, created_at as "createdAt", updated_at as "updatedAt"
       FROM organizations WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  static async findByInviteCode(inviteCode: string): Promise<Organization | null> {
    const result = await query(
      `SELECT id, name, email_domain as "emailDomain", invite_code as "inviteCode", logo, created_at as "createdAt", updated_at as "updatedAt"
       FROM organizations WHERE invite_code = $1`,
      [inviteCode]
    );
    return result.rows[0] || null;
  }

  static async update(id: string, data: Partial<Organization>): Promise<Organization | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.name) {
      updates.push(`name = $${paramCount++}`);
      values.push(data.name);
    }
    if (data.emailDomain) {
      updates.push(`email_domain = $${paramCount++}`);
      values.push(data.emailDomain);
    }
    if (data.logo) {
      updates.push(`logo = $${paramCount++}`);
      values.push(data.logo);
    }

    if (updates.length === 0) return this.findById(id);

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await query(
      `UPDATE organizations SET ${updates.join(', ')} WHERE id = $${paramCount}
       RETURNING id, name, email_domain as "emailDomain", invite_code as "inviteCode", logo, created_at as "createdAt", updated_at as "updatedAt"`,
      values
    );
    return result.rows[0] || null;
  }

  static async findAll(limit: number = 100, offset: number = 0): Promise<Organization[]> {
    const result = await query(
      `SELECT id, name, email_domain as "emailDomain", invite_code as "inviteCode", logo, created_at as "createdAt", updated_at as "updatedAt"
       FROM organizations LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  }
}
