/**
 * Knowledge Base Routes - DEMO MODE
 */

import express from 'express';

const router = express.Router();

/**
 * GET /api/kb/guides
 * Demo endpoint
 */
router.get('/guides', (req: express.Request, res: express.Response) => {
  res.json({
    success: true,
    data: [],
    pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
  });
});

/**
 * GET /api/kb/guides/:id
 */
router.get('/guides/:id', (req: express.Request, res: express.Response) => {
  res.status(404).json({ success: false, error: 'Not found' });
});

/**
 * POST /api/kb/guides
 */
router.post('/guides', (req: express.Request, res: express.Response) => {
  res.status(201).json({ success: true, data: { id: 'new-guide' } });
});

export default router;
