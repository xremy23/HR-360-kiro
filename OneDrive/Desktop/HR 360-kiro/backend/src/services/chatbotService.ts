/**
 * Chatbot Service
 * Handles chatbot conversations, feedback, and admin management
 * Supports multilingual responses (English, Tagalog, Bisaya) with Gemini AI
 */

import { query } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import aiService from './aiService';

type SupportedLanguage = 'en' | 'tl' | 'ceb';

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
   * If no explicit botResponse is provided, fetch KB guides and generate intelligent response
   * Supports multilingual responses (English, Tagalog, Bisaya)
   */
  async saveChatMessage(
    userId: string,
    organizationId: string,
    userQuestion: string,
    botResponse: string = '',
    context?: Record<string, any>,
    language?: SupportedLanguage
  ): Promise<ChatMessage> {
    const id = uuidv4();
    const now = new Date();

    // Detect language if not provided
    const detectedLanguage = language || this.detectLanguage(userQuestion);

    // If no bot response provided, fetch KB guides and generate intelligent response
    let finalBotResponse = botResponse;
    if (!finalBotResponse || finalBotResponse === 'Processing your question...') {
      finalBotResponse = await this.generateIntelligentResponse(
        userQuestion,
        organizationId,
        detectedLanguage
      );
    }

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
        finalBotResponse,
        JSON.stringify({ 
          ...context,
          language: detectedLanguage,
          kbMatches: context?.kbMatches || [],
          aiGenerated: !botResponse || botResponse === 'Processing your question...'
        }),
        'active',
        now,
      ]
    );

    return this.mapChatMessage(result.rows[0]);
  }

  /**
   * Detect language of input text
   */
  private detectLanguage(text: string): SupportedLanguage {
    // Tagalog indicators
    const tagalogIndicators = /\b(ano|kung|para|ang|nang|sa|ko|mo|ay|na|ng|kami|tayo|sila|kayo|ito|iyan|dito|diyan|narito|nariyan|bakit|kailan|nasaan|paano|salamat|puwede|ayos|dahil|talaga|sige|naman)\b/i;
    
    // Bisaya/Cebuano indicators
    const bisayaIndicators = /\b(unsa|kung|para|ang|nang|sa|ko|mo|kami|kayo|sila|ito|ato|diri|didto|ngano|kailan|asa|pagano|tayo|sala|baylo|bulbuli|usa|dugay)\b/i;

    // Simple heuristic detection
    const tagalogMatches = (text.match(tagalogIndicators) || []).length;
    const bisayaMatches = (text.match(bisayaIndicators) || []).length;

    if (bisayaMatches > tagalogMatches && bisayaMatches > 0) {
      return 'ceb';
    } else if (tagalogMatches > 0) {
      return 'tl';
    }
    return 'en';
  }

  /**
   * Generate intelligent response by searching KB guides and using Gemini AI
   */
  private async generateIntelligentResponse(
    userQuestion: string,
    organizationId: string,
    language: SupportedLanguage = 'en'
  ): Promise<string> {
    try {
      // Search for relevant KB guides
      const relevantGuides = await this.searchKBGuides(userQuestion, organizationId);

      // If AI is ready and we have guides, use Gemini with context
      if (aiService.isReady() && relevantGuides.length > 0) {
        const aiResponse = await aiService.generateResponse({
          question: userQuestion,
          language,
          context: `Emergency management context for organization ${organizationId}`,
          kbGuides: relevantGuides.map((guide) => ({
            title: guide.title,
            content: guide.content,
          })),
        });

        return aiResponse.answer;
      }

      // Fallback to KB-based response
      if (relevantGuides.length === 0) {
        return aiService.isReady()
          ? (
              await aiService.generateResponse({
                question: userQuestion,
                language,
              })
            ).answer
          : this.getDefaultResponse(userQuestion, language);
      }

      // Build response from KB content
      return await aiService.getKBResponse(userQuestion, language, 
        relevantGuides.map((guide) => ({
          title: guide.title,
          content: guide.content,
        }))
      );
    } catch (err) {
      console.error('Error generating intelligent response:', err);
      return this.getDefaultResponse(userQuestion, language);
    }
  }

  /**
   * Search KB guides for relevant content
   */
  private async searchKBGuides(
    userQuestion: string,
    organizationId: string
  ): Promise<any[]> {
    try {
      const questionLower = userQuestion.toLowerCase();
      
      // Search KB guides using text similarity (simple keyword matching for now)
      const result = await query(
        `SELECT id, title, content, category, type FROM kb_guides
         WHERE org_id = $1 AND is_archived = false
         AND (
           title ILIKE $2 OR 
           content ILIKE $2 OR
           type ILIKE $2
         )
         ORDER BY 
           CASE 
             WHEN title ILIKE $2 THEN 1
             WHEN type ILIKE $2 THEN 2
             ELSE 3
           END,
           created_at DESC
         LIMIT 5`,
        [organizationId, `%${questionLower}%`]
      );

      return result.rows;
    } catch (err) {
      console.error('Error searching KB guides:', err);
      return [];
    }
  }

  /**
   * Get default response when no KB matches found
   */
  private getDefaultResponse(userQuestion: string, language: SupportedLanguage = 'en'): string {
    const questionLower = userQuestion.toLowerCase();

    if (language === 'tl') {
      // Tagalog responses
      if (
        questionLower.includes('emergency') ||
        questionLower.includes('emerhensya') ||
        questionLower.includes('crisis') ||
        questionLower.includes('krisis')
      ) {
        return `🚨 **Tugon sa Emerhensya**\n\nPara sa agarang emerhensya:\n• Tawagan ang 911 (National Emergency Hotline)\n• I-alert kaagad ang iyong team lead\n• Gamitin ang Check-In feature para ipahayag ang iyong status\n• Sundin ang evacuation procedures kung kinakailangan\n\nAng aming crisis team ay handang tumulong. Bisitahin ang Knowledge Base para sa detalyadong emergency procedures.`;
      }

      if (questionLower.includes('contact') || questionLower.includes('numero')) {
        return `📞 **Emergency Contacts**\n\nBisitahin ang Contacts section:\n• Emergency: 911\n• Police: 117\n• Fire: 114\n• Ambulance: 143\n• Disaster Hotline: +63 2 911-5061\n\nAng inyong team leads ay available din sa contacts list.`;
      }

      return `👋 **Kumusta!**\n\nAko ang iyong HR 360 Assistant. Maaari kang magtanong tungkol sa:\n• Emergency procedures at protocols\n• Emergency contact information\n• Safety guidelines\n• Wellness check procedures\n\nBisitahin ang Knowledge Base section para sa comprehensive guides.`;
    } else if (language === 'ceb') {
      // Bisaya/Cebuano responses
      if (
        questionLower.includes('emergency') ||
        questionLower.includes('emerhensya') ||
        questionLower.includes('crisis')
      ) {
        return `🚨 **Tubag sa Emerhensya**\n\nAlang sa daghang emerhensya:\n• Tawagon ang 911 (National Emergency Hotline)\n• I-alert kaagad ang iyong team lead\n• Gamitin ang Check-In feature para ipakita ang iyong status\n• Sundan ang evacuation procedures kung kinakailangan\n\nAng aming crisis team ay handa sa tumulong. Bisitahin ang Knowledge Base para sa detalyadong emergency procedures.`;
      }

      if (questionLower.includes('contact') || questionLower.includes('numero')) {
        return `📞 **Emergency Contacts**\n\nBisitahin ang Contacts section:\n• Emergency: 911\n• Police: 117\n• Fire: 114\n• Ambulance: 143\n• Disaster Hotline: +63 2 911-5061\n\nAng inyong team leads ay available din sa contacts list.`;
      }

      return `👋 **Kumusta!**\n\nAko ang iyong HR 360 Assistant. Maaari kang magtanong tungkol sa:\n• Emergency procedures\n• Emergency contacts\n• Safety guidelines\n• Wellness check procedures\n\nBisitahin ang Knowledge Base para sa mas maraming impormasyon.`;
    }

    // English responses (default)
    if (questionLower.includes('emergency') || questionLower.includes('crisis')) {
      return `🚨 **Emergency Response**\n\nFor immediate emergencies:\n• Call 911 (National Emergency Hotline)\n• Alert your team lead immediately\n• Use the Check-In feature to notify your status\n• Follow evacuation procedures if needed\n\nOur crisis team is standing by to assist. Check the Knowledge Base for detailed emergency procedures.`;
    }

    if (questionLower.includes('contact') || questionLower.includes('phone')) {
      return `📞 **Emergency Contacts**\n\nFor emergency contacts, visit the Contacts section in the app:\n• Emergency Services: 911\n• Police: 117\n• Fire Department: 160\n• Ambulance: 143\n• Disaster Hotline: +63 2 911-5061\n\nYour organization's team leads are also available in your contacts list.`;
    }

    if (questionLower.includes('safety') || questionLower.includes('protocol')) {
      return `🛡️ **Safety Protocols**\n\nWe have comprehensive safety guidelines available in the Knowledge Base:\n• Workplace Safety Protocols\n• Natural Disaster Response Guide\n• Crisis Response Procedures\n\nVisit the KB section to access detailed safety information.`;
    }

    if (questionLower.includes('check-in') || questionLower.includes('wellness')) {
      return `✅ **Wellness Check**\n\nUse the Check-In feature to:\n• Report your status during emergencies\n• Select: Safe, Affected, Need Help, or Unable to Reach\n• Add location and notes if needed\n• Help leadership track team welfare\n\nCheck the Knowledge Base for wellness check procedures.`;
    }

    return `👋 **Hello!**\n\nThank you for reaching out. I'm your HR 360 Assistant.\n\nI can help you with:\n• Emergency procedures and protocols\n• Emergency contact information\n• Safety guidelines\n• Wellness check procedures\n• Go-bag essentials\n• Crisis response procedures\n\nFeel free to ask me anything related to crisis preparedness, safety, or emergency procedures. You can also browse the Knowledge Base section for comprehensive guides.`;
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
