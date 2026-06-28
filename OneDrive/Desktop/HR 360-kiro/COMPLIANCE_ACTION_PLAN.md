# Safety F.I.R.S.T. PWA - Compliance Action Plan
**Audit Date**: June 19, 2026  
**Current Compliance**: 78-82%  
**Target Compliance**: 95%+

---

## 🔴 CRITICAL PRIORITY (Blocking PWA Status)

### 1. Implement Offline-First Architecture with Service Worker + IndexedDB

**Why It's Critical**:
- PWA core feature specified in Section 5
- Without it, app cannot function offline
- Cannot claim "offline-first" architecture
- Safety app MUST work when connectivity drops

**Scope**: 2-3 weeks, 1-2 developers

#### Task 1.1: Service Worker Implementation
**File**: `web/public/sw.js` (create)  
**Estimated**: 3-4 days

```typescript
// Service Worker Skeleton
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('safety-first-v1').then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/css/main.css',
        '/js/app.js'
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Implement network-first strategy for API
  // Cache-first for assets
  // Offline fallback for DB
});
```

**Checklist**:
- [ ] Create service worker file
- [ ] Implement cache strategy (network-first for API, cache-first for assets)
- [ ] Add offline fallback page
- [ ] Handle cache versioning
- [ ] Test in DevTools offline mode

---

#### Task 1.2: IndexedDB Schema & Setup
**File**: `web/src/services/db/indexedDB.ts` (create)  
**Estimated**: 3-4 days

**Entities to Cache**:
1. **KB Guides** - Full text-searchable guides for offline reference
2. **Community Reports** - Last 100 reports cached locally
3. **Contacts** - Emergency services + user contacts
4. **Check-in History** - Recent check-in states
5. **Settings** - User preferences
6. **Auth** - JWT tokens (already in localStorage)

```typescript
// IndexedDB Schema
const DB_NAME = 'SafetyFirstDB';
const DB_VERSION = 1;

const STORES = {
  KB_GUIDES: {
    name: 'kb_guides',
    keyPath: 'id',
    indexes: [
      { name: 'title', keyPath: 'title' },
      { name: 'category', keyPath: 'category' },
      { name: 'synced_at', keyPath: 'synced_at' }
    ]
  },
  COMMUNITY_REPORTS: {
    name: 'community_reports',
    keyPath: 'id',
    indexes: [
      { name: 'org_id', keyPath: 'org_id' },
      { name: 'created_at', keyPath: 'created_at' }
    ]
  },
  CONTACTS: {
    name: 'contacts',
    keyPath: 'id',
    indexes: [
      { name: 'category', keyPath: 'category' },
      { name: 'type', keyPath: 'type' }
    ]
  },
  CHECKINS: {
    name: 'checkins',
    keyPath: 'id',
    indexes: [
      { name: 'user_id', keyPath: 'user_id' },
      { name: 'timestamp', keyPath: 'timestamp' }
    ]
  },
  SYNC_QUEUE: {
    name: 'sync_queue',
    keyPath: 'id',
    indexes: [
      { name: 'status', keyPath: 'status' },
      { name: 'created_at', keyPath: 'created_at' }
    ]
  }
};
```

**Checklist**:
- [ ] Design IndexedDB schema
- [ ] Implement database initialization
- [ ] Create CRUD methods for each store
- [ ] Add migration handling
- [ ] Test data persistence across page reloads

---

#### Task 1.3: Offline Sync Queue
**File**: `web/src/services/offlineSync.ts` (create)  
**Estimated**: 2-3 days

**Queue Types**:
1. CREATE actions (new reports, check-ins)
2. UPDATE actions (upvote, status change)
3. DELETE actions (remove report)

```typescript
// Offline Sync Service
class OfflineSyncService {
  async queueAction(action: SyncAction) {
    // 1. Save to sync queue in IndexedDB
    // 2. Execute optimistically on local state
    // 3. Mark as pending
    // 4. Retry on reconnection
  }

  async processSyncQueue() {
    // 1. Detect online status
    // 2. Fetch pending actions from queue
    // 3. Retry failed actions
    // 4. Mark as synced
    // 5. Update local state
  }

  async handleSyncConflict(action: SyncAction) {
    // Server version wins for auth/security actions
    // Client version wins for user-generated content (reports)
    // Notify user of conflicts
  }
}
```

**Checklist**:
- [ ] Implement sync queue data model
- [ ] Add action queueing logic
- [ ] Implement retry with exponential backoff
- [ ] Add conflict resolution strategy
- [ ] Add network status detection (navigator.onLine)
- [ ] Test offline -> online sync flow

---

#### Task 1.4: Redux Integration for Offline State
**File**: `web/src/store/slices/offlineSlice.ts` (create)  
**Estimated**: 1-2 days

