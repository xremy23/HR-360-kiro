import { Router, Response } from 'express';
import { AuthRequest, authMiddleware, adminMiddleware } from '../middleware/auth';
import { sendSuccess, sendError } from '../utils/response';
import pushNotificationService from '../services/pushNotificationService';

const router = Router();

/**
 * POST /notifications/register-device
 * Register device token for push notifications
 */
router.post('/register-device', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'UNAUTHORIZED', 'User not found', 401);
    }

    const { token, platform, deviceName } = req.body;

    if (!token || !platform) {
      return sendError(res, 'INVALID_DATA', 'token and platform are required', 400);
    }

    if (!['ios', 'android', 'web'].includes(platform)) {
      return sendError(res, 'INVALID_DATA', 'platform must be ios, android, or web', 400);
    }

    await pushNotificationService.registerDeviceToken(req.user.id, token, platform, deviceName);

    return sendSuccess(res, {}, 'Device token registered successfully', 200);
  } catch (error) {
    console.error('Register device error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to register device token', 500);
  }
});

/**
 * POST /notifications/unregister-device
 * Unregister device token
 */
router.post('/unregister-device', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return sendError(res, 'INVALID_DATA', 'token is required', 400);
    }

    await pushNotificationService.unregisterDeviceToken(token);

    return sendSuccess(res, {}, 'Device token unregistered successfully', 200);
  } catch (error) {
    console.error('Unregister device error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to unregister device token', 500);
  }
});

/**
 * GET /notifications/devices
 * Get user's registered devices
 */
router.get('/devices', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'UNAUTHORIZED', 'User not found', 401);
    }

    const devices = await pushNotificationService.getUserDeviceTokens(req.user.id);

    return sendSuccess(res, devices, 'Devices retrieved successfully', 200);
  } catch (error) {
    console.error('Get devices error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to get devices', 500);
  }
});

/**
 * GET /notifications
 * Get notification history
 */
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'UNAUTHORIZED', 'User not found', 401);
    }

    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    const notifications = await pushNotificationService.getNotificationHistory(
      req.user.id,
      limit,
      offset
    );

    return sendSuccess(res, notifications, 'Notifications retrieved successfully', 200);
  } catch (error) {
    console.error('Get notifications error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to get notifications', 500);
  }
});

/**
 * GET /notifications/unread
 * Get unread notifications
 */
router.get('/unread', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'UNAUTHORIZED', 'User not found', 401);
    }

    const notifications = await pushNotificationService.getUnreadNotifications(req.user.id);

    return sendSuccess(res, notifications, 'Unread notifications retrieved successfully', 200);
  } catch (error) {
    console.error('Get unread notifications error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to get unread notifications', 500);
  }
});

/**
 * GET /notifications/unread-count
 * Get unread notification count
 */
router.get('/unread-count', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'UNAUTHORIZED', 'User not found', 401);
    }

    const count = await pushNotificationService.getUnreadCount(req.user.id);

    return sendSuccess(res, { count }, 'Unread count retrieved successfully', 200);
  } catch (error) {
    console.error('Get unread count error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to get unread count', 500);
  }
});

/**
 * GET /notifications/stats
 * Get notification statistics
 */
router.get('/stats', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'UNAUTHORIZED', 'User not found', 401);
    }

    const stats = await pushNotificationService.getNotificationStats(req.user.id);

    return sendSuccess(res, stats, 'Notification stats retrieved successfully', 200);
  } catch (error) {
    console.error('Get stats error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to get notification stats', 500);
  }
});

/**
 * PUT /notifications/:id/read
 * Mark notification as read
 */
router.put('/:id/read', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const notification = await pushNotificationService.markNotificationAsRead(id);

    return sendSuccess(res, notification, 'Notification marked as read', 200);
  } catch (error) {
    console.error('Mark as read error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to mark notification as read', 500);
  }
});

/**
 * PUT /notifications/read-multiple
 * Mark multiple notifications as read
 */
router.put('/read-multiple', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { notificationIds } = req.body;

    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      return sendError(res, 'INVALID_DATA', 'notificationIds array is required', 400);
    }

    const count = await pushNotificationService.markMultipleNotificationsAsRead(notificationIds);

    return sendSuccess(res, { count }, 'Notifications marked as read', 200);
  } catch (error) {
    console.error('Mark multiple as read error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to mark notifications as read', 500);
  }
});

/**
 * POST /notifications/send-test
 * Send test notification (admin only)
 */
router.post('/send-test', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'UNAUTHORIZED', 'User not found', 401);
    }


    if (req.user.role !== 'admin') {
      return sendError(res, 'FORBIDDEN', 'Only admins can send test notifications', 403);
    }
    const { title, body, data, type } = req.body;

    if (!title || !body) {
      return sendError(res, 'INVALID_DATA', 'title and body are required', 400);
    }

    const notification = await pushNotificationService.sendPushNotification({
      userId: req.user.id,
      title,
      body,
      data,
      type: type || 'custom',
    });

    return sendSuccess(res, notification, 'Test notification sent successfully', 201);
  } catch (error) {
    console.error('Send test notification error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to send test notification', 500);
  }
});

export default router;
