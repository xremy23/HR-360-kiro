/**
 * Alert Routes
 * Handles alert management and notifications
 */

import express, { Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';
import { alertService } from '../services/alertService';
import { userService } from '../services/userService';
import { logger } from '../services/monitoringService';

const router = express.Router();

/**
 * GET /api/alerts
 * Get alerts for organization
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
      const severity = req.query.severity as string;
      const isDrill = req.query.isDrill === 'true';

      const { alerts, total } = await alertService.getAlerts(user.organizationId, {
        page,
        pageSize,
        severity,
        isDrill,
      });

      res.json({
        success: true,
        data: alerts,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      });
    } catch (error) {
      logger.error('Failed to get alerts', { error, userId: req.user?.userId });
      next(error);
    }
  }
);

/**
 * GET /api/alerts/:id
 * Get alert by ID
 */
router.get(
  '/:id',
  authMiddleware.verifyToken.bind(authMiddleware),
  async (req: AuthRequest, res: Response, next) => {
    try {
      const { id } = req.params;

      const alert = await alertService.getAlertById(id);

      if (!alert) {
        return res.status(404).json({
          success: false,
          error: { code: 'ALERT_NOT_FOUND', message: 'Alert not found' },
        });
      }

      res.json({ success: true, data: alert });
    } catch (error) {
      logger.error('Failed to get alert', { error, alertId: req.params.id });
      next(error);
    }
  }
);

/**
 * POST /api/alerts
 * Create alert (admin/hr only)
 */
router.post(
  '/',
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

      const { title, description, severity, type, isDrill } = req.body;

      if (!title || !description || !severity || !type) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'Missing required fields' },
        });
      }

      const validSeverities = ['low', 'medium', 'high', 'critical'];
      if (!validSeverities.includes(severity)) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_SEVERITY', message: 'Invalid severity level' },
        });
      }

      const alert = await alertService.createAlert({
        organizationId: user.organizationId,
        title,
        description,
        severity,
        type,
        createdBy: req.user.userId,
        isDrill: isDrill ?? false,
      });

      logger.info('Alert created', { alertId: alert.id, createdBy: req.user.userId });

      res.status(201).json({ success: true, data: alert });
    } catch (error) {
      logger.error('Failed to create alert', { error, userId: req.user?.userId });
      next(error);
    }
  }
);

/**
 * PUT /api/alerts/:id
 * Update alert (admin/hr only)
 */
router.put(
  '/:id',
  authMiddleware.verifyToken.bind(authMiddleware),
  authMiddleware.requireRole('admin', 'hr'),
  async (req: AuthRequest, res: Response, next) => {
    try {
      const { id } = req.params;
      const { title, description, severity, type, isDrill, isActive } = req.body;

      if (severity) {
        const validSeverities = ['low', 'medium', 'high', 'critical'];
        if (!validSeverities.includes(severity)) {
          return res.status(400).json({
            success: false,
            error: { code: 'INVALID_SEVERITY', message: 'Invalid severity level' },
          });
        }
      }

      const alert = await alertService.updateAlert(id, {
        title,
        description,
        severity,
        type,
        isDrill,
        isActive,
      });

      if (!alert) {
        return res.status(404).json({
          success: false,
          error: { code: 'ALERT_NOT_FOUND', message: 'Alert not found' },
        });
      }

      logger.info('Alert updated', { alertId: id, updatedBy: req.user?.userId });

      res.json({ success: true, data: alert });
    } catch (error) {
      logger.error('Failed to update alert', { error, alertId: req.params.id });
      next(error);
    }
  }
);

/**
 * DELETE /api/alerts/:id
 * Delete alert (admin only)
 */
router.delete(
  '/:id',
  authMiddleware.verifyToken.bind(authMiddleware),
  authMiddleware.requireRole('admin'),
  async (req: AuthRequest, res: Response, next) => {
    try {
      const { id } = req.params;

      await alertService.deleteAlert(id);

      logger.info('Alert deleted', { alertId: id, deletedBy: req.user?.userId });

      res.json({ success: true, message: 'Alert deleted successfully' });
    } catch (error) {
      logger.error('Failed to delete alert', { error, alertId: req.params.id });
      next(error);
    }
  }
);

/**
 * POST /api/alerts/:id/acknowledge
 * Acknowledge alert
 */
router.post(
  '/:id/acknowledge',
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

      const acknowledgment = await alertService.acknowledgeAlert(id, req.user.userId);

      logger.info('Alert acknowledged', { alertId: id, userId: req.user.userId });

      res.json({ success: true, data: acknowledgment });
    } catch (error) {
      logger.error('Failed to acknowledge alert', { error, alertId: req.params.id });
      next(error);
    }
  }
);

/**
 * GET /api/alerts/:id/recipients
 * Get alert recipients
 */
router.get(
  '/:id/recipients',
  authMiddleware.verifyToken.bind(authMiddleware),
  authMiddleware.requireRole('admin', 'hr'),
  async (req: AuthRequest, res: Response, next) => {
    try {
      const { id } = req.params;

      const recipients = await alertService.getAlertRecipients(id);

      res.json({ success: true, data: recipients });
    } catch (error) {
      logger.error('Failed to get alert recipients', { error, alertId: req.params.id });
      next(error);
    }
  }
);

/**
 * GET /api/alerts/notifications
 * Get user notifications
 */
router.get(
  '/notifications',
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
      const unreadOnly = req.query.unreadOnly === 'true';

      const { notifications, total } = await alertService.getUserNotifications(req.user.userId, {
        page,
        pageSize,
        unreadOnly,
      });

      res.json({
        success: true,
        data: notifications,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      });
    } catch (error) {
      logger.error('Failed to get notifications', { error, userId: req.user?.userId });
      next(error);
    }
  }
);

/**
 * PUT /api/alerts/notifications/:notificationId/read
 * Mark notification as read
 */
router.put(
  '/notifications/:notificationId/read',
  authMiddleware.verifyToken.bind(authMiddleware),
  async (req: AuthRequest, res: Response, next) => {
    try {
      const { notificationId } = req.params;

      await alertService.markNotificationAsRead(notificationId);

      logger.info('Notification marked as read', { notificationId });

      res.json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
      logger.error('Failed to mark notification as read', { error, notificationId: req.params.notificationId });
      next(error);
    }
  }
);

export default router;
