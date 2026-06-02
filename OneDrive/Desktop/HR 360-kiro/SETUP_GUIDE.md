# Feature Enhancements Setup Guide

## Quick Start

### 1. Environment Configuration

**Copy the environment template**:
```bash
cp web/.env.example web/.env.local
```

**Set up required environment variables**:
```bash
# web/.env.local

# Required: Backend API URL
VITE_API_URL=http://localhost:3000/api

# Required for LocationMap: Google Maps API Key
# Get from: https://console.cloud.google.com/
VITE_GOOGLE_MAPS_API_KEY=your_api_key_here

# Optional: Feature flags
VITE_ENABLE_NOTIFICATIONS=true
VITE_ENABLE_BIOMETRIC=true
VITE_ENABLE_LOCATION=true
VITE_ENABLE_CHATBOT=true
```

### 2. Backend Setup

**Ensure biometric database migration is run**:
```bash
cd backend
npm run migrate
```

**Start backend server**:
```bash
npm run dev
# Runs on http://localhost:3000
```

### 3. Frontend Setup

**Install dependencies** (if needed):
```bash
cd web
npm install
```

**Start development server**:
```bash
npm run dev
# Runs on http://localhost:5173
```

### 4. Test the Features

#### A. Push Notifications
1. Go to app home screen
2. Click bell icon (🔔) in header
3. First time: accept notification permission
4. Notification center will appear
5. Test sending notifications via backend admin

#### B. Biometric Authentication
1. Go to Settings (⚙️)
2. Click "🔐 Biometric Authentication"
3. If device supports: Click "➕ Add New Device"
4. Follow enrollment steps
5. Device will be added to list

#### C. Location Sharing
1. Go to Settings (⚙️)
2. Click "🗺️ Location Sharing"
3. Click "▶️ Start Tracking"
4. Allow location permission in browser
5. View current location and map
6. Toggle sharing with admins/team

#### D. Chatbot Feedback
1. Go to Assistant (💬)
2. Send a message to chatbot
3. Bot responds with message
4. Below message: 👍 thumbs up or 👎 thumbs down
5. Click feedback button to submit

---

## Architecture Overview

### Frontend Components Hierarchy

```
App.tsx
├── AppRouter
│   ├── LoginPage
│   └── EmployeeApp
│       ├── MobileLayout
│       │   ├── Header (with notification bell)
│       │   ├── Routes
│       │   │   ├── MobileHome
│       │   │   ├── MobileCheckIn
│       │   │   ├── MobileAlerts
│       │   │   ├── MobileKB
│       │   │   ├── Chatbot (with feedback buttons)
│       │   │   ├── MobileSettings
│       │   │   ├── BiometricSettingsPage (NEW)
│       │   │   ├── LocationSharingPage (NEW)
│       │   │   └── ...other pages
│       │   └── Bottom Navigation
│       └── AdminConsole (desktop only)
├── NotificationPermissionModal (conditional)
└── NotificationCenter (Redux-controlled)
```

### Redux State Structure

```
store
├── auth (existing)
├── notification (NEW)
│   ├── permission
│   ├── preferences
│   ├── notifications[]
│   ├── unreadCount
│   ├── showCenter
│   └── deviceTokenRegistered
├── biometric (NEW)
│   ├── status
│   ├── devices[]
│   ├── isSupported
│   ├── isEnrolling
│   ├── enrollmentStep
│   └── error/successMessage
├── location (NEW)
│   ├── currentLocation
│   ├── locationHistory[]
│   ├── preferences
│   ├── isTracking
│   ├── permissionStatus
│   └── showMap
├── ... (other slices)
```

### Service Layer

```
services/
├── apiService.ts (core HTTP)
├── pushNotificationService.ts (NEW)
├── biometricService.ts (NEW)
├── locationService.ts (NEW)
├── chatbotFeedbackService.ts (NEW)
├── pwaService.ts (PWA/SW)
├── indexedDBService.ts (offline)
└── ...other services
```

---

## API Endpoints Required

All endpoints should be available from backend:

### Push Notifications (9 endpoints)
- `POST /notifications/register-device`
- `POST /notifications/unregister-device`
- `GET /notifications/preferences`
- `POST /notifications/preferences`
- `GET /notifications/history`
- `POST /notifications/{id}/mark-as-read`
- `POST /notifications/mark-all-as-read`
- `DELETE /notifications/{id}`
- `POST /notifications/clear-all`

### Biometric (7 endpoints)
- `GET /users/biometric/status`
- `GET /users/biometric/devices`
- `POST /users/biometric/enable`
- `POST /users/biometric/disable`
- `POST /users/biometric/register-device`
- `DELETE /users/biometric/devices/{id}`
- `PUT /users/biometric/devices/{id}`

### Location (5 endpoints)
- `POST /location/track`
- `GET /location/history`
- `GET /location/preferences`
- `POST /location/preferences`
- `GET /location/nearby`

### Chatbot Feedback (13 endpoints)
- `POST /chatbot/messages/{id}/feedback`
- `GET /chatbot/analytics`
- `GET /chatbot/admin/stats`
- `GET /chatbot/history`
- `GET /chatbot/admin/feedback-queue`
- `GET /chatbot/admin/feedback-queue/{id}`
- `PUT /chatbot/admin/feedback-queue/{id}`
- `POST /chatbot/admin/feedback-queue/{id}/resolve`
- `POST /chatbot/admin/responses`
- `GET /chatbot/admin/responses`
- `PUT /chatbot/admin/responses/{id}`
- `DELETE /chatbot/admin/responses/{id}`

---

## Feature Details

### 1. Push Notifications

**What it does**:
- Users register device for push notifications
- Receive alerts, incidents, SOS, check-ins
- View notification history
- Mark as read/delete notifications
- Customize notification preferences

