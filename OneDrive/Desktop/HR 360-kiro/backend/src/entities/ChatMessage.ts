import { query } from '../config/database';

export interface ChatMessage {
  id: string;
  userId: string;
  orgId: string;
  userMessage: string;
  botResponse: string;
  context?: {
    relatedGuideIds?: string[];
    confidence?: number;
    keywords?: string[];
  };
  isHelpful?: boolean;
  feedback?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ChatMessageEntity {
  static async create(data: Omit<ChatMessage, 'id' | 'createdAt' | 'updatedAt'>): Promise<ChatMessage> {
    const result = await query(
      `INSERT INTO chat_messages (user_id, org_id, user_message, bot_response, context, is_helpful, feedback)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, user_id as "userId", org_id as "orgId", user_message as "userMessage", 
                 bot_response as "botResponse", context, is_helpful as "isHelpful", feedback,
                 created_at as "createdAt", updated_at as "updatedAt"`,
      [data.userId, data.orgId, data.userMessage, data.botResponse, JSON.stringify(data.context || {}), 
       data.isHelpful || null, data.feedback || null]
    );
    return result.rows[0];
  }

  static async findById(id: string): Promise<ChatMessage | null> {
    const result = await query(
      `SELECT id, user_id as "userId", org_id as "orgId", user_message as "userMessage", 
              bot_response as "botResponse", context, is_helpful as "isHelpful", feedback,
              created_at as "createdAt", updated_at as "updatedAt"
       FROM chat_messages WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  static async findByUserId(userId: string, limit: number = 50, offset: number = 0): Promise<ChatMessage[]> {
    const result = await query(
      `SELECT id, user_id as "userId", org_id as "orgId", user_message as "userMessage", 
              bot_response as "botResponse", context, is_helpful as "isHelpful", feedback,
              created_at as "createdAt", updated_at as "updatedAt"
       FROM chat_messages WHERE user_id = $1
       ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return result.rows;
  }

  static async findByOrgId(orgId: string, limit: number = 100, offset: number = 0): Promise<ChatMessage[]> {
    const result = await query(
      `SELECT id, user_id as "userId", org_id as "orgId", user_message as "userMessage", 
              bot_response as "botResponse", context, is_helpful as "isHelpful", feedback,
              created_at as "createdAt", updated_at as "updatedAt"
       FROM chat_messages WHERE org_id = $1
       ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [orgId, limit, offset]
    );
    return result.rows;
  }

  static async updateFeedback(id: string, isHelpful: boolean, feedback?: string): Promise<ChatMessage | null> {
    const result = await query(
      `UPDATE chat_messages SET is_helpful = $1, feedback = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING id, user_id as "userId", org_id as "orgId", user_message as "userMessage", 
                 bot_response as "botResponse", context, is_helpful as "isHelpful", feedback,
                 created_at as "createdAt", updated_at as "updatedAt"`,
      [isHelpful, feedback || null, id]
    );
    return result.rows[0] || null;
  }

  static async delete(id: string): Promise<boolean> {
    const result = await query(`DELETE FROM chat_messages WHERE id = $1`, [id]);
    return result.rowCount! > 0;
  }

  static async countByUserId(userId: string): Promise<number> {
    const result = await query(`SELECT COUNT(*) as count FROM chat_messages WHERE user_id = $1`, [userId]);
    return parseInt(result.rows[0].count);
  }

  static async countByOrgId(orgId: string): Promise<number> {
    const result = await query(`SELECT COUNT(*) as count FROM chat_messages WHERE org_id = $1`, [orgId]);
    return parseInt(result.rows[0].count);
  }
}
