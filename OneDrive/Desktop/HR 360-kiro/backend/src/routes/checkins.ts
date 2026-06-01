/**
 * Check-in Routes
 * Handles employee check-ins during emergencies
 */

import express, { Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';
import { checkInService } from '../services/checkInService';
import { userService } from '../services/userService';
import { logger } from '../services/monitoringService';

const router = express.Router();

/**
 * GET /api/check-ins
 * Get check-ins for organization
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
      const status = req.query.status as string;
      const incidentId = req.query.incidentId as string;
      const isDrill = req.query.isDrill === 'true';

      const { checkIns, total } = await checkInService.getCheckIns(user.organizationId, {
        page,
        pageSize,
        status,
        incidentId,
        isDrill,
      });

      res.json({
        success: true,
        data: checkIns,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      });
    } catch (error) {
      logger.error('Failed to get check-ins', { error, userId: req.user?.userId });
      next(error);
    }
  }
);

/**
 * GET /api/check-ins/:id
 * Get check-in by ID
 */
router.get(
  '/:id',
  authMiddleware.verifyToken.bind(authMiddleware),
  async (req: AuthRequest, res: Response, next) => {
    try {
      const { id } = req.params;

      const checkIn = await checkInService.getCheckInById(id);

      if (!checkIn) {
        return res.status(404).json({
          success: false,
          error: { code: 'CHECK_IN_NOT_FOUND', message: 'Check-in not found' },
        });
      }

      res.json({ success: true, data: checkIn });
    } catch (error) {
      logger.error('Failed to get check-in', { error, checkInId: req.params.id });
      next(error);
    }
  }
);

/**
 * POST /api/check-ins
 * Create check-in
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

      const { status, latitude, longitude, notes, incidentId, isDrill } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'Status is required' },
        });
      }

      const validStatuses = ['safe', 'injured', 'missing', 'unknown'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_STATUS', message: 'Invalid status' },
        });
      }

      const checkIn = await checkInService.createCheckIn({
        userId: req.user.userId,
        organizationId: user.organizationId,
        status,
        latitude,
        longitude,
        notes,
        incidentId,
        isDrill: isDrill ?? false,
      });

      logger.info('Check-in created', { checkInId: checkIn.id, userId: req.user.userId });

      res.status(201).json({ success: true, data: checkIn });
    } catch (error) {
      logger.error('Failed to create check-in', { error, userId: req.user?.userId });
      next(error);
    }
  }
);

/**
 * PUT /api/check-ins/:id
 * Update check-in
 */
router.put(
  '/:id',
  authMiddleware.verifyToken.bind(authMiddleware),
  async (req: AuthRequest, res: Response, next) => {
    try {
      const { id } = req.params;
      const { status, latitude, longitude, notes } = req.body;

      if (status) {
        const validStatuses = ['safe', 'injured', 'missing', 'unknown'];
        if (!validStatuses.includes(status)) {
          return res.status(400).json({
            success: false,
            error: { code: 'INVALID_STATUS', message: 'Invalid status' },
          });
        }
      }

      const checkIn = await checkInService.updateCheckIn(id, {
        status,
        latitude,
        longitude,
        notes,
      });

      if (!checkIn) {
        return res.status(404).json({
          success: false,
          error: { code: 'CHECK_IN_NOT_FOUND', message: 'Check-in not found' },
        });
      }

      logger.info('Check-in updated', { checkInId: id, updatedBy: req.user?.userId });

      res.json({ success: true, data: checkIn });
    } catch (error) {
      logger.error('Failed to update check-in', { error, checkInId: req.params.id });
      next(error);
    }
  }
);

/**
 * DELETE /api/check-ins/:id
 * Delete check-in
 */
router.delete(
  '/:id',
  authMiddleware.verifyToken.bind(authMiddleware),
  authMiddleware.requireRole('admin'),
  async (req: AuthRequest, res: Response, next) => {
    try {
      const { id } = req.params;

      await checkInService.deleteCheckIn(id);

      logger.info('Check-in deleted', { checkInId: id, deletedBy: req.user?.userId });

      res.json({ success: true, message: 'Check-in deleted successfully' });
    } catch (error) {
      logger.error('Failed to delete check-in', { error, checkInId: req.params.id });
      next(error);
    }
  }
);

/**
 * GET /api/check-ins/stats
 * Get check-in statistics
 */
router.get(
  '/stats',
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

      const incidentId = req.query.incidentId as string;

      const stats = await checkInService.getCheckInStats(user.organizationId, incidentId);

      res.json({ success: true, data: stats });
    } catch (error) {
      logger.error('Failed to get check-in stats', { error, userId: req.user?.userId });
      next(error);
    }
  }
);

export default router;
