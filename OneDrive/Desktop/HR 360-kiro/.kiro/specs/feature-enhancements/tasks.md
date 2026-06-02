# Tasks: HR 360 Feature Enhancements

## Feature 1: Push Notifications

### Backend Tasks

#### Task 1.1: Setup Firebase Cloud Messaging
- [ ] Create Firebase project
- [ ] Enable Cloud Messaging
- [ ] Generate service account key
- [ ] Add Firebase credentials to .env
- [ ] Install firebase-admin package
- [ ] Create firebaseService

#### Task 1.2: Create NotificationToken Entity
- [ ] Create NotificationToken.ts entity
- [ ] Add fields: userId, token, platform, isActive, lastUsed
- [ ] Create migration
- [ ] Add to entities/index.ts

#### Task 1.3: Create PushNotificationService
- [ ] Implement sendNotification(userId, payload)
- [ ] Implement registerToken(userId, token, platform)
- [ ] Implement unregisterToken(userId, token)
- [ ] Implement refreshToken(oldToken, newToken)
- [ ] Add retry logic with exponential backoff

#### Task 1.4: Create NotificationPreference Entity
- [ ] Create NotificationPreference.ts entity
- [ ] Add fields: userId, alertsEnabled, incidentsEnabled, checkinEnabled, sosEnabled
- [ ] Create migration
- [ ] Add to entities/index.ts

#### Task 1.5: Create API Routes
- [ ] POST /api/notifications/register-token
- [ ] POST /api/notifications/unregister-token
- [ ] POST /api/notifications/preferences
- [ ] GET /api/notifications/preferences
- [ ] GET /api/notifications/status/:deviceId

#### Task 1.6: Integrate with Existing Services
- [ ] Update AlertService to send push notifications
- [ ] Update IncidentService to send notifications
- [ ] Update CheckInService for reminders
- [ ] Update SOSService for escalations

#### Task 1.7: Add Tests
- [ ] Unit tests for PushNotificationService
- [ ] Integration tests for notification routes
- [ ] Test retry logic
- [ ] Test token management

### Frontend Tasks

#### Task 1.8: Request Notification Permission
- [ ] Create NotificationPermissionModal component
- [ ] Request browser permission on first visit
- [ ] Handle permission denied gracefully
- [ ] Store permission state in Redux

#### Task 1.9: Register Device Token
- [ ] Create pushNotificationService
- [ ] Register token on app load
- [ ] Handle token refresh
- [ ] Setup service worker for push handling

#### Task 1.10: Create Notification UI Components
- [ ] FeedbackButtons (thumbs up/down in chat)
- [ ] NotificationCenter (view sent notifications)
- [ ] NotificationPreferencesModal

#### Task 1.11: Handle Push Events
- [ ] Service worker receives push events
- [ ] Display notification to user
- [ ] Handle notification clicks (navigate to relevant page)
- [ ] Track notification interactions

#### Task 1.12: Add Redux Slices
- [ ] notificationPermission slice
- [ ] notificationPreferences slice
- [ ] notificationHistory slice

---

## Feature 2: Biometric Authentication

### Backend Tasks

#### Task 2.1: Setup WebAuthn Support
- [ ] Install @simplewebauthn/server package
- [ ] Create WebAuthn configuration
- [ ] Setup credential storage

#### Task 2.2: Create BiometricDevice Entity
- [ ] Create BiometricDevice.ts entity
- [ ] Add fields: userId, name, credentialId, publicKey, counter, isActive, lastUsed
- [ ] Create migration
- [ ] Add to entities/index.ts

#### Task 2.3: Create BiometricService
- [ ] Implement registerOptions(userId)
- [ ] Implement verifyRegistration(userId, credential)
- [ ] Implement authenticationOptions()
- [ ] Implement verifyAuthentication(credential)
- [ ] Add counter validation for cloning detection

