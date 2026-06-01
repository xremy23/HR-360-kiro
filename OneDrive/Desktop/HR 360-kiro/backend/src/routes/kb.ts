/**
 * Knowledge Base Routes
 * Handles KB guides and categories
 */

import express, { Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';
import { kbService } from '../services/kbService';
import { userService } from '../services/userService';
import { logger } from '../services/monitoringService';

const router = express.Router();

/**
 * GET /api/kb/guides
 * Get all guides for organization
 */
router.get(
  '/guides',
  authMiddleware.verifyToken.bind(authMiddleware),
  async (req: AuthRequest, res: Response, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: { code: 'NOT_AUTHENTICATED', message: 'User not authenticated' },
        });
      }

      const user = await userService.getUserById(req.user.userId);
      if (!user || !user.organizationId) {
        return res.status(400).json({
          success: false,
          error: { code: 'NO_ORGANIZATION', message: 'User is not part of an organization' },
        });
      }

      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 20;
      const search = req.query.search as string;
      const categoryId = req.query.categoryId as string;
      const isPublished = req.query.isPublished !== 'false';

      const { guides, total } = await kbService.getGuides(user.organizationId, {
        page,
        pageSize,
        search,
        categoryId,
        isPublished,
      });

      res.json({
        success: true,
        data: guides,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      });
    } catch (error) {
      logger.error('Failed to get guides', { error, userId: req.user?.userId });
      next(error);
    }
  }
);

/**
 * GET /api/kb/guides/:id
 * Get guide by ID
 */
router.get(
  '/guides/:id',
  authMiddleware.verifyToken.bind(authMiddleware),
  async (req: AuthRequest, res: Response, next) => {
    try {
      const { id } = req.params;

      const guide = await kbService.getGuideById(id);

      if (!guide) {
        return res.status(404).json({
          success: false,
          error: { code: 'GUIDE_NOT_FOUND', message: 'Guide not found' },
        });
      }

      res.json({ success: true, data: guide });
    } catch (error) {
      logger.error('Failed to get guide', { error, guideId: req.params.id });
      next(error);
    }
  }
);

/**
 * POST /api/kb/guides
 * Create guide (admin/hr only)
 */
router.post(
  '/guides',
  authMiddleware.verifyToken.bind(authMiddleware),
  authMiddleware.requireRole('admin', 'hr'),
  async (req: AuthRequest, res: Response, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: { code: 'NOT_AUTHENTICATED', message: 'User not authenticated' },
        });
      }

      const user = await userService.getUserById(req.user.userId);
      if (!user || !user.organizationId) {
        return res.status(400).json({
          success: false,
          error: { code: 'NO_ORGANIZATION', message: 'User is not part of an organization' },
        });
      }

      const { title, description, content, author, tags, categoryId, isPublished } = req.body;

      if (!title || !description || !content) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'Missing required fields' },
        });
      }

      const guide = await kbService.createGuide({
        organizationId: user.organizationId,
        title,
        description,
        content,
        author: author || req.user.email,
        tags,
        categoryId,
        isPublished,
      });

      logger.info('Guide created', { guideId: guide.id, createdBy: req.user.userId });

      res.status(201).json({ success: true, data: guide });
    } catch (error) {
      logger.error('Failed to create guide', { error, userId: req.user?.userId });
      next(error);
    }
  }
);

/**
 * PUT /api/kb/guides/:id
 * Update guide (admin/hr only)
 */
router.put(
  '/guides/:id',
  authMiddleware.verifyToken.bind(authMiddleware),
  authMiddleware.requireRole('admin', 'hr'),
  async (req: AuthRequest, res: Response, next) => {
    try {
      const { id } = req.params;
      const { title, description, content, author, tags, isPublished, isActive } = req.body;

      const guide = await kbService.updateGuide(id, {
        title,
        description,
        content,
        author,
        tags,
        isPublished,
        isActive,
      });

      if (!guide) {
        return res.status(404).json({
          success: false,
          error: { code: 'GUIDE_NOT_FOUND', message: 'Guide not found' },
        });
      }

      logger.info('Guide updated', { guideId: id, updatedBy: req.user?.userId });

      res.json({ success: true, data: guide });
    } catch (error) {
      logger.error('Failed to update guide', { error, guideId: req.params.id });
      next(error);
    }
  }
);

/**
 * DELETE /api/kb/guides/:id
 * Delete guide (admin only)
 */
router.delete(
  '/guides/:id',
  authMiddleware.verifyToken.bind(authMiddleware),
  authMiddleware.requireRole('admin'),
  async (req: AuthRequest, res: Response, next) => {
    try {
      const { id } = req.params;

      await kbService.deleteGuide(id);

      logger.info('Guide deleted', { guideId: id, deletedBy: req.user?.userId });

      res.json({ success: true, message: 'Guide deleted successfully' });
    } catch (error) {
      logger.error('Failed to delete guide', { error, guideId: req.params.id });
      next(error);
    }
  }
);

/**
 * GET /api/kb/categories
 * Get categories for organization
 */
router.get(
  '/categories',
  authMiddleware.verifyToken.bind(authMiddleware),
  async (req: AuthRequest, res: Response, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: { code: 'NOT_AUTHENTICATED', message: 'User not authenticated' },
        });
      }

      const user = await userService.getUserById(req.user.userId);
      if (!user || !user.organizationId) {
        return res.status(400).json({
          success: false,
          error: { code: 'NO_ORGANIZATION', message: 'User is not part of an organization' },
        });
      }

      const categories = await kbService.getCategories(user.organizationId);

      res.json({ success: true, data: categories });
    } catch (error) {
      logger.error('Failed to get categories', { error, userId: req.user?.userId });
      next(error);
    }
  }
);

/**
 * POST /api/kb/categories
 * Create category (admin/hr only)
 */
router.post(
  '/categories',
  authMiddleware.verifyToken.bind(authMiddleware),
  authMiddleware.requireRole('admin', 'hr'),
  async (req: AuthRequest, res: Response, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: { code: 'NOT_AUTHENTICATED', message: 'User not authenticated' },
        });
      }

      const user = await userService.getUserById(req.user.userId);
      if (!user || !user.organizationId) {
        return res.status(400).json({
          success: false,
          error: { code: 'NO_ORGANIZATION', message: 'User is not part of an organization' },
        });
      }

      const { name, description, icon, order } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'Category name is required' },
        });
      }

      const category = await kbService.createCategory({
        organizationId: user.organizationId,
        name,
        description,
        icon,
        order,
      });

      logger.info('Category created', { categoryId: category.id, createdBy: req.user.userId });

      res.status(201).json({ success: true, data: category });
    } catch (error) {
      logger.error('Failed to create category', { error, userId: req.user?.userId });
      next(error);
    }
  }
);

/**
 * POST /api/kb/guides/:id/acknowledge
 * Acknowledge guide
 */
router.post(
  '/guides/:id/acknowledge',
  authMiddleware.verifyToken.bind(authMiddleware),
  async (req: AuthRequest, res: Response, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: { code: 'NOT_AUTHENTICATED', message: 'User not authenticated' },
        });
      }

      const { id } = req.params;

      const acknowledgment = await kbService.acknowledgeGuide(req.user.userId, id);

      logger.info('Guide acknowledged', { guideId: id, userId: req.user.userId });

      res.json({ success: true, data: acknowledgment });
    } catch (error) {
      logger.error('Failed to acknowledge guide', { error, guideId: req.params.id });
      next(error);
    }
  }
);

export default router;
