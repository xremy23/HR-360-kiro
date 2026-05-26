import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest, authMiddleware, adminMiddleware } from '../middleware/auth';

const router = Router();

// Mock database
const sosEscalations: any[] = [];

/**
 * POST /sos
 * Trigger SOS
 */
router.post('/', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'USER_NOT_FOUND', 'User not found', 404);
    }

    const { notes } = req.body;

    const sos = {
      id: uuidv4(),
      userId: req.user.id,
      orgId: req.user.orgId,
      notes,
      initiatedAt: new Date(),
      status: 'pending',
      managerNotifiedAt: null,
      adminNotifiedAt: null,
    };

    sosEscalations.push(sos);

    // TODO: Save to database
    // TODO: Notify manager
    // TODO: Broadcast via WebSocket

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
router.get('/escalations', authMiddleware, adminMiddleware, (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'USER_NOT_FOUND', 'User not found', 404);
    }

    const { orgId } = req.query;

    if (!orgId) {
      return sendError(res, 'INVALID_ORG', 'Organization ID required', 400);
    }

    // TODO: Fetch from database
    const escalations = sosEscalations
      .filter((s) => s.orgId === orgId)
      .map((s) => ({
        id: s.id,
        userId: s.userId,
        userName: 'User Name', // TODO: Get from database
        initiatedAt: s.initiatedAt,
        status: s.status,
        managerNotifiedAt: s.managerNotifiedAt,
      }));

    return sendSuccess(res, escalations, 'SOS escalations retrieved successfully', 200);
  } catch (error) {
    console.error('Get SOS escalations error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to retrieve SOS escalations', 500);
  }
});

export default router;