#### Task 2.4: Create API Routes
- [ ] POST /api/auth/biometric/register-options
- [ ] POST /api/auth/biometric/register-verify
- [ ] POST /api/auth/biometric/login-options
- [ ] POST /api/auth/biometric/login-verify
- [ ] DELETE /api/auth/biometric/:deviceId
- [ ] GET /api/auth/biometric/devices

#### Task 2.5: Add Tests
- [ ] Unit tests for BiometricService
- [ ] Integration tests for biometric routes
- [ ] Test credential verification
- [ ] Test counter validation

### Frontend Tasks

#### Task 2.6: Create BiometricService
- [ ] Create biometricService wrapper for WebAuthn API
- [ ] Implement getBiometricSupport()
- [ ] Implement registerBiometric()
- [ ] Implement authenticateWithBiometric()

#### Task 2.7: Create Biometric UI Components
- [ ] BiometricLoginButton
- [ ] BiometricEnrollmentFlow
- [ ] BiometricDeviceList
- [ ] ManageBiometricModal

#### Task 2.8: Integrate with Auth Flow
- [ ] Add biometric option to login page
- [ ] Show biometric option if available
- [ ] Fallback to password if biometric fails
- [ ] Add manage devices to settings

#### Task 2.9: Add Redux Slices
- [ ] biometricStatus slice (supported devices, enrolled)
- [ ] biometricDevices slice

---

## Feature 3: Location-based Services

### Backend Tasks

#### Task 3.1: Create LocationLog Entity
- [ ] Create LocationLog.ts entity
- [ ] Add fields: userId, checkInId, incidentId, latitude, longitude, accuracy, timestamp, source
- [ ] Create migration with indexes on userId, incidentId
- [ ] Add to entities/index.ts

#### Task 3.2: Create LocationPreference Entity
- [ ] Create LocationPreference.ts entity
- [ ] Add fields: userId, trackingEnabled, shareWithAdmins, shareWithTeam
- [ ] Create migration
- [ ] Add to entities/index.ts

#### Task 3.3: Create LocationService
- [ ] Implement logLocation(userId, lat, long, accuracy, source)
- [ ] Implement getLocationHistory(incidentId)
- [ ] Implement getIncidentMap(incidentId)
- [ ] Implement updateLocationPreferences(userId, preferences)
- [ ] Add privacy checking

#### Task 3.4: Create API Routes
- [ ] POST /api/location/log (store location)
- [ ] GET /api/location/history/:incidentId
- [ ] GET /api/location/map/:incidentId
- [ ] POST /api/location/preferences
- [ ] GET /api/location/preferences

#### Task 3.5: Integrate with CheckInService
- [ ] Capture location on check-in submission
- [ ] Update check-in with coordinates
- [ ] Add location to CheckIn entity

#### Task 3.6: Add Tests
- [ ] Unit tests for LocationService
- [ ] Integration tests for location routes
- [ ] Test privacy enforcement
- [ ] Test historical queries

### Frontend Tasks

#### Task 3.7: Create LocationService
- [ ] Create geolocationService (wrapper for navigator.geolocation)
- [ ] Implement getCurrentLocation()
- [ ] Implement watchLocation() for continuous tracking
- [ ] Implement stopTracking()
- [ ] Handle permission denied

#### Task 3.8: Create Location UI Components
- [ ] LocationPermissionModal
- [ ] IncidentMap (display on incident page)
- [ ] LocationHistoryTimeline
- [ ] LocationPreferencesPanel

#### Task 3.9: Integrate with CheckIn Flow
- [ ] Request location permission when submitting check-in
- [ ] Capture location automatically
- [ ] Display captured location on confirmation
- [ ] Show accuracy info to user

#### Task 3.10: Integrate with Incident Dashboard
- [ ] Show employee locations on map during active incident
- [ ] Update locations in real-time via WebSocket
- [ ] Show location history timeline
- [ ] Privacy: only show if user enabled tracking

#### Task 3.11: Add Redux Slices
- [ ] locationPreferences slice
- [ ] currentLocation slice
- [ ] locationHistory slice

