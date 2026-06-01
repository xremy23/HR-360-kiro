/**
 * Chatbot Service
 * Handles chatbot conversations, feedback, and admin management
 */

import { query } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

interface ChatMessage {
  id: string;
  userId: string;
  organizationId: string;
  userQuestion: string;
  botResponse: string;
  context?: Record<string, any>;
  isHelpful?: boolean;
  feedbackText?: string;
  feedbackProvidedAt?: Date;
  status: string;
  adminNotes?: string;
  updatedResponse?: string;
  updatedBy?: string;
  updatedAt?: Date;
  createdAt: Date;
}

interface ChatbotResponse {
  id: string;
  organizationId?: string;
  questionPattern: string;
  response: string;
  category?: string;
  priority: number;
  isActive: boolean;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ChatbotFeedbackItem {
  id: string;
  chatMessageId: string;
  organizationId: string;
  userQuestion: string;
  botResponse: string;
  userFeedback?: string;
  isHelpful?: boolean;
  priority: string;
  status: string;
  assignedTo?: string;
  reviewedAt?: Date;
  resolvedAt?: Date;
  adminAction?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ChatbotService {
  /**
   * Save a chat message with user question and bot response
   */
  async saveChatMessage(
    userId: string,
    organizationId: string,
    userQuestion: string,
    botResponse: string,
    context?: Record<string, any>
  ): Promise<ChatMessage> {
    const id = uuidv4();
    const now = new Date();

    const result = await query(
      `INSERT INTO chat_messages (
        id, user_id, organization_id, user_question, bot_response, 
        context, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        id,
        userId,
        organizationId,
        userQuestion,
        botResponse,
        JSON.stringify(context || {}),
        'active',
        now,
      ]
    );

    return this.mapChatMessage(result.rows[0]);
  }

  /**
   * Submit feedback on a chat message
   */
  async submitFeedback(
    chatMessageId: string,
    isHelpful: boolean,
    feedbackText?: string
  ): Promise<ChatMessage> {
    const now = new Date();

    const result = await query(
      `UPDATE chat_messages 
       SET is_helpful = $1, feedback_text = $2, feedback_provided_at = $3
       WHERE id = $4
       RETURNING *`,
      [isHelpful, feedbackText || null, now, chatMessageId]
    );

    if (result.rows.length === 0) {
      throw new Error('Chat message not found');
    }

    // Add to feedback queue if feedback is negative
    if (!isHelpful) {
      const chatMsg = result.rows[0];
      await this.addToFeedbackQueue(
        chatMessageId,
        chatMsg.organization_id,
        chatMsg.user_question,
        chatMsg.bot_response,
        feedbackText,
        isHelpful
      );
    }

    return this.mapChatMessage(result.rows[0]);
  }

  /**
   * Add a chat message to the feedback queue for admin review
   */
  private async addToFeedbackQueue(
    chatMessageId: string,
    organizationId: string,
    userQuestion: string,
    botResponse: string,
    userFeedback?: string,
    isHelpful?: boolean
  ): Promise<ChatbotFeedbackItem> {
    const id = uuidv4();
    const now = new Date();

    const result = await query(
      `INSERT INTO chatbot_feedback_queue (
        id, chat_message_id, organization_id, user_question, bot_response,
        user_feedback, is_helpful, priority, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        id,
        chatMessageId,
        organizationId,
        userQuestion,
        botResponse,
        userFeedback || null,
        isHelpful,
        'medium',
        'pending',
        now,
        now,
      ]
    );

    return this.mapFeedbackItem(result.rows[0]);
  }

  /**
   * Get feedback queue for admin dashboard
   */
  async getFeedbackQueue(
    organizationId: string,
    status?: string,
    priority?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ items: ChatbotFeedbackItem[]; total: number }> {
    let whereClause = 'WHERE organization_id = $1';
    const params: any[] = [organizationId];
    let paramIndex = 2;

    if (status) {
      whereClause += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (priority) {
      whereClause += ` AND priority = $${paramIndex}`;
      params.push(priority);
      paramIndex++;
    }

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as count FROM chatbot_feedback_queue ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    const result = await query(
      `SELECT * FROM chatbot_feedback_queue 
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    return {
      items: result.rows.map((row) => this.mapFeedbackItem(row)),
      total,
    };
  }

  /**
   * Get a specific feedback item
   */
  async getFeedbackItem(feedbackId: string): Promise<ChatbotFeedbackItem> {
    const result = await query(
      `SELECT * FROM chatbot_feedback_queue WHERE id = $1`,
      [feedbackId]
    );

    if (result.rows.length === 0) {
      throw new Error('Feedback item not found');
    }

    return this.mapFeedbackItem(result.rows[0]);
  }

  /**
   * Update feedback item status and admin action
   */
  async updateFeedbackItem(
    feedbackId: string,
    status: string,
    adminAction?: string,
    assignedTo?: string
  ): Promise<ChatbotFeedbackItem> {
    const now = new Date();

    const result = await query(
      `UPDATE chatbot_feedback_queue 
       SET status = $1, admin_action = $2, assigned_to = $3, 
           reviewed_at = $4, updated_at = $5
       WHERE id = $6
       RETURNING *`,
      [status, adminAction || null, assignedTo || null, now, now, feedbackId]
    );

    if (result.rows.length === 0) {
      throw new Error('Feedback item not found');
    }

    return this.mapFeedbackItem(result.rows[0]);
  }

  /**
   * Resolve a feedback item
   */
  async resolveFeedbackItem(
    feedbackId: string,
    adminAction: string,
    updatedResponseId?: string
  ): Promise<ChatbotFeedbackItem> {
    const now = new Date();

    const result = await query(
      `UPDATE chatbot_feedback_queue 
       SET status = $1, admin_action = $2, resolved_at = $3, updated_at = $4
       WHERE id = $5
       RETURNING *`,
      ['resolved', adminAction, now, now, feedbackId]
    );

    if (result.rows.length === 0) {
      throw new Error('Feedback item not found');
    }

    return this.mapFeedbackItem(result.rows[0]);
  }

  /**
   * Create or update a chatbot response pattern
   */
  async saveChatbotResponse(
    organizationId: string | null,
    questionPattern: string,
    response: string,
    category?: string,
    priority: number = 0,
    createdBy?: string
  ): Promise<ChatbotResponse> {
    const id = uuidv4();
    const now = new Date();

    const result = await query(
      `INSERT INTO chatbot_responses (
        id, organization_id, question_pattern, response, category, 
        priority, is_active, created_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (organization_id, question_pattern) 
      DO UPDATE SET response = $4, category = $5, priority = $6, updated_at = $10
      RETURNING *`,
      [
        id,
        organizationId,
        questionPattern,
        response,
        category || null,
        priority,
        true,
        createdBy || null,
        now,
        now,
      ]
    );

    return this.mapChatbotResponse(result.rows[0]);
  }

  /**
   * Get chatbot responses for an organization
   */
  async getChatbotResponses(
    organizationId: string | null,
    category?: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<{ items: ChatbotResponse[]; total: number }> {
    let whereClause = 'WHERE (organization_id = $1 OR organization_id IS NULL) AND is_active = true';
    const params: any[] = [organizationId];
    let paramIndex = 2;

    if (category) {
      whereClause += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as count FROM chatbot_responses ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    const result = await query(
      `SELECT * FROM chatbot_responses 
       ${whereClause}
       ORDER BY priority DESC, created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    return {
      items: result.rows.map((row) => this.mapChatbotResponse(row)),
      total,
    };
  }

  /**
   * Get chat history for a user
   */
  async getChatHistory(
    userId: string,
    organizationId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ items: ChatMessage[]; total: number }> {
    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as count FROM chat_messages 
       WHERE user_id = $1 AND organization_id = $2`,
      [userId, organizationId]
    );
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    const result = await query(
      `SELECT * FROM chat_messages 
       WHERE user_id = $1 AND organization_id = $2
       ORDER BY created_at DESC
       LIMIT $3 OFFSET $4`,
      [userId, organizationId, limit, offset]
    );

    return {
      items: result.rows.map((row) => this.mapChatMessage(row)),
      total,
    };
  }

  /**
   * Get statistics about chatbot performance
   */
  async getChatbotStats(organizationId: string): Promise<{
    totalMessages: number;
    helpfulMessages: number;
    unhelpfulMessages: number;
    helpfulPercentage: number;
    pendingFeedback: number;
    averageResponseLength: number;
  }> {
    const result = await query(
      `SELECT 
        COUNT(*) as total_messages,
        SUM(CASE WHEN is_helpful = true THEN 1 ELSE 0 END) as helpful_messages,
        SUM(CASE WHEN is_helpful = false THEN 1 ELSE 0 END) as unhelpful_messages,
        AVG(LENGTH(bot_response)) as avg_response_length
       FROM chat_messages 
       WHERE organization_id = $1`,
      [organizationId]
    );

    const row = result.rows[0];
    const total = parseInt(row.total_messages) || 0;
    const helpful = parseInt(row.helpful_messages) || 0;
    const unhelpful = parseInt(row.unhelpful_messages) || 0;

    // Get pending feedback count
    const feedbackResult = await query(
      `SELECT COUNT(*) as pending_count FROM chatbot_feedback_queue 
       WHERE organization_id = $1 AND status = 'pending'`,
      [organizationId]
    );

    return {
      totalMessages: total,
      helpfulMessages: helpful,
      unhelpfulMessages: unhelpful,
      helpfulPercentage: total > 0 ? Math.round((helpful / total) * 100) : 0,
      pendingFeedback: parseInt(feedbackResult.rows[0].pending_count) || 0,
      averageResponseLength: Math.round(parseFloat(row.avg_response_length) || 0),
    };
  }

  /**
   * Map database row to ChatMessage object
   */
  private mapChatMessage(row: any): ChatMessage {
    return {
      id: row.id,
      userId: row.user_id,
      organizationId: row.organization_id,
      userQuestion: row.user_question,
      botResponse: row.bot_response,
      context: row.context ? JSON.parse(row.context) : undefined,
      isHelpful: row.is_helpful,
      feedbackText: row.feedback_text,
      feedbackProvidedAt: row.feedback_provided_at,
      status: row.status,
      adminNotes: row.admin_notes,
      updatedResponse: row.updated_response,
      updatedBy: row.updated_by,
      updatedAt: row.updated_at,
      createdAt: row.created_at,
    };
  }

  /**
   * Map database row to ChatbotResponse object
   */
  private mapChatbotResponse(row: any): ChatbotResponse {
    return {
      id: row.id,
      organizationId: row.organization_id,
      questionPattern: row.question_pattern,
      response: row.response,
      category: row.category,
      priority: row.priority,
      isActive: row.is_active,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Map database row to ChatbotFeedbackItem object
   */
  private mapFeedbackItem(row: any): ChatbotFeedbackItem {
    return {
      id: row.id,
      chatMessageId: row.chat_message_id,
      organizationId: row.organization_id,
      userQuestion: row.user_question,
      botResponse: row.bot_response,
      userFeedback: row.user_feedback,
      isHelpful: row.is_helpful,
      priority: row.priority,
      status: row.status,
      assignedTo: row.assigned_to,
      reviewedAt: row.reviewed_at,
      resolvedAt: row.resolved_at,
      adminAction: row.admin_action,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export default new ChatbotService();
