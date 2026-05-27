# Quick Start: Testing Implementation

**Get started in 5 minutes!**

---

## Step 1: Install Dependencies (2 minutes)

```bash
cd backend

# Install testing dependencies
npm install --save-dev @types/jest jest-mock-extended ts-jest

# Verify Jest is working
npm test -- --listTests
```

---

## Step 2: Create Mock Files (2 minutes)

### Create `backend/src/__mocks__/database.ts`:

```typescript
export const mockConnection = {
  query: jest.fn(),
  execute: jest.fn(),
  transaction: jest.fn(),
  close: jest.fn(),
};

export const getConnection = jest.fn().mockResolvedValue(mockConnection);

export default { getConnection, mockConnection };
```

### Create `backend/src/__mocks__/entities.ts`:

```typescript
export const AlertEntityMock = {
  create: jest.fn(),
  findById: jest.fn(),
  findByOrgId: jest.fn(),
};

export const UserEntityMock = {
  create: jest.fn(),
  findById: jest.fn(),
  findByOrgId: jest.fn(),
};

export const PushNotificationEntityMock = {
  create: jest.fn(),
  findByUserId: jest.fn(),
  markAsRead: jest.fn(),
};

export const DeviceTokenEntityMock = {
  findByUserId: jest.fn(),
  upsert: jest.fn(),
  deleteByToken: jest.fn(),
};

export default {
  AlertEntityMock,
  UserEntityMock,
  PushNotificationEntityMock,
  DeviceTokenEntityMock,
};
```

### Create `backend/src/__mocks__/websocket.ts`:

```typescript
export const webSocketServerMock = {
  broadcastAlertCreated: jest.fn(),
  broadcastSOSCreated: jest.fn(),
  broadcastNotificationToUser: jest.fn(),
  broadcastNotificationToOrganization: jest.fn(),
};

export const getWebSocketServer = jest.fn().mockReturnValue(webSocketServerMock);

export default { webSocketServerMock, getWebSocketServer };
```

---

## Step 3: Run Tests (1 minute)

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- pushNotificationService.test.ts

# Run in watch mode
npm test -- --watch
```

---

## Step 4: Check Results

You should see output like:

```
PASS  src/services/__tests__/pushNotificationService.test.ts
  PushNotificationService
    sendPushNotification
      ✓ should send push notification to user (45ms)
      ✓ should handle user with no device tokens (32ms)
    sendBulkPushNotifications
      ✓ should send notifications to multiple users (38ms)

Test Suites: 1 passed, 1 total
Tests:       3 passed, 3 total
Snapshots:   0 total
Time:        2.345s
```

---

## Common Commands

```bash
# Run all tests
npm test

# Run with coverage report
npm test -- --coverage

# Run specific test file
npm test -- pushNotificationService.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="should send"

# Run in watch mode (re-run on file changes)
npm test -- --watch

# Update snapshots
npm test -- --updateSnapshot

# Run with verbose output
npm test -- --verbose

# Run with specific reporter
npm test -- --reporters=verbose

# Generate HTML coverage report
npm test -- --coverage --coverageReporters=html
```

---

## Troubleshooting

### Issue: "Cannot find module"
**Solution**: Make sure mock files are in `__mocks__` directory with correct names

### Issue: "Tests not found"
**Solution**: Verify test files are in `__tests__` directory and end with `.test.ts`

### Issue: "TypeScript errors"
**Solution**: Check `jest.config.js` has proper ts-jest configuration

### Issue: "Mocks not working"
**Solution**: Add `jest.mock()` at top of test file before imports

---

## Next: Week 1 Checklist

- [ ] Install dependencies
- [ ] Create mock files (database, entities, websocket)
- [ ] Run tests successfully
- [ ] Get initial coverage report
- [ ] Fix any failing tests
- [ ] Commit changes to git

```bash
git add backend/src/__mocks__/
git add backend/jest.config.js
git commit -m "Add mock files for testing"
git push
```

---

## Week 2: Improve Coverage

Once Week 1 is complete:

1. Run coverage report: `npm test -- --coverage`
2. Identify files with <80% coverage
3. Add tests for missing scenarios
4. Re-run coverage until >80%

---

## Week 3: E2E Testing

```bash
# Install Playwright
npm install --save-dev @playwright/test

# Create E2E tests
mkdir -p backend/e2e

# Run E2E tests
npx playwright test
```

---

## Week 4: Performance Testing

```bash
# Install k6
npm install --save-dev k6

# Run load test
k6 run backend/performance/load-test.js
```

---

## Week 5: Security & Production

```bash
# Security audit
npm audit

# Fix vulnerabilities
npm audit fix

# Deploy to staging
npm run build
# Deploy to staging server
```

---

## Resources

- Full guide: `TESTING_IMPLEMENTATION_GUIDE.md`
- Test scenarios: `E2E_TEST_SCENARIOS.md`
- Performance guide: `PERFORMANCE_TESTING.md`
- Security checklist: `SECURITY_AUDIT_CHECKLIST.md`

---

## Get Help

If you get stuck:

1. Check the full guide: `TESTING_IMPLEMENTATION_GUIDE.md`
2. Review test examples in `backend/src/services/__tests__/`
3. Check Jest documentation: https://jestjs.io/
4. Review error messages carefully

---

**You're ready to start! Begin with Step 1 above.**
