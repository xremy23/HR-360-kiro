/**
 * Incident Service
 * Manages emergency incidents
 */

import { query } from '../config/database';
import { logger } from './monitoringService';
import { v4 as uuidv4 } from 'uuid';

export interface Incident {
  id: string;
  organizationId: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  severity: 'low' | 'medium' | 'high' | 'critical';
  latitude?: number;
  longitude?: number;
  createdBy: string;
  isDrill: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IncidentUpdate {
  id: string;
  incidentId: string;
  message: string;
  createdBy: string;
  createdAt: Date;
}

export interface CreateIncidentInput {
  organizationId: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  latitude?: number;
  longitude?: number;
  createdBy: string;
  isDrill?: boolean;
}

export interface UpdateIncidentInput {
  title?: string;
  description?: string;
  status?: 'open' | 'in_progress' | 'resolved' | 'closed';
  severity?: 'low' | 'medium' | 'high' | 'critical';
  latitude?: number;
  longitude?: number;
}

class IncidentService {
  /**
   * Get incidents for organization
   */
  async getIncidents(
    organizationId: string,
    options: {
      page?: number;
      pageSize?: number;
      status?: string;
      severity?: string;
      isDrill?: boolean;
    } = {}
  ): Promise<{ incidents: Incident[]; total: number }> {
    try {
      const { page = 1, pageSize = 20, status, severity, isDrill } = options;
      const offset = (page - 1) * pageSize;

      let whereClause = 'WHERE organization_id = $1';
      const params: any[] = [organizationId];
      let paramIndex = 2;

      if (status) {
        whereClause += ` AND status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      if (severity) {
        whereClause += ` AND severity = $${paramIndex}`;
        params.push(severity);
        paramIndex++;
      }

      if (isDrill !== undefined) {
        whereClause += ` AND is_drill = $${paramIndex}`;
        params.push(isDrill);
        paramIndex++;
      }

      // Get total count
      const countResult = await query(
        `SELECT COUNT(*) as count FROM incidents ${whereClause}`,
        params
      );
      const total = parseInt(countResult.rows[0].count, 10);

      // Get incidents
      const result = await query(
        `
        SELECT * FROM incidents
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `,
        [...params, pageSize, offset]
      );

      const incidents = result.rows.map(this.mapIncidentRow);

      logger.info('Incidents retrieved', { organizationId, count: incidents.length });

      return { incidents, total };
    } catch (error) {
      logger.error('Failed to get incidents', { error, organizationId });
      throw error;
    }
  }

  /**
   * Get incident by ID
   */
  async getIncidentById(incidentId: string): Promise<Incident | null> {
    try {
      const result = await query(
        `SELECT * FROM incidents WHERE id = $1`,
        [incidentId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapIncidentRow(result.rows[0]);
    } catch (error) {
      logger.error('Failed to get incident', { error, incidentId });
      throw error;
    }
  }

  /**
   * Create incident
   */
  async createIncident(input: CreateIncidentInput): Promise<Incident> {
    try {
      const id = uuidv4();
      const now = new Date();

      const result = await query(
        `
        INSERT INTO incidents (
          id, organization_id, title, description, status, severity,
          latitude, longitude, created_by, is_drill, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
        `,
        [
          id,
          input.organizationId,
          input.title,
          input.description,
          'open',
          input.severity,
          input.latitude || null,
          input.longitude || null,
          input.createdBy,
          input.isDrill ?? false,
          now,
          now,
        ]
      );

      logger.info('Incident created', { incidentId: id, organizationId: input.organizationId });

      return this.mapIncidentRow(result.rows[0]);
    } catch (error) {
      logger.error('Failed to create incident', { error, input });
      throw error;
    }
  }

  /**
   * Update incident
   */
  async updateIncident(incidentId: string, input: UpdateIncidentInput): Promise<Incident | null> {
    try {
      const updates: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (input.title !== undefined) {
        updates.push(`title = $${paramIndex}`);
        params.push(input.title);
        paramIndex++;
      }

      if (input.description !== undefined) {
        updates.push(`description = $${paramIndex}`);
        params.push(input.description);
        paramIndex++;
      }

      if (input.status !== undefined) {
        updates.push(`status = $${paramIndex}`);
        params.push(input.status);
        paramIndex++;
      }

      if (input.severity !== undefined) {
        updates.push(`severity = $${paramIndex}`);
        params.push(input.severity);
        paramIndex++;
      }

      if (input.latitude !== undefined) {
        updates.push(`latitude = $${paramIndex}`);
        params.push(input.latitude);
        paramIndex++;
      }

      if (input.longitude !== undefined) {
        updates.push(`longitude = $${paramIndex}`);
        params.push(input.longitude);
        paramIndex++;
      }

      if (updates.length === 0) {
        return this.getIncidentById(incidentId);
      }

      updates.push(`updated_at = $${paramIndex}`);
      params.push(new Date());
      paramIndex++;

      params.push(incidentId);

      const result = await query(
        `
        UPDATE incidents
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
        `,
        params
      );

      if (result.rows.length === 0) {
        return null;
      }

      logger.info('Incident updated', { incidentId });

      return this.mapIncidentRow(result.rows[0]);
    } catch (error) {
      logger.error('Failed to update incident', { error, incidentId });
      throw error;
    }
  }

  /**
   * Delete incident
   */
  async deleteIncident(incidentId: string): Promise<void> {
    try {
      await query(
        `DELETE FROM incidents WHERE id = $1`,
        [incidentId]
      );

      logger.info('Incident deleted', { incidentId });
    } catch (error) {
      logger.error('Failed to delete incident', { error, incidentId });
      throw error;
    }
  }

  /**
   * Add incident update
   */
  async addIncidentUpdate(incidentId: string, message: string, createdBy: string): Promise<IncidentUpdate> {
    try {
      const id = uuidv4();
      const now = new Date();

      const result = await query(
        `
        INSERT INTO incident_updates (id, incident_id, message, created_by, created_at)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
        `,
        [id, incidentId, message, createdBy, now]
      );

      logger.info('Incident update added', { incidentId, updateId: id });

      const row = result.rows[0];
      return {
        id: row.id,
        incidentId: row.incident_id,
        message: row.message,
        createdBy: row.created_by,
        createdAt: row.created_at,
      };
    } catch (error) {
      logger.error('Failed to add incident update', { error, incidentId });
      throw error;
    }
  }

  /**
   * Get incident updates
   */
  async getIncidentUpdates(
    incidentId: string,
    options: { page?: number; pageSize?: number } = {}
  ): Promise<{ updates: IncidentUpdate[]; total: number }> {
    try {
      const { page = 1, pageSize = 20 } = options;
      const offset = (page - 1) * pageSize;

      // Get total count
      const countResult = await query(
        `SELECT COUNT(*) as count FROM incident_updates WHERE incident_id = $1`,
        [incidentId]
      );
      const total = parseInt(countResult.rows[0].count, 10);

      // Get updates
      const result = await query(
        `
        SELECT * FROM incident_updates
        WHERE incident_id = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
        `,
        [incidentId, pageSize, offset]
      );

      const updates = result.rows.map((row: any) => ({
        id: row.id,
        incidentId: row.incident_id,
        message: row.message,
        createdBy: row.created_by,
        createdAt: row.created_at,
      }));

      logger.info('Incident updates retrieved', { incidentId, count: updates.length });

      return { updates, total };
    } catch (error) {
      logger.error('Failed to get incident updates', { error, incidentId });
      throw error;
    }
  }

  /**
   * Map database row to incident object
   */
  private mapIncidentRow(row: any): Incident {
    return {
      id: row.id,
      organizationId: row.organization_id,
      title: row.title,
      description: row.description,
      status: row.status,
      severity: row.severity,
      latitude: row.latitude,
      longitude: row.longitude,
      createdBy: row.created_by,
      isDrill: row.is_drill,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const incidentService = new IncidentService();