```typescript
// Offline State
interface OfflineState {
  isOnline: boolean;
  syncStatus: 'idle' | 'syncing' | 'error';
  pendingActions: number;
  lastSync: Date | null;
  failedActions: SyncAction[];
}

// Redux integration for:
// - Show sync indicator in UI
// - Disable certain actions when offline
// - Show "syncing..." message during reconnection
```

**Checklist**:
- [ ] Create offlineSlice with status tracking
- [ ] Add network listener to update isOnline
- [ ] Add sync status indicators to UI
- [ ] Add pending actions badge
- [ ] Test Redux integration

---

#### Task 1.5: UI Indicators & User Feedback
**Files**: Multiple components  
**Estimated**: 1-2 days

**Add to UI**:
1. **Sync Status Indicator** (top-right header)
   - 🟢 Online / Synced
   - 🟡 Online / Syncing
   - 🔴 Offline
   - 🟠 Offline / Pending X actions

2. **Queued Actions Badge** (on navbar)
   - Show count of pending actions
   - Click to view details

3. **Offline Banner** (top of page)
   - "You're offline. Actions will sync when you're back online."
   - Auto-hide when online

**Checklist**:
- [ ] Create SyncStatusIndicator component
- [ ] Add to DesktopLayout header
- [ ] Add to MobileLayout footer
- [ ] Add queued actions counter
- [ ] Add offline notification toast
- [ ] Test visibility in offline mode

---

### Offline-First Acceptance Criteria
- ✅ App loads and functions without network
- ✅ KB guides available offline
- ✅ Recent reports cached offline
- ✅ Can create new reports offline (queued)
- ✅ Can change check-in status offline
- ✅ Sync queue processes on reconnection
- ✅ No data loss during offline -> online transition
- ✅ Conflicts handled gracefully

---

## 🟡 HIGH PRIORITY (1-2 weeks)

### 2. Add Tablet Layout Support

**Why**: Spec explicitly calls for tablet breakpoints (768-1023px)

**Scope**: 1 week, 1 developer

#### Task 2.1: Define Responsive Breakpoints
**File**: `web/src/styles/breakpoints.ts` (create)

```typescript
export const BREAKPOINTS = {
  MOBILE: 0,      // <768px
  TABLET: 768,    // 768px - 1023px
  DESKTOP: 1024,  // ≥1024px
};

export const VIEWPORT_SIZES = {
  mobile: 'max-w-md',
  tablet: 'max-w-2xl',
  desktop: 'max-w-7xl',
};

// Tailwind config
// sm: 640px, md: 768px, lg: 1024px, xl: 1280px
```

**Checklist**:
- [ ] Define breakpoint constants
- [ ] Add to Tailwind config
- [ ] Document responsive strategy

---

#### Task 2.2: Create Tablet Layout Component
**File**: `web/src/components/TabletLayout.tsx` (create)  
**Estimated**: 2-3 days

```typescript
// Tablet Layout
// - Two-column grid (sidebar + content)
// - Responsive sidebar (collapsible on tablet)
// - Larger touch targets (44-48px buttons)
// - Adaptive font sizes

const TabletLayout: React.FC = () => {
  // md: grid-cols-1 lg: grid-cols-3
  // Sidebar: md: hidden lg: block (or always visible with toggle)
  // Content: full-width on tablet, constrained on larger
}
```

**Checklist**:
- [ ] Create TabletLayout component
- [ ] Add responsive grid with md: breakpoints
- [ ] Ensure 44-48px min touch targets
- [ ] Test on iPad/tablet emulator
- [ ] Verify responsive behavior

---

#### Task 2.3: Update Responsive Components
**Files**: All main layout components  
**Estimated**: 2-3 days

Audit and update:
- [ ] Header responsive sizes
- [ ] Navigation responsive widths
- [ ] Card responsive padding
- [ ] Input responsive sizes
- [ ] Modal responsive sizes
- [ ] Table responsive columns

**Test Breakpoints**:
- [ ] 768px - Tablet portrait
- [ ] 1024px - Tablet landscape / Small desktop
- [ ] 1280px - Full desktop

---

### Tablet Layout Acceptance Criteria
- ✅ UI adapts properly at 768px breakpoint
- ✅ Two-column grid on tablet
- ✅ Touch targets ≥44px
- ✅ No content overflow
- ✅ Navigation accessible on tablet
- ✅ Admin consoles visible on tablet (if > 1024px)

---

### 3. Enforce Email Domain Restrictions

**Why**: Critical security feature for organization access control

**Scope**: 2-3 days, 1 developer

#### Task 3.1: Validate Domain in Magic Link Generation
**File**: `backend/src/services/authService.ts` (modify)  
**Estimated**: 1 day

