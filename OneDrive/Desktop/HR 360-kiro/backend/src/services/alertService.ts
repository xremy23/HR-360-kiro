/**
 * Alert Service
 * Manages emergency alerts and notifications
 */

import { query } from '../config/database';
import { logger } from './monitoringService';
import { v4 as uuidv4 } from 'uuid';

export interface Alert {
  id: string;
  organizationId: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  createdBy: string;
  isDrill: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AlertRecipient {
  id: string;
  alertId: string;
  userId: string;
  isAcknowledged: boolean;
  acknowledgedAt?: Date;
  createdAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  alertId?: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
}

export interface CreateAlertInput {
  organizationId: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  createdBy: string;
  isDrill?: boolean;
}

export interface UpdateAlertInput {
  title?: string;
  description?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  type?: string;
  isDrill?: boolean;
  isActive?: boolean;
}

class AlertService {
  /**
   * Get alerts for organization
   */
  async getAlerts(
    organizationId: string,
    options: {
      page?: number;
      pageSize?: number;
      severity?: string;
      isDrill?: boolean;
    } = {}
  ): Promise<{ alerts: Alert[]; total: number }> {
    try {
      const { page = 1, pageSize = 20, severity, isDrill } = options;
      const offset = (page - 1) * pageSize;

      let whereClause = 'WHERE organization_id = $1 AND is_active = true';
      const params: any[] = [organizationId];
      let paramIndex = 2;

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
        `SELECT COUNT(*) as count FROM alerts ${whereClause}`,
        params
      );
      const total = parseInt(countResult.rows[0].count, 10);

      // Get alerts
      const result = await query(
        `
        SELECT * FROM alerts
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `,
        [...params, pageSize, offset]
      );

      const alerts = result.rows.map(this.mapAlertRow);

      logger.info('Alerts retrieved', { organizationId, count: alerts.length });

      return { alerts, total };
    } catch (error) {
      logger.error('Failed to get alerts', { error, organizationId });
      throw error;
    }
  }

