# Development Guide - HR 360 Emergency Management App

Complete guide for developing the HR 360 app.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────┐
│  Frontend (React + Vite)                │
│  Mobile (React Native + Expo)           │
└─────────────────────────────────────────┘
              ↓ HTTP/REST
┌─────────────────────────────────────────┐
│  Backend (Express + Node.js)            │
│  - 14 Services                          │
│  - 13 API Routes                        │
│  - WebSocket Server                     │
└─────────────────────────────────────────┘
    ↓ SQL      ↓ Redis      ↓ SMTP
┌────────┐  ┌────────┐  ┌──────────┐
│PostgreSQL│ │ Redis  │  │Nodemailer│
└────────┘  └────────┘  └──────────┘
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- Redis 6+
- npm 8+

### Initial Setup

```bash
# 1. Clone repository
git clone <repo-url>
cd HR\ 360-kiro

# 2. Backend setup
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials

# 3. Frontend setup
cd ../web
npm install

# 4. Mobile setup
cd ../mobile
npm install
```

## 🔧 Development Workflow

### Backend Development

```bash
cd backend

# Start development server with hot reload
npm run dev

# Run tests
npm test

# Run specific test
npm test -- --testPathPattern="User.test"

# Run with coverage
npm test -- --coverage

# Lint code
npm run lint

# Build for production
npm run build

# Database migrations
npm run migrate
npm run migrate:status
npm run migrate:create
```

### Frontend (PWA) Development

```bash
cd web

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## 📁 Project Structure

### Backend
```
backend/
├── src/
│   ├── config/          # Database, security config
│   ├── entities/        # Data models (15 entities)
│   ├── middleware/      # Auth, error handling
│   ├── routes/          # API endpoints (13 modules)
│   ├── services/        # Business logic (14 services)
│   ├── migrations/      # Database migrations
│   ├── websocket/       # WebSocket server
│   └── server.ts        # Main entry point
├── package.json
├── jest.config.js
├── tsconfig.json
└── .env
```

### Frontend
```
web/
├── src/
│   ├── components/      # React components
│   ├── pages/           # Page components
│   ├── services/        # API, WebSocket, IndexedDB
│   ├── store/           # Redux store
│   ├── styles/          # Design system
│   ├── utils/           # Utilities
│   ├── hooks/           # Custom hooks
│   ├── App.tsx
│   └── main.tsx
├── public/              # Static assets
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## 🧪 Testing

### Running Tests

```bash
cd backend

# Run all tests
npm test

# Run specific test file
npm test -- --testPathPattern="User.test"

# Run with coverage
npm test -- --coverage

# Run performance tests
npm test -- --testNamePattern="Performance"

# Watch mode
npm test -- --watch
```

### Test Structure

- `src/entities/__tests__/` - Entity tests (13 files)
- `src/routes/__tests__/` - Route tests (13 files)
- `src/services/__tests__/` - Service tests (3 files)
- `src/__tests__/` - Integration & performance tests

### Current Test Status

- **Total Tests**: 602
- **Passing**: 571 (94.8%)
- **Failing**: 31 (5.2%)

### Fixing Failing Tests

The 31 failing tests are mostly KB route tests due to auth middleware mocking issues.

**To fix**:
1. Mock JWT verification
2. Mock session service
3. Update test setup

See [TEST_FIXES.md](TEST_FIXES.md) for details.

## 🔐 Security

### Authentication Flow

1. User enters email
2. Backend sends magic link
3. User clicks link
4. Backend generates JWT token
5. Frontend stores JWT in localStorage
6. All requests include JWT in Authorization header

### Security Features

- ✅ JWT authentication (7-day expiration)
- ✅ Rate limiting (100 req/15min general, 5 req/15min auth)
- ✅ CORS configuration
- ✅ Helmet security headers
- ✅ Input validation
- ✅ SQL injection prevention (parameterized queries)
- ✅ XSS prevention (input sanitization)
- ✅ Token blacklist (Redis-backed)
- ✅ Session management
- ✅ Error message sanitization

### Adding Security to New Routes

```typescript
import { authMiddleware } from '../middleware/authMiddleware';

router.get(
  '/protected',
  authMiddleware.verifyToken.bind(authMiddleware),
  async (req: AuthRequest, res: Response) => {
    // req.user is now available
    const userId = req.user.userId;
    // ...
  }
);

// For admin-only routes
router.post(
  '/admin-only',
  authMiddleware.verifyToken.bind(authMiddleware),
  authMiddleware.requireRole('admin'),
  async (req: AuthRequest, res: Response) => {
    // Only admins can access
    // ...
  }
);
```

## 📊 Database

### Schema

The database has 15 entities:
- User, Organization, Department, Team
- Alert, Incident, CheckIn, Contact
- KBGuide, GuideAcknowledgment
- Notification, PushNotification
- ChatMessage, DeviceToken
- SOSEscalation, ToBagItem, MagicLinkToken

