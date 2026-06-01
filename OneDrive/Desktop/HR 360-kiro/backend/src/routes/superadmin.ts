import { Router, Response } from 'express';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest, authMiddleware, superAdminMiddleware } from '../middleware/auth';
import { OrganizationEntity, UserEntity } from '../entities';
import { userService } from '../services/userService';
import { organizationService } from '../services/organizationService';

const router = Router();

/**
 * GET /superadmin/organizations
 * Get all organizations (super-admin only)
 */
router.get('/organizations', authMiddleware, superAdminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { organizations, total } = await organizationService.getAllOrganizations({ pageSize: 1000 });
    
    // Enrich with member count
    const enrichedOrgs = await Promise.all(
      organizations.map(async (org: any) => {
        const { users: members } = await userService.getOrganizationUsers(org.id, { page: 1, pageSize: 1000 });
        return {
          ...org,
          memberCount: members.length,
        };
      })
    );

    return sendSuccess(res, enrichedOrgs, 'All organizations retrieved', 200);
  } catch (error) {
    console.error('Get all organizations error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to retrieve organizations', 500);
  }
});

/**
 * GET /superadmin/organizations/:orgId
 * Get organization details (super-admin only)
 */
router.get('/organizations/:orgId', authMiddleware, superAdminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { orgId } = req.params;

    const org = await organizationService.getOrganizationById(orgId);
    if (!org) {
      return sendError(res, 'NOT_FOUND', 'Organization not found', 404);
    }

    const { users: members } = await userService.getOrganizationUsers(orgId, { page: 1, pageSize: 1000 });

    return sendSuccess(res, { ...org, members }, 'Organization details retrieved', 200);
  } catch (error) {
    console.error('Get organization error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to retrieve organization', 500);
  }
});

/**
 * POST /superadmin/organizations/:orgId/switch
 * Switch to organization as super-admin
 */
router.post('/organizations/:orgId/switch', authMiddleware, superAdminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { orgId } = req.params;

    const org = await organizationService.getOrganizationById(orgId);
    if (!org) {
      return sendError(res, 'NOT_FOUND', 'Organization not found', 404);
    }

    // Update user's current org
    if (req.user) {
      (req.user as any).orgId = orgId;
    }

    return sendSuccess(res, { orgId, orgName: org.name }, 'Switched to organization', 200);
  } catch (error) {
    console.error('Switch organization error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to switch organization', 500);
  }
});

/**
 * GET /superadmin/users
 * Get all users (super-admin only)
 */
router.get('/users', authMiddleware, superAdminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { users, total } = await userService.getOrganizationUsers('', { page: 1, pageSize: 10000 });

    return sendSuccess(res, users, 'All users retrieved', 200);
  } catch (error) {
    console.error('Get all users error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to retrieve users', 500);
  }
});

/**
 * PUT /superadmin/users/:userId/role
 * Update user role (super-admin only)
 */
router.put('/users/:userId/role', authMiddleware, superAdminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['super_admin', 'admin', 'hr', 'manager', 'employee'].includes(role)) {
      return sendError(res, 'INVALID_ROLE', 'Invalid role', 400);
    }

    const user = await userService.getUserById(userId);
    if (!user) {
      return sendError(res, 'NOT_FOUND', 'User not found', 404);
    }

    const updatedUser = await (userService as any).updateUserRole(userId, role);

    return sendSuccess(res, updatedUser, 'User role updated', 200);
  } catch (error) {
    console.error('Update user role error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to update user role', 500);
  }
});

export default router;