  /**
   * Get alert by ID
   */
  async getAlertById(alertId: string): Promise<Alert | null> {
    try {
      const result = await query(
        `SELECT * FROM alerts WHERE id = $1 AND is_active = true`,
        [alertId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapAlertRow(result.rows[0]);
    } catch (error) {
      logger.error('Failed to get alert', { error, alertId });
      throw error;
    }
  }

  /**
   * Create alert
   */
  async createAlert(input: CreateAlertInput): Promise<Alert> {
    try {
      const id = uuidv4();
      const now = new Date();

      const result = await query(
        `
        INSERT INTO alerts (
          id, organization_id, title, description, severity, type,
          created_by, is_drill, is_active, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
        `,
        [
          id,
          input.organizationId,
          input.title,
          input.description,
          input.severity,
          input.type,
          input.createdBy,
          input.isDrill ?? false,
          true,
          now,
          now,
        ]
      );

      logger.info('Alert created', { alertId: id, organizationId: input.organizationId });

      return this.mapAlertRow(result.rows[0]);
    } catch (error) {
      logger.error('Failed to create alert', { error, input });
      throw error;
    }
  }

  /**
   * Update alert
   */
  async updateAlert(alertId: string, input: UpdateAlertInput): Promise<Alert | null> {
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

      if (input.severity !== undefined) {
        updates.push(`severity = $${paramIndex}`);
        params.push(input.severity);
        paramIndex++;
      }

      if (input.type !== undefined) {
        updates.push(`type = $${paramIndex}`);
        params.push(input.type);
        paramIndex++;
      }

      if (input.isDrill !== undefined) {
        updates.push(`is_drill = $${paramIndex}`);
        params.push(input.isDrill);
        paramIndex++;
      }

      if (input.isActive !== undefined) {
        updates.push(`is_active = $${paramIndex}`);
        params.push(input.isActive);
        paramIndex++;
      }

      if (updates.length === 0) {
        return this.getAlertById(alertId);
      }

      updates.push(`updated_at = $${paramIndex}`);
      params.push(new Date());
      paramIndex++;

      params.push(alertId);

      const result = await query(
        `
        UPDATE alerts
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
        `,
        params
      );

      if (result.rows.length === 0) {
        return null;
      }

      logger.info('Alert updated', { alertId });

      return this.mapAlertRow(result.rows[0]);
    } catch (error) {
      logger.error('Failed to update alert', { error, alertId });
      throw error;
    }
  }

  /**
   * Delete alert
   */
  async deleteAlert(alertId: string): Promise<void> {
    try {
      await query(
        `UPDATE alerts SET is_active = false, updated_at = NOW() WHERE id = $1`,
        [alertId]
      );

      logger.info('Alert deleted', { alertId });
    } catch (error) {
      logger.error('Failed to delete alert', { error, alertId });
      throw error;
    }
  }

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(alertId: string, userId: string): Promise<AlertRecipient> {
    try {
      const id = uuidv4();
      const now = new Date();

      // Check if already acknowledged
      const existing = await query(
        `SELECT * FROM alert_recipients WHERE alert_id = $1 AND user_id = $2`,
        [alertId, userId]
      );

      if (existing.rows.length > 0) {
        const row = existing.rows[0];
        if (!row.is_acknowledged) {
          await query(
            `UPDATE alert_recipients SET is_acknowledged = true, acknowledged_at = NOW() WHERE id = $1`,
            [row.id]
          );
        }
        return {
          id: row.id,
          alertId: row.alert_id,
          userId: row.user_id,
          isAcknowledged: true,
          acknowledgedAt: row.acknowledged_at || now,
          createdAt: row.created_at,
        };
      }

      const result = await query(
        `
        INSERT INTO alert_recipients (id, alert_id, user_id, is_acknowledged, acknowledged_at, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
        `,
        [id, alertId, userId, true, now, now]
      );

      logger.info('Alert acknowledged', { alertId, userId });

      const row = result.rows[0];
      return {
        id: row.id,
        alertId: row.alert_id,
        userId: row.user_id,
        isAcknowledged: row.is_acknowledged,
        acknowledgedAt: row.acknowledged_at,
        createdAt: row.created_at,
      };
    } catch (error) {
      logger.error('Failed to acknowledge alert', { error, alertId, userId });
      throw error;
    }
  }

  /**
   * Get alert recipients
   */
  async getAlertRecipients(alertId: string): Promise<AlertRecipient[]> {
    try {
      const result = await query(
        `SELECT * FROM alert_recipients WHERE alert_id = $1 ORDER BY created_at DESC`,
        [alertId]
      );

      return result.rows.map((row) => ({
        id: row.id,
        alertId: row.alert_id,
        userId: row.user_id,
        isAcknowledged: row.is_acknowledged,
        acknowledgedAt: row.acknowledged_at,
        createdAt: row.created_at,
      }));
    } catch (error) {
      logger.error('Failed to get alert recipients', { error, alertId });
      throw error;
    }
  }

  /**
   * Create notification
   */
  async createNotification(
    userId: string,
    title: string,
    message: string,
    type: string,
    alertId?: string
  ): Promise<Notification> {
    try {
      const id = uuidv4();
      const now = new Date();

      const result = await query(
        `
        INSERT INTO notifications (id, user_id, alert_id, title, message, type, is_read, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
        `,
        [id, userId, alertId || null, title, message, type, false, now]
      );

      logger.info('Notification created', { notificationId: id, userId });

      const row = result.rows[0];
      return {
        id: row.id,
        userId: row.user_id,
        alertId: row.alert_id,
        title: row.title,
        message: row.message,
        type: row.type,
        isRead: row.is_read,
        readAt: row.read_at,
        createdAt: row.created_at,
      };
    } catch (error) {
      logger.error('Failed to create notification', { error, userId });
      throw error;
    }
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(
    userId: string,
    options: { page?: number; pageSize?: number; unreadOnly?: boolean } = {}
  ): Promise<{ notifications: Notification[]; total: number }> {
    try {
      const { page = 1, pageSize = 20, unreadOnly = false } = options;
      const offset = (page - 1) * pageSize;

      let whereClause = 'WHERE user_id = $1';
      const params: any[] = [userId];

      if (unreadOnly) {
        whereClause += ' AND is_read = false';
      }

      // Get total count
      const countResult = await query(
        `SELECT COUNT(*) as count FROM notifications ${whereClause}`,
        params
      );
      const total = parseInt(countResult.rows[0].count, 10);

      // Get notifications
      const result = await query(
        `
        SELECT * FROM notifications
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
        `,
        [userId, pageSize, offset]
      );

      const notifications = result.rows.map((row) => ({
        id: row.id,
        userId: row.user_id,
        alertId: row.alert_id,
        title: row.title,
        message: row.message,
        type: row.type,
        isRead: row.is_read,
        readAt: row.read_at,
        createdAt: row.created_at,
      }));

      return { notifications, total };
    } catch (error) {
      logger.error('Failed to get user notifications', { error, userId });
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      await query(
        `UPDATE notifications SET is_read = true, read_at = NOW() WHERE id = $1`,
        [notificationId]
      );

      logger.info('Notification marked as read', { notificationId });
    } catch (error) {
      logger.error('Failed to mark notification as read', { error, notificationId });
      throw error;
    }
  }

  /**
   * Map database row to alert object
   */
  private mapAlertRow(row: any): Alert {
    return {
      id: row.id,
      organizationId: row.organization_id,
      title: row.title,
      description: row.description,
      severity: row.severity,
      type: row.type,
      createdBy: row.created_by,
      isDrill: row.is_drill,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const alertService = new AlertService();
