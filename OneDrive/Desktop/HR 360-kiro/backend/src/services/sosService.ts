/**
 * SOS Service
 * Manages SOS escalations and emergency contacts
 */

import { query } from '../config/database';
import { logger } from './monitoringService';
import { v4 as uuidv4 } from 'uuid';

export interface SOSEscalation {
  id: string;
  userId: string;
  organizationId: string;
  status: 'pending' | 'acknowledged' | 'resolved' | 'cancelled';
  latitude?: number;
  longitude?: number;
  message?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EscalationContact {
  id: string;
  organizationId: string;
  name: string;
  phone: string;
  email?: string;
  role: string;
  priority: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSOSInput {
  userId: string;
  organizationId: string;
  latitude?: number;
  longitude?: number;
  message?: string;
}

export interface CreateContactInput {
  organizationId: string;
  name: string;
  phone: string;
  email?: string;
  role: string;
  priority: number;
}

export interface UpdateContactInput {
  name?: string;
  phone?: string;
  email?: string;
  role?: string;
  priority?: number;
  isActive?: boolean;
}

class SOSService {
  /**
   * Get SOS escalations for organization
   */
  async getSOSEscalations(
    organizationId: string,
    options: {
      page?: number;
      pageSize?: number;
      status?: string;
    } = {}
  ): Promise<{ escalations: SOSEscalation[]; total: number }> {
    try {
      const { page = 1, pageSize = 20, status } = options;
      const offset = (page - 1) * pageSize;

      let whereClause = 'WHERE organization_id = $1';
      const params: any[] = [organizationId];
      let paramIndex = 2;

      if (status) {
        whereClause += ` AND status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      // Get total count
      const countResult = await query(
        `SELECT COUNT(*) as count FROM sos_escalations ${whereClause}`,
        params
      );
      const total = parseInt(countResult.rows[0].count, 10);

      // Get escalations
      const result = await query(
        `
        SELECT * FROM sos_escalations
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `,
        [...params, pageSize, offset]
      );

      const escalations = result.rows.map(this.mapSOSRow);

      logger.info('SOS escalations retrieved', { organizationId, count: escalations.length });

      return { escalations, total };
    } catch (error) {
      logger.error('Failed to get SOS escalations', { error, organizationId });
      throw error;
    }
  }

  /**
   * Get SOS escalation by ID
   */
  async getSOSById(sosId: string): Promise<SOSEscalation | null> {
    try {
      const result = await query(
        `SELECT * FROM sos_escalations WHERE id = $1`,
        [sosId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapSOSRow(result.rows[0]);
    } catch (error) {
      logger.error('Failed to get SOS escalation', { error, sosId });
      throw error;
    }
  }

  /**
   * Create SOS escalation
   */
  async createSOS(input: CreateSOSInput): Promise<SOSEscalation> {
    try {
      const id = uuidv4();
      const now = new Date();

      const result = await query(
        `
        INSERT INTO sos_escalations (
          id, user_id, organization_id, status, latitude, longitude,
          message, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
        `,
        [
          id,
          input.userId,
          input.organizationId,
          'pending',
          input.latitude || null,
          input.longitude || null,
          input.message || null,
          now,
          now,
        ]
      );

      logger.info('SOS escalation created', { sosId: id, userId: input.userId });

      return this.mapSOSRow(result.rows[0]);
    } catch (error) {
      logger.error('Failed to create SOS escalation', { error, input });
      throw error;
    }
  }

  /**
   * Update SOS escalation status
   */
  async updateSOSStatus(sosId: string, status: 'pending' | 'acknowledged' | 'resolved' | 'cancelled'): Promise<SOSEscalation | null> {
    try {
      const result = await query(
        `
        UPDATE sos_escalations
        SET status = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
        `,
        [status, sosId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      logger.info('SOS escalation status updated', { sosId, status });

      return this.mapSOSRow(result.rows[0]);
    } catch (error) {
      logger.error('Failed to update SOS escalation', { error, sosId });
      throw error;
    }
  }

  /**
   * Get escalation contacts for organization
   */
  async getEscalationContacts(
    organizationId: string,
    options: { page?: number; pageSize?: number } = {}
  ): Promise<{ contacts: EscalationContact[]; total: number }> {
    try {
      const { page = 1, pageSize = 20 } = options;
      const offset = (page - 1) * pageSize;

      // Get total count
      const countResult = await query(
        `SELECT COUNT(*) as count FROM escalation_contacts WHERE organization_id = $1 AND is_active = true`,
        [organizationId]
      );
      const total = parseInt(countResult.rows[0].count, 10);

      // Get contacts
      const result = await query(
        `
        SELECT * FROM escalation_contacts
        WHERE organization_id = $1 AND is_active = true
        ORDER BY priority ASC, created_at ASC
        LIMIT $2 OFFSET $3
        `,
        [organizationId, pageSize, offset]
      );

      const contacts = result.rows.map(this.mapContactRow);

      logger.info('Escalation contacts retrieved', { organizationId, count: contacts.length });

      return { contacts, total };
    } catch (error) {
      logger.error('Failed to get escalation contacts', { error, organizationId });
      throw error;
    }
  }

  /**
   * Get escalation contact by ID
   */
  async getContactById(contactId: string): Promise<EscalationContact | null> {
    try {
      const result = await query(
        `SELECT * FROM escalation_contacts WHERE id = $1`,
        [contactId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapContactRow(result.rows[0]);
    } catch (error) {
      logger.error('Failed to get escalation contact', { error, contactId });
      throw error;
    }
  }

  /**
   * Create escalation contact
   */
  async createContact(input: CreateContactInput): Promise<EscalationContact> {
    try {
      const id = uuidv4();
      const now = new Date();

      const result = await query(
        `
        INSERT INTO escalation_contacts (
          id, organization_id, name, phone, email, role, priority,
          is_active, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
        `,
        [
          id,
          input.organizationId,
          input.name,
          input.phone,
          input.email || null,
          input.role,
          input.priority,
          true,
          now,
          now,
        ]
      );

      logger.info('Escalation contact created', { contactId: id, organizationId: input.organizationId });

      return this.mapContactRow(result.rows[0]);
    } catch (error) {
      logger.error('Failed to create escalation contact', { error, input });
      throw error;
    }
  }

  /**
   * Update escalation contact
   */
  async updateContact(contactId: string, input: UpdateContactInput): Promise<EscalationContact | null> {
    try {
      const updates: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (input.name !== undefined) {
        updates.push(`name = $${paramIndex}`);
        params.push(input.name);
        paramIndex++;
      }

      if (input.phone !== undefined) {
        updates.push(`phone = $${paramIndex}`);
        params.push(input.phone);
        paramIndex++;
      }

      if (input.email !== undefined) {
        updates.push(`email = $${paramIndex}`);
        params.push(input.email);
        paramIndex++;
      }

      if (input.role !== undefined) {
        updates.push(`role = $${paramIndex}`);
        params.push(input.role);
        paramIndex++;
      }

      if (input.priority !== undefined) {
        updates.push(`priority = $${paramIndex}`);
        params.push(input.priority);
        paramIndex++;
      }

      if (input.isActive !== undefined) {
        updates.push(`is_active = $${paramIndex}`);
        params.push(input.isActive);
        paramIndex++;
      }

      if (updates.length === 0) {
        return this.getContactById(contactId);
      }

      updates.push(`updated_at = $${paramIndex}`);
      params.push(new Date());
      paramIndex++;

      params.push(contactId);

      const result = await query(
        `
        UPDATE escalation_contacts
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
        `,
        params
      );

      if (result.rows.length === 0) {
        return null;
      }

      logger.info('Escalation contact updated', { contactId });

      return this.mapContactRow(result.rows[0]);
    } catch (error) {
      logger.error('Failed to update escalation contact', { error, contactId });
      throw error;
    }
  }

  /**
   * Delete escalation contact
   */
  async deleteContact(contactId: string): Promise<void> {
    try {
      await query(
        `UPDATE escalation_contacts SET is_active = false, updated_at = NOW() WHERE id = $1`,
        [contactId]
      );

      logger.info('Escalation contact deleted', { contactId });
    } catch (error) {
      logger.error('Failed to delete escalation contact', { error, contactId });
      throw error;
    }
  }

  /**
   * Map database row to SOS object
   */
  private mapSOSRow(row: any): SOSEscalation {
    return {
      id: row.id,
      userId: row.user_id,
      organizationId: row.organization_id,
      status: row.status,
      latitude: row.latitude,
      longitude: row.longitude,
      message: row.message,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Map database row to contact object
   */
  private mapContactRow(row: any): EscalationContact {
    return {
      id: row.id,
      organizationId: row.organization_id,
      name: row.name,
      phone: row.phone,
      email: row.email,
      role: row.role,
      priority: row.priority,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const sosService = new SOSService();
