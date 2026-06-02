# Spec: HR 360 Feature Enhancements

**Status**: Ready for Implementation  
**Version**: 1.0.0  
**Last Updated**: June 2, 2026  
**Scope**: 5 Major Features

---

## Overview

This spec covers 5 major feature enhancements to the HR 360 PWA:

1. **Push Notifications** - Real-time alert delivery to devices
2. **Biometric Authentication** - Fingerprint/Face ID login
3. **Location-based Services** - Track employee locations during incidents
4. **Advanced Analytics** - Dashboard with insights and metrics
5. **Chatbot Feedback & Training** - Thumbs up/down + correction system for AI training

---

## Feature 1: Push Notifications

### Overview
Enable push notifications on browsers and mobile devices for real-time alert delivery even when app is closed.

### Requirements

#### Functional Requirements
- [ ] Register device tokens with push service (Firebase Cloud Messaging)
- [ ] Send push notifications for:
  - New alerts
  - Incident updates
  - Check-in reminders
  - SOS escalations
- [ ] User can toggle notifications on/off per category
- [ ] Track notification delivery status
- [ ] Retry failed notifications (exponential backoff)

#### Non-Functional Requirements
- [ ] Support iOS, Android, and web browsers
- [ ] <100ms notification send latency
- [ ] 99.5% delivery rate
- [ ] Handle token expiration and refresh

### Design

#### Backend Changes
```
New Entities:
- NotificationToken (device tokens)
- NotificationLog (sent notifications)

New Services:
- PushNotificationService
- NotificationPreferenceService

New Routes:
- POST /api/notifications/register-token
- POST /api/notifications/preferences
- GET /api/notifications/status
```

#### Frontend Changes
```
New Components:
- NotificationPermissionModal
- NotificationPreferences
- NotificationCenter

New Services:
- pushNotificationService
- firebaseService

New Redux Slices:
- notificationPreferences
- notificationHistory
```

### Technical Details

#### Firebase Setup
- Create Firebase project
- Configure Cloud Messaging
- Generate service worker
- Add firebase config to .env

#### Device Token Storage
```typescript
interface NotificationToken {
  id: UUID;
  userId: UUID;
  token: string;
  platform: 'web' | 'ios' | 'android';
  isActive: boolean;
  lastUsed: Timestamp;
  createdAt: Timestamp;
}
```

#### Notification Payload
```typescript
interface PushPayload {
  title: string;
  body: string;
  icon: string;
  tag: 'alert' | 'incident' | 'checkin' | 'sos';
  data: {
    url: string;
    actionId: UUID;
  };
}
```

---

## Feature 2: Biometric Authentication

### Overview
Allow users to login using fingerprint or face recognition for improved security and UX.

### Requirements

#### Functional Requirements
- [ ] Support fingerprint authentication (Web API)
- [ ] Support face recognition (Web API)
- [ ] Fallback to password/magic link
- [ ] Option to enable/disable biometric
- [ ] User can manage enrolled devices
- [ ] Biometric data stored securely on device only
- [ ] Biometric verification after 7 days of inactivity

#### Non-Functional Requirements
- [ ] <1s authentication latency
- [ ] Secure storage (no server-side biometric storage)
- [ ] Works on 95%+ of modern devices

### Design

#### Backend Changes
```
New Entities:
- BiometricDevice (enrolled devices)

New Services:
- BiometricService

New Routes:
- POST /api/auth/biometric/register
- POST /api/auth/biometric/verify
- DELETE /api/auth/biometric/:deviceId
- GET /api/auth/biometric/devices
```

#### Frontend Changes
```
New Components:
- BiometricLoginModal
- BiometricEnrollmentFlow
- ManageBiometricDevices

New Services:
- biometricService (WebAuthn API wrapper)

New Utils:
- webauthnHelper
```

### Technical Details

#### WebAuthn Flow
```typescript
interface RegistrationOptions {
  challenge: Uint8Array;
  rp: { name: string };
  user: { id: Uint8Array; name: string; displayName: string };
  pubKeyCredParams: Array<{ alg: number; type: string }>;
  authenticatorSelection: { authenticatorAttachment: string };
  attestation: 'direct';
}

interface AuthenticationAssertion {
  id: string;
  rawId: ArrayBuffer;
  response: { clientDataJSON: ArrayBuffer; authenticatorData: ArrayBuffer; signature: ArrayBuffer };
}
```

#### Device Registration
```typescript
interface BiometricDevice {
  id: UUID;
  userId: UUID;
  name: string;
  credentialId: string;
  publicKey: string;
  counter: number;
  isActive: boolean;
  lastUsed: Timestamp;
  createdAt: Timestamp;
}
```

---

## Feature 3: Location-based Services

