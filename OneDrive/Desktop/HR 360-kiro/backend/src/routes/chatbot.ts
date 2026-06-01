/**
 * Chatbot Routes
 * Handles chatbot conversations and admin feedback management
 */

import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';
import chatbotService from '../services/chatbotService';

const router = Router();

// ============================================================================
// USER ROUTES (Chatbot conversations)
// ============================================================================

/**
 * POST /api/chatbot/messages
 * Save a chat message with user question and bot response
 */
router.post(
  '/messages',
  authMiddleware.verifyToken.bind(authMiddleware),
  async (req: AuthRequest, res: Response) => {
    try {
      const { userQuestion, botResponse, context } = req.body;
      const userId = req.user?.userId;
      const organizationId = (req as any).user?.organizationId;

      if (!userQuestion || !botResponse) {
        return res.status(400).json({
          error: 'userQuestion and botResponse are required',
        });
      }

      if (!userId || !organizationId) {
        return res.status(401).json({
          error: 'User not authenticated',
        });
      }

      const message = await chatbotService.saveChatMessage(
        userId,
        organizationId,
        userQuestion,
        botResponse,
        context
      );

      res.status(201).json(message);
    } catch (error) {
      console.error('Error saving chat message:', error);
      res.status(500).json({ error: 'Failed to save chat message' });
    }
  }
);

/**
 * POST /api/chatbot/messages/:id/feedback
 * Submit feedback on a chat message
 */
router.post(
  '/messages/:id/feedback',
  authMiddleware.verifyToken.bind(authMiddleware),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { isHelpful, feedbackText } = req.body;

      if (typeof isHelpful !== 'boolean') {
        return res.status(400).json({
          error: 'isHelpful is required and must be a boolean',
        });
      }

      const message = await chatbotService.submitFeedback(
        id,
        isHelpful,
        feedbackText
      );

      res.json(message);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      res.status(500).json({ error: 'Failed to submit feedback' });
    }
  }
);

/**
 * GET /api/chatbot/history
 * Get chat history for the current user
 */
router.get(
  '/history',
  authMiddleware.verifyToken.bind(authMiddleware),
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      const organizationId = (req as any).user?.organizationId;
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const offset = parseInt(req.query.offset as string) || 0;

      if (!userId || !organizationId) {
        return res.status(401).json({
          error: 'User not authenticated',
        });
      }

      const result = await chatbotService.getChatHistory(
        userId,
        organizationId,
        limit,
        offset
      );

      res.json(result);
    } catch (error) {
      console.error('Error fetching chat history:', error);
      res.status(500).json({ error: 'Failed to fetch chat history' });
    }
  }
);

// ============================================================================
// ADMIN ROUTES (Chatbot management)
// ============================================================================

/**
 * GET /api/chatbot/admin/feedback-queue
 * Get feedback queue for admin dashboard
 * Requires: admin role
 */
