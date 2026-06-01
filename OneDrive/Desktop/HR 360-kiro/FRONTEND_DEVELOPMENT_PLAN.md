# Frontend Development Plan - Phase 2

**Date**: June 1, 2026  
**Status**: 🚀 Phase 2 In Progress (40% Complete)  
**Current Focus**: Frontend Component Development  
**Estimated Completion**: 11-15 days

---

## 📊 Project Status Overview

### Completed ✅
- **Backend**: 6 services, 50+ endpoints, 0 TypeScript errors
- **Database**: 24 tables, all migrations executed
- **Frontend Infrastructure**: React 18, Redux, Vite, TailwindCSS configured
- **Build Pipeline**: Both backend and frontend build successfully
- **Documentation**: 14 comprehensive markdown files
- **Design System**: Complete UI design guide with layouts and components

### Current Phase: Frontend Components (45% of Phase 2)
- **Pages**: 15 pages created (auth, employee, admin, mobile)
- **Components**: 8 components created (basic structure)
- **Status**: Ready for feature implementation

### Next Phase: Offline Support (15% of Phase 2)
- Service Worker setup
- IndexedDB integration
- Background sync
- Offline indicator UI

---

## 🎯 Frontend Development Roadmap

### Priority 1: Core User Features (Days 1-3)

#### 1.1 Chatbot UI Component ⭐ HIGH PRIORITY
**Why**: Most frequently used feature, admin feedback queue depends on this
**Files to Create/Update**:
- `web/src/components/ChatbotUI.tsx` - Main chatbot interface
- `web/src/components/ChatMessage.tsx` - Individual message component
- `web/src/components/ChatFeedback.tsx` - Feedback buttons component
- `web/src/pages/ChatbotPage.tsx` - Full page view

**Requirements**:
- Display chat messages (user and bot)
- Input field for user questions
- Feedback buttons (helpful/not helpful)
- Chat history display
- Suggested scenarios/quick replies
- Offline support (cache messages)

**API Integration**:
- `POST /api/chatbot/messages` - Save message
- `POST /api/chatbot/feedback` - Submit feedback
- `GET /api/chatbot/history` - Get chat history

**Design Reference**: UI_DESIGN_GUIDE.md - Chatbot Screen section

---

#### 1.2 Alert System UI
**Files to Create/Update**:
- `web/src/pages/AlertsPage.tsx` - Alert list page
- `web/src/components/AlertCard.tsx` - Individual alert component
- `web/src/components/AlertDetail.tsx` - Alert detail view
- `web/src/components/AlertFilter.tsx` - Filter component

**Requirements**:
- List all alerts with filtering
- Display alert severity (green/amber/red)
- Show alert details (title, description, timestamp)
- Acknowledge alerts
- Search and filter by status/severity
- Pagination

**API Integration**:
- `GET /api/alerts` - List alerts
- `GET /api/alerts/:id` - Get alert detail
- `PUT /api/alerts/:id/acknowledge` - Acknowledge alert

**Design Reference**: UI_DESIGN_GUIDE.md - Alert Card section

---

#### 1.3 Check-in Interface
**Files to Create/Update**:
- `web/src/pages/CheckInPage.tsx` - Check-in page
- `web/src/components/CheckInForm.tsx` - Check-in form
- `web/src/components/StatusSelector.tsx` - Status selection component
- `web/src/components/CheckInHistory.tsx` - History view

**Requirements**:
- Status selection (Safe, Need Help, SOS)
- Location tracking (if available)
- Optional notes/message
- Check-in history display
- Timestamp display
- Offline support (queue check-ins)

**API Integration**:
- `POST /api/checkins` - Create check-in
- `GET /api/checkins` - Get check-in history
- `GET /api/checkins/stats` - Get statistics

**Design Reference**: UI_DESIGN_GUIDE.md - Status Screen section

---

### Priority 2: Admin Features (Days 4-6)

