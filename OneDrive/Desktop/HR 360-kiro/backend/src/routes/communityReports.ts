/**
 * Community Reports Routes
 * Handles crowd-sourced hazard reporting
 */

import express, { Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';
import { communityReportService } from '../services/communityReportService';
import { userService } from '../services/userService';
import { logger } from '../services/monitoringService';

const router = express.Router();

/**
 * GET /api/community-reports
 * Get all community reports for the organization
 * Query params: category, severity, page, pageSize
 */
router.get(
  '/',
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
      const category = req.query.category as string;
      const severity = req.query.severity as string;

      const offset = (page - 1) * pageSize;

      const { reports, total } = await communityReportService.getReportsByOrgId(user.organizationId, {
        category,
        severity,
        limit: pageSize,
        offset,
      });

      res.json({
        success: true,
        data: reports,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      });
    } catch (error) {
      logger.error('Failed to get community reports', { error, userId: req.user?.userId });
      next(error);
    }
  }
);

/**
 * GET /api/community-reports/user/mine
 * Get reports created by the current user
 */
router.get(
  '/user/mine',
  authMiddleware.verifyToken.bind(authMiddleware),
  async (req: AuthRequest, res: Response, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: { code: 'NOT_AUTHENTICATED', message: 'User not authenticated' },
        });
      }

      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 20;
      const offset = (page - 1) * pageSize;

      const reports = await communityReportService.getReportsByUserId(req.user.userId, {
        limit: pageSize,
        offset,
      });

      res.json({
        success: true,
        data: reports,
        pagination: {
          page,
          pageSize,
          total: reports.length,
          totalPages: Math.ceil(reports.length / pageSize),
        },
      });
    } catch (error) {
      logger.error('Failed to get user community reports', { error, userId: req.user?.userId });
      next(error);
    }
  }
);

/**
 * GET /api/community-reports/:id
 * Get a specific community report
 */
router.get(
  '/:id',
  authMiddleware.verifyToken.bind(authMiddleware),
  async (req: AuthRequest, res: Response, next) => {
    try {
      const { id } = req.params;

      const report = await communityReportService.getReportById(id);

      if (!report) {
        return res.status(404).json({
          success: false,
          error: { code: 'REPORT_NOT_FOUND', message: 'Community report not found' },
        });
      }

      res.json({ success: true, data: report });
    } catch (error) {
      logger.error('Failed to get community report', { error, reportId: req.params.id });
      next(error);
    }
  }
);

/**
 * POST /api/community-reports
 * Create a new community report
 */
router.post(
  '/',
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

      const { title, description, category, severity, location, imageUrls } = req.body;

      // Validation
      if (!title || !description) {
        return res.status(400).json({
          success: false,
          error: { code: 'MISSING_FIELDS', message: 'Title and description are required' },
        });
      }

      const report = await communityReportService.createReport(user.organizationId, req.user.userId, {
        title,
        description,
        category: category || 'other',
        severity: severity || 'medium',
        location,
        imageUrls,
      });

      res.status(201).json({ success: true, data: report });
    } catch (error) {
      logger.error('Failed to create community report', { error, userId: req.user?.userId });
      next(error);
    }
  }
);

/**
 * PUT /api/community-reports/:id
 * Update a community report (creator only)
 */
router.put(
  '/:id',
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
      const { title, description, category, severity, status, location, imageUrls } = req.body;

      const report = await communityReportService.updateReport(id, req.user.userId, {
        title,
        description,
        category,
        severity,
        status,
        location,
        imageUrls,
      });

      if (!report) {
        return res.status(404).json({
          success: false,
          error: { code: 'REPORT_NOT_FOUND', message: 'Community report not found' },
        });
      }

      res.json({ success: true, data: report });
    } catch (error: any) {
      if (error.message === 'Unauthorized to update this report') {
        return res.status(403).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: error.message },
        });
      }

      logger.error('Failed to update community report', { error, reportId: req.params.id, userId: req.user?.userId });
      next(error);
    }
  }
);

/**
 * DELETE /api/community-reports/:id
 * Delete a community report (creator only)
 */
router.delete(
  '/:id',
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

      const deleted = await communityReportService.deleteReport(id, req.user.userId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: { code: 'REPORT_NOT_FOUND', message: 'Community report not found' },
        });
      }

      res.json({ success: true, message: 'Report deleted successfully' });
    } catch (error: any) {
      if (error.message === 'Unauthorized to delete this report') {
        return res.status(403).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: error.message },
        });
      }

      logger.error('Failed to delete community report', { error, reportId: req.params.id, userId: req.user?.userId });
      next(error);
    }
  }
);

/**
 * POST /api/community-reports/:id/upvote
 * Upvote a community report
 */
router.post(
  '/:id/upvote',
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

      const report = await communityReportService.upvoteReport(id, req.user.userId);

      if (!report) {
        return res.status(404).json({
          success: false,
          error: { code: 'REPORT_NOT_FOUND', message: 'Community report not found' },
        });
      }

      res.json({ success: true, data: report });
    } catch (error) {
      logger.error('Failed to upvote community report', { error, reportId: req.params.id, userId: req.user?.userId });
      next(error);
    }
  }
);

/**
 * DELETE /api/community-reports/:id/upvote
 * Remove upvote from a community report
 */
router.delete(
  '/:id/upvote',
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

      const report = await communityReportService.removeUpvote(id, req.user.userId);

      if (!report) {
        return res.status(404).json({
          success: false,
          error: { code: 'REPORT_NOT_FOUND', message: 'Community report not found' },
        });
      }

      res.json({ success: true, data: report });
    } catch (error) {
      logger.error('Failed to remove upvote from community report', {
        error,
        reportId: req.params.id,
        userId: req.user?.userId,
      });
      next(error);
    }
  }
);

/**
 * PUT /api/community-reports/:id/resolve
 * Resolve a community report (admin only)
 */
router.put(
  '/:id/resolve',
  authMiddleware.verifyToken.bind(authMiddleware),
  async (req: AuthRequest, res: Response, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: { code: 'NOT_AUTHENTICATED', message: 'User not authenticated' },
        });
      }

      // Check if user is admin/hr
      const user = await userService.getUserById(req.user.userId);
      if (!user || !['admin', 'hr_admin'].includes(user.role)) {
        return res.status(403).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Only admins can resolve reports' },
        });
      }

      const { id } = req.params;

      const report = await communityReportService.resolveReport(id);

      if (!report) {
        return res.status(404).json({
          success: false,
          error: { code: 'REPORT_NOT_FOUND', message: 'Community report not found' },
        });
      }

      res.json({ success: true, data: report });
    } catch (error) {
      logger.error('Failed to resolve community report', { error, reportId: req.params.id, userId: req.user?.userId });
      next(error);
    }
  }
);

export default router;
