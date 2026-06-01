/**
 * Organization Routes
 * Handles organization management endpoints
 */

import express, { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';
import { organizationService } from '../services/organizationService';
import { userService } from '../services/userService';
import { logger } from '../services/monitoringService';

const router = express.Router();

/**
 * POST /api/org
 * Create new organization (guest users only)
 */
router.post('/', authMiddleware.verifyToken.bind(authMiddleware), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'NOT_AUTHENTICATED',
          message: 'User not authenticated',
        },
      });
    }

    // Only guest users can create organizations
    const user = await userService.getUserById(req.user.userId);
    if (!user || user.organizationId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ALREADY_IN_ORG',
          message: 'User is already part of an organization',
        },
      });
    }

    const { name, emailDomain, logoUrl, description } = req.body;

    // Validate input
    if (!name || typeof name !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Organization name is required',
        },
      });
    }

    // Check if organization already exists
    const existingOrg = await organizationService.getOrganizationByName(name);
    if (existingOrg) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ORG_EXISTS',
          message: 'Organization with this name already exists',
        },
      });
    }

    // Create organization
    const organization = await organizationService.createOrganization({
      name,
      emailDomain,
      logoUrl,
      description,
      createdBy: req.user.userId,
    });

    // Update user to be admin of new organization
    await userService.updateUser(req.user.userId, {
      organizationId: organization.id,
    });

    logger.info('Organization created', { orgId: organization.id, createdBy: req.user.userId });

    res.status(201).json({
      success: true,
      data: organization,
    });
  } catch (error) {
    logger.error('Create organization error', { error, userId: req.user?.userId });
    res.status(500).json({
      success: false,
      error: {
        code: 'ORG_CREATE_FAILED',
        message: 'Failed to create organization',
      },
    });
  }
});

/**
 * GET /api/org
 * Get current user's organization
 */
router.get('/', authMiddleware.verifyToken.bind(authMiddleware), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'NOT_AUTHENTICATED',
          message: 'User not authenticated',
        },
      });
    }

    const user = await userService.getUserById(req.user.userId);
    if (!user || !user.organizationId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_ORGANIZATION',
          message: 'User is not part of an organization',
        },
      });
    }

    const organization = await organizationService.getOrganizationById(user.organizationId);

    if (!organization) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ORG_NOT_FOUND',
          message: 'Organization not found',
        },
      });
    }

    res.json({
      success: true,
      data: organization,
    });
  } catch (error) {
    logger.error('Get organization error', { error, userId: req.user?.userId });
    res.status(500).json({
      success: false,
      error: {
        code: 'ORG_FETCH_FAILED',
        message: 'Failed to fetch organization',
      },
    });
  }
});

/**
 * GET /api/org/:id
 * Get organization by ID (admin only)
 */
router.get(
  '/:id',
  authMiddleware.verifyToken.bind(authMiddleware),
  authMiddleware.requireRole('admin'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      const organization = await organizationService.getOrganizationById(id);

      if (!organization) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'ORG_NOT_FOUND',
            message: 'Organization not found',
          },
        });
      }

      res.json({
        success: true,
        data: organization,
      });
    } catch (error) {
      logger.error('Get organization by ID error', { error, userId: req.user?.userId });
      res.status(500).json({
        success: false,
        error: {
          code: 'ORG_FETCH_FAILED',
          message: 'Failed to fetch organization',
        },
      });
    }
  }
);

/**
 * PUT /api/org
 * Update current user's organization (admin only)
 */
router.put('/', authMiddleware.verifyToken.bind(authMiddleware), authMiddleware.requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'NOT_AUTHENTICATED',
          message: 'User not authenticated',
        },
      });
    }

    const user = await userService.getUserById(req.user.userId);
    if (!user || !user.organizationId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_ORGANIZATION',
          message: 'User is not part of an organization',
        },
      });
    }

    const { name, emailDomain, logoUrl, description } = req.body;

    const updatedOrg = await organizationService.updateOrganization(user.organizationId, {
      name,
      emailDomain,
      logoUrl,
      description,
    });

    logger.info('Organization updated', { orgId: user.organizationId, updatedBy: req.user.userId });

    res.json({
      success: true,
      data: updatedOrg,
    });
  } catch (error) {
    logger.error('Update organization error', { error, userId: req.user?.userId });
    res.status(500).json({
      success: false,
      error: {
        code: 'ORG_UPDATE_FAILED',
        message: 'Failed to update organization',
      },
    });
  }
});

/**
 * GET /api/org/stats
 * Get organization statistics
 */
router.get(
  '/stats',
  authMiddleware.verifyToken.bind(authMiddleware),
  authMiddleware.requireRole('admin'),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'NOT_AUTHENTICATED',
            message: 'User not authenticated',
          },
        });
      }

      const user = await userService.getUserById(req.user.userId);
      if (!user || !user.organizationId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'NO_ORGANIZATION',
            message: 'User is not part of an organization',
          },
        });
      }

      const [userCount, teamCount, departmentCount] = await Promise.all([
        organizationService.getOrganizationUserCount(user.organizationId),
        organizationService.getOrganizationTeamCount(user.organizationId),
        organizationService.getOrganizationDepartmentCount(user.organizationId),
      ]);

      res.json({
        success: true,
        data: {
          userCount,
          teamCount,
          departmentCount,
        },
      });
    } catch (error) {
      logger.error('Get organization stats error', { error, userId: req.user?.userId });
      res.status(500).json({
        success: false,
        error: {
          code: 'STATS_FETCH_FAILED',
          message: 'Failed to fetch organization statistics',
        },
      });
    }
  }
);

/**
 * POST /api/org/join
 * Join organization with invite code
 */
router.post('/join', authMiddleware.verifyToken.bind(authMiddleware), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'NOT_AUTHENTICATED',
          message: 'User not authenticated',
        },
      });
    }

    const { inviteCode } = req.body;

    if (!inviteCode || typeof inviteCode !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Invite code is required',
        },
      });
    }

    // TODO: Implement invite code validation and organization joining
    // This will be implemented in Phase 2

    res.status(501).json({
      success: false,
      error: {
        code: 'NOT_IMPLEMENTED',
        message: 'Organization joining is not yet implemented',
      },
    });
  } catch (error) {
    logger.error('Join organization error', { error, userId: req.user?.userId });
    res.status(500).json({
      success: false,
      error: {
        code: 'JOIN_ORG_FAILED',
        message: 'Failed to join organization',
      },
    });
  }
});

export default router;
