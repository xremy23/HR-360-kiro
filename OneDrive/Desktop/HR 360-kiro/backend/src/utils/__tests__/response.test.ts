/**
 * Response Utility Tests
 */

import { sendSuccess, sendError, sendPaginated } from '../response';
import { Response } from 'express';

describe('Response Utils', () => {
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('sendSuccess', () => {
    it('should send success response with data', () => {
      const data = { id: 1, name: 'Test' };
      const message = 'Success';
      const statusCode = 200;

      sendSuccess(mockRes as Response, data, message, statusCode);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Success',
        data: { id: 1, name: 'Test' },
      });
    });

    it('should use default status code 200', () => {
      sendSuccess(mockRes as Response, null, 'Success');

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should use default message', () => {
      sendSuccess(mockRes as Response, { test: 'data' });

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Operation successful',
        data: { test: 'data' },
      });
    });

    it('should handle null data', () => {
      sendSuccess(mockRes as Response, null, 'Success');

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Success',
        data: null,
      });
    });
  });

  describe('sendError', () => {
    it('should send error response', () => {
      const code = 'VALIDATION_ERROR';
      const message = 'Invalid input';
      const statusCode = 400;

      sendError(mockRes as Response, code, message, statusCode);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
        },
        statusCode: 400,
      });
    });

    it('should use default status code 400', () => {
      sendError(mockRes as Response, 'SERVER_ERROR', 'Internal error');

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should handle empty message', () => {
      sendError(mockRes as Response, 'ERROR', '');

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'ERROR',
          message: '',
        },
        statusCode: 400,
      });
    });
  });

  describe('sendPaginated', () => {
    it('should send paginated response', () => {
      const data = [{ id: 1 }, { id: 2 }];
      const total = 10;
      const limit = 2;
      const offset = 0;

      sendPaginated(mockRes as Response, data, total, limit, offset);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: [{ id: 1 }, { id: 2 }],
        pagination: {
          total: 10,
          limit: 2,
          offset: 0,
          pages: 5,
        },
      });
    });

    it('should calculate pages correctly', () => {
      const data = [{ id: 1 }];
      const total = 7;
      const limit = 3;
      const offset = 0;

      sendPaginated(mockRes as Response, data, total, limit, offset);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: [{ id: 1 }],
        pagination: {
          total: 7,
          limit: 3,
          offset: 0,
          pages: 3, // Math.ceil(7/3) = 3
        },
      });
    });
  });
});