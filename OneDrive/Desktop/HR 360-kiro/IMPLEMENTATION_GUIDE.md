# HR Crisis 360 - Implementation Guide

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Docker & Docker Compose
- Google Cloud SDK

### Quick Start

```bash
# Clone and setup
git clone <repo>
cd hr-360-kiro

# Install dependencies
npm install --workspaces

# Setup environment
cp .env.example .env
cp backend/.env.example backend/.env

# Start development
npm run dev
```

## Development Workflow

### 1. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Setup database
npm run db:migrate

# Start server
npm run dev
```

**Backend runs on**: `http://localhost:3001`

### 2. Frontend Setup

```bash
cd web

# Install dependencies
npm install

# Start dev server
npm run dev
```

**Frontend runs on**: `http://localhost:5173`

### 3. Database Setup

```bash
# Create PostgreSQL database
createdb hr_crisis_360

# Run migrations
npm run db:migrate

# Seed sample data (optional)
npm run db:seed
```

## Key Implementation Details

### Authentication Flow

1. User enters email on login page
2. Backend sends magic link via email
3. User clicks link with token
4. Frontend verifies token with backend
5. Backend returns JWT token
6. Frontend stores token in localStorage + IndexedDB
7. User redirected to app

### Offline Sync Flow

```
User Action (Offline)
    ↓
Save to IndexedDB
    ↓
Show optimistic UI update
    ↓
Device comes online
    ↓
Service Worker detects online
    ↓
Sync pending changes to backend
    ↓
Resolve conflicts
    ↓
Update local cache
    ↓
Update UI
```

### Organization Isolation

Every API request includes:
- User ID (from JWT)
- Organization ID (from user record)

Backend validates:
- User belongs to org
- User has permission for action
- Data belongs to org

### State Management (Redux)

```typescript
// Store structure
{
  auth: {
    user: User | null
    token: string | null
    loading: boolean
    error: string | null
  },
  org: {
    current: Organization | null
    users: User[]
    teams: Team[]
    loading: boolean
  },
  kb: {
    articles: KBArticle[]
    selectedArticle: KBArticle | null
    searchQuery: string
    loading: boolean
  },
  alerts: {
    items: Alert[]
    filter: string
    loading: boolean
  },
  status: {
    teamStatus: StatusUpdate[]
    userStatus: StatusUpdate | null
    loading: boolean
  }
}
```

### Service Worker Strategy

**Caching Strategy**: Cache-first for static assets, network-first for API

```typescript
// Static assets (cache-first)
- /assets/*
- /manifest.json
- /icon.svg

// API calls (network-first)
- /api/kb
- /api/alerts
- /api/users

// Always network
- /api/auth/*
- /api/status (sync)
```

### IndexedDB Schema

```typescript
// Stores
- knowledgebase: { keyPath: 'id', indexes: ['category', 'orgId'] }
- alerts: { keyPath: 'id', indexes: ['orgId', 'createdAt'] }
- statusUpdates: { keyPath: 'id', indexes: ['userId', 'teamId'] }
- users: { keyPath: 'id', indexes: ['orgId', 'teamId'] }
- organizations: { keyPath: 'id' }
- syncQueue: { keyPath: 'id', indexes: ['status', 'timestamp'] }
```

## Component Structure

### Layout Components
- `MobileLayout` - Mobile navigation wrapper
- `DesktopLayout` - Desktop sidebar + content
- `AuthLayout` - Login page wrapper

### Page Components
- `LoginPage` - Magic link authentication
- `GuestHome` - Guest user dashboard
- `OrgHome` - Organization dashboard
- `KnowledgebaseScreen` - KB search & browse
- `TeamCheckIn` - Status updates
- `AdminConsole` - Admin panel
- `HRConsole` - HR management

### Feature Components
- `AlertCard` - Alert display
- `StatusIndicator` - User status badge
- `ChatBot` - Chatbot interface
- `ToGoBagChecklist` - Checklist UI
- `HotlineDirectory` - Emergency contacts

## Testing Strategy

### Unit Tests
- Redux reducers
- Utility functions
- Service layer

### Integration Tests
- API endpoints
- Database operations
- Offline sync

### E2E Tests
- Login flow
- Create org
- Join org
- Status update
- Offline functionality

## Performance Optimization

### Bundle Size
- Code splitting by route
- Tree-shaking unused code
- Minification & compression

### Runtime Performance
- Memoization for expensive components
- Virtual scrolling for long lists
- Lazy loading images

### Network
- Gzip compression
- HTTP/2 push
- CDN for static assets

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Service Worker tested
- [ ] Offline functionality verified
- [ ] Performance benchmarks met
- [ ] Security audit passed
- [ ] Docker image builds
- [ ] Cloud Run deployment successful
- [ ] SSL certificate configured
- [ ] Monitoring & logging setup

## Troubleshooting

### Service Worker not updating
```bash
# Clear cache
rm -rf .next/cache
npm run build
```

### Database connection issues
```bash
# Check PostgreSQL
psql -U postgres -d hr_crisis_360

# Reset database
npm run db:reset
```

### Offline sync stuck
```typescript
// Check IndexedDB
const db = await openDB('hr-crisis-360');
const queue = await db.getAll('syncQueue');
console.log(queue);
```

## Resources

- [React Documentation](https://react.dev)
- [Redux Toolkit](https://redux-toolkit.js.org)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Google Cloud Run](https://cloud.google.com/run/docs)
