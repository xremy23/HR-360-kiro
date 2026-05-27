import { query } from '../config/database';

export interface PushNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  type: 'alert' | 'incident' | 'sos' | 'checkin' | 'custom';
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  deliveredAt?: Date;
  readAt?: Date;
  createdAt: Date;
}

export class PushNotificationEntity {
  /**
   * Create a new push notification
   */
  static async create(data: Omit<PushNotification, 'id' | 'createdAt'>): Promise<PushNotification> {
    const result = await query(
      `INSERT INTO push_notifications (user_id, title, body, data, type, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, user_id as "userId", title, body, data, type, status, 
                 delivered_at as "deliveredAt", read_at as "readAt", created_at as "createdAt"`,
      [data.userId, data.title, data.body, JSON.stringify(data.data || {}), data.type, data.status]
    );
    return result.rows[0];
  }

  /**
   * Find notification by ID
   */
  static async findById(id: string): Promise<PushNotification | null> {
    const result = await query(
      `SELECT id, user_id as "userId", title, body, data, type, status, 
              delivered_at as "deliveredAt", read_at as "readAt", created_at as "createdAt"
       FROM push_notifications WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Find notifications by user ID
   */
  static async findByUserId(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<PushNotification[]> {
    const result = await query(
      `SELECT id, user_id as "userId", title, body, data, type, status, 
              delivered_at as "deliveredAt", read_at as "readAt", created_at as "createdAt"
       FROM push_notifications 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return result.rows;
  }

  /**
   * Find unread notifications for user
   */
  static async findUnreadByUserId(userId: string): Promise<PushNotification[]> {
    const result = await query(
      `SELECT id, user_id as "userId", title, body, data, type, status, 
              delivered_at as "deliveredAt", read_at as "readAt", created_at as "createdAt"
       FROM push_notifications 
       WHERE user_id = $1 AND read_at IS NULL
       ORDER BY created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  /**
   * Count unread notifications for user
   */
  static async countUnreadByUserId(userId: string): Promise<number> {
    const result = await query(
      `SELECT COUNT(*) as count FROM push_notifications 
       WHERE user_id = $1 AND read_at IS NULL`,
      [userId]
    );
    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(id: string): Promise<PushNotification> {
    const result = await query(
      `UPDATE push_notifications 
       SET read_at = CURRENT_TIMESTAMP 
       WHERE id = $1
       RETURNING id, user_id as "userId", title, body, data, type, status, 
                 delivered_at as "deliveredAt", read_at as "readAt", created_at as "createdAt"`,
      [id]
    );
    return result.rows[0];
  }

  /**
   * Mark multiple notifications as read
   */
  static async markMultipleAsRead(ids: string[]): Promise<number> {
    if (ids.length === 0) return 0;

    const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
    const result = await query(
      `UPDATE push_notifications 
       SET read_at = CURRENT_TIMESTAMP 
       WHERE id IN (${placeholders})`,
      ids
    );
    return result.rowCount || 0;
  }

  /**
   * Mark notification as delivered
   */
  static async markAsDelivered(id: string): Promise<PushNotification> {
    const result = await query(
      `UPDATE push_notifications 
       SET status = 'delivered', delivered_at = CURRENT_TIMESTAMP 
       WHERE id = $1
       RETURNING id, user_id as "userId", title, body, data, type, status, 
                 delivered_at as "deliveredAt", read_at as "readAt", created_at as "createdAt"`,
      [id]
    );
    return result.rows[0];
  }

  /**
   * Mark notification as failed
   */
  static async markAsFailed(id: string): Promise<PushNotification> {
    const result = await query(
      `UPDATE push_notifications 
       SET status = 'failed' 
       WHERE id = $1
       RETURNING id, user_id as "userId", title, body, data, type, status, 
                 delivered_at as "deliveredAt", read_at as "readAt", created_at as "createdAt"`,
      [id]
    );
    return result.rows[0];
  }

  /**
   * Find pending notifications
   */
  static async findPending(limit: number = 100): Promise<PushNotification[]> {
    const result = await query(
      `SELECT id, user_id as "userId", title, body, data, type, status, 
              delivered_at as "deliveredAt", read_at as "readAt", created_at as "createdAt"
       FROM push_notifications 
       WHERE status = 'pending'
       ORDER BY created_at ASC
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  /**
   * Delete notification
   */
  static async delete(id: string): Promise<void> {
    await query('DELETE FROM push_notifications WHERE id = $1', [id]);
  }

  /**
   * Delete old notifications (older than days)
   */
  static async deleteOlderThan(days: number): Promise<number> {
    const result = await query(
      `DELETE FROM push_notifications 
       WHERE created_at < NOW() - INTERVAL '${days} days'`
    );
    return result.rowCount || 0;
  }

  /**
   * Get notification statistics
   */
  static async getStats(userId: string): Promise<{
    total: number;
    unread: number;
    delivered: number;
    failed: number;
  }> {
    const result = await query(
      `SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN read_at IS NULL THEN 1 END) as unread,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed
       FROM push_notifications 
       WHERE user_id = $1`,
      [userId]
    );
    return {
      total: parseInt(result.rows[0].total, 10),
      unread: parseInt(result.rows[0].unread, 10),
      delivered: parseInt(result.rows[0].delivered, 10),
      failed: parseInt(result.rows[0].failed, 10),
    };
  }
}

export default PushNotificationEntity;