### Overview
Track employee locations during emergencies to better coordinate response and ensure safety.

### Requirements

#### Functional Requirements
- [ ] Request location permission on first check-in
- [ ] Capture GPS coordinates (lat/long) with check-in
- [ ] Display employee locations on admin map
- [ ] Show location history for incidents
- [ ] Approximate location if precise GPS unavailable
- [ ] Auto-update location every 30s during active incident
- [ ] Respect privacy settings (employees can disable tracking)

#### Non-Functional Requirements
- [ ] <5s location acquisition
- [ ] Accuracy: ±50m on desktop, ±10m on mobile
- [ ] Minimal battery drain (use geolocation batching)
- [ ] Privacy-first (no tracking without consent)

### Design

#### Backend Changes
```
New Entities:
- LocationLog (stores location history)
- LocationPreference (privacy settings)
- IncidentMap (incident location data)

New Services:
- LocationService
- GeocodingService

New Routes:
- POST /api/location/checkin
- GET /api/location/history/:incidentId
- POST /api/location/preferences
- GET /api/location/map/:incidentId
```

#### Frontend Changes
```
New Components:
- LocationMap (display locations on map)
- LocationPermissionModal
- LocationHistoryTimeline
- IncidentMap

New Services:
- locationService
- mapService (Google Maps integration)
- geolocationService

New Redux Slices:
- locationPreferences
- currentLocation
- locationHistory
```

### Technical Details

#### Location Storage
```typescript
interface LocationLog {
  id: UUID;
  userId: UUID;
  checkInId?: UUID;
  incidentId?: UUID;
  latitude: number;
  longitude: number;
  accuracy: number; // meters
  timestamp: Timestamp;
  source: 'gps' | 'wifi' | 'cell' | 'approximate';
}

interface LocationPreference {
  userId: UUID;
  trackingEnabled: boolean;
  shareWithAdmins: boolean;
  shareWithTeam: boolean;
}
```

#### Map Integration
- Use Google Maps API or Mapbox
- Display markers for each employee
- Show real-time updates via WebSocket
- Privacy: Only show locations for active incidents

---

## Feature 4: Advanced Analytics

### Overview
Provide dashboards and insights into emergency preparedness, response effectiveness, and employee wellness.

### Requirements

#### Functional Requirements
- [ ] Dashboard with KPIs:
  - Check-in response rate
  - Average check-in time
  - SOS escalation trends
  - Incident response time
- [ ] Charts and graphs:
  - Check-in trends (daily/weekly/monthly)
  - Department comparisons
  - Response time distribution
  - Incident type breakdown
- [ ] Export reports (PDF, CSV)
- [ ] Custom date ranges and filters
- [ ] Department and team level analytics

#### Non-Functional Requirements
- [ ] Dashboard loads in <2s
- [ ] Support 1 year of data history
- [ ] Real-time KPI updates
- [ ] Admin-only access

### Design

#### Backend Changes
```
New Services:
- AnalyticsService
- ReportService

New Routes:
- GET /api/analytics/dashboard
- GET /api/analytics/checkins
- GET /api/analytics/incidents
- GET /api/analytics/sos
- GET /api/analytics/report
- POST /api/analytics/export
```

#### Frontend Changes
```
New Pages:
- AnalyticsDashboard

New Components:
- KPICard
- TrendChart
- IncidentChart
- ResponseTimeChart
- FilterPanel
- ReportExporter

New Services:
- analyticsService

New Redux Slices:
- analyticsData
```

### Technical Details

#### Analytics Data Model
```typescript
interface AnalyticsDashboard {
  dateRange: { start: Date; end: Date };
  kpis: {
    checkInResponseRate: number; // %
    avgCheckInTime: number; // minutes
    sosEscalationRate: number; // %
    avgIncidentResponseTime: number; // minutes
  };
  trends: {
    dailyCheckIns: Array<{ date: string; count: number }>;
    departmentComparison: Array<{ dept: string; responseRate: number }>;
    incidentTypes: Array<{ type: string; count: number }>;
  };
}
```

#### Report Generation
- Use Chart.js or D3.js for visualization
- PDF export via pdfkit or similar
- CSV export for data analysis
- Scheduled report delivery

---

## Feature 5: Chatbot Feedback & Training System

### Overview
Collect user feedback on chatbot answers and use it to train and improve the AI model over time.

### Requirements

#### Functional Requirements
- [ ] Thumbs up/down feedback on chatbot answers
- [ ] Store Q&A pairs with feedback
- [ ] Admin interface to review and correct answers
- [ ] Feedback analytics (helpful vs unhelpful %)
- [ ] Ability to provide correction suggestions
- [ ] Retrain chatbot model with feedback data
- [ ] Track improvement metrics over time

