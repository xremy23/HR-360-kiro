# HR Crisis 360 - Project Restart

## Project Overview
A corporate emergency knowledgebase PWA with offline-first architecture, organization-based access control, and real-time status updates.

## Architecture Decision

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **State Management**: Redux Toolkit
- **Offline Storage**: IndexedDB + Service Workers
- **Backend**: Node.js + Express + PostgreSQL
- **Deployment**: Google Cloud Run (Docker)
- **PWA**: Service Workers + Web App Manifest

### Project Structure
```
hr-360-kiro/
├── web/                          # React PWA (Desktop + Mobile responsive)
│   ├── src/
│   │   ├── components/           # Reusable UI components
│   │   ├── pages/                # Page components
│   │   ├── services/             # API & offline services
│   │   ├── store/                # Redux store
│   │   ├── hooks/                # Custom React hooks
│   │   ├── utils/                # Utility functions
│   │   ├── styles/               # Design system & global styles
│   │   ├── types/                # TypeScript types
│   │   └── main.tsx
│   ├── public/                   # Static assets
│   ├── Dockerfile
│   └── package.json
│
├── backend/                      # Node.js API Server
│   ├── src/
│   │   ├── routes/               # API endpoints
│   │   ├── services/             # Business logic
│   │   ├── models/               # Database models
│   │   ├── middleware/           # Express middleware
│   │   ├── config/               # Configuration
│   │   └── server.ts
│   ├── Dockerfile
│   └── package.json
│
├── cloudbuild.yaml               # Google Cloud Build config
└── README.md
```

## Key Features Implementation Plan

### Phase 1: Foundation (Week 1)
- [ ] Project setup (monorepo structure)
- [ ] Design system implementation
- [ ] Authentication (Magic Link SSO)
- [ ] Basic offline support (Service Worker)
- [ ] Database schema

### Phase 2: Core Features (Week 2-3)
- [ ] Organization management
- [ ] Knowledgebase CRUD
- [ ] Team check-in system
- [ ] Alerts system
- [ ] IndexedDB caching

### Phase 3: Advanced Features (Week 4)
- [ ] Chatbot integration
- [ ] To-go bag checklist
- [ ] Hotlines directory
- [ ] Admin console
- [ ] HR console

### Phase 4: Deployment (Week 5)
- [ ] Docker containerization
- [ ] Cloud Run deployment
- [ ] Performance optimization
- [ ] Testing & QA

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

## API Endpoints (RESTful)

### Auth
- `POST /api/auth/send-magic-link` - Send magic link
- `POST /api/auth/verify-magic-link` - Verify and login

### Organizations
- `POST /api/orgs` - Create org
- `GET /api/orgs/:id` - Get org details
- `POST /api/orgs/:id/invite` - Invite user
- `POST /api/orgs/join` - Join org with code

### Knowledgebase
- `GET /api/kb` - List KB articles
- `POST /api/kb` - Create article (admin)
- `PUT /api/kb/:id` - Update article (admin)
- `DELETE /api/kb/:id` - Delete article (admin)

### Alerts
- `GET /api/alerts` - List alerts
- `POST /api/alerts` - Create alert
- `GET /api/alerts/external` - Get PAGASA/PhilVocs data

### Status Updates
- `GET /api/status` - Get team status
- `POST /api/status` - Update status
- `GET /api/status/history` - Status history

### Users
- `GET /api/users` - List org users
- `PUT /api/users/:id` - Update user (admin/HR)
- `DELETE /api/users/:id` - Delete user (admin)

## Offline-First Strategy

### Service Worker
- Cache API responses
- Sync status updates when online
- Background sync for alerts

### IndexedDB Stores
- `knowledgebase` - Cached KB articles
- `alerts` - Local alerts
- `statusUpdates` - Pending status updates
- `users` - Cached user directory
- `organizations` - Org data

### Sync Strategy
1. User performs action offline
2. Action saved to IndexedDB
3. When online, sync to backend
4. Resolve conflicts (last-write-wins)

## UI/UX Flow

### Mobile (Primary)
1. **Login** → Magic link email
2. **Guest Environment** → Alerts, KB, Chatbot, To-go bag, Hotlines
3. **Create/Join Org** → Settings
4. **Org Environment** → Team check-in, Org KB, Org contacts
5. **Admin/HR** → Console access (if role assigned)

### Desktop (Secondary)
- Same features as mobile
- Additional console views (Dashboard, Directory, Admin)
- Wider layout for data tables

## Success Criteria
- ✅ Works offline (all core features)
- ✅ Syncs when online
- ✅ Organization isolation enforced
- ✅ <3s initial load
- ✅ <100KB JS bundle (gzipped)
- ✅ 90+ Lighthouse score
- ✅ Deployed to Cloud Run

## Next Steps
1. Clean up current codebase
2. Initialize fresh project structure
3. Set up backend API
4. Implement authentication
5. Build core UI components
