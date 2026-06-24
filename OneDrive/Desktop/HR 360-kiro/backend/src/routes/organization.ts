import express, { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';
import { organizationService } from '../services/organizationService';
import { userService } from '../services/userService';
import { logger } from '../services/monitoringService';

const router = express.Router();

// TEST ENDPOINT
router.post('/test-org-response', (req: AuthRequest, res: Response) => {
  logger.info('TEST ENDPOINT CALLED');
  res.status(200).json({
    success: true,
    data: {
      id: 'test-id',
      name: 'Test Org',
      inviteCode: 'ABC12345'
    }
  });
});

router.post('/', authMiddleware.verifyToken.bind(authMiddleware), async (req: AuthRequest, res: Response) => {
  try {
    logger.info('🔵 POST /org - START', { userId: req.user?.userId });

    if (!req.user) {
      logger.error('🔴 No user in request');
      return res.status(401).json({ success: false, error: { code: 'NOT_AUTHENTICATED', message: 'User not authenticated' } });
    }

    logger.info('🔵 Getting user by ID', { userId: req.user.userId });
    const user = await userService.getUserById(req.user.userId);
    logger.info('🔵 User retrieved', { user: user ? `Found (orgId: ${user.organizationId})` : 'Not found' });

    if (!user || user.organizationId) {
      logger.error('🔴 User check failed', { userExists: !!user, hasOrgId: user?.organizationId ? true : false });
      return res.status(400).json({ success: false, error: { code: 'ALREADY_IN_ORG', message: 'User is already part of an organization' } });
    }

    const { name, emailDomain, logoUrl, description } = req.body;
    logger.info('🔵 Request body', { name, emailDomain, logoUrl });

    if (!name || typeof name !== 'string') {
      logger.error('🔴 Invalid org name', { name });
      return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Organization name is required' } });
    }

    logger.info('🔵 Checking if org exists', { name });
    const existingOrg = await organizationService.getOrganizationByName(name);
    if (existingOrg) {
      logger.error('🔴 Organization already exists', { name });
      return res.status(400).json({ success: false, error: { code: 'ORG_EXISTS', message: 'Organization with this name already exists' } });
    }

    logger.info('🔵 Creating organization', { name, createdBy: req.user?.userId });
    const organization = await organizationService.createOrganization({
      name,
      emailDomain,
      logoUrl,
      description,
      createdBy: req.user!.userId,
    });
    logger.info('🔵 Organization created', { orgId: organization.id });

    const inviteCode = uuidv4().substring(0, 8).toUpperCase();
    logger.info('🔵 Generated invite code', { inviteCode });

    logger.info('🔵 Updating user with organization', { userId: req.user?.userId, orgId: organization.id });
    await userService.updateUser(req.user!.userId, {
      organizationId: organization.id,
    });
    logger.info('🔵 User updated');

    logger.info('✅ Organization created successfully', { orgId: organization.id, createdBy: req.user.userId });

    const response = {
      success: true,
      data: {
        ...organization,
        inviteCode,
      },
    };
    logger.info('🔵 Sending response', { response });
    res.status(201).json(response);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : '';
    logger.error('🔴 Create organization error', { error: errorMsg, stack: errorStack, userId: req.user?.userId });
    res.status(500).json({
      success: false,
      error: {
        code: 'ORG_CREATE_FAILED',
        message: 'Failed to create organization',
        details: errorMsg,
      },
    });
  }
});

router.get('/', authMiddleware.verifyToken.bind(authMiddleware), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: { code: 'NOT_AUTHENTICATED', message: 'User not authenticated' } });
    }

    const user = await userService.getUserById(req.user.userId);
    if (!user || !user.organizationId) {
      return res.status(400).json({ success: false, error: { code: 'NO_ORGANIZATION', message: 'User is not part of an organization' } });
    }

    const organization = await organizationService.getOrganizationById(user.organizationId);

    if (!organization) {
      return res.status(404).json({ success: false, error: { code: 'ORG_NOT_FOUND', message: 'Organization not found' } });
    }

    res.json({
      success: true,
      data: { ...organization, inviteCode: null },
    });
  } catch (error) {
    logger.error('Get organization error', { error, userId: req.user?.userId });
    res.status(500).json({ success: false, error: { code: 'ORG_FETCH_FAILED', message: 'Failed to fetch organization' } });
  }
});

