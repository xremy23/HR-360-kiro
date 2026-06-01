# Architecture - HR 360 Emergency Management PWA

System architecture, design decisions, and technical specifications.

---

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React + Vite)                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Pages: Login, Dashboard, Admin Console              │   │
│  │  Components: Buttons, Cards, Forms, Modals           │   │
│  │  State: Redux (Auth, App, UI)                        │   │
│  │  Services: API Client, PWA, IndexedDB                │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓ HTTP/REST
┌─────────────────────────────────────────────────────────────┐
│                  Backend (Express + Node.js)                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Routes: Auth, Users, Orgs, KB, Alerts, etc.        │   │
│  │  Middleware: Auth, Error Handler, Rate Limiter      │   │
│  │  Services: User, Org, Auth, Email, Session          │   │
│  │  Entities: User, Org, Team, Department, etc.        │   │
│  │  Utils: Validators, Error Classes, Helpers          │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
         ↓ SQL              ↓ Redis              ↓ SMTP
    ┌─────────┐         ┌────────┐          ┌──────────┐
    │PostgreSQL│         │ Redis  │          │ Nodemailer│
    │Database  │         │ Cache  │          │ Email    │
    └─────────┘         └────────┘          └──────────┘
```

---

## Backend Architecture

### Layered Architecture

```
┌─────────────────────────────────────────┐
│         Routes (API Endpoints)          │
│  /api/auth, /api/users, /api/org, etc.  │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│      Middleware (Auth, Error Handler)   │
│  Authentication, Authorization, Logging │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         Services (Business Logic)       │
│  UserService, OrgService, AuthService   │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│      Entities & Data Access Layer       │
│  User, Organization, Team, Department   │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│      Database (PostgreSQL)              │
│  Tables, Indexes, Relationships         │
└─────────────────────────────────────────┘
```

### Service-Based Architecture

All business logic is encapsulated in services:

- **AuthService**: Magic link, JWT, token management
- **UserService**: User CRUD, search, organization queries
- **OrganizationService**: Org CRUD, statistics
- **EmailService**: Email templates, sending
- **SessionService**: Redis session management
- **MonitoringService**: Logging, metrics, security events

### Request Flow

```
1. Client sends HTTP request
   ↓
2. Express receives request
   ↓
3. Middleware chain:
   - CORS, Helmet, Rate Limiting
   - Auth Middleware (JWT verification)
   - Error Handler (catches exceptions)
   ↓
4. Route handler processes request
   ↓
5. Service layer executes business logic
   ↓
6. Data access layer queries database
   ↓
7. Response sent back to client
   ↓
8. Error handler catches any errors
   ↓
9. Standardized error response sent
```

---

## Frontend Architecture

### Component Hierarchy

```
App
├── AppRouter
│   ├── LoginPage (unauthenticated)
│   ├── EmployeeApp (authenticated)
│   │   ├── Header
│   │   ├── Sidebar
│   │   ├── MainContent
│   │   │   ├── Dashboard
│   │   │   ├── Incidents
│   │   │   ├── Alerts
│   │   │   └── Profile
│   │   └── Footer
│   └── AdminConsole (admin only, desktop)
│       ├── UserManagement
│       ├── OrganizationSettings
│       └── Analytics
└── ChatbotButton (global)
```

### State Management (Redux)

```
Store
├── auth
│   ├── user
│   ├── isAuthenticated
│   ├── loading
│   └── error
├── app
│   ├── isOnline
│   ├── deviceType
│   └── notifications
└── ui
    ├── sidebarOpen
    ├── theme
    └── modals
```

### Data Flow

```
User Action
    ↓
Component Event Handler
    ↓
Redux Action Dispatch
    ↓
Reducer Updates State
    ↓
Component Re-renders
    ↓
API Service (if needed)
    ↓
Backend Request
    ↓
Response Received
    ↓
Redux Action Dispatch
    ↓
State Updated
    ↓
Component Re-renders
```

---

## Database Schema

### Core Tables

```
organizations
├── id (UUID)
├── name (VARCHAR)
├── email_domain (VARCHAR)
├── logo_url (TEXT)
├── description (TEXT)
├── is_active (BOOLEAN)
├── created_at (TIMESTAMP)
├── updated_at (TIMESTAMP)
└── created_by (UUID)

users
├── id (UUID)
├── email (VARCHAR)
├── first_name (VARCHAR)
├── last_name (VARCHAR)
├── phone (VARCHAR)
├── avatar_url (TEXT)
├── role (VARCHAR) - admin, hr, employee, guest
├── organization_id (UUID) - FK
├── department_id (UUID) - FK
├── team_id (UUID) - FK
├── position (VARCHAR)
├── address (TEXT)
├── personal_emergency_contact (VARCHAR)
├── is_active (BOOLEAN)
├── last_login (TIMESTAMP)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

departments
├── id (UUID)
├── organization_id (UUID) - FK
├── name (VARCHAR)
├── description (TEXT)
├── head_id (UUID) - FK to users
├── is_active (BOOLEAN)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

teams
├── id (UUID)
├── organization_id (UUID) - FK
├── department_id (UUID) - FK
├── name (VARCHAR)
├── description (TEXT)
├── head_id (UUID) - FK to users
├── is_active (BOOLEAN)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

[Additional tables for KB, Alerts, Incidents, Check-ins, SOS, etc.]
```

---

## Authentication Flow

### Magic Link Authentication

```
1. User enters email
   ↓
