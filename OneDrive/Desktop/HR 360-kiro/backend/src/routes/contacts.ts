import { Router, Response } from 'express';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { validatePhoneNumber, validateCoordinates } from '../utils/validators';
import { ContactEntity } from '../entities';

const router = Router();

/**
 * GET /contacts
 * Get user contacts
 */
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'USER_NOT_FOUND', 'User not found', 404);
    }

    const userContacts = await ContactEntity.findByUserId(req.user.id);

    return sendSuccess(res, userContacts, 'Contacts retrieved successfully', 200);
  } catch (error) {
    console.error('Get contacts error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to retrieve contacts', 500);
  }
});

/**
 * POST /contacts
 * Create contact
 */
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'USER_NOT_FOUND', 'User not found', 404);
    }

    const { name, type, phone, email, category, address, latitude, longitude, isPinned } = req.body;

    if (!name || !type) {
      return sendError(res, 'INVALID_INPUT', 'Name and type required', 400);
    }

    if (phone && !validatePhoneNumber(phone)) {
      return sendError(res, 'INVALID_PHONE', 'Invalid phone number', 400);
    }

    if (latitude !== undefined || longitude !== undefined) {
      if (!validateCoordinates(latitude || 0, longitude || 0)) {
        return sendError(res, 'INVALID_COORDINATES', 'Invalid coordinates', 400);
      }
    }

    const contact = await ContactEntity.create({
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

    return sendSuccess(res, contact, 'Contact created successfully', 201);
  } catch (error) {
    console.error('Create contact error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to create contact', 500);
  }
});

/**
 * PUT /contacts/:id
 * Update contact
 */
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'USER_NOT_FOUND', 'User not found', 404);
    }

    const { id } = req.params;
    const { name, phone, isPinned } = req.body;

    const contact = await ContactEntity.findById(id);

    if (!contact || contact.userId !== req.user.id) {
      return sendError(res, 'CONTACT_NOT_FOUND', 'Contact not found', 404);
    }

    if (phone && !validatePhoneNumber(phone)) {
      return sendError(res, 'INVALID_PHONE', 'Invalid phone number', 400);
    }

    const updated = await ContactEntity.update(id, req.user.id, {
      name: name || contact.name,
      phone: phone || contact.phone,
      isPinned: isPinned !== undefined ? isPinned : contact.isPinned,
    });

    return sendSuccess(res, updated, 'Contact updated successfully', 200);
  } catch (error) {
    console.error('Update contact error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to update contact', 500);
  }
});

/**
 * DELETE /contacts/:id
 * Delete contact
 */
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'USER_NOT_FOUND', 'User not found', 404);
    }

    const { id } = req.params;

    const contact = await ContactEntity.findById(id);

    if (!contact || contact.userId !== req.user.id) {
      return sendError(res, 'CONTACT_NOT_FOUND', 'Contact not found', 404);
    }

    await ContactEntity.delete(id, req.user.id);

    return sendSuccess(res, {}, 'Contact deleted successfully', 200);
  } catch (error) {
    console.error('Delete contact error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to delete contact', 500);
  }
});

/**
 * GET /contacts/nearby
 * Get nearby services
 */
router.get('/nearby', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { latitude, longitude, radius, type } = req.query;

    if (!latitude || !longitude) {
      return sendError(res, 'INVALID_COORDINATES', 'Latitude and longitude required', 400);
    }

    const lat = parseFloat(latitude as string);
    const lon = parseFloat(longitude as string);
    const searchRadius = parseFloat(radius as string) || 5;

    if (!validateCoordinates(lat, lon)) {
      return sendError(res, 'INVALID_COORDINATES', 'Invalid coordinates', 400);
    }

    const nearbyServices = await ContactEntity.findNearby(lat, lon, searchRadius);

    return sendSuccess(res, nearbyServices, 'Nearby services retrieved successfully', 200);
  } catch (error) {
    console.error('Get nearby services error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to retrieve nearby services', 500);
  }
});

export default router;