router.put('/', authMiddleware.verifyToken.bind(authMiddleware), authMiddleware.requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: { code: 'NOT_AUTHENTICATED', message: 'User not authenticated' } });
    }

    const user = await userService.getUserById(req.user.userId);
    if (!user || !user.organizationId) {
      return res.status(400).json({ success: false, error: { code: 'NO_ORGANIZATION', message: 'User is not part of an organization' } });
    }

    const { name, emailDomain, logoUrl, description } = req.body;
    const updatedOrg = await organizationService.updateOrganization(user.organizationId, { name, emailDomain, logoUrl, description });

    logger.info('Organization updated', { orgId: user.organizationId, updatedBy: req.user.userId });

    res.json({ success: true, data: updatedOrg });
  } catch (error) {
    logger.error('Update organization error', { error, userId: req.user?.userId });
    res.status(500).json({ success: false, error: { code: 'ORG_UPDATE_FAILED', message: 'Failed to update organization' } });
  }
});

router.get('/stats', authMiddleware.verifyToken.bind(authMiddleware), authMiddleware.requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: { code: 'NOT_AUTHENTICATED', message: 'User not authenticated' } });
    }

    const user = await userService.getUserById(req.user.userId);
    if (!user || !user.organizationId) {
      return res.status(400).json({ success: false, error: { code: 'NO_ORGANIZATION', message: 'User is not part of an organization' } });
    }

    const [userCount, teamCount, departmentCount] = await Promise.all([
      organizationService.getOrganizationUserCount(user.organizationId),
      organizationService.getOrganizationTeamCount(user.organizationId),
      organizationService.getOrganizationDepartmentCount(user.organizationId),
    ]);

    res.json({ success: true, data: { userCount, teamCount, departmentCount } });
  } catch (error) {
    logger.error('Get organization stats error', { error, userId: req.user?.userId });
    res.status(500).json({ success: false, error: { code: 'STATS_FETCH_FAILED', message: 'Failed to fetch organization statistics' } });
  }
});

router.get('/teams', authMiddleware.verifyToken.bind(authMiddleware), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: { code: 'NOT_AUTHENTICATED', message: 'User not authenticated' } });
    }

    const user = await userService.getUserById(req.user.userId);
    if (!user || !user.organizationId) {
      return res.status(400).json({ success: false, error: { code: 'NO_ORGANIZATION', message: 'User is not part of an organization' } });
    }

    const { users } = await userService.getOrganizationUsers(user.organizationId, {});
    const teamsMap = new Map<string, any>();
    users.forEach(u => {
      if (u.teamId) {
        if (!teamsMap.has(u.teamId)) {
          teamsMap.set(u.teamId, { id: u.teamId, memberCount: 0 });
        }
        const team = teamsMap.get(u.teamId);
        team.memberCount += 1;
      }
    });

    const teams = Array.from(teamsMap.values());
    res.json({ success: true, data: teams });
  } catch (error) {
    logger.error('Get organization teams error', { error, userId: req.user?.userId });
    res.status(500).json({ success: false, error: { code: 'TEAMS_FETCH_FAILED', message: 'Failed to fetch organization teams' } });
  }
});

router.get('/users', authMiddleware.verifyToken.bind(authMiddleware), authMiddleware.requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: { code: 'NOT_AUTHENTICATED', message: 'User not authenticated' } });
    }

    const user = await userService.getUserById(req.user.userId);
    if (!user || !user.organizationId) {
      return res.status(400).json({ success: false, error: { code: 'NO_ORGANIZATION', message: 'User is not part of an organization' } });
    }

    const pageSize = Math.min(parseInt(req.query.pageSize as string) || 50, 100);
    const page = parseInt(req.query.page as string) || 1;
    const role = req.query.role as string | undefined;
    const search = req.query.search as string | undefined;

    const { users, total } = await userService.getOrganizationUsers(user.organizationId, { page, pageSize, role, search });

    res.json({ success: true, data: users, pagination: { total, pageSize, page } });
  } catch (error) {
    logger.error('Get organization users error', { error, userId: req.user?.userId });
    res.status(500).json({ success: false, error: { code: 'USERS_FETCH_FAILED', message: 'Failed to fetch organization users' } });
  }
});