#### 2.1 Chatbot Admin Feedback Queue Dashboard ⭐ HIGH PRIORITY
**Why**: Critical for improving chatbot responses
**Files to Create/Update**:
- `web/src/pages/AdminChatbotFeedback.tsx` - Main feedback queue page
- `web/src/components/FeedbackQueueItem.tsx` - Individual feedback item
- `web/src/components/FeedbackDetail.tsx` - Detailed feedback view
- `web/src/components/ResponsePatternEditor.tsx` - Response editor

**Requirements**:
- Display feedback queue (user questions with feedback)
- Filter by status (pending, resolved, ignored)
- Sort by date, rating, frequency
- View user question and bot response
- Edit response patterns
- Mark as resolved/ignored
- Add new response patterns
- View statistics (total feedback, resolution rate)

**API Integration**:
- `GET /api/admin/chatbot/feedback` - Get feedback queue
- `PUT /api/admin/chatbot/feedback/:id` - Update feedback status
- `POST /api/admin/chatbot/responses` - Create response pattern
- `GET /api/admin/chatbot/responses` - List response patterns
- `PUT /api/admin/chatbot/responses/:id` - Update response pattern
- `GET /api/admin/chatbot/stats` - Get statistics

**Design Reference**: UI_DESIGN_GUIDE.md - Admin Console section

---

#### 2.2 Knowledge Base Management UI
**Files to Create/Update**:
- `web/src/pages/KBManagementPage.tsx` - KB management page
- `web/src/components/KBGuideList.tsx` - Guide list component
- `web/src/components/KBGuideEditor.tsx` - Guide editor
- `web/src/components/KBCategoryManager.tsx` - Category management

**Requirements**:
- List all KB guides
- Create/edit/delete guides
- Organize by category
- Search and filter
- View acknowledgment stats
- Publish/unpublish guides
- Version history

**API Integration**:
- `GET /api/kb` - List guides
- `POST /api/kb` - Create guide
- `PUT /api/kb/:id` - Update guide
- `DELETE /api/kb/:id` - Delete guide
- `GET /api/kb/:id/acknowledgments` - Get acknowledgments

**Design Reference**: UI_DESIGN_GUIDE.md - Disaster Library section

---

#### 2.3 Incident Management Dashboard
**Files to Create/Update**:
- `web/src/pages/IncidentDashboard.tsx` - Incident dashboard
- `web/src/components/IncidentList.tsx` - Incident list
- `web/src/components/IncidentTimeline.tsx` - Timeline view
- `web/src/components/IncidentStats.tsx` - Statistics

**Requirements**:
- List all incidents with status
- Create new incidents
- Update incident status
- View incident timeline
- Add incident notes
- Assign to teams
- View statistics

**API Integration**:
- `GET /api/incidents` - List incidents
- `POST /api/incidents` - Create incident
- `PUT /api/incidents/:id` - Update incident
- `GET /api/incidents/:id` - Get incident detail

**Design Reference**: UI_DESIGN_GUIDE.md - Admin Dashboard section

---

### Priority 3: Additional Features (Days 7-9)

#### 3.1 SOS Trigger & Emergency Contacts
**Files to Create/Update**:
- `web/src/components/SOSButton.tsx` - SOS button component
- `web/src/pages/EmergencyContactsPage.tsx` - Contacts page
- `web/src/components/ContactCard.tsx` - Contact card
- `web/src/components/SOSStatus.tsx` - SOS status display

**Requirements**:
- Large, prominent SOS button
- Confirm SOS action
- Display emergency contacts
- Show escalation status
- Contact management (add/edit/delete)
- Quick call/message actions

**API Integration**:
- `POST /api/sos` - Trigger SOS
- `GET /api/sos/:id` - Get SOS status
- `GET /api/contacts` - List contacts
- `POST /api/contacts` - Create contact

**Design Reference**: UI_DESIGN_GUIDE.md - Emergency Directory section

---

#### 3.2 Organization & User Management
**Files to Create/Update**:
- `web/src/pages/OrganizationManagement.tsx` - Org management
- `web/src/components/UserList.tsx` - User list
- `web/src/components/UserForm.tsx` - User form
- `web/src/components/RoleManager.tsx` - Role management

**Requirements**:
- View organization details
- Manage users (add/edit/remove)
- Assign roles
- View user activity
- Organization settings

