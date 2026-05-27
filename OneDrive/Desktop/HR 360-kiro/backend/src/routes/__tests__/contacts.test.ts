/**
 * Contacts Route Tests
 * Tests for emergency contacts management endpoints
 */

import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { jest } from '@jest/globals';
import contactsRouter from '../contacts';
import { ContactEntity } from '../../entities';

// Mock dependencies
jest.mock('../../entities');
jest.mock('jsonwebtoken');

const mockedContactEntity = ContactEntity as jest.Mocked<typeof ContactEntity>;
const mockedJwt = jwt as jest.Mocked<typeof jwt>;

// Test app setup
const app = express();
app.use(express.json());
app.use('/contacts', contactsRouter);

describe('Contacts Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set JWT secret for testing
    process.env.JWT_SECRET = 'test-jwt-secret-for-contacts-testing-32-chars-minimum';
    
    // Mock JWT verify for auth middleware
    mockedJwt.verify.mockImplementation(((token: any) => {
      if (token === 'invalid-token') {
        throw new Error('Invalid token');
      }
      return {
        id: 'user-123',
        email: 'test@example.com',
        role: 'employee',
        orgId: 'org-123',
        teamId: 'team-123',
      };
    }) as any);
  });

  describe('GET /contacts', () => {
    const mockContacts = [
      {
        id: 'contact-1',
        userId: 'user-123',
        name: 'Emergency Services',
        type: 'hotline' as const,
        phone: '+1234567890',
        email: 'emergency@example.com',
        category: 'emergency',
        isPinned: true,
        createdAt: new Date(),
      },
      {
        id: 'contact-2',
        userId: 'user-123',
        name: 'John Doe',
        type: 'personal' as const,
        phone: '+1987654321',
        email: 'john@example.com',
        category: 'family',
        isPinned: false,
        createdAt: new Date(),
      },
    ];

    it('should get user contacts successfully', async () => {
      mockedContactEntity.findByUserId.mockResolvedValue(mockContacts);

      const response = await request(app)
        .get('/contacts')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Contacts retrieved successfully');
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].id).toBe('contact-1');
      expect(mockedContactEntity.findByUserId).toHaveBeenCalledWith('user-123');
    });

    it('should handle empty contacts list', async () => {
      mockedContactEntity.findByUserId.mockResolvedValue([]);

      const response = await request(app)
        .get('/contacts')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });

    it('should handle database errors', async () => {
      mockedContactEntity.findByUserId.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/contacts')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SERVER_ERROR');
      expect(response.body.error.message).toBe('Failed to retrieve contacts');
    });
  });

  describe('POST /contacts', () => {
    const mockContact = {
      id: 'contact-123',
      userId: 'user-123',
      name: 'Emergency Contact',
      type: 'hotline' as const,
      phone: '+1234567890',
      email: 'emergency@example.com',
      category: 'emergency',
      isPinned: false,
      createdAt: new Date(),
    };

    beforeEach(() => {
      mockedContactEntity.create.mockResolvedValue(mockContact);
    });

    it('should create contact successfully', async () => {
      const contactData = {
        name: 'Emergency Contact',
        type: 'emergency',
        phone: '+1234567890',
        email: 'emergency@example.com',
        category: 'emergency',
        address: '123 Main St',
        latitude: 40.7128,
        longitude: -74.0060,
        isPinned: false,
      };

      const response = await request(app)
        .post('/contacts')
        .set('Authorization', 'Bearer valid-token')
        .send(contactData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Contact created successfully');
      expect(response.body.data.id).toBe(mockContact.id);

      expect(mockedContactEntity.create).toHaveBeenCalledWith({
        userId: 'user-123',
        name: 'Emergency Contact',
        type: 'emergency',
        phone: '+1234567890',
        email: 'emergency@example.com',
        category: 'emergency',
        address: '123 Main St',
        latitude: 40.7128,
        longitude: -74.0060,
        isPinned: false,
      });
    });

    it('should create contact with minimal data', async () => {
      const minimalData = {
        name: 'Simple Contact',
        type: 'personal',
      };

      const response = await request(app)
        .post('/contacts')
        .set('Authorization', 'Bearer valid-token')
        .send(minimalData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(mockedContactEntity.create).toHaveBeenCalledWith({
        userId: 'user-123',
        name: 'Simple Contact',
        type: 'personal',
        phone: undefined,
        email: undefined,
        category: undefined,
        address: undefined,
        latitude: undefined,
        longitude: undefined,
        isPinned: false,
      });
    });

    it('should reject missing required fields', async () => {
      const incompleteData = {
        name: 'Contact Name',
        // Missing type
      };

      const response = await request(app)
        .post('/contacts')
        .set('Authorization', 'Bearer valid-token')
        .send(incompleteData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_INPUT');
      expect(response.body.error.message).toBe('Name and type required');
    });

    it('should reject invalid phone number', async () => {
      const invalidData = {
        name: 'Contact Name',
        type: 'personal',
        phone: 'invalid-phone',
      };

      const response = await request(app)
        .post('/contacts')
        .set('Authorization', 'Bearer valid-token')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_PHONE');
      expect(response.body.error.message).toBe('Invalid phone number');
    });

    it('should reject invalid coordinates', async () => {
      const invalidData = {
        name: 'Contact Name',
        type: 'personal',
        latitude: 200, // Invalid latitude
        longitude: -74.0060,
      };

      const response = await request(app)
        .post('/contacts')
        .set('Authorization', 'Bearer valid-token')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_COORDINATES');
      expect(response.body.error.message).toBe('Invalid coordinates');
    });

    it('should handle database errors', async () => {
      mockedContactEntity.create.mockRejectedValue(new Error('Database error'));

      const contactData = {
        name: 'Contact Name',
        type: 'personal',
      };

      const response = await request(app)
        .post('/contacts')
        .set('Authorization', 'Bearer valid-token')
        .send(contactData);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SERVER_ERROR');
      expect(response.body.error.message).toBe('Failed to create contact');
    });
  });

  describe('PUT /contacts/:id', () => {
    const mockContact = {
      id: 'contact-123',
      userId: 'user-123',
      name: 'Original Name',
      type: 'hotline' as const,
      phone: '+1234567890',
      isPinned: false,
      createdAt: new Date(),
    };

    const updatedContact = {
      ...mockContact,
      name: 'Updated Name',
      phone: '+1987654321',
      isPinned: true,
    };

    beforeEach(() => {
      mockedContactEntity.findById.mockResolvedValue(mockContact);
      mockedContactEntity.update.mockResolvedValue(updatedContact);
    });

    it('should update contact successfully', async () => {
      const updateData = {
        name: 'Updated Name',
        phone: '+1987654321',
        isPinned: true,
      };

      const response = await request(app)
        .put('/contacts/contact-123')
        .set('Authorization', 'Bearer valid-token')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Contact updated successfully');
      expect(response.body.data.name).toBe('Updated Name');

      expect(mockedContactEntity.update).toHaveBeenCalledWith('contact-123', 'user-123', {
        name: 'Updated Name',
        phone: '+1987654321',
        isPinned: true,
      });
    });

    it('should update contact with partial data', async () => {
      const updateData = {
        isPinned: true,
      };

      const response = await request(app)
        .put('/contacts/contact-123')
        .set('Authorization', 'Bearer valid-token')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(mockedContactEntity.update).toHaveBeenCalledWith('contact-123', 'user-123', {
        name: 'Original Name',
        phone: '+1234567890',
        isPinned: true,
      });
    });

    it('should handle contact not found', async () => {
      mockedContactEntity.findById.mockResolvedValue(null);

      const updateData = {
        name: 'Updated Name',
      };

      const response = await request(app)
        .put('/contacts/nonexistent-id')
        .set('Authorization', 'Bearer valid-token')
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CONTACT_NOT_FOUND');
      expect(response.body.error.message).toBe('Contact not found');
    });

    it('should handle unauthorized contact access', async () => {
      const unauthorizedContact = {
        ...mockContact,
        userId: 'other-user-456',
      };
      mockedContactEntity.findById.mockResolvedValue(unauthorizedContact);

      const updateData = {
        name: 'Updated Name',
      };

      const response = await request(app)
        .put('/contacts/contact-123')
        .set('Authorization', 'Bearer valid-token')
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CONTACT_NOT_FOUND');
    });

    it('should reject invalid phone number in update', async () => {
      const updateData = {
        phone: 'invalid-phone',
      };

      const response = await request(app)
        .put('/contacts/contact-123')
        .set('Authorization', 'Bearer valid-token')
        .send(updateData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_PHONE');
      expect(response.body.error.message).toBe('Invalid phone number');
    });

    it('should handle database errors', async () => {
      mockedContactEntity.update.mockRejectedValue(new Error('Database error'));

      const updateData = {
        name: 'Updated Name',
      };

      const response = await request(app)
        .put('/contacts/contact-123')
        .set('Authorization', 'Bearer valid-token')
        .send(updateData);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SERVER_ERROR');
      expect(response.body.error.message).toBe('Failed to update contact');
    });
  });

  describe('DELETE /contacts/:id', () => {
    const mockContact = {
      id: 'contact-123',
      userId: 'user-123',
      name: 'Contact to Delete',
      type: 'hotline' as const,
      phone: '+1234567890',
      isPinned: false,
      createdAt: new Date(),
    };

    beforeEach(() => {
      mockedContactEntity.findById.mockResolvedValue(mockContact);
      mockedContactEntity.delete.mockResolvedValue(true);
    });

    it('should delete contact successfully', async () => {
      const response = await request(app)
        .delete('/contacts/contact-123')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Contact deleted successfully');
      expect(response.body.data).toEqual({});

      expect(mockedContactEntity.delete).toHaveBeenCalledWith('contact-123', 'user-123');
    });

    it('should handle contact not found for deletion', async () => {
      mockedContactEntity.findById.mockResolvedValue(null);

      const response = await request(app)
        .delete('/contacts/nonexistent-id')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CONTACT_NOT_FOUND');
      expect(response.body.error.message).toBe('Contact not found');
    });

    it('should handle unauthorized contact deletion', async () => {
      const unauthorizedContact = {
        ...mockContact,
        userId: 'other-user-456',
      };
      mockedContactEntity.findById.mockResolvedValue(unauthorizedContact);

      const response = await request(app)
        .delete('/contacts/contact-123')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CONTACT_NOT_FOUND');
    });

    it('should handle database errors during deletion', async () => {
      mockedContactEntity.delete.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .delete('/contacts/contact-123')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SERVER_ERROR');
      expect(response.body.error.message).toBe('Failed to delete contact');
    });
  });

  describe('GET /contacts/nearby', () => {
    const mockNearbyServices = [
      {
        id: 'service-1',
        userId: 'system',
        name: 'Hospital',
        type: 'location-based' as const,
        phone: '+1234567890',
        isPinned: false,
        latitude: 40.7128,
        longitude: -74.0060,
        distance: 1.2,
        createdAt: new Date(),
      },
      {
        id: 'service-2',
        userId: 'system',
        name: 'Fire Station',
        type: 'hotline' as const,
        phone: '+1234567891',
        isPinned: false,
        latitude: 40.7130,
        longitude: -74.0058,
        distance: 0.8,
        createdAt: new Date(),
      },
    ];

    beforeEach(() => {
      mockedContactEntity.findNearby.mockResolvedValue(mockNearbyServices);
    });

    it('should get nearby services successfully', async () => {
      const response = await request(app)
        .get('/contacts/nearby?latitude=40.7128&longitude=-74.0060&radius=5')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Nearby services retrieved successfully');
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].name).toBe('Hospital');

      expect(mockedContactEntity.findNearby).toHaveBeenCalledWith(40.7128, -74.0060, 5);
    });

    it('should use default radius when not provided', async () => {
      const response = await request(app)
        .get('/contacts/nearby?latitude=40.7128&longitude=-74.0060')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(mockedContactEntity.findNearby).toHaveBeenCalledWith(40.7128, -74.0060, 5);
    });

    it('should reject missing coordinates', async () => {
      const response = await request(app)
        .get('/contacts/nearby?latitude=40.7128')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_COORDINATES');
      expect(response.body.error.message).toBe('Latitude and longitude required');
    });

    it('should reject invalid coordinates', async () => {
      const response = await request(app)
        .get('/contacts/nearby?latitude=200&longitude=-74.0060')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_COORDINATES');
      expect(response.body.error.message).toBe('Invalid coordinates');
    });

    it('should handle database errors', async () => {
      mockedContactEntity.findNearby.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/contacts/nearby?latitude=40.7128&longitude=-74.0060')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SERVER_ERROR');
      expect(response.body.error.message).toBe('Failed to retrieve nearby services');
    });
  });
});

/**
 * Test Coverage Summary for Contacts Routes:
 * 
 * ✅ GET /contacts - Get user contacts
 * ✅ POST /contacts - Create new contact with validation
 * ✅ PUT /contacts/:id - Update contact with ownership check
 * ✅ DELETE /contacts/:id - Delete contact with authorization
 * ✅ GET /contacts/nearby - Find nearby emergency services
 * 
 * Coverage includes:
 * - Authentication and user ownership validation
 * - Input validation (phone numbers, coordinates)
 * - Database operations and error handling
 * - Geographic search functionality
 * - Edge cases and error conditions
 * - Partial updates and data validation
 */