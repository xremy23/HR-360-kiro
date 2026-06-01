# HR Crisis 360 - Project Restart Summary

## What We're Building

A **Progressive Web App (PWA)** for corporate emergency management with:
- ✅ Offline-first architecture
- ✅ Organization-based access control
- ✅ Real-time team status updates
- ✅ Comprehensive emergency knowledgebase
- ✅ AI chatbot for emergency guidance
- ✅ Mobile-first responsive design
- ✅ Google Cloud deployment

---

## Why We're Restarting

The previous implementation had:
- ❌ Complex, tangled codebase
- ❌ Deployment issues with Docker/Cloud Run
- ❌ Unclear architecture decisions
- ❌ Difficult to maintain and extend

**New approach**: Clean, focused, well-documented architecture from scratch.

---

## Project Structure

```
hr-360-kiro/
├── web/                    # React PWA (Frontend)
├── backend/                # Node.js API (Backend)
├── cloudbuild.yaml         # Google Cloud Build config
├── docker-compose.yml      # Local development
├── PROJECT_RESTART.md      # This plan
└── IMPLEMENTATION_GUIDE.md # How to build it
```

---

## Core Features

### 1. **Authentication**
- Magic link SSO (email-based)
- JWT tokens
- Cached credentials for offline access

### 2. **Organization Management**
- Create organizations
- Invite users with codes
- Role-based access (Admin, HR, Employee)
- Email domain restrictions

### 3. **Knowledgebase**
- Search & filter by category
- Offline access (cached)
- Categories:
  - Natural disasters (earthquakes, typhoons, floods, etc.)
  - HR protocols (workplace violence, harassment, etc.)
  - Work protocols (strikes, outages, pandemics, etc.)

### 4. **Team Check-In**
- Real-time status updates (Safe, Caution, Danger, Missing)
- Team-based visibility
- Offline sync when online

### 5. **Alerts**
- User-reported alerts (flooding, traffic, infrastructure)
- External data (PAGASA weather, PhilVocs earthquakes)
- Organization-scoped visibility

### 6. **Chatbot**
- Emergency guidance Q&A
- References knowledgebase
- Works offline

### 7. **To-Go Bag Checklist**
- Preparedness checklist
- Add/modify/delete items
- Offline persistence

### 8. **Emergency Hotlines**
- Police, fire, medical, barangay
- Suicide hotlines
- Personal emergency contacts
- Organization contacts (supervisor)

### 9. **Admin Console** (Desktop)
- User management
- Knowledgebase management
- Email domain configuration
- Organization settings

### 10. **HR Console** (Desktop)
- User directory
- Department/team management
- Organization chart
- User data management

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + TypeScript + Vite |
| **State** | Redux Toolkit |
| **Offline** | Service Workers + IndexedDB |
| **Backend** | Node.js + Express + TypeScript |
| **Database** | PostgreSQL |
| **Deployment** | Docker + Google Cloud Run |
| **Styling** | Tailwind CSS |

---

## Design System

