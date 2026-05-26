import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { sendSuccess, sendError, sendPaginated } from '../utils/response';
import { AuthRequest, authMiddleware, managerMiddleware } from '../middleware/auth';
import { validateCheckInStatus, validateCoordinates } from '../utils/validators';

const router = Router();

// Mock database
const checkIns: any[] = [];

/**
 * POST /check-ins
 * Submit check-in
 */
router.post('/', authMiddleware, (req: AuthRequest, res: Response) => {
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

    const checkIn = {
      id: uuidv4(),
      userId: req.user.id,
      teamId: req.user.teamId || '',
      status,
      notes,
      location,
      timestamp: new Date(),
      incidentId,
      isDrill: isDrill || false,
      syncedToServer: true,
    };

    checkIns.push(checkIn);

    // TODO: Save to database
    // TODO: Broadcast via WebSocket

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
router.get('/team/:teamId', authMiddleware, managerMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { teamId } = req.params;
    const { incidentId, isDrill } = req.query;

    // TODO: Fetch from database with filters
    const teamCheckIns = checkIns.filter((c) => {
      let match = c.teamId === teamId;
      if (incidentId) match = match && c.incidentId === incidentId;
      if (isDrill !== undefined) match = match && c.isDrill === (isDrill === 'true');
      return match;
    });

    const formattedCheckIns = teamCheckIns.map((c) => ({
      userId: c.userId,
      userName: 'User Name', // TODO: Get from database
      status: c.status,
      timestamp: c.timestamp,
      notes: c.notes,
    }));

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
router.get('/history', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'USER_NOT_FOUND', 'User not found', 404);
    }

    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    // TODO: Fetch from database
    const userCheckIns = checkIns.filter((c) => c.userId === req.user!.id);
    const paginatedCheckIns = userCheckIns.slice(offset, offset + limit);

    return sendPaginated(res, paginatedCheckIns, userCheckIns.length, limit, offset, 200);
  } catch (error) {
    console.error('Get check-in history error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to retrieve check-in history', 500);
  }
});

/**
 * GET /check-ins/incident/:incidentId
 * Get incident check-ins
 */
router.get('/incident/:incidentId', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { incidentId } = req.params;

    // TODO: Fetch from database
    const incidentCheckIns = checkIns
      .filter((c) => c.incidentId === incidentId)
      .map((c) => ({
        userId: c.userId,
        userName: 'User Name', // TODO: Get from database
        teamId: c.teamId,
        status: c.status,
        timestamp: c.timestamp,
        notes: c.notes,
      }));

    return sendSuccess(res, incidentCheckIns, 'Incident check-ins retrieved', 200);
  } catch (error) {
    console.error('Get incident check-ins error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to retrieve incident check-ins', 500);
  }
});

export default router;
