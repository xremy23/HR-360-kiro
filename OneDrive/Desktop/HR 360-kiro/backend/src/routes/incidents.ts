import { Router, Response } from 'express';
import { sendSuccess, sendError, sendPaginated } from '../utils/response';
import { AuthRequest, authMiddleware, adminMiddleware } from '../middleware/auth';
import { validateAlertSeverity } from '../utils/validators';
import { IncidentEntity, CheckInEntity, UserEntity, OrganizationEntity } from '../entities';
import { getWebSocketServer } from '../websocket/server';
import { pushNotificationService } from '../services/pushNotificationService';
import { userService } from '../services/userService';
import { organizationService } from '../services/organizationService';

const router = Router();

/**
 * GET /incidents
 * Get incidents
 */
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
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

    const incidents = await IncidentEntity.findByOrgId(orgId as string, isDrill === 'true');
    const total = incidents.length;
    const paginated = incidents.slice(offset, offset + limit);

    return sendPaginated(res, paginated, total, limit, offset, 200);
  } catch (error) {
    console.error('Get incidents error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to retrieve incidents', 500);
  }
});

/**
 * POST /incidents
 * Create incident (Admin)
 */
router.post('/', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
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

    const incident = await IncidentEntity.create({
      orgId: req.user.orgId,
      type,
      severity,
      startTime: new Date(),
      isDrill: isDrill || false,
      createdBy: req.user.id,
    });

    // Get organization members for notification
    const org = await organizationService.getOrganizationById(req.user.orgId);
    const { users: members } = await userService.getOrganizationUsers(req.user.orgId, { page: 1, pageSize: 1000 });
    const memberIds = (members as any[]).map((m: any) => m.id);

    // Send push notifications
    try {
      await pushNotificationService.sendIncidentNotification(
        memberIds,
        type,
        `Incident: ${type} (Severity: ${severity})`
      );
      console.log(`Incident push notifications sent to ${memberIds.length} members`);
    } catch (pushError) {
      console.warn('Push notification failed:', pushError);
      // Don't fail the request if push notifications fail
    }

    // Broadcast via WebSocket
    try {
      const wsServer = getWebSocketServer();
      wsServer.broadcastIncidentCreated(incident);
      wsServer.broadcastNotificationToOrganization(req.user.orgId, {
        type: 'incident',
        incidentId: incident.id,
        incidentType: type,
        severity,
      });
    } catch (wsError) {
      console.warn('WebSocket broadcast failed:', wsError);
      // Don't fail the request if WebSocket fails
    }

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
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const incident = await IncidentEntity.findById(id);

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
router.get('/:id/summary', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const incident = await IncidentEntity.findById(id);

    if (!incident) {
      return sendError(res, 'INCIDENT_NOT_FOUND', 'Incident not found', 404);
    }

    const checkIns = await CheckInEntity.findByIncidentId(id);
    
    // Calculate summary from check-ins
    const summary = {
      totalMembers: 100, // TODO: Get actual total from organization
      checkedIn: checkIns.length,
      notCheckedIn: 100 - checkIns.length,
      safe: checkIns.filter((c) => c.status === 'safe').length,
      needHelp: checkIns.filter((c) => c.status === 'need_help').length,
      sos: checkIns.filter((c) => c.status === 'sos').length,
      responseRate: Math.round((checkIns.length / 100) * 100),
    };

    return sendSuccess(res, summary, 'Incident summary retrieved successfully', 200);
  } catch (error) {
    console.error('Get incident summary error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to retrieve incident summary', 500);
  }
});

export default router;
