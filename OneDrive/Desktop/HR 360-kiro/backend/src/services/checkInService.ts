/**
 * Check-in Service
 * Manages employee check-ins during emergencies
 */

import { query } from '../config/database';
import { logger } from './monitoringService';
import { v4 as uuidv4 } from 'uuid';

export interface CheckIn {
  id: string;
  userId: string;
  organizationId: string;
  status: 'safe' | 'injured' | 'missing' | 'unknown';
  latitude?: number;
  longitude?: number;
  notes?: string;
  incidentId?: string;
  isDrill: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCheckInInput {
  userId: string;
  organizationId: string;
  teamId?: string;
  status: 'safe' | 'injured' | 'missing' | 'unknown';
  latitude?: number;
  longitude?: number;
  notes?: string;
  incidentId?: string;
  isDrill?: boolean;
}

export interface UpdateCheckInInput {
  status?: 'safe' | 'injured' | 'missing' | 'unknown';
  latitude?: number;
  longitude?: number;
  notes?: string;
}

class CheckInService {
  /**
   * Get check-ins for organization
   */
  async getCheckIns(
    organizationId: string,
    options: {
      page?: number;
      pageSize?: number;
      status?: string;
      incidentId?: string;
      isDrill?: boolean;
    } = {}
  ): Promise<{ checkIns: CheckIn[]; total: number }> {
    try {
      const { page = 1, pageSize = 20, status, incidentId, isDrill } = options;
      const offset = (page - 1) * pageSize;

      let whereClause = 'WHERE organization_id = $1';
      const params: any[] = [organizationId];
      let paramIndex = 2;

      if (status) {
        whereClause += ` AND status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      if (incidentId) {
        whereClause += ` AND incident_id = $${paramIndex}`;
        params.push(incidentId);
        paramIndex++;
      }

      if (isDrill !== undefined) {
        whereClause += ` AND is_drill = $${paramIndex}`;
        params.push(isDrill);
        paramIndex++;
      }

      // Get total count
      const countResult = await query(
        `SELECT COUNT(*) as count FROM check_ins ${whereClause}`,
        params
      );
      const total = parseInt(countResult.rows[0].count, 10);

      // Get check-ins
      const result = await query(
        `
        SELECT * FROM check_ins
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `,
        [...params, pageSize, offset]
      );

      const checkIns = result.rows.map(this.mapCheckInRow);

      logger.info('Check-ins retrieved', { organizationId, count: checkIns.length });

      return { checkIns, total };
    } catch (error) {
      logger.error('Failed to get check-ins', { error, organizationId });
      throw error;
    }
  }

  /**
   * Get check-in by ID
   */
  async getCheckInById(checkInId: string): Promise<CheckIn | null> {
    try {
      const result = await query(
        `SELECT * FROM check_ins WHERE id = $1`,
        [checkInId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapCheckInRow(result.rows[0]);
    } catch (error) {
      logger.error('Failed to get check-in', { error, checkInId });
      throw error;
    }
  }

  /**
   * Create check-in
   */
  async createCheckIn(input: CreateCheckInInput): Promise<CheckIn> {
    try {
      const id = uuidv4();
      const now = new Date();

      const result = await query(
        `
        INSERT INTO check_ins (
          id, user_id, team_id, organization_id, status, latitude, longitude,
          notes, incident_id, is_drill, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
        `,
        [
          id,
          input.userId,
          input.teamId || null,
          input.organizationId,
          input.status,
          input.latitude || null,
          input.longitude || null,
          input.notes || null,
          input.incidentId || null,
          input.isDrill ?? false,
          now,
          now,
        ]
      );

      logger.info('Check-in created', { checkInId: id, userId: input.userId, teamId: input.teamId });

      return this.mapCheckInRow(result.rows[0]);
    } catch (error) {
      logger.error('Failed to create check-in', { error, input });
      throw error;
    }
  }

  /**
   * Update check-in
   */
  async updateCheckIn(checkInId: string, input: UpdateCheckInInput): Promise<CheckIn | null> {
    try {
      const updates: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (input.status !== undefined) {
        updates.push(`status = $${paramIndex}`);
        params.push(input.status);
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

      if (input.notes !== undefined) {
        updates.push(`notes = $${paramIndex}`);
        params.push(input.notes);
        paramIndex++;
      }

      if (updates.length === 0) {
        return this.getCheckInById(checkInId);
      }

      updates.push(`updated_at = $${paramIndex}`);
      params.push(new Date());
      paramIndex++;

      params.push(checkInId);

      const result = await query(
        `
        UPDATE check_ins
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
        `,
        params
      );

      if (result.rows.length === 0) {
        return null;
      }

      logger.info('Check-in updated', { checkInId });

      return this.mapCheckInRow(result.rows[0]);
    } catch (error) {
      logger.error('Failed to update check-in', { error, checkInId });
      throw error;
    }
  }

  /**
   * Delete check-in
   */
  async deleteCheckIn(checkInId: string): Promise<void> {
    try {
      await query(
        `DELETE FROM check_ins WHERE id = $1`,
        [checkInId]
      );

      logger.info('Check-in deleted', { checkInId });
    } catch (error) {
      logger.error('Failed to delete check-in', { error, checkInId });
      throw error;
    }
  }

  /**
   * Get check-ins by user
   */
  async getCheckInsByUser(
    userId: string,
    options: { page?: number; pageSize?: number } = {}
  ): Promise<{ checkIns: CheckIn[]; total: number }> {
    try {
      const { page = 1, pageSize = 20 } = options;
      const offset = (page - 1) * pageSize;

      // Get total count
      const countResult = await query(
        `SELECT COUNT(*) as count FROM check_ins WHERE user_id = $1`,
        [userId]
      );
      const total = parseInt(countResult.rows[0].count, 10);

      // Get check-ins
      const result = await query(
        `
        SELECT * FROM check_ins
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
        `,
        [userId, pageSize, offset]
      );

      const checkIns = result.rows.map(this.mapCheckInRow);

      logger.info('User check-ins retrieved', { userId, count: checkIns.length });

      return { checkIns, total };
    } catch (error) {
      logger.error('Failed to get user check-ins', { error, userId });
      throw error;
    }
  }

  /**
   * Get check-ins by incident
   */
  async getCheckInsByIncident(
    incidentId: string,
    options: { page?: number; pageSize?: number } = {}
  ): Promise<{ checkIns: CheckIn[]; total: number }> {
    try {
      const { page = 1, pageSize = 20 } = options;
      const offset = (page - 1) * pageSize;

      // Get total count
      const countResult = await query(
        `SELECT COUNT(*) as count FROM check_ins WHERE incident_id = $1`,
        [incidentId]
      );
      const total = parseInt(countResult.rows[0].count, 10);

      // Get check-ins
      const result = await query(
        `
        SELECT * FROM check_ins
        WHERE incident_id = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
        `,
        [incidentId, pageSize, offset]
      );

      const checkIns = result.rows.map(this.mapCheckInRow);

      logger.info('Incident check-ins retrieved', { incidentId, count: checkIns.length });

      return { checkIns, total };
    } catch (error) {
      logger.error('Failed to get incident check-ins', { error, incidentId });
      throw error;
    }
  }

  /**
   * Get check-in statistics
   */
  async getCheckInStats(organizationId: string, incidentId?: string): Promise<any> {
    try {
      let whereClause = 'WHERE organization_id = $1';
      const params: any[] = [organizationId];

      if (incidentId) {
        whereClause += ` AND incident_id = $2`;
        params.push(incidentId);
      }

      const result = await query(
        `
        SELECT
          status,
          COUNT(*) as count
        FROM check_ins
        ${whereClause}
        GROUP BY status
        `,
        params
      );

      const stats = {
        safe: 0,
        injured: 0,
        missing: 0,
        unknown: 0,
        total: 0,
      };

      result.rows.forEach((row: any) => {
        stats[row.status as keyof typeof stats] = parseInt(row.count, 10);
        stats.total += parseInt(row.count, 10);
      });

      logger.info('Check-in stats retrieved', { organizationId, stats });

      return stats;
    } catch (error) {
      logger.error('Failed to get check-in stats', { error, organizationId });
      throw error;
    }
  }

  /**
   * Map database row to check-in object
   */
  private mapCheckInRow(row: any): CheckIn {
    return {
      id: row.id,
      userId: row.user_id,
      organizationId: row.organization_id,
      status: row.status,
      latitude: row.latitude,
      longitude: row.longitude,
      notes: row.notes,
      incidentId: row.incident_id,
      isDrill: row.is_drill,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const checkInService = new CheckInService();
