import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { sendSuccess, sendError, sendPaginated } from '../utils/response';
import { AuthRequest, authMiddleware, adminMiddleware } from '../middleware/auth';

const router = Router();

// Mock database
const guides: any[] = [];
const guideAcknowledgments: any[] = [];

/**
 * GET /kb/guides
 * Get KB guides
 */
router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'USER_NOT_FOUND', 'User not found', 404);
    }

    const { orgId, category, type } = req.query;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    if (!orgId) {
      return sendError(res, 'INVALID_ORG', 'Organization ID required', 400);
    }

    // TODO: Fetch from database with filters
    let filtered = guides.filter((g) => g.orgId === orgId);
    if (category) filtered = filtered.filter((g) => g.category === category);
    if (type) filtered = filtered.filter((g) => g.type === type);

    const paginated = filtered.slice(offset, offset + limit);

    return sendPaginated(res, paginated, filtered.length, limit, offset, 200);
  } catch (error) {
    console.error('Get guides error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to retrieve guides', 500);
  }
});

/**
 * GET /kb/guides/:id
 * Get guide details
 */
router.get('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // TODO: Fetch from database
    const guide = guides.find((g) => g.id === id);

    if (!guide) {
      return sendError(res, 'GUIDE_NOT_FOUND', 'Guide not found', 404);
    }

    return sendSuccess(res, guide, 'Guide retrieved successfully', 200);
  } catch (error) {
    console.error('Get guide error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to retrieve guide', 500);
  }
});

/**
 * GET /kb/guides/:id/versions
 * Get guide version history
 */
router.get('/:id/versions', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // TODO: Fetch from database
    const guide = guides.find((g) => g.id === id);

    if (!guide) {
      return sendError(res, 'GUIDE_NOT_FOUND', 'Guide not found', 404);
    }

    const versions = guide.previousVersions || [];

    return sendSuccess(res, versions, 'Guide versions retrieved successfully', 200);
  } catch (error) {
    console.error('Get guide versions error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to retrieve guide versions', 500);
  }
});

/**
 * POST /kb/guides
 * Create KB guide (Admin)
 */
router.post('/', authMiddleware, adminMiddleware, (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'USER_NOT_FOUND', 'User not found', 404);
    }

    const { title, category, type, content, mediaUrls, isRequired } = req.body;

    if (!title || !category || !type || !content) {
      return sendError(res, 'INVALID_INPUT', 'Missing required fields', 400);
    }

    const guide = {
      id: uuidv4(),
      orgId: req.user.orgId,
      title,
      category,
      type,
      content,
      mediaUrls: mediaUrls || [],
      isRequired: isRequired || false,
      version: 1,
      previousVersions: [],
      createdBy: req.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      updatedBy: req.user.id,
    };

    guides.push(guide);

    // TODO: Save to database

    return sendSuccess(res, guide, 'Guide created successfully', 201);
  } catch (error) {
    console.error('Create guide error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to create guide', 500);
  }
});

/**
 * PUT /kb/guides/:id
 * Update KB guide (Admin)
 */
router.put('/:id', authMiddleware, adminMiddleware, (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'USER_NOT_FOUND', 'User not found', 404);
    }

    const { id } = req.params;
    const { title, content, isRequired } = req.body;

    // TODO: Fetch from database
    const guide = guides.find((g) => g.id === id);

    if (!guide) {
      return sendError(res, 'GUIDE_NOT_FOUND', 'Guide not found', 404);
    }

    // Store previous version
    if (guide.previousVersions) {
      guide.previousVersions.push({
        version: guide.version,
        content: guide.content,
        createdAt: guide.updatedAt,
        createdBy: guide.updatedBy,
      });
    }

    // Update guide
    guide.title = title || guide.title;
    guide.content = content || guide.content;
    guide.isRequired = isRequired !== undefined ? isRequired : guide.isRequired;
    guide.version += 1;
    guide.updatedAt = new Date();
    guide.updatedBy = req.user.id;

    // TODO: Save to database

    return sendSuccess(res, guide, 'Guide updated successfully', 200);
  } catch (error) {
    console.error('Update guide error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to update guide', 500);
  }
});

/**
 * DELETE /kb/guides/:id
 * Delete KB guide (Admin)
 */
router.delete('/:id', authMiddleware, adminMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // TODO: Delete from database
    const index = guides.findIndex((g) => g.id === id);

    if (index === -1) {
      return sendError(res, 'GUIDE_NOT_FOUND', 'Guide not found', 404);
    }

    guides.splice(index, 1);

    return sendSuccess(res, {}, 'Guide deleted successfully', 200);
  } catch (error) {
    console.error('Delete guide error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to delete guide', 500);
  }
});

/**
 * POST /kb/guides/:id/acknowledge
 * Acknowledge guide
 */
router.post('/:id/acknowledge', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'USER_NOT_FOUND', 'User not found', 404);
    }

    const { id } = req.params;

    // TODO: Save acknowledgment to database
    const acknowledgment = {
      id: uuidv4(),
      userId: req.user.id,
      guideId: id,
      acknowledgedAt: new Date(),
    };

    guideAcknowledgments.push(acknowledgment);

    return sendSuccess(res, {}, 'Guide acknowledged', 200);
  } catch (error) {
    console.error('Acknowledge guide error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to acknowledge guide', 500);
  }
});

export default router;
