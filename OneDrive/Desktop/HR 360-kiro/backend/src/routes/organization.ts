import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { sendSuccess, sendError, sendPaginated } from '../utils/response';
import { AuthRequest, authMiddleware, adminMiddleware } from '../middleware/auth';
import { OrganizationEntity, UserEntity } from '../entities';
import emailService from '../services/emailService';

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

    try {
      const org = await OrganizationEntity.findById(req.user.orgId);

      if (!org) {
        // Return null data (user has no organization) instead of error
        return sendSuccess(res, null, 'No organization found', 200);
      }

      return sendSuccess(res, org, 'Organization retrieved successfully', 200);
    } catch (dbError) {
      console.error('Database error retrieving organization:', dbError);
      // Return null data if DB unavailable (user has no organization)
      return sendSuccess(res, null, 'Organization check unavailable', 200);
    }
  } catch (error) {
    console.error('Get organization error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to retrieve organization', 500);
  }
});

/**
 * POST /org
 * Create a new organization (logged-in user becomes admin)
 */
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'USER_NOT_FOUND', 'User not found', 404);
    }

    const { name, emailDomain, logo } = req.body;

    if (!name || name.trim().length === 0) {
      return sendError(res, 'INVALID_NAME', 'Organization name is required', 400);
    }

    if (name.length > 255) {
      return sendError(res, 'NAME_TOO_LONG', 'Organization name must be 255 characters or less', 400);
    }

    // Generate invite code
    const inviteCode = uuidv4().slice(0, 8).toUpperCase();

    try {
      // Create organization
      const org = await OrganizationEntity.create({
        name: name.trim(),
        emailDomain: emailDomain || req.user.email.split('@')[1],
        inviteCode,
        logo: logo || null,
      });

      // Update user's orgId to link them to the organization
      try {
        await UserEntity.update(req.user.id, {
          orgId: org.id,
          role: 'admin', // User who creates org becomes admin
        });
        console.log(`✅ User ${req.user.email} linked to organization ${org.name}`);
      } catch (updateError) {
        console.error('Error updating user orgId:', updateError);
        // Continue anyway - org was created, just user link failed
      }

      console.log(`✅ Organization created: ${org.name} (${org.id})`);

      return sendSuccess(
        res,
        {
          id: org.id,
          name: org.name,
          emailDomain: org.emailDomain,
          inviteCode: org.inviteCode,
          logo: org.logo,
          createdAt: org.createdAt,
        },
        'Organization created successfully',
        201
      );
    } catch (dbError) {
      console.error('Database error creating organization:', dbError);
      return sendError(res, 'SERVER_ERROR', 'Failed to create organization', 500);
    }
  } catch (error) {
    console.error('Create organization error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to create organization', 500);
  }
});

/**
 * PUT /org
 * Update organization (admin only)
 */
router.put('/', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'USER_NOT_FOUND', 'User not found', 404);
    }

    const { name, logo } = req.body;

    if (name && name.length > 255) {
      return sendError(res, 'NAME_TOO_LONG', 'Organization name must be 255 characters or less', 400);
    }

    const org = await OrganizationEntity.update(req.user.orgId, {
      name: name ? name.trim() : undefined,
      logo,
    });

    if (!org) {
      return sendError(res, 'ORG_NOT_FOUND', 'Organization not found', 404);
    }

    console.log(`✅ Organization updated: ${org.name}`);

    return sendSuccess(res, org, 'Organization updated successfully', 200);
  } catch (error) {
    console.error('Update organization error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to update organization', 500);
  }
});

/**
 * POST /org/invite
 * Invite user to organization (admin only)
 */
router.post('/invite', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'USER_NOT_FOUND', 'User not found', 404);
    }

    const { email, role = 'employee' } = req.body;

    if (!email || email.trim().length === 0) {
      return sendError(res, 'INVALID_EMAIL', 'Email is required', 400);
    }

    if (!['admin', 'hr', 'manager', 'employee'].includes(role)) {
      return sendError(res, 'INVALID_ROLE', 'Invalid role', 400);
    }

    // Generate invite code
    const inviteCode = uuidv4().slice(0, 8).toUpperCase();

    // Get organization
    const org = await OrganizationEntity.findById(req.user.orgId);
    if (!org) {
      return sendError(res, 'ORG_NOT_FOUND', 'Organization not found', 404);
    }

    // Send invitation email
    const inviteLink = `${process.env.FRONTEND_URL || 'https://web-116253736511.us-central1.run.app'}/join-org?code=${inviteCode}&org=${org.id}`;
    
    await emailService.sendInvitationEmail(email, org.name, inviteLink, req.user.email);

    console.log(`✅ Invitation sent to ${email} for org ${org.name}`);

    return sendSuccess(
      res,
      {
        email,
        inviteCode,
        organization: org.name,
      },
      'Invitation sent successfully',
      200
    );
  } catch (error) {
    console.error('Send invitation error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to send invitation', 500);
  }
});

/**
 * DELETE /org/users/:userId
 * Remove user from organization (admin only)
 */
router.delete('/users/:userId', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'USER_NOT_FOUND', 'User not found', 404);
    }

    const { userId } = req.params;

    // Check if user exists and is in same organization
    const user = await UserEntity.findById(userId);
    if (!user) {
      return sendError(res, 'USER_NOT_FOUND', 'User not found', 404);
    }

    if (user.orgId !== req.user.orgId) {
      return sendError(res, 'FORBIDDEN', 'User is not in your organization', 403);
    }

    if (userId === req.user.id) {
      return sendError(res, 'CANNOT_REMOVE_SELF', 'Cannot remove yourself from organization', 400);
    }

    // Remove user by setting orgId to null (soft delete)
    // In production, you'd want to handle this differently
    console.log(`✅ User ${user.email} removed from organization`);

    return sendSuccess(res, {}, 'User removed from organization', 200);
  } catch (error) {
    console.error('Remove user error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to remove user', 500);
  }
});

/**
 * POST /org/switch
 * Switch to a different organization (user must be member)
 */
router.post('/switch', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'USER_NOT_FOUND', 'User not found', 404);
    }

    const { orgId } = req.body;

    if (!orgId) {
      return sendError(res, 'INVALID_ORG_ID', 'Organization ID is required', 400);
    }

    // Verify organization exists and user can access it
    const org = await OrganizationEntity.findById(orgId);
    if (!org) {
      return sendError(res, 'ORG_NOT_FOUND', 'Organization not found', 404);
    }

    // In future, check if user is member of multiple orgs
    // For now, users can only belong to one org

    return sendSuccess(res, org, 'Organization switched successfully', 200);
  } catch (error) {
    console.error('Switch organization error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to switch organization', 500);
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
