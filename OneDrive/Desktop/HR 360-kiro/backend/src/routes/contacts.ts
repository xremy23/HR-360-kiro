import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { validatePhoneNumber, validateCoordinates } from '../utils/validators';

const router = Router();

// Mock database
const contacts: any[] = [];

/**
 * GET /contacts
 * Get user contacts
 */
router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'USER_NOT_FOUND', 'User not found', 404);
    }

    // TODO: Fetch from database
    const userContacts = contacts.filter((c) => c.userId === req.user!.id);

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
router.post('/', authMiddleware, (req: AuthRequest, res: Response) => {
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

    const contact = {
      id: uuidv4(),
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
      createdAt: new Date(),
    };

    contacts.push(contact);

    // TODO: Save to database

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
router.put('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'USER_NOT_FOUND', 'User not found', 404);
    }

    const { id } = req.params;
    const { name, phone, isPinned } = req.body;

    // TODO: Fetch from database
    const contact = contacts.find((c) => c.id === id && c.userId === req.user!.id);

    if (!contact) {
      return sendError(res, 'CONTACT_NOT_FOUND', 'Contact not found', 404);
    }

    if (phone && !validatePhoneNumber(phone)) {
      return sendError(res, 'INVALID_PHONE', 'Invalid phone number', 400);
    }

    contact.name = name || contact.name;
    contact.phone = phone || contact.phone;
    contact.isPinned = isPinned !== undefined ? isPinned : contact.isPinned;
    contact.updatedAt = new Date();

    // TODO: Save to database

    return sendSuccess(res, contact, 'Contact updated successfully', 200);
  } catch (error) {
    console.error('Update contact error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to update contact', 500);
  }
});

/**
 * DELETE /contacts/:id
 * Delete contact
 */
router.delete('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'USER_NOT_FOUND', 'User not found', 404);
    }

    const { id } = req.params;

    // TODO: Delete from database
    const index = contacts.findIndex((c) => c.id === id && c.userId === req.user!.id);

    if (index === -1) {
      return sendError(res, 'CONTACT_NOT_FOUND', 'Contact not found', 404);
    }

    contacts.splice(index, 1);

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
router.get('/nearby', authMiddleware, (req: AuthRequest, res: Response) => {
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

    // TODO: Query nearby services from database
    // This would typically use PostGIS or similar for geospatial queries
    const nearbyServices = [
      {
        id: uuidv4(),
        name: 'City Hospital',
        type: 'hospital',
        phone: '+63912345678',
        address: '456 Hospital Ave',
        latitude: 14.6,
        longitude: 120.985,
        distance: 0.8,
      },
    ];

    return sendSuccess(res, nearbyServices, 'Nearby services retrieved successfully', 200);
  } catch (error) {
    console.error('Get nearby services error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to retrieve nearby services', 500);
  }
});

export default router;