```typescript
async generateMagicLink(email: string, orgId?: string) {
  // 1. If orgId provided, validate email domain
  if (orgId) {
    const org = await organizationService.findById(orgId);
    const emailDomain = email.split('@')[1];
    
    if (org.emailDomain && org.emailDomain !== emailDomain) {
      throw new ValidationError('Email domain not allowed');
    }
  }
  
  // 2. Generate and send magic link
  const token = generateSecureToken();
  await magicLinkService.create({ email, token, expiresAt });
  await emailService.sendMagicLink(email, token);
}
```

**Checklist**:
- [ ] Add domain validation logic
- [ ] Add error handling
- [ ] Test validation with matching domain
- [ ] Test validation with non-matching domain
- [ ] Add unit tests

---

#### Task 3.2: Validate Domain During Organization Creation
**File**: `backend/src/routes/organization.ts` (modify)  
**Estimated**: 1 day

```typescript
// POST /api/organizations
router.post('/', async (req, res) => {
  const { name, email_domain, created_by } = req.body;
  
  // 1. Validate email_domain format
  if (!isValidEmailDomain(email_domain)) {
    return res.status(400).json({ error: 'Invalid email domain' });
  }
  
  // 2. Store email_domain
  const org = await Organization.create({ name, email_domain, created_by });
  
  res.json(org);
});
```

**Checklist**:
- [ ] Add domain format validation
- [ ] Add to organization creation endpoint
- [ ] Test domain storage
- [ ] Test invalid domain rejection

---

#### Task 3.3: Validate Domain During Invite Acceptance
**File**: `backend/src/routes/organization.ts` (modify)  
**Estimated**: 1 day

```typescript
// POST /api/organizations/:id/accept-invite
router.post('/:id/accept-invite', async (req, res) => {
  const { inviteCode, email } = req.body;
  
  // 1. Validate invite code
  const invite = await Invite.findByCode(inviteCode);
  
  // 2. Validate email domain matches org
  const org = await Organization.findById(invite.org_id);
  const emailDomain = email.split('@')[1];
  
  if (org.email_domain && org.email_domain !== emailDomain) {
    return res.status(403).json({ error: 'Email domain not allowed' });
  }
  
  // 3. Accept invite
  await User.assignToOrg(email, org.id, invite.role);
  
  res.json({ success: true });
});
```

**Checklist**:
- [ ] Add domain validation to invite acceptance
- [ ] Test acceptance with matching domain
- [ ] Test rejection with non-matching domain
- [ ] Add error messages

---

### Email Domain Enforcement Acceptance Criteria
- ✅ Users can only sign up with approved email domains
- ✅ Error shown for non-approved domains
- ✅ IT Admin can configure email domains
- ✅ Invite acceptance validates domain
- ✅ Cannot bypass domain restrictions

---

## 🟠 MEDIUM PRIORITY (1-2 weeks)

### 4. Increase Test Coverage to 70%+

**Why**: Ensure code reliability and catch bugs early

**Scope**: 1-2 weeks, 1-2 developers

#### Task 4.1: Add Integration Tests
**Estimated**: 3-4 days

```typescript
// Integration test example: Complete bulk import flow
describe('Bulk Import Integration', () => {
  it('should successfully import users from CSV', async () => {
    // 1. HR Admin uploads CSV
    const response = await request(app)
      .post('/api/bulk-import/upload')
      .set('Authorization', `Bearer ${hrAdminToken}`)
      .attach('file', csvPath);
    
    // 2. Validate preview
    expect(response.body.preview).toHaveLength(5);
    
    // 3. Execute import
    const executeRes = await request(app)
      .post('/api/bulk-import/execute')
      .set('Authorization', `Bearer ${hrAdminToken}`)
      .send({ job_id: response.body.job_id });
    
    // 4. Verify users created
    const users = await User.findByOrgId(org.id);
    expect(users).toHaveLength(5);
  });
});
```

**Checklist**:
- [ ] Write integration tests for critical workflows
- [ ] Test complete end-to-end flows
- [ ] Test error cases
- [ ] Add setup/teardown for test data

---

#### Task 4.2: Add E2E Tests for Critical Paths
**Estimated**: 2-3 days

Using Cypress or Playwright:

```typescript
// E2E test example: Login and check-in flow
describe('Employee Check-in Flow', () => {
  it('should login and update check-in status', () => {
    cy.visit('http://localhost:3000/login');
    cy.get('input[type="email"]').type('user@example.com');
    cy.get('button').contains('Send Magic Link').click();
    
    // Intercept magic link (in test environment)
    cy.request('/api/auth/magic-link/verify?token=...');
    
    cy.get('button').contains('Safe').click();
    cy.contains('Status Updated').should('be.visible');
  });
});
```