#### Task 3.12: Add Map Integration
- [ ] Integrate Google Maps API
- [ ] Display markers for employees
- [ ] Show real-time updates
- [ ] Handle zoom and pan

---

## Feature 4: Advanced Analytics

### Backend Tasks

#### Task 4.1: Create AnalyticsService
- [ ] Implement getCheckInStats(dateRange, orgId)
- [ ] Implement getIncidentStats(dateRange, orgId)
- [ ] Implement getSOSStats(dateRange, orgId)
- [ ] Implement getDepartmentComparison(dateRange, orgId)
- [ ] Add caching for performance

#### Task 4.2: Create ReportService
- [ ] Implement generateReport(type, dateRange, filters)
- [ ] Implement exportPDF(report)
- [ ] Implement exportCSV(report)
- [ ] Implement scheduleReport(schedule, email)

#### Task 4.3: Create API Routes
- [ ] GET /api/analytics/dashboard
- [ ] GET /api/analytics/checkins
- [ ] GET /api/analytics/incidents
- [ ] GET /api/analytics/sos
- [ ] POST /api/analytics/export
- [ ] GET /api/analytics/departments

#### Task 4.4: Add Database Indexes
- [ ] Add indexes on check_in created_at, incident created_at
- [ ] Add indexes on user_id, department_id for joins
- [ ] Optimize query performance

#### Task 4.5: Add Tests
- [ ] Unit tests for AnalyticsService
- [ ] Integration tests for analytics routes
- [ ] Test date range queries
- [ ] Test filtering and aggregation

### Frontend Tasks

#### Task 4.6: Create AnalyticsDashboard Page
- [ ] Create AnalyticsDashboard.tsx page component
- [ ] Add to admin console routes
- [ ] Add navigation link in admin nav

#### Task 4.7: Create Dashboard Components
- [ ] KPICard component (displays single KPI)
- [ ] TrendChart component (line chart)
- [ ] ResponseTimeChart component
- [ ] DepartmentComparison component
- [ ] FilterPanel component (date range, department, team)

#### Task 4.8: Integrate Charts Library
- [ ] Install Chart.js
- [ ] Create chart wrappers
- [ ] Implement responsive charts
- [ ] Add tooltips and legends

#### Task 4.9: Create Report Export Feature
- [ ] Add export buttons to dashboard
- [ ] Implement PDF export
- [ ] Implement CSV export
- [ ] Add date range selection

#### Task 4.10: Add Redux Slices
- [ ] analyticsData slice
- [ ] analyticsFilters slice
- [ ] reportExport slice

#### Task 4.11: Add AnalyticsService
- [ ] Create front-end analyticsService
- [ ] Implement data fetching
- [ ] Implement caching
- [ ] Add error handling

---

## Feature 5: Chatbot Feedback & Training System

### Backend Tasks

#### Task 5.1: Create ChatbotFeedback Entity
- [ ] Create ChatbotFeedback.ts entity
- [ ] Add fields: messageId, userId, question, answer, feedback (helpful/not), reason
- [ ] Create migration
- [ ] Add to entities/index.ts

#### Task 5.2: Create ChatbotCorrection Entity
- [ ] Create ChatbotCorrection.ts entity
- [ ] Add fields: feedbackId, adminId, suggestedAnswer, reasoning, status (pending/approved/rejected)
- [ ] Create migration
- [ ] Add to entities/index.ts

#### Task 5.3: Create ChatbotFeedbackService
- [ ] Implement submitFeedback(messageId, userId, feedback, reason)
- [ ] Implement getFeedbackStats()
- [ ] Implement getUnreviewedFeedback()
- [ ] Implement approveFeedback(feedbackId, newAnswer)

#### Task 5.4: Create ChatbotTrainingService
- [ ] Implement collectTrainingData()
- [ ] Implement generateTrainingDataset()
- [ ] Implement triggerModelRetrain()
- [ ] Implement updateChatbotKnowledge()

