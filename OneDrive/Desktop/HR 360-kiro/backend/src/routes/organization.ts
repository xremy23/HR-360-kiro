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
import { query as dbQuery } from '../config/database';

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

    // For regular users, check if they're already in an organization
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

    // Create invite code for the organization
    const inviteCode = uuidv4().substring(0, 8).toUpperCase();
    
    await dbQuery(
      `INSERT INTO organization_invites (organization_id, code, is_active, created_at)
       VALUES ($1, $2, true, NOW())`,
      [organization.id, inviteCode]
    );

    // Update user to be admin of new organization
    await userService.updateUser(req.user.userId, {
      organizationId: organization.id,
    });

    logger.info('Organization created', { orgId: organization.id, createdBy: req.user.userId });

    res.status(201).json({
      success: true,
      data: {
        ...organization,
        inviteCode,
      },
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : '';
    logger.error('Create organization error', { error: errorMsg, stack: errorStack, userId: req.user?.userId });
    res.status(500).json({
      success: false,
      error: {
        code: 'ORG_CREATE_FAILED',
        message: 'Failed to create organization',
        details: errorMsg, // Include error details for debugging
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

    // Fetch invite code for this organization
    const inviteResult = await dbQuery(
      `SELECT code FROM organization_invites WHERE organization_id = $1 AND is_active = true LIMIT 1`,
      [user.organizationId]
    );

    const inviteCode = inviteResult.rows.length > 0 ? inviteResult.rows[0].code : null;

    res.json({
      success: true,
      data: {
        ...organization,
        inviteCode,
      },
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
 * GET /api/org/teams
 * Get organization teams
 */
router.get(
  '/teams',
  authMiddleware.verifyToken.bind(authMiddleware),
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

      const { users } = await userService.getOrganizationUsers(user.organizationId, {});

      // Group users by team
      const teamsMap = new Map<string, any>();
      users.forEach(u => {
        if (u.teamId) {
          if (!teamsMap.has(u.teamId)) {
            teamsMap.set(u.teamId, {
              id: u.teamId,
              memberCount: 0,
            });
          }
          const team = teamsMap.get(u.teamId);
          team.memberCount += 1;
        }
      });

      const teams = Array.from(teamsMap.values());

      res.json({
        success: true,
        data: teams,
      });
    } catch (error) {
      logger.error('Get organization teams error', { error, userId: req.user?.userId });
      res.status(500).json({
        success: false,
        error: {
          code: 'TEAMS_FETCH_FAILED',
          message: 'Failed to fetch organization teams',
        },
      });
    }
  }
);

/**
 * GET /api/org/users
 * Get organization users (admin only)
 */
router.get(
  '/users',
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

      // Parse query parameters
      const pageSize = Math.min(parseInt(req.query.pageSize as string) || 50, 100);
      const page = parseInt(req.query.page as string) || 1;
      const role = req.query.role as string | undefined;
      const search = req.query.search as string | undefined;

      const { users, total } = await userService.getOrganizationUsers(user.organizationId, {
        page,
        pageSize,
        role,
        search,
      });

      res.json({
        success: true,
        data: users,
        pagination: {
          total,
          pageSize,
          page,
        },
      });
    } catch (error) {
      logger.error('Get organization users error', { error, userId: req.user?.userId });
      res.status(500).json({
        success: false,
        error: {
          code: 'USERS_FETCH_FAILED',
          message: 'Failed to fetch organization users',
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

    // Check if user already has an organization
    const user = await userService.getUserById(req.user.userId);
    if (user?.organizationId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ALREADY_IN_ORG',
          message: 'You are already part of an organization',
        },
      });
    }

    // Find organization by invite code
    const inviteResult = await dbQuery(
      `SELECT organization_id FROM organization_invites WHERE code = $1 AND is_active = true LIMIT 1`,
      [inviteCode.toUpperCase()]
    );

    if (inviteResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'INVALID_CODE',
          message: 'Invalid or expired invite code',
        },
      });
    }

    const organizationId = inviteResult.rows[0].organization_id;

    // Add user to organization
    await userService.updateUser(req.user.userId, {
      organizationId,
    });

    // Fetch updated organization and user
    const organization = await organizationService.getOrganizationById(organizationId);
    const updatedUser = await userService.getUserById(req.user.userId);

    logger.info('User joined organization', { userId: req.user.userId, orgId: organizationId, inviteCode });

    res.json({
      success: true,
      data: {
        organization,
        user: updatedUser,
        message: `Successfully joined ${organization?.name}!`,
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

/**
 * DELETE /api/org/users/:userId
 * Remove user from organization (admin only)
 */
router.delete(
  '/users/:userId',
  authMiddleware.verifyToken.bind(authMiddleware),
  authMiddleware.requireRole('admin'),
  async (req: AuthRequest, res: Response, next) => {
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

      let { userId } = req.params;
      let userToRemove = null;

      // Prevent admin from removing themselves
      if (userId === req.user.userId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'CANNOT_REMOVE_SELF',
            message: 'Cannot remove yourself from the organization',
          },
        });
      }

      // First, try to get user by the provided ID (UUID case)
      userToRemove = await userService.getUserById(userId);

      if (!userToRemove) {
        logger.warn('User not found for deletion', { 
          providedId: req.params.userId,
          adminId: req.user.userId 
        });
        return res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found in organization',
          },
        });
      }

      // Verify user belongs to same organization
      if (userToRemove.organizationId !== user.organizationId) {
        logger.warn('User removal attempted across organizations', {
          removedUserId: userId,
          removedUserOrgId: userToRemove.organizationId,
          adminOrgId: user.organizationId,
          adminId: req.user.userId
        });
        return res.status(403).json({
          success: false,
          error: {
            code: 'NOT_IN_SAME_ORG',
            message: 'User does not belong to your organization',
          },
        });
      }

      // Remove user from organization by setting organizationId to empty string
      await userService.updateUser(userId, {
        organizationId: '',
      });

      logger.info('User removed from organization', { 
        removedUserId: userId, 
        removedUserEmail: userToRemove.email,
        orgId: user.organizationId, 
        removedBy: req.user.userId,
        removedByEmail: user.email
      });

      res.json({
        success: true,
        message: 'User removed from organization successfully',
        data: {
          removedUserId: userId,
          organizationId: user.organizationId,
        },
      });
    } catch (error) {
      logger.error('Remove user from organization error', { 
        error, 
        userId: req.params.userId,
        adminId: req.user?.userId 
      });
      next(error);
    }
  }
);

/**
 * GET /api/org/:id
 * Get organization by ID (admin only)
 * NOTE: This must be LAST - parameter routes match before specific routes
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

export default router;
 
 