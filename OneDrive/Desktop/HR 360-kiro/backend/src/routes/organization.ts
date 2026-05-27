import { Router, Response } from 'express';
import { sendSuccess, sendError, sendPaginated } from '../utils/response';
import { AuthRequest, authMiddleware, adminMiddleware } from '../middleware/auth';
import { OrganizationEntity, UserEntity } from '../entities';

const router = Router();

/**
 * GET /org
 * Get organization
 */
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'USER_NOT_FOUND', 'User not found', 404);
    }

    const org = await OrganizationEntity.findById(req.user.orgId);

    if (!org) {
      return sendError(res, 'ORG_NOT_FOUND', 'Organization not found', 404);
    }

    return sendSuccess(res, org, 'Organization retrieved successfully', 200);
  } catch (error) {
    console.error('Get organization error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to retrieve organization', 500);
  }
});

/**
 * GET /org/teams
 * Get organization teams
 */
router.get('/teams', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'USER_NOT_FOUND', 'User not found', 404);
    }

    const orgTeams = await UserEntity.findByOrgId(req.user.orgId);
    
    // Group users by team
    const teamMap = new Map<string, any[]>();
    orgTeams.forEach((user) => {
      if (user.teamId) {
        if (!teamMap.has(user.teamId)) {
          teamMap.set(user.teamId, []);
        }
        teamMap.get(user.teamId)!.push(user);
      }
    });

    const teams = Array.from(teamMap.entries()).map(([teamId, members]) => ({
      id: teamId,
      memberCount: members.length,
    }));

    return sendSuccess(res, teams, 'Teams retrieved successfully', 200);
  } catch (error) {
    console.error('Get teams error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to retrieve teams', 500);
  }
});

/**
 * GET /org/users
 * Get organization users (Admin)
 */
router.get('/users', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'USER_NOT_FOUND', 'User not found', 404);
    }

    const { teamId, role } = req.query;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    let users = await UserEntity.findByOrgId(req.user.orgId);
    
    if (teamId) {
      users = users.filter((u) => u.teamId === teamId);
    }
    if (role) {
      users = users.filter((u) => u.role === role);
    }

    const total = users.length;
    const paginated = users.slice(offset, offset + limit);

    return sendPaginated(res, paginated, total, limit, offset, 200);
  } catch (error) {
    console.error('Get organization users error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to retrieve organization users', 500);
  }
});

export default router;