#### Task 5.5: Create API Routes
- [ ] POST /api/chatbot/feedback
- [ ] GET /api/chatbot/feedback-analytics
- [ ] POST /api/chatbot/correction
- [ ] GET /api/admin/chatbot/feedback-review
- [ ] POST /api/admin/chatbot/approve-correction
- [ ] POST /api/admin/chatbot/retrain

#### Task 5.6: Setup Model Retraining
- [ ] Configure scheduled job (nightly)
- [ ] Collect approved corrections
- [ ] Generate training dataset
- [ ] Retrain or fine-tune model

#### Task 5.7: Add Tests
- [ ] Unit tests for feedback service
- [ ] Integration tests for feedback routes
- [ ] Test analytics calculations

### Frontend Tasks

#### Task 5.8: Create Feedback UI in Chatbot
- [ ] Add thumbs up/down buttons below chatbot answers
- [ ] Show feedback submission state
- [ ] Handle feedback submission errors
- [ ] Show thank you message

#### Task 5.9: Create Correction Modal
- [ ] CorrectionModal component for suggesting better answers
- [ ] TextArea for user suggestions
- [ ] Reason/context field
- [ ] Submit button with validation

#### Task 5.10: Create Admin Feedback Dashboard
- [ ] ChatbotFeedbackReview page in admin console
- [ ] Display pending corrections
- [ ] Show feedback analytics (helpful %)
- [ ] Approve/reject interface
- [ ] Batch operations

#### Task 5.11: Create Feedback Analytics Dashboard
- [ ] FeedbackAnalytics component
- [ ] Display helpful rate percentage
- [ ] Show top questions
- [ ] Show improvement areas
- [ ] Trending unhelpful questions

#### Task 5.12: Add Redux Slices
- [ ] chatbotFeedback slice
- [ ] chatbotAnalytics slice

#### Task 5.13: Add ChatbotFeedbackService
- [ ] Create front-end chatbotFeedbackService
- [ ] Implement submitFeedback(messageId, feedback, reason)
- [ ] Implement fetchAnalytics()
- [ ] Add error handling

---

## Cross-Feature Tasks

### Task 6.1: Environment Variables
- [ ] Add all new .env variables to .env.example
- [ ] Document all new environment variables

### Task 6.2: Testing
- [ ] Add integration tests for all features
- [ ] Add end-to-end tests
- [ ] Performance testing for analytics queries
- [ ] Load testing for push notifications

### Task 6.3: Documentation
- [ ] Update README.md
- [ ] Create FEATURES.md
- [ ] Add deployment guide updates
- [ ] Create user guide for new features

### Task 6.4: Security Review
- [ ] Security audit for all new endpoints
- [ ] Verify authentication/authorization
- [ ] Check input validation
- [ ] Review data privacy measures

### Task 6.5: Performance Optimization
- [ ] Optimize analytics queries
- [ ] Add caching layers
- [ ] Profile frontend components
- [ ] Monitor API response times

### Task 6.6: Deployment
- [ ] Deploy backend changes
- [ ] Deploy frontend changes
- [ ] Run smoke tests
- [ ] Monitor error rates

---

## Estimated Effort

| Feature | Backend | Frontend | Testing | Total |
|---------|---------|----------|---------|-------|
| Push Notifications | 12 hrs | 10 hrs | 6 hrs | 28 hrs |
| Biometric Auth | 10 hrs | 10 hrs | 5 hrs | 25 hrs |
| Location Services | 14 hrs | 16 hrs | 8 hrs | 38 hrs |
| Advanced Analytics | 12 hrs | 14 hrs | 8 hrs | 34 hrs |
| Chatbot Feedback | 10 hrs | 12 hrs | 6 hrs | 28 hrs |
| Cross-Feature | - | - | - | 20 hrs |
| **TOTAL** | **58** | **62** | **33** | **153 hrs** |

---

**Ready to start implementation?** Pick a feature to begin with!
