import { Router, Response } from 'express';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest, authMiddleware, adminMiddleware } from '../middleware/auth';
import { SOSEscalationEntity, UserEntity, OrganizationEntity } from '../entities';
import { getWebSocketServer } from '../websocket/server';
import { pushNotificationService } from '../services/pushNotificationService';

const router = Router();

/**
 * POST /sos
 * Trigger SOS
 */
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'USER_NOT_FOUND', 'User not found', 404);
    }

    const { notes } = req.body;

    const sos = await SOSEscalationEntity.create({
      userId: req.user.id,
      notes,
      status: 'pending',
    });

    // Get user details for notification
    const user = await UserEntity.findById(req.user.id);
    const userName = user ? `${user.firstName} ${user.lastName}` : 'Unknown User';

    // Get organization members for notification
    const org = await OrganizationEntity.findById(req.user.orgId);
    const members = org ? await UserEntity.findByOrgId(req.user.orgId) : [];
    const memberIds = members
      .filter((m) => m.id !== req.user?.id) // Don't notify the SOS initiator
      .map((m) => m.id);

    // Send push notifications
    try {
      await pushNotificationService.sendSOSNotification(
        memberIds,
        req.user.id,
        userName
      );
      console.log(`SOS push notifications sent to ${memberIds.length} members`);
    } catch (pushError) {
      console.warn('Push notification failed:', pushError);
      // Don't fail the request if push notifications fail
    }

    // Broadcast via WebSocket
    try {
      const wsServer = getWebSocketServer();
      wsServer.broadcastSOSCreated(sos);
      wsServer.broadcastNotificationToOrganization(req.user.orgId, {
        type: 'sos',
        sosId: sos.id,
        userId: req.user.id,
        userName,
        notes,
      });
    } catch (wsError) {
      console.warn('WebSocket broadcast failed:', wsError);
      // Don't fail the request if WebSocket fails
    }

    return sendSuccess(res, sos, 'SOS triggered successfully', 201);
  } catch (error) {
    console.error('Trigger SOS error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to trigger SOS', 500);
  }
});

/**
 * GET /sos/escalations
 * Get SOS escalations (Admin)
 */
router.get('/escalations', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'USER_NOT_FOUND', 'User not found', 404);
    }

    const { orgId } = req.query;

    if (!orgId) {
      return sendError(res, 'INVALID_ORG', 'Organization ID required', 400);
    }

    const escalations = await SOSEscalationEntity.findByOrgId(orgId as string);

    const formattedEscalations = await Promise.all(
      escalations.map(async (s) => {
        const user = await UserEntity.findById(s.userId);
        return {
          id: s.id,
          userId: s.userId,
          userName: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
          initiatedAt: s.initiatedAt,
          status: s.status,
          managerNotifiedAt: s.managerNotifiedAt,
        };
      })
    );

    return sendSuccess(res, formattedEscalations, 'SOS escalations retrieved successfully', 200);
  } catch (error) {
    console.error('Get SOS escalations error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to retrieve SOS escalations', 500);
  }
});

export default router;
