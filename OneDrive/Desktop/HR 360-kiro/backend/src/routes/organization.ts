import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { sendSuccess, sendError, sendPaginated } from '../utils/response';
import { AuthRequest, authMiddleware, adminMiddleware } from '../middleware/auth';

const router = Router();

// Mock database
const organizations: any = {};
const teams: any[] = [];
const orgUsers: any[] = [];

/**
 * GET /org
 * Get organization
 */
router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'USER_NOT_FOUND', 'User not found', 404);
    }

    // TODO: Fetch from database
    const org = {
      id: req.user.orgId,
      name: 'Sample Organization',
      emailDomain: 'example.com',
      inviteCode: 'ABC123',
      logo: 'https://example.com/logo.png',
    };

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
router.get('/teams', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'USER_NOT_FOUND', 'User not found', 404);
    }

    // TODO: Fetch from database
    const orgTeams = teams
      .filter((t) => t.orgId === req.user!.orgId)
      .map((t) => ({
        id: t.id,
        name: t.name,
        managerId: t.managerId,
        memberCount: t.members?.length || 0,
      }));

    return sendSuccess(res, orgTeams, 'Teams retrieved successfully', 200);
  } catch (error) {
    console.error('Get teams error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to retrieve teams', 500);
  }
});

/**
 * GET /org/users
 * Get organization users (Admin)
 */
router.get('/users', authMiddleware, adminMiddleware, (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'USER_NOT_FOUND', 'User not found', 404);
    }

    const { teamId, role } = req.query;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    // TODO: Fetch from database
    let filtered = orgUsers.filter((u) => u.orgId === req.user!.orgId);
    if (teamId) filtered = filtered.filter((u) => u.teamId === teamId);
    if (role) filtered = filtered.filter((u) => u.role === role);

    const paginated = filtered.slice(offset, offset + limit);

    return sendPaginated(res, paginated, filtered.length, limit, offset, 200);
  } catch (error) {
    console.error('Get organization users error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to retrieve organization users', 500);
  }
});

export default router;