**Checklist**:
- [ ] Set up Cypress or Playwright
- [ ] Write E2E tests for critical flows
- [ ] Test on different browsers
- [ ] Add to CI/CD

---

#### Task 4.3: Configure CI/CD with Test Gates
**Files**: `.github/workflows/test.yml` (create)  
**Estimated**: 1 day

```yaml
name: Run Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      
      - run: npm install
      - run: npm run test:backend -- --coverage
      - run: npm run test:frontend -- --coverage
      
      - name: Check Coverage
        run: |
          if [ $(cat coverage/coverage.txt | grep -oP 'Total.*?\K\d+' | head -1) -lt 70 ]; then
            echo "Coverage below 70%"
            exit 1
          fi
```

**Checklist**:
- [ ] Configure CI/CD pipeline
- [ ] Add test gates (coverage ≥ 70%)
- [ ] Block PRs if tests fail
- [ ] Report coverage metrics

---

### Test Coverage Acceptance Criteria
- ✅ Overall coverage ≥ 70%
- ✅ Critical paths covered (auth, bulk import, check-in)
- ✅ Integration tests for workflows
- ✅ E2E tests for user journeys
- ✅ CI/CD enforces test requirements

---

## ✅ LOW PRIORITY (Nice to Have)

### 5. Add Performance Monitoring & Analytics
**Estimated**: 1-2 weeks

- [ ] Add Sentry for error tracking
- [ ] Add New Relic or DataDog for performance
- [ ] Add Mixpanel for user analytics
- [ ] Add Core Web Vitals monitoring

### 6. Create User Documentation
**Estimated**: 1-2 weeks

- [ ] User guide PDFs
- [ ] Video tutorials
- [ ] FAQ documentation
- [ ] Admin setup guide

### 7. Accessibility Improvements
**Estimated**: 1 week

- [ ] WCAG 2.1 AA compliance audit
- [ ] Screen reader testing
- [ ] Keyboard navigation testing
- [ ] Color contrast improvements

---

## 📅 IMPLEMENTATION TIMELINE

### Week 1-2: Offline-First (CRITICAL)
- [ ] Service Worker implementation
- [ ] IndexedDB schema & setup
- [ ] Offline sync queue
- [ ] Redux integration
- [ ] UI indicators

### Week 3: Tablet Layout + Email Domain (HIGH PRIORITY)
- [ ] Tablet responsive design
- [ ] Email domain enforcement
- [ ] Responsive component updates

### Week 4: Testing (HIGH PRIORITY)
- [ ] Integration tests
- [ ] E2E tests
- [ ] CI/CD pipeline
- [ ] Coverage improvements

### Week 5+: Polish & Monitoring (MEDIUM/LOW PRIORITY)
- [ ] Performance monitoring
- [ ] Documentation
- [ ] Accessibility
- [ ] Analytics

---

## 🎯 SUCCESS METRICS

| Metric | Current | Target | By Date |
|--------|---------|--------|---------|
| Spec Compliance | 78-82% | 95%+ | Week 4 |
| Test Coverage | ~40% | 70%+ | Week 4 |
| Offline Support | 0% | 100% | Week 2 |
| Performance LCP | Unknown | <2.5s | Week 4 |
| Security Score | Unknown | A | Week 4 |
| App Deployment | Online-only | Full PWA | Week 2 |

---

## 📞 QUESTIONS & ESCALATION

### If Offline-First Seems Complex
- Recommend using `workbox` library to simplify service worker
- Recommend `dexie.js` to simplify IndexedDB
- Consider hiring PWA specialist for 2-3 week sprint

### If Timeline Too Aggressive
- Prioritize: 1. Offline-first (PWA core), 2. Email domain enforcement, 3. Tablet layout
- Defer: Testing improvements, monitoring, documentation to phase 2

### If Team Size Limited
- Offline-first: 1-2 developers (complex)
- Email domain: 1 developer (simple)
- Tablet layout: 1 developer (medium)
- Testing: 1 developer (ongoing)

---

## ✅ TRACKING CHECKLIST

- [ ] Offline-first service worker deployed
- [ ] IndexedDB caching functional
- [ ] Sync queue tested end-to-end
- [ ] Tablet layout responsive
- [ ] Email domain enforced at all entry points
- [ ] Test coverage ≥ 70%
- [ ] E2E tests automated
- [ ] CI/CD pipeline running
- [ ] All 4 admin consoles tested
- [ ] Performance benchmarks met
- [ ] Security audit passed
- [ ] Documentation complete
- [ ] Ready for production deployment ✅

---

**Prepared by**: Development Team  
**Next Review**: June 26, 2026  
**Status**: In Progress ⏳
