import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { sendSuccess, sendError, sendPaginated } from '../utils/response';
import { AuthRequest, authMiddleware, adminMiddleware } from '../middleware/auth';
import { validateAlertSeverity } from '../utils/validators';

const router = Router();

// Mock database
const incidents: any[] = [];

/**
 * GET /incidents
 * Get incidents
 */
router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'USER_NOT_FOUND', 'User not found', 404);
    }

    const { orgId, isDrill } = req.query;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    if (!orgId) {
      return sendError(res, 'INVALID_ORG', 'Organization ID required', 400);
    }

    // TODO: Fetch from database
    let filtered = incidents.filter((i) => i.orgId === orgId);
    if (isDrill !== undefined) filtered = filtered.filter((i) => i.isDrill === (isDrill === 'true'));

    const paginated = filtered.slice(offset, offset + limit);

    return sendPaginated(res, paginated, filtered.length, limit, offset, 200);
  } catch (error) {
    console.error('Get incidents error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to retrieve incidents', 500);
  }
});

/**
 * POST /incidents
 * Create incident (Admin)
 */
router.post('/', authMiddleware, adminMiddleware, (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'USER_NOT_FOUND', 'User not found', 404);
    }

    const { type, severity, isDrill } = req.body;

    if (!type || !severity) {
      return sendError(res, 'INVALID_INPUT', 'Type and severity required', 400);
    }

    if (!validateAlertSeverity(severity)) {
      return sendError(res, 'INVALID_SEVERITY', 'Invalid severity level', 400);
    }

    const incident = {
      id: uuidv4(),
      orgId: req.user.orgId,
      type,
      severity,
      startTime: new Date(),
      endTime: null,
      isDrill: isDrill || false,
      createdBy: req.user.id,
      checkIns: [],
      alertsBroadcast: [],
    };

    incidents.push(incident);

    // TODO: Save to database
    // TODO: Broadcast via WebSocket

    return sendSuccess(res, incident, 'Incident created successfully', 201);
  } catch (error) {
    console.error('Create incident error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to create incident', 500);
  }
});

/**
 * GET /incidents/:id
 * Get incident details
 */
router.get('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // TODO: Fetch from database
    const incident = incidents.find((i) => i.id === id);

    if (!incident) {
      return sendError(res, 'INCIDENT_NOT_FOUND', 'Incident not found', 404);
    }

    return sendSuccess(res, incident, 'Incident retrieved successfully', 200);
  } catch (error) {
    console.error('Get incident error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to retrieve incident', 500);
  }
});

/**
 * GET /incidents/:id/summary
 * Get incident check-in summary
 */
router.get('/:id/summary', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // TODO: Fetch from database and calculate summary
    const incident = incidents.find((i) => i.id === id);

    if (!incident) {
      return sendError(res, 'INCIDENT_NOT_FOUND', 'Incident not found', 404);
    }

    const summary = {
      totalMembers: 100,
      checkedIn: 85,
      notCheckedIn: 15,
      safe: 80,
      needHelp: 4,
      sos: 1,
      responseRate: 85,
    };

    return sendSuccess(res, summary, 'Incident summary retrieved successfully', 200);
  } catch (error) {
    console.error('Get incident summary error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to retrieve incident summary', 500);
  }
});

export default router;