### Colors
- **Primary**: Teal (#038F8D)
- **Secondary**: Dark Teal (#024645), Cyan (#49D7D1)
- **Semantic**: Success (#10B981), Warning (#F59E0B), Error (#EF4444)
- **Neutral**: Grayscale 50-900

### Typography
- **Display**: Outfit, Inter (headings)
- **Body**: Inter (text)
- **Mono**: JetBrains Mono (code)

### Spacing & Radius
- Spacing: 4px, 8px, 12px, 16px, 24px, 32px, 48px
- Border Radius: 4px, 8px, 12px, 16px, full

---

## Development Phases

### Phase 1: Foundation (Week 1)
- Project setup
- Design system
- Authentication
- Basic offline support
- Database schema

### Phase 2: Core Features (Week 2-3)
- Organization management
- Knowledgebase CRUD
- Team check-in
- Alerts system
- IndexedDB caching

### Phase 3: Advanced Features (Week 4)
- Chatbot
- To-go bag checklist
- Hotlines directory
- Admin console
- HR console

### Phase 4: Deployment (Week 5)
- Docker containerization
- Cloud Run deployment
- Performance optimization
- Testing & QA

---

## Key Architectural Decisions

### 1. **Offline-First**
- All data cached locally
- Sync when online
- Conflict resolution (last-write-wins)

### 2. **Organization Isolation**
- Every API request validated
- User must belong to org
- Data scoped to org

### 3. **Mobile-First**
- Responsive design
- Touch-friendly UI
- Optimized for 4G/5G

### 4. **PWA**
- Installable on home screen
- Works offline
- Push notifications ready

### 5. **Monorepo**
- Shared types between frontend/backend
- Easier to maintain
- Single deployment pipeline

---

## API Design

### RESTful Endpoints

```
Auth
  POST   /api/auth/send-magic-link
  POST   /api/auth/verify-magic-link

Organizations
  POST   /api/orgs
  GET    /api/orgs/:id
  POST   /api/orgs/:id/invite
  POST   /api/orgs/join

Knowledgebase
  GET    /api/kb
  POST   /api/kb (admin)
  PUT    /api/kb/:id (admin)
  DELETE /api/kb/:id (admin)

Alerts
  GET    /api/alerts
  POST   /api/alerts
  GET    /api/alerts/external

Status
  GET    /api/status
  POST   /api/status
  GET    /api/status/history

Users
  GET    /api/users
  PUT    /api/users/:id (admin/hr)
  DELETE /api/users/:id (admin)
```

---

## Database Schema (PostgreSQL)

### Core Tables
- `users` - User accounts
- `organizations` - Company/org data
- `teams` - Team groupings
- `departments` - Department groupings
- `knowledgebase` - KB articles
- `alerts` - User-reported alerts
- `status_updates` - Team check-in status
- `contacts` - Emergency contacts
- `to_go_bag_items` - Checklist items
- `user_roles` - Role assignments

---

## Offline Strategy

### Service Worker
- Cache static assets (cache-first)
- Cache API responses (network-first)
- Background sync for status updates

### IndexedDB Stores
- `knowledgebase` - Cached KB articles
- `alerts` - Local alerts
- `statusUpdates` - Pending status updates
- `users` - Cached user directory
- `organizations` - Org data
- `syncQueue` - Pending API calls

### Sync Flow
1. User performs action offline
2. Action saved to IndexedDB
3. UI updated optimistically
4. When online, sync to backend
5. Resolve conflicts
6. Update local cache

---

## UI/UX Flow

### Mobile (Primary)
```
Login
  ↓
Guest Environment
  ├─ Alerts
  ├─ Knowledgebase
  ├─ Chatbot
  ├─ To-Go Bag
  ├─ Hotlines
  └─ Settings
    ├─ Create Org
    └─ Join Org
  ↓
Org Environment
  ├─ Team Check-In
  ├─ Org Knowledgebase
  ├─ Org Contacts
  └─ Admin/HR Console (if role)
```

### Desktop (Secondary)
- Same features as mobile
- Additional console views
- Wider layout for data tables
- Dashboard with analytics

---

## Success Criteria

- ✅ Works offline (all core features)
- ✅ Syncs seamlessly when online
- ✅ Organization isolation enforced
- ✅ <3s initial load time
- ✅ <100KB JS bundle (gzipped)
- ✅ 90+ Lighthouse score
- ✅ Deployed to Cloud Run
- ✅ Mobile responsive
- ✅ Accessible (WCAG 2.1 AA)

---

## Next Steps

1. **Review this plan** - Ensure alignment with requirements
2. **Set up development environment** - Node, PostgreSQL, Docker
3. **Initialize project structure** - Create folders and configs
4. **Implement Phase 1** - Foundation (auth, design system, DB)
5. **Build incrementally** - Phase 2, 3, 4 in sequence
6. **Test thoroughly** - Unit, integration, E2E tests
7. **Deploy to Cloud Run** - Final deployment

---

## Questions to Clarify

1. **Chatbot**: Should it use OpenAI API or local embeddings?
2. **External Data**: How often to sync PAGASA/PhilVocs data?
3. **Notifications**: Push notifications for alerts?
4. **Analytics**: Track user behavior?
5. **Backup**: Database backup strategy?
6. **Scaling**: Expected number of users?

---

## Resources

- [React Documentation](https://react.dev)
- [Redux Toolkit](https://redux-toolkit.js.org)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Google Cloud Run](https://cloud.google.com/run/docs)
- [PostgreSQL](https://www.postgresql.org/docs/)
- [Express.js](https://expressjs.com/)

---

## Contact & Support

For questions or clarifications, refer to:
- `PROJECT_RESTART.md` - Detailed architecture
- `IMPLEMENTATION_GUIDE.md` - Step-by-step implementation
- Code comments - Inline documentation

---

**Status**: Ready to begin Phase 1 implementation

**Last Updated**: June 1, 2026

**Next Review**: After Phase 1 completion
