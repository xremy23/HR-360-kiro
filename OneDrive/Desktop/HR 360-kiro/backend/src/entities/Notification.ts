import { query } from '../config/database';

export interface Notification {
  id: string;
  userId: string;
  alertId: string;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
}

export class NotificationEntity {
  static async create(data: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification> {
    const result = await query(
      `INSERT INTO alert_notifications (user_id, alert_id, is_read)
       VALUES ($1, $2, $3)
       RETURNING id, user_id as "userId", alert_id as "alertId", is_read as "isRead", 
                 read_at as "readAt", created_at as "createdAt"`,
      [data.userId, data.alertId, data.isRead]
    );
    return result.rows[0];
  }

  static async findById(id: string): Promise<Notification | null> {
    const result = await query(
      `SELECT id, user_id as "userId", alert_id as "alertId", is_read as "isRead", 
              read_at as "readAt", created_at as "createdAt"
       FROM alert_notifications WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  static async findByAlertId(alertId: string): Promise<Notification[]> {
    const result = await query(
      `SELECT id, user_id as "userId", alert_id as "alertId", is_read as "isRead", 
              read_at as "readAt", created_at as "createdAt"
       FROM alert_notifications WHERE alert_id = $1 ORDER BY created_at DESC`,
      [alertId]
    );
    return result.rows;
  }

  static async findByUserId(userId: string, limit: number = 50, offset: number = 0): Promise<Notification[]> {
    const result = await query(
      `SELECT id, user_id as "userId", alert_id as "alertId", is_read as "isRead", 
              read_at as "readAt", created_at as "createdAt"
       FROM alert_notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return result.rows;
  }

  static async findUnreadByUserId(userId: string): Promise<Notification[]> {
    const result = await query(
      `SELECT id, user_id as "userId", alert_id as "alertId", is_read as "isRead", 
              read_at as "readAt", created_at as "createdAt"
       FROM alert_notifications WHERE user_id = $1 AND is_read = false ORDER BY created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  static async markAsRead(id: string): Promise<Notification | null> {
    const result = await query(
      `UPDATE alert_notifications SET is_read = true, read_at = CURRENT_TIMESTAMP WHERE id = $1
       RETURNING id, user_id as "userId", alert_id as "alertId", is_read as "isRead", 
                 read_at as "readAt", created_at as "createdAt"`,
      [id]
    );
    return result.rows[0] || null;
  }

  static async markAllAsRead(userId: string): Promise<number> {
    const result = await query(
      `UPDATE alert_notifications SET is_read = true, read_at = CURRENT_TIMESTAMP 
       WHERE user_id = $1 AND is_read = false`,
      [userId]
    );
    return result.rowCount || 0;
  }

  static async countUnreadByUserId(userId: string): Promise<number> {
    const result = await query(
      `SELECT COUNT(*) as count FROM alert_notifications WHERE user_id = $1 AND is_read = false`,
      [userId]
    );
    return parseInt(result.rows[0].count);
  }

  static async delete(id: string): Promise<boolean> {
    const result = await query(`DELETE FROM alert_notifications WHERE id = $1`, [id]);
    return result.rowCount! > 0;
  }

  static async deleteByAlertId(alertId: string): Promise<number> {
    const result = await query(`DELETE FROM alert_notifications WHERE alert_id = $1`, [alertId]);
    return result.rowCount || 0;
  }
}
