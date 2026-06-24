"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const response_1 = require("../utils/response");
const auth_1 = require("../middleware/auth");
const validators_1 = require("../utils/validators");
const entities_1 = require("../entities");
const router = (0, express_1.Router)();
/**
 * GET /contacts
 * Get user contacts
 * Allows guests to see default emergency contacts
 */
router.get('/', auth_1.optionalAuthMiddleware, async (req, res) => {
    try {
        let userContacts;
        if (req.user) {
            // Authenticated user - get their personal contacts
            userContacts = await entities_1.ContactEntity.findByUserId(req.user.id);
        }
        else {
            // Guest user - return default emergency contacts
            userContacts = await entities_1.ContactEntity.findByUserId('default') || [];
        }
        return (0, response_1.sendSuccess)(res, userContacts, 'Contacts retrieved successfully', 200);
    }
    catch (error) {
        console.error('Get contacts error:', error);
        return (0, response_1.sendError)(res, 'SERVER_ERROR', 'Failed to retrieve contacts', 500);
    }
});
/**
 * POST /contacts
 * Create contact (requires authentication)
 */
router.post('/', auth_1.authMiddleware, async (req, res) => {
    try {
        if (!req.user) {
            return (0, response_1.sendError)(res, 'USER_NOT_FOUND', 'User not found', 404);
        }
        const { name, type, phone, email, category, address, latitude, longitude, isPinned } = req.body;
        if (!name || !type) {
            return (0, response_1.sendError)(res, 'INVALID_INPUT', 'Name and type required', 400);
        }
        if (phone && !(0, validators_1.validatePhoneNumber)(phone)) {
            return (0, response_1.sendError)(res, 'INVALID_PHONE', 'Invalid phone number', 400);
        }
        if (latitude !== undefined || longitude !== undefined) {
            if (!(0, validators_1.validateCoordinates)(latitude || 0, longitude || 0)) {
                return (0, response_1.sendError)(res, 'INVALID_COORDINATES', 'Invalid coordinates', 400);
            }
        }
        const contact = await entities_1.ContactEntity.create({
            userId: req.user.id,
            name,
            type,
            phone,
            email,
            category,
            address,
            latitude,
            longitude,
            isPinned: isPinned || false,
        });
        return (0, response_1.sendSuccess)(res, contact, 'Contact created successfully', 201);
    }
    catch (error) {
        console.error('Create contact error:', error);
        return (0, response_1.sendError)(res, 'SERVER_ERROR', 'Failed to create contact', 500);
    }
});
/**
 * PUT /contacts/:id
 * Update contact
 */
router.put('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        if (!req.user) {
            return (0, response_1.sendError)(res, 'USER_NOT_FOUND', 'User not found', 404);
        }
        const { id } = req.params;
        const { name, phone, isPinned } = req.body;
        const contact = await entities_1.ContactEntity.findById(id);
        if (!contact || contact.userId !== req.user.id) {
            return (0, response_1.sendError)(res, 'CONTACT_NOT_FOUND', 'Contact not found', 404);
        }
        if (phone && !(0, validators_1.validatePhoneNumber)(phone)) {
            return (0, response_1.sendError)(res, 'INVALID_PHONE', 'Invalid phone number', 400);
        }
        const updated = await entities_1.ContactEntity.update(id, req.user.id, {
            name: name || contact.name,
            phone: phone || contact.phone,
            isPinned: isPinned !== undefined ? isPinned : contact.isPinned,
        });
        return (0, response_1.sendSuccess)(res, updated, 'Contact updated successfully', 200);
    }
    catch (error) {
        console.error('Update contact error:', error);
        return (0, response_1.sendError)(res, 'SERVER_ERROR', 'Failed to update contact', 500);
    }
});
/**
 * DELETE /contacts/:id
 * Delete contact
 */
router.delete('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        if (!req.user) {
            return (0, response_1.sendError)(res, 'USER_NOT_FOUND', 'User not found', 404);
        }
        const { id } = req.params;
        const contact = await entities_1.ContactEntity.findById(id);
        if (!contact || contact.userId !== req.user.id) {
            return (0, response_1.sendError)(res, 'CONTACT_NOT_FOUND', 'Contact not found', 404);
        }
        await entities_1.ContactEntity.delete(id, req.user.id);
        return (0, response_1.sendSuccess)(res, {}, 'Contact deleted successfully', 200);
    }
    catch (error) {
        console.error('Delete contact error:', error);
        return (0, response_1.sendError)(res, 'SERVER_ERROR', 'Failed to delete contact', 500);
    }
});
/**
 * GET /contacts/nearby
 * Get nearby services
 */
router.get('/nearby', auth_1.authMiddleware, async (req, res) => {
    try {
        const { latitude, longitude, radius, type } = req.query;
        if (!latitude || !longitude) {
            return (0, response_1.sendError)(res, 'INVALID_COORDINATES', 'Latitude and longitude required', 400);
        }
        const lat = parseFloat(latitude);
        const lon = parseFloat(longitude);
        const searchRadius = parseFloat(radius) || 5;
        if (!(0, validators_1.validateCoordinates)(lat, lon)) {
            return (0, response_1.sendError)(res, 'INVALID_COORDINATES', 'Invalid coordinates', 400);
        }
        const nearbyServices = await entities_1.ContactEntity.findNearby(lat, lon, searchRadius);
        return (0, response_1.sendSuccess)(res, nearbyServices, 'Nearby services retrieved successfully', 200);
    }
    catch (error) {
        console.error('Get nearby services error:', error);
        return (0, response_1.sendError)(res, 'SERVER_ERROR', 'Failed to retrieve nearby services', 500);
    }
});
exports.default = router;
//# sourceMappingURL=contacts.js.map