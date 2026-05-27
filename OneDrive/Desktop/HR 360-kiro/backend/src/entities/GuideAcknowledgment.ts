import { query } from '../config/database';

export interface GuideAcknowledgment {
  id: string;
  userId: string;
  guideId: string;
  acknowledgedAt: Date;
}

export class GuideAcknowledgmentEntity {
  static async create(data: Omit<GuideAcknowledgment, 'id' | 'acknowledgedAt'>): Promise<GuideAcknowledgment> {
    const result = await query(
      `INSERT INTO guide_acknowledgments (user_id, guide_id)
       VALUES ($1, $2)
       RETURNING id, user_id as "userId", guide_id as "guideId", acknowledged_at as "acknowledgedAt"`,
      [data.userId, data.guideId]
    );
    return result.rows[0];
  }

  static async findById(id: string): Promise<GuideAcknowledgment | null> {
    const result = await query(
      `SELECT id, user_id as "userId", guide_id as "guideId", acknowledged_at as "acknowledgedAt"
       FROM guide_acknowledgments WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  static async findByUserAndGuide(userId: string, guideId: string): Promise<GuideAcknowledgment | null> {
    const result = await query(
      `SELECT id, user_id as "userId", guide_id as "guideId", acknowledged_at as "acknowledgedAt"
       FROM guide_acknowledgments WHERE user_id = $1 AND guide_id = $2`,
      [userId, guideId]
    );
    return result.rows[0] || null;
  }

  static async findByUserId(userId: string, limit: number = 50, offset: number = 0): Promise<GuideAcknowledgment[]> {
    const result = await query(
      `SELECT id, user_id as "userId", guide_id as "guideId", acknowledged_at as "acknowledgedAt"
       FROM guide_acknowledgments WHERE user_id = $1 ORDER BY acknowledged_at DESC LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return result.rows;
  }

  static async findByGuideId(guideId: string): Promise<GuideAcknowledgment[]> {
    const result = await query(
      `SELECT id, user_id as "userId", guide_id as "guideId", acknowledged_at as "acknowledgedAt"
       FROM guide_acknowledgments WHERE guide_id = $1 ORDER BY acknowledged_at DESC`,
      [guideId]
    );
    return result.rows;
  }

  static async countByGuideId(guideId: string): Promise<number> {
    const result = await query(
      `SELECT COUNT(*) as count FROM guide_acknowledgments WHERE guide_id = $1`,
      [guideId]
    );
    return parseInt(result.rows[0].count);
  }

  static async countByUserIdAndGuideId(userId: string, guideId: string): Promise<number> {
    const result = await query(
      `SELECT COUNT(*) as count FROM guide_acknowledgments WHERE user_id = $1 AND guide_id = $2`,
      [userId, guideId]
    );
    return parseInt(result.rows[0].count);
  }

  static async delete(id: string): Promise<boolean> {
    const result = await query(`DELETE FROM guide_acknowledgments WHERE id = $1`, [id]);
    return result.rowCount! > 0;
  }

  static async deleteByGuideId(guideId: string): Promise<number> {
    const result = await query(`DELETE FROM guide_acknowledgments WHERE guide_id = $1`, [guideId]);
    return result.rowCount || 0;
  }
}
