import { Router, Response } from 'express';
import { sendSuccess, sendError, sendPaginated } from '../utils/response';
import { AuthRequest, authMiddleware, adminMiddleware } from '../middleware/auth';
import { validateAlertSeverity } from '../utils/validators';
import { AlertEntity, NotificationEntity, UserEntity, OrganizationEntity } from '../entities';
import { getWebSocketServer } from '../websocket/server';
import { pushNotificationService } from '../services/pushNotificationService';

const router = Router();

/**
 * GET /alerts
 * Get alerts
 */
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
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

    const alerts = await AlertEntity.findByOrgId(orgId as string, isDrill === 'true', severity as string);
    const total = alerts.length;
    const paginated = alerts.slice(offset, offset + limit);

    return sendPaginated(res, paginated, total, limit, offset, 200);
  } catch (error) {
    console.error('Get alerts error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to retrieve alerts', 500);
  }
});

/**
 * POST /alerts/broadcast
 * Broadcast alert (Admin)
 */
router.post('/broadcast', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
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

    const alert = await AlertEntity.create({
      orgId: req.user.orgId,
      teamIds: teamIds || [],
      title,
      message,
      severity,
      type,
      createdBy: req.user.id,
      isDrill: isDrill || false,
    });

    // Get organization members for notification
    const org = await OrganizationEntity.findById(req.user.orgId);
    const members = org ? await UserEntity.findByOrgId(req.user.orgId) : [];
    const memberIds = members.map((m) => m.id);

    // Send push notifications
    try {
      await pushNotificationService.sendAlertNotification(
        memberIds,
        title,
        message,
        severity
      );
      console.log(`Push notifications sent to ${memberIds.length} members for alert ${alert.id}`);
    } catch (pushError) {
      console.warn('Push notification failed:', pushError);
      // Don't fail the request if push notifications fail
    }

    // Broadcast via WebSocket
    try {
      const wsServer = getWebSocketServer();
      wsServer.broadcastAlertCreated(alert);
      wsServer.broadcastNotificationToOrganization(req.user.orgId, {
        type: 'alert',
        alertId: alert.id,
        title,
        message,
        severity,
      });
    } catch (wsError) {
      console.warn('WebSocket broadcast failed:', wsError);
      // Don't fail the request if WebSocket fails
    }

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
router.get('/:id/notifications', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const notifications = await NotificationEntity.findByAlertId(id);

    const formattedNotifications = await Promise.all(
      notifications.map(async (n) => {
        const user = await UserEntity.findById(n.userId);
        return {
          id: n.id,
          userId: n.userId,
          userName: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
          isRead: n.isRead,
          readAt: n.readAt,
          createdAt: n.createdAt,
        };
      })
    );

    return sendSuccess(res, formattedNotifications, 'Notifications retrieved successfully', 200);
  } catch (error) {
    console.error('Get notifications error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to retrieve notifications', 500);
  }
});

/**
 * PUT /alerts/:id/notifications/:nId
 * Mark notification as read
 */
router.put('/:id/notifications/:nId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id, nId } = req.params;

    const notification = await NotificationEntity.findById(nId);

    if (!notification) {
      return sendError(res, 'NOTIFICATION_NOT_FOUND', 'Notification not found', 404);
    }

    const updated = await NotificationEntity.markAsRead(nId);

    return sendSuccess(res, updated, 'Notification marked as read', 200);
  } catch (error) {
    console.error('Mark notification error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to mark notification', 500);
  }
});

export default router;
