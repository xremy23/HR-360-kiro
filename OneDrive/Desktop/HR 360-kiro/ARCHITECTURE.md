# Emergency Management App - Architecture

## System Overview

This is a comprehensive emergency management platform with three main components:

1. **Mobile App** (React Native/Expo) - Android-first, iOS-ready
2. **Web Console** (React + Vite) - Admin/HR management
3. **Backend API** (Node.js/Express) - Data sync and real-time updates

## Architecture Principles

### Offline-First Design
- All critical data is stored locally on the device using SQLite
- Sync queue manages pending operations when offline
- Automatic sync when connection is restored
- Users can perform all essential functions without internet

### Real-Time Capabilities
- WebSocket connections for live alerts and check-in updates
- Push notifications for critical alerts
- Graceful degradation when offline

### Security
- Email-based authentication with verification codes
- JWT tokens for API authentication
- Role-based access control (RBAC)
- Biometric re-authentication for sensitive operations
- Encrypted storage of sensitive data

### Scalability
- Stateless API design
- Database connection pooling
- Efficient indexing for common queries
- Caching strategies for KB content

## Mobile App Architecture

### Layers

```
┌─────────────────────────────────────┐
│         UI Layer (Screens)          │
│  (React Native Components)          │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Redux Store (State Mgmt)       │
│  (Auth, KB, CheckIn, Alerts)        │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Services Layer                 │
│  (Auth, DB, Sync, Location, etc)    │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│    Local Storage & Sync             │
│  (SQLite, AsyncStorage, Queue)      │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Backend API (when online)      │
└─────────────────────────────────────┘
```

### Key Services

**authService**
- Email verification
- Token management
- Session persistence
- Biometric authentication

**dbService**
- SQLite operations
- Local data persistence
- Query management

**syncService**
- Network status monitoring
- Automatic sync on reconnect
- Conflict resolution
- Sync queue management

**locationService**
- GPS location tracking
- Location-aware contact population
- Geocoding for nearby services

**notificationService**
- Push notifications
- Local notifications
- Alert handling

**sosService**
- SOS escalation workflow
- Manager notification
- Emergency contact notification
- Team broadcast

## Backend API Architecture

### Routes

```
/api/auth
  POST /send-verification      - Send verification email
  POST /verify-email           - Verify email and create session
  POST /join-org               - Join organization
  POST /refresh-token          - Refresh JWT token
  POST /logout                 - Logout

/api/kb
  GET  /guides                 - Get KB guides
  POST /guides                 - Create guide (admin)
  PUT  /guides/:id             - Update guide (admin)
  DELETE /guides/:id           - Delete guide (admin)
  GET  /guides/:id/versions    - Get guide version history
  POST /guides/:id/acknowledge - Acknowledge guide

/api/check-ins
  POST /                       - Submit check-in
  GET  /team/:teamId           - Get team check-ins
  GET  /history                - Get user check-in history
  GET  /incident/:incidentId   - Get check-ins for incident

/api/alerts
  GET  /                       - Get alerts
  POST /broadcast              - Broadcast alert (admin)
  GET  /:id/notifications      - Get alert notifications
  PUT  /:id/notifications/:nId - Mark notification as read

/api/contacts
  GET  /                       - Get user contacts
  POST /                       - Create contact
  PUT  /:id                    - Update contact
  DELETE /:id                  - Delete contact
  GET  /nearby                 - Get nearby services

/api/users
  GET  /profile                - Get user profile
  PUT  /profile                - Update profile
  POST /biometric/enable       - Enable biometric
  POST /biometric/disable      - Disable biometric

/api/org
  GET  /                       - Get organization
  PUT  /                       - Update organization (admin)
  GET  /teams                  - Get teams
  POST /teams                  - Create team (admin)
  GET  /users                  - Get organization users (admin)

/api/incidents
  GET  /                       - Get incidents
  POST /                       - Create incident (admin)
  GET  /:id                    - Get incident details
  GET  /:id/summary            - Get incident check-in summary

/api/sos
  POST /                       - Trigger SOS
  GET  /escalations            - Get SOS escalations (admin)
```

### Middleware

**authMiddleware**
- Validates JWT tokens
- Refreshes expired tokens
- Handles token errors

