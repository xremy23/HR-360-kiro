import { Router, Response } from 'express';
import { sendSuccess, sendError, sendPaginated } from '../utils/response';
import { AuthRequest, authMiddleware, adminMiddleware } from '../middleware/auth';
import { KBGuideEntity, GuideAcknowledgmentEntity } from '../entities';

const router = Router();

/**
 * GET /kb/guides
 * Get KB guides
 */
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
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

    const guides = await KBGuideEntity.findByOrgId(orgId as string, category as string, type as string);
    const total = guides.length;
    const paginated = guides.slice(offset, offset + limit);

    return sendPaginated(res, paginated, total, limit, offset, 200);
  } catch (error) {
    console.error('Get guides error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to retrieve guides', 500);
  }
});

/**
 * GET /kb/guides/:id
 * Get guide details
 */
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const guide = await KBGuideEntity.findById(id);

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
router.get('/:id/versions', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const guide = await KBGuideEntity.findById(id);

    if (!guide) {
      return sendError(res, 'GUIDE_NOT_FOUND', 'Guide not found', 404);
    }

    // Return current guide as version history
    // Note: Full version history would require storing versions in a separate table
    const versions = [
      {
        version: guide.version,
        title: guide.title,
        content: guide.content,
        updatedAt: guide.updatedAt,
        updatedBy: guide.updatedBy,
      },
    ];

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
router.post('/', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'USER_NOT_FOUND', 'User not found', 404);
    }

    const { title, category, type, content, mediaUrls, isRequired } = req.body;

    if (!title || !category || !type || !content) {
      return sendError(res, 'INVALID_INPUT', 'Missing required fields', 400);
    }

    const guide = await KBGuideEntity.create({
      orgId: req.user.orgId,
      title,
      category,
      type,
      content,
      mediaUrls: mediaUrls || [],
      isRequired: isRequired || false,
      createdBy: req.user.id,
      updatedBy: req.user.id,
    });

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
router.put('/:id', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'USER_NOT_FOUND', 'User not found', 404);
    }

    const { id } = req.params;
    const { title, content, isRequired } = req.body;

    const guide = await KBGuideEntity.findById(id);

    if (!guide) {
      return sendError(res, 'GUIDE_NOT_FOUND', 'Guide not found', 404);
    }

    const updated = await KBGuideEntity.update(id, {
      title: title || guide.title,
      content: content || guide.content,
      isRequired: isRequired !== undefined ? isRequired : guide.isRequired,
    }, req.user.id);

    return sendSuccess(res, updated, 'Guide updated successfully', 200);
  } catch (error) {
    console.error('Update guide error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to update guide', 500);
  }
});

/**
 * DELETE /kb/guides/:id
 * Delete KB guide (Admin)
 */
router.delete('/:id', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const deleted = await KBGuideEntity.delete(id);

    if (!deleted) {
      return sendError(res, 'GUIDE_NOT_FOUND', 'Guide not found', 404);
    }

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
router.post('/:id/acknowledge', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'USER_NOT_FOUND', 'User not found', 404);
    }

    const { id } = req.params;

    const guide = await KBGuideEntity.findById(id);

    if (!guide) {
      return sendError(res, 'GUIDE_NOT_FOUND', 'Guide not found', 404);
    }

    // Check if already acknowledged
    const existing = await GuideAcknowledgmentEntity.findByUserAndGuide(req.user.id, id);

    if (existing) {
      return sendSuccess(res, existing, 'Guide already acknowledged', 200);
    }

    // Create acknowledgment
    const acknowledgment = await GuideAcknowledgmentEntity.create({
      userId: req.user.id,
      guideId: id,
    });

    return sendSuccess(res, acknowledgment, 'Guide acknowledged successfully', 201);
  } catch (error) {
    console.error('Acknowledge guide error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to acknowledge guide', 500);
  }
});

export default router;