router.post('/join', authMiddleware.verifyToken.bind(authMiddleware), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: { code: 'NOT_AUTHENTICATED', message: 'User not authenticated' } });
    }

    const { inviteCode } = req.body;
    if (!inviteCode || typeof inviteCode !== 'string') {
      return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Invite code is required' } });
    }

    const user = await userService.getUserById(req.user.userId);
    if (user?.organizationId) {
      return res.status(400).json({ success: false, error: { code: 'ALREADY_IN_ORG', message: 'You are already part of an organization' } });
    }

    const { OrganizationEntity } = await import('../entities/Organization');
    const organization = await OrganizationEntity.findByInviteCode(inviteCode);

    if (!organization) {
      return res.status(404).json({ success: false, error: { code: 'INVALID_CODE', message: 'Invalid or expired invite code' } });
    }

    if (organization.emailDomain) {
      const emailDomainSuffix = `@${organization.emailDomain}`;
      if (!user?.email.endsWith(emailDomainSuffix)) {
        return res.status(403).json({ success: false, error: { code: 'DOMAIN_RESTRICTION', message: 'Your email domain is not authorized for this organization' } });
      }
    }

    await userService.updateUser(req.user.userId, { organizationId: organization.id });

    res.json({ success: true, data: { organizationId: organization.id } });
  } catch (error) {
    logger.error('Join organization error', { error, userId: req.user?.userId });
    res.status(500).json({ success: false, error: { code: 'JOIN_ORG_FAILED', message: 'Failed to join organization' } });
  }
});

router.delete('/users/:userId', authMiddleware.verifyToken.bind(authMiddleware), authMiddleware.requireRole('admin'), async (req: AuthRequest, res: Response, next: express.NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: { code: 'NOT_AUTHENTICATED', message: 'User not authenticated' } });
    }

    const user = await userService.getUserById(req.user.userId);
    if (!user || !user.organizationId) {
      return res.status(400).json({ success: false, error: { code: 'NO_ORGANIZATION', message: 'User is not part of an organization' } });
    }

    const { userId } = req.params;

    if (userId === req.user.userId) {
      return res.status(400).json({ success: false, error: { code: 'CANNOT_REMOVE_SELF', message: 'Cannot remove yourself from the organization' } });
    }

    const userToRemove = await userService.getUserById(userId);

    if (!userToRemove) {
      logger.warn('User not found for deletion', { providedId: req.params.userId, adminId: req.user.userId });
      return res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found in organization' } });
    }

    if (userToRemove.organizationId !== user.organizationId) {
      logger.warn('User removal attempted across organizations', { removedUserId: userId, removedUserOrgId: userToRemove.organizationId, adminOrgId: user.organizationId, adminId: req.user.userId });
      return res.status(403).json({ success: false, error: { code: 'NOT_IN_SAME_ORG', message: 'User does not belong to your organization' } });
    }

    await userService.updateUser(userId, { organizationId: '' });

    logger.info('User removed from organization', { removedUserId: userId, removedUserEmail: userToRemove.email, orgId: user.organizationId, removedBy: req.user.userId, removedByEmail: user.email });

    res.json({ success: true, message: 'User removed from organization successfully', data: { removedUserId: userId, organizationId: user.organizationId } });
  } catch (error) {
    logger.error('Remove user from organization error', { error, userId: req.params.userId, adminId: req.user?.userId });
    next(error);
  }
});

router.get('/:id', authMiddleware.verifyToken.bind(authMiddleware), authMiddleware.requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const organization = await organizationService.getOrganizationById(id);

    if (!organization) {
      return res.status(404).json({ success: false, error: { code: 'ORG_NOT_FOUND', message: 'Organization not found' } });
    }

    res.json({ success: true, data: organization });
  } catch (error) {
    logger.error('Get organization by ID error', { error, userId: req.user?.userId });
    res.status(500).json({ success: false, error: { code: 'ORG_FETCH_FAILED', message: 'Failed to fetch organization' } });
  }
});

export default router;