**API Integration**:
- `GET /api/organization` - Get org details
- `GET /api/organization/users` - List users
- `POST /api/organization/users` - Add user
- `PUT /api/organization/users/:id` - Update user

**Design Reference**: UI_DESIGN_GUIDE.md - Organization Workspace section

---

### Priority 4: Offline Support (Days 10-12)

#### 4.1 Service Worker Implementation
**Files to Create**:
- `web/src/services/serviceWorker.ts` - Service Worker registration
- `web/public/sw.js` - Service Worker script

**Requirements**:
- Cache static assets
- Cache API responses
- Offline detection
- Background sync
- Push notifications

---

#### 4.2 IndexedDB Integration
**Files to Create/Update**:
- `web/src/services/indexedDBService.ts` - IndexedDB service (already exists)
- Update all API calls to use IndexedDB cache

**Requirements**:
- Store chat messages
- Store alerts
- Store check-ins
- Store KB guides
- Sync queue for offline actions

---

#### 4.3 Offline UI Indicators
**Files to Create/Update**:
- `web/src/components/OfflineIndicator.tsx` - Offline status indicator
- `web/src/components/SyncStatus.tsx` - Sync status display

**Requirements**:
- Show offline status
- Show sync progress
- Show pending actions
- Retry mechanism

---

### Priority 5: Testing & Polish (Days 13-15)

#### 5.1 Component Testing
- Unit tests for all components
- Integration tests for pages
- E2E tests for user flows

#### 5.2 Performance Optimization
- Code splitting
- Lazy loading
- Image optimization
- Bundle size optimization

#### 5.3 Accessibility Review
- WCAG AA compliance
- Keyboard navigation
- Screen reader testing
- Color contrast verification

---

## 📋 Implementation Checklist

### Week 1: Core Features
- [ ] Chatbot UI component
- [ ] Alert system UI
- [ ] Check-in interface
- [ ] Basic styling and layout
- [ ] API integration for user features

### Week 2: Admin Features
- [ ] Chatbot feedback queue dashboard
- [ ] KB management UI
- [ ] Incident management dashboard
- [ ] SOS trigger and contacts
- [ ] Organization management

### Week 3: Offline & Polish
- [ ] Service Worker implementation
- [ ] IndexedDB integration
- [ ] Offline indicators
- [ ] Testing and optimization
- [ ] Final polish and deployment prep

---

## 🔧 Development Guidelines

### Code Organization
```
web/src/
├── components/
│   ├── ChatbotUI.tsx
│   ├── ChatMessage.tsx
│   ├── AlertCard.tsx
│   ├── CheckInForm.tsx
│   ├── SOSButton.tsx
│   └── ...
├── pages/
│   ├── ChatbotPage.tsx
│   ├── AlertsPage.tsx
│   ├── CheckInPage.tsx
│   ├── AdminChatbotFeedback.tsx
│   └── ...
├── services/
│   ├── apiService.ts
│   ├── chatbotService.ts
│   ├── indexedDBService.ts
│   └── ...
└── store/
    ├── slices/
    │   ├── chatbotSlice.ts
    │   ├── alertSlice.ts
    │   └── ...
    └── store.ts
```

### Component Structure
```typescript
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { colors, typography, spacing } from '../styles/designSystem';

interface ComponentProps {
  // Props definition
}

const Component: React.FC<ComponentProps> = ({ ...props }) => {
  // Component logic
  return (
    <div style={{ /* styling */ }}>
      {/* JSX */}
    </div>
  );
};

export default Component;
```

### Styling
- Use design system tokens from `styles/designSystem.ts`
- Use inline styles with design tokens
- Use TailwindCSS for utility classes
- Follow color palette from UI_DESIGN_GUIDE.md

### API Integration
- Use `apiService` for all API calls
- Handle errors with try-catch
- Use Redux for state management
- Cache responses in IndexedDB

### Testing
- Write tests in `__tests__` directories
- Use Jest for unit tests
- Aim for 80%+ coverage
- Test user interactions

---

## 🚀 Getting Started

### Step 1: Setup Development Environment
```bash
cd web
npm install
npm run dev
```