**rbacMiddleware**
- Enforces role-based access control
- Validates user permissions
- Logs access attempts

**errorHandler**
- Centralized error handling
- Consistent error responses
- Logging

## Data Flow

### Check-in Flow (Offline)
1. User submits check-in on mobile
2. Check-in saved to local SQLite
3. Added to sync queue
4. UI shows success immediately
5. When online, sync service sends to backend
6. Backend stores and broadcasts to team

### Alert Broadcast Flow
1. Admin creates alert in web console
2. Backend stores alert
3. WebSocket broadcasts to connected clients
4. Mobile app receives via push notification
5. Alert stored locally
6. Displayed in alerts screen
7. Synced to local DB for offline access

### SOS Escalation Flow
1. User marks SOS status
2. Local notification to user
3. Sync queue adds SOS record
4. When online, backend receives SOS
5. Backend triggers escalation:
   - Notify manager immediately
   - Notify emergency contacts
   - Optionally broadcast to team
6. Escalation status tracked and synced back

## Database Schema

### Key Tables

**users**
- id, email, firstName, lastName, role
- orgId, teamId, departmentId
- address, latitude, longitude
- biometricEnabled

**organizations**
- id, name, emailDomain, inviteCode
- logo, createdAt, updatedAt

**kb_guides**
- id, orgId, title, category, type
- content, mediaUrls, isRequired
- version, createdBy, updatedBy
- createdAt, updatedAt

**check_ins**
- id, userId, teamId, status
- notes, location (lat/long)
- timestamp, incidentId, isDrill

**alerts**
- id, orgId, teamIds, title, message
- severity, type, createdBy
- createdAt, expiresAt, isDrill

**incidents**
- id, orgId, type, severity
- startTime, endTime, isDrill
- createdBy

## State Management (Redux)

### Slices

**authSlice**
- user, token, isAuthenticated
- isLoading, error
- verificationSent, orgJoined

**kbSlice**
- guides, selectedGuide, filteredGuides
- searchQuery, selectedCategory
- acknowledgedGuideIds

**checkinSlice**
- currentCheckIn, history
- teamCheckIns
- lastCheckInTime

**alertsSlice**
- alerts, notifications
- unreadCount, selectedAlert

## Offline Sync Strategy

### Sync Queue
- Stores pending operations locally
- Tracks action (create/update/delete)
- Stores entity type and data
- Marks as synced when confirmed

### Conflict Resolution
- Last-write-wins for most operations
- Server version takes precedence for critical data
- User notified of conflicts

### Data Freshness
- Pull updates on app launch
- Pull updates when coming online
- Periodic background sync
- Manual refresh available

## Security Considerations

### Authentication
- Email verification prevents unauthorized access
- JWT tokens with expiration
- Refresh token rotation
- Session persistence with secure storage

### Authorization
- Role-based access control
- Team-based data isolation
- Manager can only see their team
- Admin has full access

### Data Protection
- Sensitive data encrypted at rest
- HTTPS for all API communication
- Biometric re-auth for sensitive operations
- Secure token storage

### Privacy
- Location data only collected with permission
- Contact data stored locally
- Minimal data sent to server
- GDPR compliance considerations

## Performance Optimization

### Mobile
- Lazy loading of KB content
- Image compression for media
- Efficient SQLite queries
- Debounced search
- Pagination for lists

### Backend
- Database connection pooling
- Query optimization with indexes
- Caching for KB content
- Rate limiting for API
- Compression for responses

### Network
- Batch sync operations
- Differential sync (only changed data)
- Compression of payloads
- Retry logic with exponential backoff

## Deployment

### Mobile
- Build for Android via Expo
- Build for iOS via Expo
- App Store and Play Store distribution

### Web
- Build with Vite
- Deploy to CDN
- Environment-based configuration

### Backend
- Docker containerization
- Kubernetes orchestration
- Database migrations
- Environment variables for config

## Monitoring & Logging

### Mobile
- Crash reporting (Sentry)
- Analytics (Firebase)
- Local error logs
- Performance monitoring

### Backend
- Request logging
- Error tracking
- Database query logging
- Performance metrics

### Web
- Error tracking
- User analytics
- Performance monitoring
