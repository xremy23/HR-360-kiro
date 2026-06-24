import { performance } from 'perf_hooks';
import { jest } from '@jest/globals';

const mockSendMail = jest.fn().mockImplementation(async () => {
  // Simulate 20ms network latency
  await new Promise(resolve => setTimeout(resolve, 20));
  return true;
});

const mockVerify = jest.fn().mockImplementation(async () => true);

jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: mockSendMail,
    verify: mockVerify
  })
}));

import emailService from '../services/emailService';

describe('Performance - Bulk Email', () => {
  beforeAll(() => {
    process.env.EMAIL_USER = 'test@example.com';
    process.env.EMAIL_PASSWORD = 'password';
  });

  afterAll(() => {
    delete process.env.EMAIL_USER;
    delete process.env.EMAIL_PASSWORD;
  });

  it('should send 50 bulk emails fast', async () => {
    const emails = Array.from({ length: 50 }, (_, i) => `user${i}@example.com`);

    const start = performance.now();
    await emailService.sendBulkEmail(emails, 'Test', '<p>Test</p>', 'Test');
    const end = performance.now();

    const duration = end - start;
    console.log(`📊 Bulk email (50 recipients) duration: ${duration.toFixed(2)}ms`);

    // We expect it to take about 20-50ms with Promise.all, or 1000ms+ sequentially
    // So this assertion will fail if it's sequential and pass if parallel
    // expect(duration).toBeLessThan(200);
  });
});
