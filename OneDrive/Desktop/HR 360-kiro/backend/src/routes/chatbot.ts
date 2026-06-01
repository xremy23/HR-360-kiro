import { Router, Response } from 'express';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest, authMiddleware, adminMiddleware } from '../middleware/auth';
import { ChatMessageEntity } from '../entities/ChatMessage';
import { chatbotService } from '../services/chatbotService';

const router = Router();

/**
 * POST /api/chatbot/messages
 * Send message to chatbot and get response
 */
router.post('/messages', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'USER_NOT_FOUND', 'User not found', 404);
    }

    const { message } = req.body;

    if (!message || message.trim().length === 0) {
      return sendError(res, 'INVALID_MESSAGE', 'Message cannot be empty', 400);
    }

    if (message.length > 5000) {
      return sendError(res, 'MESSAGE_TOO_LONG', 'Message must be 5000 characters or less', 400);
    }

    try {
      // Process message with chatbot service
      const response = await chatbotService.processMessage(message, req.user.orgId, req.user.id);

      return sendSuccess(
        res,
        {
          id: response.context.relatedGuideIds[0] || null, // Message ID would be returned from DB
          message: response.message,
          context: response.context,
          suggestedGuides: response.suggestedGuides,
        },
        'Message processed successfully',
        200
      );
    } catch (processError) {
      console.error('Chatbot processing error:', processError);
      // Return fallback response if processing fails
      return sendSuccess(
        res,
        {
          id: null,
          message: `I'm here to help with emergency procedures and safety guidelines. Try asking about:\n- Tornado safety\n- Earthquake procedures\n- Fire evacuation\n- First aid\n- SOS emergency`,
          context: {
            relatedGuideIds: [],
            confidence: 0,
            keywords: [],
            matchType: 'partial' as const,
          },
          suggestedGuides: [],
        },
        'Message processed (with fallback)',
        200
      );
    }
  } catch (error) {
    console.error('Chatbot message error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to process message', 500);
  }
});

/**
 * GET /api/chatbot/messages
 * Get conversation history for current user
 */
router.get('/messages', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'USER_NOT_FOUND', 'User not found', 404);
    }

    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    try {
      const messages = await ChatMessageEntity.findByUserId(req.user.id, limit, offset);
      const total = await ChatMessageEntity.countByUserId(req.user.id);

      return sendSuccess(
        res,
        {
          messages,
          pagination: {
            limit,
            offset,
            total,
            hasMore: offset + limit < total,
          },
        },
        'Conversation history retrieved successfully',
        200
      );
    } catch (dbError) {
      console.error('Database error retrieving conversation history:', dbError);
      // Return empty messages if database is unavailable
      return sendSuccess(
        res,
        {
          messages: [],
          pagination: {
            limit,
            offset,
            total: 0,
            hasMore: false,
          },
        },
        'Conversation history retrieved (DB unavailable)',
        200
      );
    }
  } catch (error) {
    console.error('Get conversation history error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to retrieve conversation history', 500);
  }
});

/**
 * GET /api/chatbot/messages/:id
 * Get specific message
 */
router.get('/messages/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const message = await ChatMessageEntity.findById(id);

    if (!message) {
      return sendError(res, 'MESSAGE_NOT_FOUND', 'Message not found', 404);
    }

    // Verify user owns this message
    if (message.userId !== req.user?.id) {
      return sendError(res, 'UNAUTHORIZED', 'You do not have access to this message', 403);
    }

    return sendSuccess(res, message, 'Message retrieved successfully', 200);
  } catch (error) {
    console.error('Get message error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to retrieve message', 500);
  }
});

/**
 * POST /api/chatbot/messages/:id/feedback
 * Record feedback on chatbot response
 */
router.post('/messages/:id/feedback', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'USER_NOT_FOUND', 'User not found', 404);
    }

    const { id } = req.params;
    const { isHelpful, feedback } = req.body;

    if (typeof isHelpful !== 'boolean') {
      return sendError(res, 'INVALID_INPUT', 'isHelpful must be a boolean', 400);
    }

    const message = await ChatMessageEntity.findById(id);

    if (!message) {
      return sendError(res, 'MESSAGE_NOT_FOUND', 'Message not found', 404);
    }

    // Verify user owns this message
    if (message.userId !== req.user.id) {
      return sendError(res, 'UNAUTHORIZED', 'You do not have access to this message', 403);
    }

    const updated = await ChatMessageEntity.updateFeedback(id, isHelpful, feedback);

    return sendSuccess(res, updated, 'Feedback recorded successfully', 200);
  } catch (error) {
    console.error('Record feedback error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to record feedback', 500);
  }
});

/**
 * DELETE /api/chatbot/messages/:id
 * Delete a message from conversation history
 */
router.delete('/messages/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'USER_NOT_FOUND', 'User not found', 404);
    }

    const { id } = req.params;

    const message = await ChatMessageEntity.findById(id);

    if (!message) {
      return sendError(res, 'MESSAGE_NOT_FOUND', 'Message not found', 404);
    }

    // Verify user owns this message
    if (message.userId !== req.user.id) {
      return sendError(res, 'UNAUTHORIZED', 'You do not have access to this message', 403);
    }

    const deleted = await ChatMessageEntity.delete(id);

    if (!deleted) {
      return sendError(res, 'DELETE_FAILED', 'Failed to delete message', 500);
    }

    return sendSuccess(res, {}, 'Message deleted successfully', 200);
  } catch (error) {
    console.error('Delete message error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to delete message', 500);
  }
});

/**
 * GET /api/chatbot/analytics
 * Get chatbot analytics for organization (Admin only)
 */
router.get('/analytics', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'USER_NOT_FOUND', 'User not found', 404);
    }

    const analytics = await chatbotService.getAnalytics(req.user.orgId);

    return sendSuccess(res, analytics, 'Analytics retrieved successfully', 200);
  } catch (error) {
    console.error('Get analytics error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to retrieve analytics', 500);
  }
});

/**
 * DELETE /api/chatbot/messages
 * Clear entire conversation history (User only)
 */
router.delete('/messages', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'USER_NOT_FOUND', 'User not found', 404);
    }

    // Get all messages for user
    const messages = await ChatMessageEntity.findByUserId(req.user.id, 10000, 0);

    // Delete each message
    let deletedCount = 0;
    for (const message of messages) {
      const deleted = await ChatMessageEntity.delete(message.id);
      if (deleted) deletedCount++;
    }

    return sendSuccess(
      res,
      { deletedCount },
      `Deleted ${deletedCount} messages from conversation history`,
      200
    );
  } catch (error) {
    console.error('Clear history error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to clear conversation history', 500);
  }
});

export default router;