2. Frontend sends POST /api/auth/send-magic-link
   ↓
3. Backend generates token and sends email
   ↓
4. User clicks link in email
   ↓
5. Frontend sends POST /api/auth/verify-magic-link
   ↓
6. Backend verifies token and creates/updates user
   ↓
7. Backend generates JWT token
   ↓
8. Frontend stores JWT in localStorage
   ↓
9. Frontend redirects to dashboard
   ↓
10. All subsequent requests include JWT in Authorization header
```

### JWT Token Structure

```
Header:
{
  "alg": "HS256",
  "typ": "JWT"
}

Payload:
{
  "userId": "uuid",
  "email": "user@example.com",
  "role": "employee",
  "iat": 1234567890,
  "exp": 1234654290
}

Signature:
HMACSHA256(base64UrlEncode(header) + "." + base64UrlEncode(payload), secret)
```

---

## Error Handling

### Error Classes

```
AppError (base)
├── ValidationError (400)
├── AuthenticationError (401)
├── AuthorizationError (403)
├── NotFoundError (404)
├── ConflictError (409)
├── RateLimitError (429)
├── InternalServerError (500)
└── ServiceUnavailableError (503)
```

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  },
  "statusCode": 400
}
```

---

## Security Architecture

### Authentication & Authorization

- **JWT Tokens**: 7-day expiration
- **Token Blacklist**: Redis-backed token revocation
- **Session Management**: Redis session storage
- **Role-Based Access Control**: Admin, HR, Employee, Guest roles
- **Organization Isolation**: Users only see their organization's data

### Input Validation

- Request body validation
- Email format validation
- Password strength validation
- SQL injection prevention (parameterized queries)
- XSS prevention (input sanitization)

### Rate Limiting

- General endpoints: 100 requests per 15 minutes
- Auth endpoints: 5 requests per 15 minutes
- IP-based rate limiting

### CORS & Headers

- Configurable CORS origins
- Security headers (Helmet.js)
- Content Security Policy
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff

---

## Deployment Architecture

### Google Cloud Run

```
┌─────────────────────────────────────────┐
│         Cloud Load Balancer             │
│  (Distributes traffic)                  │
└─────────────────────────────────────────┘
         ↓                    ↓
┌──────────────────┐  ┌──────────────────┐
│  Cloud Run       │  │  Cloud Run       │
│  (Backend)       │  │  (Frontend)      │
│  - Auto-scaling  │  │  - Auto-scaling  │
│  - Containerized │  │  - Containerized │
└──────────────────┘  └──────────────────┘
         ↓                    ↓
┌──────────────────────────────────────────┐
│         Cloud SQL (PostgreSQL)           │
│  - Automated backups                     │
│  - High availability                     │
└──────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────┐
│    Cloud Memorystore (Redis)             │
│  - Automatic failover                    │
│  - Persistence                           │
└──────────────────────────────────────────┘
```

---

## Scalability Considerations

### Horizontal Scaling

- Stateless backend services
- Session storage in Redis (not in-memory)
- Database connection pooling
- Load balancing across instances

### Vertical Scaling

- Optimize database queries with indexes
- Cache frequently accessed data
- Implement pagination for large datasets
- Use CDN for static assets

### Performance Optimization

- Database query optimization
- Redis caching layer
- Frontend code splitting
- Image optimization
- Gzip compression

---

## Monitoring & Logging

### Logging Strategy

- Request/response logging
- Error logging with stack traces
- Security event logging
- Performance metrics logging

### Monitoring Metrics

- Request latency
- Error rates
- Database query performance
- Redis cache hit rates
- Server resource usage

### Alerting

- High error rates
- Database connection issues
- Redis connection issues
- High latency
- Rate limit exceeded

---

## Development Workflow

### Git Workflow

```
main (production)
  ↑
  ├── develop (staging)
  │   ↑
  │   ├── feature/user-management
  │   ├── feature/kb-system
  │   ├── feature/alerts
  │   └── bugfix/auth-issue
```

### CI/CD Pipeline

```
1. Developer pushes to feature branch
   ↓
2. GitHub Actions runs tests
   ↓
3. Code review required
   ↓
4. Merge to develop
   ↓
5. Deploy to staging
   ↓
6. Manual testing
   ↓
7. Merge to main
   ↓
8. Deploy to production
```

---

## Technology Decisions

### Why TypeScript?
- Type safety reduces bugs
- Better IDE support
- Self-documenting code
- Easier refactoring

### Why React?
- Component-based architecture
- Large ecosystem
- Good performance
- Strong community

### Why Express?
- Lightweight and flexible
- Large middleware ecosystem
- Easy to learn and use
- Good performance

### Why PostgreSQL?
- ACID compliance
- Complex queries support
- Scalability
- Open source

### Why Redis?
- Fast in-memory cache
- Session management
- Token blacklist
- Pub/Sub capabilities

---

## Future Enhancements

### Phase 2
- Knowledge Base system
- Alert management
- Incident tracking
- Check-in functionality
- SOS escalation
- Offline support

### Phase 3
- Mobile app (React Native)
- Advanced analytics
- Integration APIs
- Multi-language support
- Video/audio calling

### Phase 4
- Machine learning for incident prediction
- Advanced reporting
- Custom workflows
- Third-party integrations

---

**Last Updated**: June 1, 2026

