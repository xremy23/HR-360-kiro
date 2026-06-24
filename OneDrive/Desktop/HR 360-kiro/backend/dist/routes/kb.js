"use strict";
/**
 * Knowledge Base Routes - DEMO MODE
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
/**
 * GET /api/kb/guides
 * Demo endpoint
 */
router.get('/guides', (req, res) => {
    res.json({
        success: true,
        data: [],
        pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    });
});
/**
 * GET /api/kb/guides/:id
 */
router.get('/guides/:id', (req, res) => {
    res.status(404).json({ success: false, error: 'Not found' });
});
/**
 * POST /api/kb/guides
 */
router.post('/guides', (req, res) => {
    res.status(201).json({ success: true, data: { id: 'new-guide' } });
});
exports.default = router;
//# sourceMappingURL=kb.js.map