#### Non-Functional Requirements
- [ ] Feedback submission <200ms
- [ ] Support 100k+ Q&A pairs
- [ ] Retrain model nightly
- [ ] Monitor feedback quality

### Design

#### Backend Changes
```
New Entities:
- ChatbotFeedback (thumbs up/down)
- ChatbotCorrection (admin corrections)
- ChatbotTrainingData (feedback for retraining)

New Services:
- ChatbotFeedbackService
- ChatbotTrainingService
- ChatbotAnalyticsService

New Routes:
- POST /api/chatbot/feedback
- POST /api/chatbot/correction
- GET /api/chatbot/feedback-analytics
- GET /api/admin/chatbot/review
- POST /api/admin/chatbot/approve-correction
```

#### Frontend Changes
```
New Components:
- FeedbackButtons (thumbs up/down in chat)
- CorrectionModal (suggest better answer)
- ChatbotAnalyticsDashboard (admin)
- ChatbotReviewPanel (admin)

New Services:
- chatbotFeedbackService

New Redux Slices:
- chatbotFeedback
```

### Technical Details

#### Feedback Data Model
```typescript
interface ChatbotFeedback {
  id: UUID;
  messageId: UUID;
  userId: UUID;
  question: string;
  answer: string;
  feedback: 'helpful' | 'not_helpful';
  reason?: string;
  timestamp: Timestamp;
}

interface ChatbotCorrection {
  id: UUID;
  feedbackId: UUID;
  adminId: UUID;
  suggestedAnswer: string;
  reasoning: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: Timestamp;
}
```

#### Analytics
```typescript
interface ChatbotAnalytics {
  totalQuestions: number;
  totalFeedback: number;
  helpfulRate: number; // %
  topQuestions: Array<{ question: string; count: number }>;
  improvementAreas: Array<{ topic: string; unhelpfulRate: number }>;
}
```

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1)
- [ ] Push Notifications - Backend setup
- [ ] Biometric Auth - Backend setup
- [ ] Location Services - Backend setup
- [ ] Analytics - Backend setup
- [ ] Chatbot Feedback - Backend setup

### Phase 2: Integration (Week 2)
- [ ] Push Notifications - Frontend + Integration tests
- [ ] Biometric Auth - Frontend + Integration tests
- [ ] Location Services - Frontend + Map integration
- [ ] Analytics - Frontend + Dashboard
- [ ] Chatbot Feedback - Frontend + Admin panel

### Phase 3: Testing & Refinement (Week 3)
- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] Security audit
- [ ] User acceptance testing

### Phase 4: Deployment (Week 4)
- [ ] Production deployment
- [ ] Monitoring setup
- [ ] Documentation
- [ ] User training

---

## Success Criteria

### Push Notifications
- ✅ 95%+ delivery rate
- ✅ <100ms send latency
- ✅ Users can toggle preferences
- ✅ No crashes on notification arrival

### Biometric Authentication
- ✅ <1s authentication time
- ✅ Works on 95%+ devices
- ✅ Secure credential storage
- ✅ Users prefer biometric to password (UX test)

### Location Services
- ✅ ±50m accuracy on desktop
- ✅ <5s location acquisition
- ✅ Privacy settings respected
- ✅ No battery drain impact on mobile

### Advanced Analytics
- ✅ Dashboard loads in <2s
- ✅ Accurate KPI calculations
- ✅ Reports export successfully
- ✅ Admin finds actionable insights

### Chatbot Feedback & Training
- ✅ 80%+ feedback rate on answers
- ✅ Correction suggestions are useful
- ✅ Model improvement after retraining
- ✅ Admin panel is easy to use

---

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Firebase rate limits | High | Implement client-side queueing |
| WebAuthn browser support | Medium | Graceful fallback to password |
| Location accuracy issues | Medium | Fallback to WiFi/cell triangulation |
| Analytics query performance | Medium | Database indexing + caching |
| Chatbot model retraining time | Low | Schedule retraining off-peak |

---

## Dependencies

- Firebase Admin SDK
- WebAuthn library (e.g., fido2-server)
- Google Maps API or Mapbox
- Chart.js or D3.js
- ML library for chatbot (TensorFlow.js or similar)

---

## Questions for Clarification

1. **Push Notifications**: Should we use Firebase or a different service?
2. **Biometric**: Should we support facial recognition, fingerprint, or both?
3. **Location**: Are admins allowed to track employee locations in real-time?
4. **Analytics**: What's the priority KPI users want to see first?
5. **Chatbot**: Should corrections be auto-applied or require admin approval?

---

**Ready to proceed with implementation?** Let me know if you want to adjust any requirements or priorities.