### Migrations

```bash
cd backend

# Run all pending migrations
npm run migrate

# Check migration status
npm run migrate:status

# Create new migration
npm run migrate:create
```

### Adding New Entity

1. Create entity file in `src/entities/`
2. Create migration in `src/migrations/`
3. Create service in `src/services/`
4. Create routes in `src/routes/`
5. Add tests

## 🔄 API Development

### Creating New Route

```typescript
// src/routes/example.ts
import express, { Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';
import { exampleService } from '../services/exampleService';
import { logger } from '../services/monitoringService';

const router = express.Router();

/**
 * GET /api/example
 * Get all examples
 */
router.get(
  '/',
  authMiddleware.verifyToken.bind(authMiddleware),
  async (req: AuthRequest, res: Response, next) => {
    try {
      const examples = await exampleService.getAll();
      res.json({ success: true, data: examples });
    } catch (error) {
      logger.error('Failed to get examples', { error });
      next(error);
    }
  }
);

export default router;
```

### Creating New Service

```typescript
// src/services/exampleService.ts
import { query } from '../config/database';
import { logger } from './monitoringService';

class ExampleService {
  async getAll() {
    try {
      const result = await query('SELECT * FROM examples');
      return result.rows;
    } catch (error) {
      logger.error('Failed to get examples', { error });
      throw error;
    }
  }
}

export const exampleService = new ExampleService();
```

## 🎨 Frontend Development

### Component Structure

```typescript
// src/components/Example.tsx
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';

interface ExampleProps {
  title: string;
}

const Example: React.FC<ExampleProps> = ({ title }) => {
  const dispatch = useDispatch();
  const data = useSelector((state: RootState) => state.example.data);

  return (
    <div>
      <h1>{title}</h1>
      {/* Component content */}
    </div>
  );
};

export default Example;
```

### Redux Integration

```typescript
// src/store/slices/exampleSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ExampleState {
  data: any[];
  loading: boolean;
  error: string | null;
}

const initialState: ExampleState = {
  data: [],
  loading: false,
  error: null,
};

const exampleSlice = createSlice({
  name: 'example',
  initialState,
  reducers: {
    setData: (state, action: PayloadAction<any[]>) => {
      state.data = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { setData, setLoading, setError } = exampleSlice.actions;
export default exampleSlice.reducer;
```

## 🚢 Deployment

### Backend Deployment

```bash
# Build
npm run build

# Deploy to Google Cloud Run
gcloud builds submit --tag gcr.io/PROJECT_ID/hr360-backend
gcloud run deploy hr360-backend --image gcr.io/PROJECT_ID/hr360-backend
```

### Frontend (PWA) Deployment

```bash
# Build
npm run build

# Deploy to Cloud Storage
gsutil -m cp -r dist/* gs://PROJECT_ID-frontend/
```

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed instructions.

## 🐛 Debugging

### Backend Debugging

```bash
# Enable debug logging
DEBUG=* npm run dev

# Use Node debugger
node --inspect-brk dist/server.js
```

### Frontend (PWA) Debugging

```bash
# Use browser DevTools
npm run dev

# Check Redux state
# Install Redux DevTools browser extension
```

## 📝 Code Style

### TypeScript

- Use strict mode
- Define interfaces for all data structures
- Use async/await instead of promises
- Add JSDoc comments for public functions

### React

- Use functional components with hooks
- Use Redux for state management
- Keep components small and focused
- Use TypeScript for prop types

### Express

- Use async/await for route handlers
- Use middleware for cross-cutting concerns
- Validate input on all routes
- Return consistent response format

## 🔄 Git Workflow

```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes and commit
git add .
git commit -m "feat: add my feature"

# Push to remote
git push origin feature/my-feature

# Create pull request
# Review and merge

# Delete branch
git branch -d feature/my-feature
```

## 📚 Documentation

- [README.md](README.md) - Project overview
- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture
- [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) - Directory structure
- [docs/API.md](docs/API.md) - API documentation
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) - Deployment guide

## 🆘 Troubleshooting

### Backend won't start
```bash
# Check if port is in use
lsof -i :3000

# Check database connection
psql -h localhost -U postgres -d hr360

# Check Redis connection
redis-cli ping
```

### Tests failing
```bash
# Clear Jest cache
npm test -- --clearCache

# Run specific test
npm test -- --testPathPattern="User.test"
```

### Frontend won't start
```bash
# Clear node_modules
rm -rf node_modules
npm install

# Clear Vite cache
rm -rf .vite
npm run dev
```

## 📞 Getting Help

1. Check the relevant documentation
2. Review existing code for examples
3. Check test files for usage patterns
4. Ask in team chat

---

**Ready to develop?** Pick a task and start coding!
