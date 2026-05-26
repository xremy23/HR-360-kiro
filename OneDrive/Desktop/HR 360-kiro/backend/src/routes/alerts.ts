import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { sendSuccess, sendError, sendPaginated } from '../utils/response';
import { AuthRequest, authMiddleware, adminMiddleware } from '../middleware/auth';
import { validateAlertSeverity } from '../utils/validators';

const router = Router();

// Mock database
const alerts: any[] = [];
const alertNotifications: any[] = [];

/**
 * GET /alerts
 * Get alerts
 */
router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'USER_NOT_FOUND', 'User not found', 404);
    }

    const { orgId, isDrill, severity } = req.query;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    if (!orgId) {
      return sendError(res, 'INVALID_ORG', 'Organization ID required', 400);
    }

    // TODO: Fetch from database with filters
    let filtered = alerts.filter((a) => a.orgId === orgId);
    if (isDrill !== undefined) filtered = filtered.filter((a) => a.isDrill === (isDrill === 'true'));
    if (severity) filtered = filtered.filter((a) => a.severity === severity);

    const paginated = filtered.slice(offset, offset + limit);

    return sendPaginated(res, paginated, filtered.length, limit, offset, 200);
  } catch (error) {
    console.error('Get alerts error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to retrieve alerts', 500);
  }
});

/**
 * POST /alerts/broadcast
 * Broadcast alert (Admin)
 */
router.post('/broadcast', authMiddleware, adminMiddleware, (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'USER_NOT_FOUND', 'User not found', 404);
    }

    const { title, message, severity, type, teamIds, isDrill } = req.body;

    if (!title || !message || !severity || !type) {
      return sendError(res, 'INVALID_INPUT', 'Missing required fields', 400);
    }

    if (!validateAlertSeverity(severity)) {
      return sendError(res, 'INVALID_SEVERITY', 'Invalid severity level', 400);
    }

    const alert = {
      id: uuidv4(),
      orgId: req.user.orgId,
      teamIds: teamIds || [],
      title,
      message,
      severity,
      type,
      createdBy: req.user.id,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      isDrill: isDrill || false,
    };

    alerts.push(alert);

    // TODO: Create notifications for all users in teams
    // TODO: Broadcast via WebSocket

    return sendSuccess(res, alert, 'Alert broadcast successfully', 201);
  } catch (error) {
    console.error('Broadcast alert error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to broadcast alert', 500);
  }
});

/**
 * GET /alerts/:id/notifications
 * Get alert notifications
 */
router.get('/:id/notifications', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // TODO: Fetch from database
    const notifications = alertNotifications.filter((n) => n.alertId === id);

    return sendSuccess(res, notifications, 'Notifications retrieved successfully', 200);
  } catch (error) {
    console.error('Get notifications error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to retrieve notifications', 500);
  }
});

/**
 * PUT /alerts/:id/notifications/:nId
 * Mark notification as read
 */
router.put('/:id/notifications/:nId', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { id, nId } = req.params;

    // TODO: Update in database
    const notification = alertNotifications.find((n) => n.id === nId && n.alertId === id);

    if (!notification) {
      return sendError(res, 'NOTIFICATION_NOT_FOUND', 'Notification not found', 404);
    }

    notification.read = true;
    notification.readAt = new Date();

    return sendSuccess(res, {}, 'Notification marked as read', 200);
  } catch (error) {
    console.error('Mark notification error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to mark notification', 500);
  }
});

export default router;