### Step 2: Read Documentation
- Read `UI_DESIGN_GUIDE.md` for design specifications
- Read `ARCHITECTURE.md` for system design
- Review existing components for patterns

### Step 3: Pick Your First Task
Start with **Chatbot UI Component** (Priority 1.1):
1. Create `web/src/components/ChatbotUI.tsx`
2. Create `web/src/components/ChatMessage.tsx`
3. Create `web/src/components/ChatFeedback.tsx`
4. Integrate with Redux store
5. Connect to API endpoints

### Step 4: Follow the Pattern
- Look at existing components (AlertPanel, IncidentCard)
- Follow the same structure and styling
- Use design system tokens
- Test with mock data first

---

## 📚 Reference Files

### Design System
- `UI_DESIGN_GUIDE.md` - Complete design specifications
- `styles/designSystem.ts` - Design tokens

### API Reference
- `CHATBOT_API_QUICK_REFERENCE.md` - Chatbot API endpoints
- Backend routes in `backend/src/routes/`

### Existing Components
- `web/src/components/AlertPanel.tsx` - Alert component example
- `web/src/components/IncidentCard.tsx` - Card component example
- `web/src/components/CheckInSummary.tsx` - Summary component example

### Redux Store
- `web/src/store/slices/alertSlice.ts` - Alert state management
- `web/src/store/slices/checkinSlice.ts` - Check-in state management
- `web/src/store/slices/incidentSlice.ts` - Incident state management

---

## 🎯 Success Criteria

### Phase 2 Completion (60% → 100%)
- ✅ All frontend components implemented
- ✅ All API endpoints integrated
- ✅ Offline support working
- ✅ 0 TypeScript errors
- ✅ 80%+ test coverage
- ✅ WCAG AA compliance
- ✅ Performance optimized

### Build Status
- Backend: `npm run build` ✅ 0 errors
- Frontend: `npm run build` ✅ 0 errors
- Database: All migrations executed ✅

---

## 📞 Common Issues & Solutions

### Issue: API calls failing
**Solution**: Check backend is running (`npm run dev` in backend folder)

### Issue: Redux state not updating
**Solution**: Verify dispatch is called with correct action

### Issue: Styling not applying
**Solution**: Check design system tokens are imported correctly

### Issue: Offline features not working
**Solution**: Verify Service Worker is registered and IndexedDB is initialized

---

## 🎓 Learning Resources

### TypeScript
- Review existing service implementations
- Check type definitions in entities

### React
- Review component structure in existing components
- Study Redux integration patterns

### Design System
- Read UI_DESIGN_GUIDE.md thoroughly
- Review design tokens in styles/designSystem.ts

### API Integration
- Review apiService.ts for patterns
- Check existing route implementations

---

## 📊 Progress Tracking

### Current Status
- **Phase 1**: ✅ 100% Complete
- **Phase 2**: 🚀 40% Complete
  - Backend: ✅ 100% Complete
  - Frontend: ⏳ 0% Complete (Starting Now)
  - Offline: ⏳ 0% Complete
  - Testing: ⏳ 0% Complete

### Timeline
- **Week 1** (Days 1-3): Core user features
- **Week 2** (Days 4-6): Admin features
- **Week 3** (Days 7-9): Additional features
- **Week 4** (Days 10-12): Offline support
- **Week 5** (Days 13-15): Testing & polish

### Estimated Completion
- **Phase 2**: June 15, 2026 (14 days from now)
- **Phase 3**: July 1, 2026 (planned)

---

## 🎉 Next Steps

1. **Read** `UI_DESIGN_GUIDE.md` completely
2. **Review** existing components for patterns
3. **Start** with Chatbot UI component (Priority 1.1)
4. **Follow** the implementation checklist
5. **Test** each component before moving to next
6. **Commit** regularly with meaningful messages

---

**Status**: Ready for Frontend Development  
**Next Milestone**: Chatbot UI Component  
**Estimated Time**: 2-3 days  
**Priority**: ⭐⭐⭐ HIGH

---

**Document Version**: 1.0  
**Last Updated**: June 1, 2026  
**Prepared By**: Development Team