**UI Location**: 
- Bell icon (🔔) in header
- Settings → Notification preferences

**Redux Slice**: `notificationSlice`
**Service**: `pushNotificationService`

### 2. Biometric Authentication

**What it does**:
- Enroll fingerprint/face recognition devices
- List enrolled devices
- Remove devices
- Show biometric status
- Support detection for device

**UI Location**: 
- Settings → 🔐 Biometric Authentication

**Redux Slice**: `biometricSlice`
**Service**: `biometricService`
**Component**: `BiometricSettingsPage`, `BiometricEnrollmentFlow`

### 3. Location Services

**What it does**:
- Start/stop location tracking
- Display current location on map
- Show location history
- Share location with admins/team
- Calculate distances
- Find nearby team members

**UI Location**: 
- Settings → 🗺️ Location Sharing

**Redux Slice**: `locationSlice`
**Service**: `locationService`
**Component**: `LocationSharingPage`, `LocationMap`

### 4. Chatbot Feedback

**What it does**:
- Submit feedback (helpful/unhelpful) on bot responses
- Suggest improvements
- Record question/answer pairs
- Train chatbot with feedback
- View analytics

**UI Location**: 
- Assistant (💬) → Below each message

**Redux Slice**: `chatbotSlice` (existing)
**Service**: `chatbotFeedbackService`
**Component**: `ChatFeedbackButtons`

---

## Build Verification

### Web Project
```
✓ 192 modules
✓ 405.72 KB (118.15 KB gzipped)
✓ Zero TypeScript errors
```

### Backend Project
```
✓ Compiles without errors
✓ All migrations ready
```

---

## Testing Checklist

### Manual Testing

- [ ] **Notifications**
  - [ ] Bell icon visible in header
  - [ ] Permission modal shows on first load
  - [ ] Notification center displays
  - [ ] Mark as read works
  - [ ] Delete notification works
  - [ ] Unread count badge shows correctly

- [ ] **Biometric**
  - [ ] Settings page loads
  - [ ] If supported: "Add Device" button active
  - [ ] If not supported: warning message shows
  - [ ] Enrollment flow works
  - [ ] Device appears in list after enrollment
  - [ ] Remove device works

- [ ] **Location**
  - [ ] Settings page loads
  - [ ] Location permission requested
  - [ ] Start/Stop tracking buttons work
  - [ ] Current location displays
  - [ ] Map loads and displays
  - [ ] Sharing preferences toggle works

- [ ] **Chatbot**
  - [ ] Feedback buttons show below messages
  - [ ] Thumbs up/down buttons work
  - [ ] Suggestion modal shows on thumbs down
  - [ ] Feedback submits successfully
  - [ ] Multiple feedback entries work

### Browser Compatibility

- [ ] Chrome/Edge (desktop)
- [ ] Safari (desktop)
- [ ] Chrome Mobile (Android)
- [ ] Safari Mobile (iOS)

### Offline Testing

- [ ] Go offline (devtools or airplane mode)
- [ ] Notifications cache locally
- [ ] Location history queues
- [ ] Chat messages store locally
- [ ] Resume online and sync works

---

## Troubleshooting

### Notification Bell Not Showing
**Solution**: Check `MobileLayout.tsx` imports Redux correctly
```bash
# Should see error in console if Redux not available
```

### Biometric Settings Page Blank
**Solution**: Check browser console for errors
```bash
# Verify biometricService.getBiometricStatus() returns data
# Check API endpoint: GET /users/biometric/status
```

### Location Map Not Displaying
**Solution**: Add Google Maps API key
```bash
# Must set VITE_GOOGLE_MAPS_API_KEY in .env.local
# Get key from: https://console.cloud.google.com/
```

### Feedback Buttons Not Showing
**Solution**: Verify ChatFeedbackButtons imported in ChatbotUI
```bash
# Check: web/src/components/ChatbotUI.tsx
# Line should have: import ChatFeedbackButtons from './ChatFeedbackButtons'
```

---

## Next Steps

1. **Set up Google Maps API** (if not done)
   - Go to Google Cloud Console
   - Create new project
   - Enable Maps JavaScript API
   - Create API key
   - Add to `.env.local`

2. **Configure Backend**
   - Ensure all 34 endpoints implemented
   - Database migrations ran
   - Environment variables set

3. **Run End-to-End Tests**
   - Test all 4 feature flows
   - Test offline scenarios
   - Test error scenarios

4. **Deploy to Staging**
   - Build web project
   - Deploy frontend to CDN
   - Test in staging environment

5. **Production Deployment**
   - Create production environment variables
   - Deploy backend with migrations
   - Deploy frontend
   - Verify all endpoints
   - Monitor for errors

---

## Performance Tips

- Notification polling: 30 seconds (configurable)
- Location tracking: 30 seconds (configurable)
- Bundle size: 405 KB → compresses to 118 KB
- Lazy load components where possible
- Use Redux for state to minimize re-renders

---

## Security Considerations

✅ **Already Implemented**:
- All API calls authenticated with JWT
- Biometric data stays on device
- Location data encrypted in transit
- Feedback data anonymized
- CORS configured on backend

⚠️ **To Verify**:
- HTTPS in production
- API rate limiting
- Database encryption at rest
- Secure token storage (localStorage → HttpOnly cookies)
- GDPR compliance for location data

---

## Support

For issues or questions, refer to:
- `.kiro/specs/feature-enhancements/INTEGRATION_COMPLETE.md` - Implementation details
- `.kiro/specs/feature-enhancements/REMAINING_WORK.md` - Future improvements
- `web/src/services/README.md` - Service documentation
- Backend API documentation (TODO)

---

**Status**: ✅ Ready for Development/Testing
**Last Updated**: June 2, 2026
