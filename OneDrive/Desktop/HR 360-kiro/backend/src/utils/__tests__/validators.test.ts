/**
 * Validator Utility Tests
 */

import { 
  validateEmail, 
  validatePhoneNumber, 
  validateCoordinates, 
  validateUUID, 
  validateCheckInStatus, 
  validateAlertSeverity, 
  validateRole 
} from '../validators';

describe('Validators', () => {
  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'user123@test-domain.com',
        'a@b.co',
      ];

      validEmails.forEach(email => {
        expect(validateEmail(email)).toBe(true);
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        '',
        'invalid',
        '@example.com',
        'user@',
        'user@.com',
        'user@example',
        'user name@example.com',
        'user@ex ample.com',
      ];

      invalidEmails.forEach(email => {
        expect(validateEmail(email)).toBe(false);
      });
    });
  });

  describe('validatePhoneNumber', () => {
    it('should validate correct phone numbers', () => {
      const validPhones = [
        '+1234567890',
        '(123) 456-7890',
        '123-456-7890',
        '1234567890',
        '+1 (123) 456-7890',
      ];

      validPhones.forEach(phone => {
        expect(validatePhoneNumber(phone)).toBe(true);
      });
    });

    it('should reject invalid phone numbers', () => {
      const invalidPhones = [
        '',
        '123',
        'abc123',
        '123-45',
        'phone',
      ];

      invalidPhones.forEach(phone => {
        expect(validatePhoneNumber(phone)).toBe(false);
      });
    });
  });

  describe('validateCoordinates', () => {
    it('should validate correct coordinates', () => {
      expect(validateCoordinates(0, 0)).toBe(true);
      expect(validateCoordinates(90, 180)).toBe(true);
      expect(validateCoordinates(-90, -180)).toBe(true);
      expect(validateCoordinates(45.5, -122.3)).toBe(true);
    });

    it('should reject invalid coordinates', () => {
      expect(validateCoordinates(91, 0)).toBe(false);
      expect(validateCoordinates(-91, 0)).toBe(false);
      expect(validateCoordinates(0, 181)).toBe(false);
      expect(validateCoordinates(0, -181)).toBe(false);
    });
  });

  describe('validateUUID', () => {
    it('should validate correct UUIDs', () => {
      const validUUIDs = [
        '123e4567-e89b-12d3-a456-426614174000',
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        '00000000-0000-0000-0000-000000000000',
      ];

      validUUIDs.forEach(uuid => {
        expect(validateUUID(uuid)).toBe(true);
      });
    });

    it('should reject invalid UUIDs', () => {
      const invalidUUIDs = [
        '',
        'invalid',
        '123e4567-e89b-12d3-a456',
        '123e4567-e89b-12d3-a456-426614174000-extra',
        'gggggggg-gggg-gggg-gggg-gggggggggggg',
      ];

      invalidUUIDs.forEach(uuid => {
        expect(validateUUID(uuid)).toBe(false);
      });
    });
  });

  describe('validateCheckInStatus', () => {
    it('should validate correct check-in statuses', () => {
      expect(validateCheckInStatus('safe')).toBe(true);
      expect(validateCheckInStatus('need_help')).toBe(true);
      expect(validateCheckInStatus('sos')).toBe(true);
    });

    it('should reject invalid check-in statuses', () => {
      expect(validateCheckInStatus('invalid')).toBe(false);
      expect(validateCheckInStatus('')).toBe(false);
      expect(validateCheckInStatus('SAFE')).toBe(false);
    });
  });

  describe('validateAlertSeverity', () => {
    it('should validate correct alert severities', () => {
      expect(validateAlertSeverity('advisory')).toBe(true);
      expect(validateAlertSeverity('watch')).toBe(true);
      expect(validateAlertSeverity('emergency')).toBe(true);
    });

    it('should reject invalid alert severities', () => {
      expect(validateAlertSeverity('invalid')).toBe(false);
      expect(validateAlertSeverity('')).toBe(false);
      expect(validateAlertSeverity('EMERGENCY')).toBe(false);
    });
  });

  describe('validateRole', () => {
    it('should validate correct roles', () => {
      expect(validateRole('admin')).toBe(true);
      expect(validateRole('hr')).toBe(true);
      expect(validateRole('manager')).toBe(true);
      expect(validateRole('employee')).toBe(true);
    });

    it('should reject invalid roles', () => {
      expect(validateRole('invalid')).toBe(false);
      expect(validateRole('')).toBe(false);
      expect(validateRole('ADMIN')).toBe(false);
    });
  });
});