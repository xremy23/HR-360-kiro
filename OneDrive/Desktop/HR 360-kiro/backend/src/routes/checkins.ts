import { Router, Response } from 'express';
import { sendSuccess, sendError, sendPaginated } from '../utils/response';
import { AuthRequest, authMiddleware, managerMiddleware } from '../middleware/auth';
import { validateCheckInStatus, validateCoordinates } from '../utils/validators';
import { CheckInEntity, UserEntity } from '../entities';
import { getWebSocketServer } from '../websocket/server';

const router = Router();

/**
 * PUT /check-ins/:id
 * Update check-in status
 */
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'USER_NOT_FOUND', 'User not found', 404);
    }

    const { id } = req.params;
    const { status, notes } = req.body;

    if (!validateCheckInStatus(status)) {
      return sendError(res, 'INVALID_STATUS', 'Invalid check-in status', 400);
    }

    // Get existing check-in
    const existingCheckIn = await CheckInEntity.findById(id);
    if (!existingCheckIn) {
      return sendError(res, 'NOT_FOUND', 'Check-in not found', 404);
    }

    // Verify user owns this check-in
    if (existingCheckIn.userId !== req.user.id) {
      return sendError(res, 'FORBIDDEN', 'Cannot update check-in from another user', 403);
    }

    // Update check-in
    const updatedCheckIn = await CheckInEntity.update(id, {
      status,
      notes: notes || existingCheckIn.notes,
    });

    // Broadcast via WebSocket
    try {
      const wsServer = getWebSocketServer();
      wsServer.broadcastCheckInUpdated(updatedCheckIn);
    } catch (wsError) {
      console.warn('WebSocket broadcast failed:', wsError);
      // Don't fail the request if WebSocket fails
    }

    return sendSuccess(res, updatedCheckIn, 'Check-in updated successfully', 200);
  } catch (error) {
    console.error('Update check-in error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to update check-in', 500);
  }
});

/**
 * GET /check-ins/:id
 * Get check-in by ID
 */
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const checkIn = await CheckInEntity.findById(id);
    if (!checkIn) {
      return sendError(res, 'NOT_FOUND', 'Check-in not found', 404);
    }

    return sendSuccess(res, checkIn, 'Check-in retrieved', 200);
  } catch (error) {
    console.error('Get check-in error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to retrieve check-in', 500);
  }
});

/**
 * POST /check-ins
 * Submit check-in
 */
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'USER_NOT_FOUND', 'User not found', 404);
    }

    const { status, notes, location, incidentId, isDrill } = req.body;

    if (!validateCheckInStatus(status)) {
      return sendError(res, 'INVALID_STATUS', 'Invalid check-in status', 400);
    }

    if (location && !validateCoordinates(location.latitude, location.longitude)) {
      return sendError(res, 'INVALID_COORDINATES', 'Invalid coordinates', 400);
    }

    const checkIn = await CheckInEntity.create({
      userId: req.user.id,
      teamId: req.user.teamId || '',
      status,
      notes,
      latitude: location?.latitude,
      longitude: location?.longitude,
      incidentId,
      isDrill: isDrill || false,
    });

    // Broadcast via WebSocket
    try {
      const wsServer = getWebSocketServer();
      wsServer.broadcastCheckInCreated(checkIn);
    } catch (wsError) {
      console.warn('WebSocket broadcast failed:', wsError);
      // Don't fail the request if WebSocket fails
    }

    return sendSuccess(res, checkIn, 'Check-in submitted successfully', 201);
  } catch (error) {
    console.error('Submit check-in error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to submit check-in', 500);
  }
});

/**
 * GET /check-ins/team/:teamId
 * Get team check-ins
 */
router.get('/team/:teamId', authMiddleware, managerMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { teamId } = req.params;
    const { incidentId, isDrill } = req.query;

    const checkIns = await CheckInEntity.findByTeamId(teamId, incidentId as string, isDrill === 'true');

    const formattedCheckIns = await Promise.all(
      checkIns.map(async (c) => {
        const user = await UserEntity.findById(c.userId);
        return {
          userId: c.userId,
          userName: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
          status: c.status,
          timestamp: c.timestamp,
          notes: c.notes,
        };
      })
    );

    return sendSuccess(res, formattedCheckIns, 'Team check-ins retrieved', 200);
  } catch (error) {
    console.error('Get team check-ins error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to retrieve team check-ins', 500);
  }
});

/**
 * GET /check-ins/history
 * Get user check-in history
 */
router.get('/history', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'USER_NOT_FOUND', 'User not found', 404);
    }

    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    const userCheckIns = await CheckInEntity.findByUserId(req.user.id);
    const total = userCheckIns.length;
    const paginatedCheckIns = userCheckIns.slice(offset, offset + limit);

    return sendPaginated(res, paginatedCheckIns, total, limit, offset, 200);
  } catch (error) {
    console.error('Get check-in history error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to retrieve check-in history', 500);
  }
});

/**
 * GET /check-ins/incident/:incidentId
 * Get incident check-ins
 */
router.get('/incident/:incidentId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { incidentId } = req.params;

    const incidentCheckIns = await CheckInEntity.findByIncidentId(incidentId);

    const formattedCheckIns = await Promise.all(
      incidentCheckIns.map(async (c) => {
        const user = await UserEntity.findById(c.userId);
        return {
          userId: c.userId,
          userName: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
          teamId: c.teamId,
          status: c.status,
          timestamp: c.timestamp,
          notes: c.notes,
        };
      })
    );

    return sendSuccess(res, formattedCheckIns, 'Incident check-ins retrieved', 200);
  } catch (error) {
    console.error('Get incident check-ins error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to retrieve incident check-ins', 500);
  }
});

export default router;
