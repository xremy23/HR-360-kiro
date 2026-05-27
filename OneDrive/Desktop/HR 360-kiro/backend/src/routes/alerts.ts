import { Router, Response } from 'express';
import { sendSuccess, sendError, sendPaginated } from '../utils/response';
import { AuthRequest, authMiddleware, adminMiddleware } from '../middleware/auth';
import { validateAlertSeverity } from '../utils/validators';
import { AlertEntity } from '../entities';
import { getWebSocketServer } from '../websocket/server';

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

    // Broadcast via WebSocket
    try {
      const wsServer = getWebSocketServer();
      wsServer.broadcastAlertCreated(alert);
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

    // Note: Notification retrieval would require additional entity methods
    // For now, returning empty array as placeholder
    const notifications: any[] = [];

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
router.put('/:id/notifications/:nId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id, nId } = req.params;

    // Note: Notification update would require additional entity methods
    // For now, returning success as placeholder
    return sendSuccess(res, {}, 'Notification marked as read', 200);
  } catch (error) {
    console.error('Mark notification error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to mark notification', 500);
  }
});

export default router;
