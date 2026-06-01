/**
 * Incident Routes
 * Handles incident management
 */

import express, { Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';
import { incidentService } from '../services/incidentService';
import { checkInService } from '../services/checkInService';
import { userService } from '../services/userService';
import { logger } from '../services/monitoringService';

const router = express.Router();

/**
 * GET /api/incidents
 * Get incidents for organization
 */
router.get(
  '/',
  authMiddleware.verifyToken.bind(authMiddleware),
  async (req: AuthRequest, res: Response, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: { code: 'NOT_AUTHENTICATED', message: 'User not authenticated' },
        });
      }

      const user = await userService.getUserById(req.user.userId);
      if (!user || !user.organizationId) {
        return res.status(400).json({
          success: false,
          error: { code: 'NO_ORGANIZATION', message: 'User is not part of an organization' },
        });
      }

      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 20;
      const status = req.query.status as string;
      const severity = req.query.severity as string;
      const isDrill = req.query.isDrill === 'true';

      const { incidents, total } = await incidentService.getIncidents(user.organizationId, {
        page,
        pageSize,
        status,
        severity,
        isDrill,
      });

      res.json({
        success: true,
        data: incidents,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      });
    } catch (error) {
      logger.error('Failed to get incidents', { error, userId: req.user?.userId });
      next(error);
    }
  }
);

/**
 * GET /api/incidents/:id
 * Get incident by ID
 */
router.get(
  '/:id',
  authMiddleware.verifyToken.bind(authMiddleware),
  async (req: AuthRequest, res: Response, next) => {
    try {
      const { id } = req.params;

      const incident = await incidentService.getIncidentById(id);

      if (!incident) {
        return res.status(404).json({
          success: false,
          error: { code: 'INCIDENT_NOT_FOUND', message: 'Incident not found' },
        });
      }

      res.json({ success: true, data: incident });
    } catch (error) {
      logger.error('Failed to get incident', { error, incidentId: req.params.id });
      next(error);
    }
  }
);

/**
 * POST /api/incidents
 * Create incident (admin/hr only)
 */
router.post(
  '/',
  authMiddleware.verifyToken.bind(authMiddleware),
  authMiddleware.requireRole('admin', 'hr'),
  async (req: AuthRequest, res: Response, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: { code: 'NOT_AUTHENTICATED', message: 'User not authenticated' },
        });
      }

      const user = await userService.getUserById(req.user.userId);
      if (!user || !user.organizationId) {
        return res.status(400).json({
          success: false,
          error: { code: 'NO_ORGANIZATION', message: 'User is not part of an organization' },
        });
      }

      const { title, description, severity, latitude, longitude, isDrill } = req.body;

      if (!title || !description || !severity) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'Missing required fields' },
        });
      }

      const validSeverities = ['low', 'medium', 'high', 'critical'];
      if (!validSeverities.includes(severity)) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_SEVERITY', message: 'Invalid severity level' },
        });
      }

      const incident = await incidentService.createIncident({
        organizationId: user.organizationId,
        title,
        description,
        severity,
        latitude,
        longitude,
        createdBy: req.user.userId,
        isDrill: isDrill ?? false,
      });

      logger.info('Incident created', { incidentId: incident.id, createdBy: req.user.userId });

      res.status(201).json({ success: true, data: incident });
    } catch (error) {
      logger.error('Failed to create incident', { error, userId: req.user?.userId });
      next(error);
    }
  }
);

/**
 * PUT /api/incidents/:id
 * Update incident (admin/hr only)
 */
router.put(
  '/:id',
  authMiddleware.verifyToken.bind(authMiddleware),
  authMiddleware.requireRole('admin', 'hr'),
  async (req: AuthRequest, res: Response, next) => {
    try {
      const { id } = req.params;
      const { title, description, status, severity, latitude, longitude } = req.body;

      if (severity) {
        const validSeverities = ['low', 'medium', 'high', 'critical'];
        if (!validSeverities.includes(severity)) {
          return res.status(400).json({
            success: false,
            error: { code: 'INVALID_SEVERITY', message: 'Invalid severity level' },
          });
        }
      }

      if (status) {
        const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
        if (!validStatuses.includes(status)) {
          return res.status(400).json({
            success: false,
            error: { code: 'INVALID_STATUS', message: 'Invalid status' },
          });
        }
      }

      const incident = await incidentService.updateIncident(id, {
        title,
        description,
        status,
        severity,
        latitude,
        longitude,
      });

      if (!incident) {
        return res.status(404).json({
          success: false,
          error: { code: 'INCIDENT_NOT_FOUND', message: 'Incident not found' },
        });
      }

      logger.info('Incident updated', { incidentId: id, updatedBy: req.user?.userId });

      res.json({ success: true, data: incident });
    } catch (error) {
      logger.error('Failed to update incident', { error, incidentId: req.params.id });
      next(error);
    }
  }
);

/**
 * DELETE /api/incidents/:id
 * Delete incident (admin only)
 */
router.delete(
  '/:id',
  authMiddleware.verifyToken.bind(authMiddleware),
  authMiddleware.requireRole('admin'),
  async (req: AuthRequest, res: Response, next) => {
    try {
      const { id } = req.params;

      await incidentService.deleteIncident(id);

      logger.info('Incident deleted', { incidentId: id, deletedBy: req.user?.userId });

      res.json({ success: true, message: 'Incident deleted successfully' });
    } catch (error) {
      logger.error('Failed to delete incident', { error, incidentId: req.params.id });
      next(error);
    }
  }
);

/**
 * POST /api/incidents/:id/updates
 * Add incident update
 */
router.post(
  '/:id/updates',
  authMiddleware.verifyToken.bind(authMiddleware),
  authMiddleware.requireRole('admin', 'hr'),
  async (req: AuthRequest, res: Response, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: { code: 'NOT_AUTHENTICATED', message: 'User not authenticated' },
        });
      }

      const { id } = req.params;
      const { message } = req.body;

      if (!message) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'Message is required' },
        });
      }

      const update = await incidentService.addIncidentUpdate(id, message, req.user.userId);

      logger.info('Incident update added', { incidentId: id, updateId: update.id });

      res.status(201).json({ success: true, data: update });
    } catch (error) {
      logger.error('Failed to add incident update', { error, incidentId: req.params.id });
      next(error);
    }
  }
);

/**
 * GET /api/incidents/:id/updates
 * Get incident updates
 */
router.get(
  '/:id/updates',
  authMiddleware.verifyToken.bind(authMiddleware),
  async (req: AuthRequest, res: Response, next) => {
    try {
      const { id } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 20;

      const { updates, total } = await incidentService.getIncidentUpdates(id, {
        page,
        pageSize,
      });

      res.json({
        success: true,
        data: updates,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      });
    } catch (error) {
      logger.error('Failed to get incident updates', { error, incidentId: req.params.id });
      next(error);
    }
  }
);

/**
 * GET /api/incidents/:id/stats
 * Get incident check-in statistics
 */
router.get(
  '/:id/stats',
  authMiddleware.verifyToken.bind(authMiddleware),
  async (req: AuthRequest, res: Response, next) => {
    try {
      const { id } = req.params;

      const stats = await checkInService.getCheckInStats('', id);

      res.json({ success: true, data: stats });
    } catch (error) {
      logger.error('Failed to get incident stats', { error, incidentId: req.params.id });
      next(error);
    }
  }
);

export default router;