router.get(
  '/admin/feedback-queue',
  authMiddleware.verifyToken.bind(authMiddleware),
  async (req: AuthRequest, res: Response) => {
    try {
      const organizationId = (req as any).user?.organizationId;
      const userRole = req.user?.role;

      // Check if user is admin
      if (userRole !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      if (!organizationId) {
        return res.status(401).json({
          error: 'User not authenticated',
        });
      }

      const status = req.query.status as string;
      const priority = req.query.priority as string;
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const offset = parseInt(req.query.offset as string) || 0;

      const result = await chatbotService.getFeedbackQueue(
        organizationId,
        status,
        priority,
        limit,
        offset
      );

      res.json(result);
    } catch (error) {
      console.error('Error fetching feedback queue:', error);
      res.status(500).json({ error: 'Failed to fetch feedback queue' });
    }
  }
);

/**
 * GET /api/chatbot/admin/feedback-queue/:id
 * Get a specific feedback item
 * Requires: admin role
 */
router.get(
  '/admin/feedback-queue/:id',
  authMiddleware.verifyToken.bind(authMiddleware),
  async (req: AuthRequest, res: Response) => {
    try {
      const userRole = req.user?.role;

      if (userRole !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const item = await chatbotService.getFeedbackItem(req.params.id);
      res.json(item);
    } catch (error) {
      console.error('Error fetching feedback item:', error);
      res.status(500).json({ error: 'Failed to fetch feedback item' });
    }
  }
);

/**
 * PATCH /api/chatbot/admin/feedback-queue/:id
 * Update feedback item status and admin action
 * Requires: admin role
 */
router.patch(
  '/admin/feedback-queue/:id',
  authMiddleware.verifyToken.bind(authMiddleware),
  async (req: AuthRequest, res: Response) => {
    try {
      const userRole = req.user?.role;
      const userId = req.user?.userId;

      if (userRole !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const { status, adminAction, assignedTo } = req.body;

      if (!status) {
        return res.status(400).json({ error: 'status is required' });
      }

      const item = await chatbotService.updateFeedbackItem(
        req.params.id,
        status,
        adminAction,
        assignedTo || userId
      );

      res.json(item);
    } catch (error) {
      console.error('Error updating feedback item:', error);
      res.status(500).json({ error: 'Failed to update feedback item' });
    }
  }
);

/**
 * POST /api/chatbot/admin/feedback-queue/:id/resolve
 * Resolve a feedback item
 * Requires: admin role
 */
router.post(
  '/admin/feedback-queue/:id/resolve',
  authMiddleware.verifyToken.bind(authMiddleware),
  async (req: AuthRequest, res: Response) => {
    try {
      const userRole = req.user?.role;

      if (userRole !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const { adminAction, updatedResponseId } = req.body;

      if (!adminAction) {
        return res.status(400).json({ error: 'adminAction is required' });
      }

      const item = await chatbotService.resolveFeedbackItem(
        req.params.id,
        adminAction,
        updatedResponseId
      );

      res.json(item);
    } catch (error) {
      console.error('Error resolving feedback item:', error);
      res.status(500).json({ error: 'Failed to resolve feedback item' });
    }
  }
);

/**
 * POST /api/chatbot/admin/responses
 * Create or update a chatbot response pattern
 * Requires: admin role
 */
router.post(
  '/admin/responses',
  authMiddleware.verifyToken.bind(authMiddleware),
  async (req: AuthRequest, res: Response) => {
    try {
      const userRole = req.user?.role;
      const organizationId = (req as any).user?.organizationId;
      const userId = req.user?.userId;

      if (userRole !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const { questionPattern, response, category, priority } = req.body;

      if (!questionPattern || !response) {
        return res.status(400).json({
          error: 'questionPattern and response are required',
        });
      }

      const chatbotResponse = await chatbotService.saveChatbotResponse(
        organizationId,
        questionPattern,
        response,
        category,
        priority || 0,
        userId
      );

      res.status(201).json(chatbotResponse);
    } catch (error) {
      console.error('Error saving chatbot response:', error);
      res.status(500).json({ error: 'Failed to save chatbot response' });
    }
  }
);

/**
 * GET /api/chatbot/admin/responses
 * Get chatbot response patterns
 * Requires: admin role
 */
router.get(
  '/admin/responses',
  authMiddleware.verifyToken.bind(authMiddleware),
  async (req: AuthRequest, res: Response) => {
    try {
      const userRole = req.user?.role;
      const organizationId = (req as any).user?.organizationId;

      if (userRole !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const category = req.query.category as string;
      const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);
      const offset = parseInt(req.query.offset as string) || 0;

      const result = await chatbotService.getChatbotResponses(
        organizationId,
        category,
        limit,
        offset
      );

      res.json(result);
    } catch (error) {
      console.error('Error fetching chatbot responses:', error);
      res.status(500).json({ error: 'Failed to fetch chatbot responses' });
    }
  }
);

/**
 * GET /api/chatbot/admin/stats
 * Get chatbot performance statistics
 * Requires: admin role
 */
router.get(
  '/admin/stats',
  authMiddleware.verifyToken.bind(authMiddleware),
  async (req: AuthRequest, res: Response) => {
    try {
      const userRole = req.user?.role;
      const organizationId = (req as any).user?.organizationId;

      if (userRole !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const stats = await chatbotService.getChatbotStats(organizationId);
      res.json(stats);
    } catch (error) {
      console.error('Error fetching chatbot stats:', error);
      res.status(500).json({ error: 'Failed to fetch chatbot stats' });
    }
  }
);

export default router;
