# Frontend Services Documentation

This directory contains all frontend service modules that handle communication with the backend API and manage external integrations.

## Service Modules

### 1. API Service (`apiService.ts`)
**Core HTTP communication layer**

The central API service handles all HTTP requests to the backend with built-in:
- Authentication token management
- Automatic token refresh
- Request/response interceptors
- Error handling with custom ApiError class
- Support for all endpoints (auth, users, notifications, biometric, location, etc.)

**Key Methods:**
- `get(url, params)` - GET request
- `post(url, data)` - POST request
- `put(url, data)` - PUT request
- `delete(url)` - DELETE request
- `setToken(token)` - Store authentication token
- `clearToken()` - Remove authentication token

### 2. Push Notification Service (`pushNotificationService.ts`)
**Push notification management**

Handles device token registration, notification preferences, and history management.

**Key Functions:**
- `registerDeviceToken(data)` - Register device for push notifications
- `unregisterDeviceToken(token)` - Unregister device
- `getNotificationPreferences()` - Get user preferences
- `updateNotificationPreferences(prefs)` - Update preferences
- `getNotificationHistory(params)` - Get notification history
- `markNotificationAsRead(id)` - Mark individual notification as read
- `markAllNotificationsAsRead()` - Mark all as read
- `deleteNotification(id)` - Delete specific notification
- `clearAllNotifications()` - Clear all notifications

**Backend Endpoints Used:**
- POST `/notifications/register-device`
- POST `/notifications/unregister-device`
- GET `/notifications/preferences`
- POST `/notifications/preferences`
- GET `/notifications/history`
- POST `/notifications/{id}/mark-as-read`
- POST `/notifications/mark-all-as-read`
- DELETE `/notifications/{id}`
- POST `/notifications/clear-all`

### 3. Biometric Service (`biometricService.ts`)
**Biometric authentication device management**

Manages biometric device registration and authentication settings.

**Key Functions:**
- `checkBiometricSupport()` - Check device biometric capabilities
- `getBiometricStatus()` - Get user's biometric status
- `getBiometricDevices()` - List enrolled devices
- `enableBiometric(type)` - Enable biometric authentication
- `disableBiometric()` - Disable biometric authentication
- `registerBiometricDevice(data)` - Register new device
- `removeBiometricDevice(id)` - Remove device
- `updateBiometricDevice(id, name)` - Update device name
- `authenticateWithBiometric()` - Authenticate using biometric

**Backend Endpoints Used:**
- GET `/users/biometric/status`
- GET `/users/biometric/devices`
- POST `/users/biometric/enable`
- POST `/users/biometric/disable`
- POST `/users/biometric/register-device`
- DELETE `/users/biometric/devices/{id}`
- PUT `/users/biometric/devices/{id}`

### 4. Location Service (`locationService.ts`)
**Geolocation and tracking services**

Handles location tracking, history, and preferences.

**Key Functions:**
- `getCurrentLocation()` - Get current device location
- `startTracking(callback, interval)` - Start continuous tracking
- `stopTracking(watchId)` - Stop tracking
- `trackLocation(location)` - Send location to backend
- `getLocationHistory(params)` - Get location history
- `getLocationPreferences()` - Get user preferences
- `updateLocationPreferences(prefs)` - Update preferences
- `calculateDistance(lat1, lon1, lat2, lon2)` - Calculate distance (Haversine)
- `getNearbyTeamMembers(params)` - Get nearby users
- `requestLocationPermission()` - Request browser permission

**Backend Endpoints Used:**
- POST `/location/track`
- GET `/location/history`
- GET `/location/preferences`
- POST `/location/preferences`
- GET `/location/nearby`

### 5. Chatbot Feedback Service (`chatbotFeedbackService.ts`)
**Chatbot conversation feedback and analytics**

Manages feedback submission and admin analytics for chatbot improvements.

**Key Functions:**
- `submitChatbotFeedback(id, feedback)` - Submit feedback
- `getChatbotAnalytics()` - Get conversation analytics
- `getChatbotStats()` - Get statistics (admin)
- `getChatHistoryWithFeedback(params)` - Get history with feedback
- `getFeedbackQueue(params)` - Get feedback queue (admin)
- `getFeedbackItem(id)` - Get feedback item details
- `updateFeedbackItem(id, data)` - Update feedback (admin)
- `resolveFeedbackItem(id, action, responseId)` - Resolve feedback
- `createChatbotResponse(data)` - Create response (admin)
- `getChatbotResponses(params)` - Get responses (admin)
- `updateChatbotResponse(id, data)` - Update response (admin)
- `deleteChatbotResponse(id)` - Delete response (admin)

**Backend Endpoints Used:**
- POST `/chatbot/messages/{id}/feedback`
- GET `/chatbot/analytics`
- GET `/chatbot/admin/stats`
- GET `/chatbot/history`
- GET `/chatbot/admin/feedback-queue`
- GET `/chatbot/admin/feedback-queue/{id}`
- PUT `/chatbot/admin/feedback-queue/{id}`
- POST `/chatbot/admin/feedback-queue/{id}/resolve`
- POST `/chatbot/admin/responses`
- GET `/chatbot/admin/responses`
- PUT `/chatbot/admin/responses/{id}`
- DELETE `/chatbot/admin/responses/{id}`

## Usage Examples

### Registering Push Notifications
```typescript
import { pushNotificationService } from '../services/pushNotificationService';

// Register device token
const token = await getServiceWorkerToken(); // from your PWA setup
await pushNotificationService.registerDeviceToken({
  token,
  platform: 'web',
  deviceName: 'My Device'
});

// Get and update preferences
const prefs = await pushNotificationService.getNotificationPreferences();
await pushNotificationService.updateNotificationPreferences({
  alertsEnabled: true,
  sosEnabled: true
});
```

### Managing Biometric Authentication
```typescript
import { biometricService } from '../services/biometricService';

// Check support
const support = await biometricService.checkBiometricSupport();
if (support.fingerprintSupported) {
  // Enable fingerprint
  await biometricService.enableBiometric('fingerprint');
}

// Get enrolled devices
const devices = await biometricService.getBiometricDevices();
devices.forEach(device => console.log(device.deviceName));
```

### Tracking Location
```typescript
import { locationService } from '../services/locationService';

// Get current location
const location = await locationService.getCurrentLocation();
await locationService.trackLocation(location);

// Start continuous tracking
const watchId = await locationService.startTracking((location) => {
  console.log('Location updated:', location);
}, 30000); // Update every 30 seconds

// Stop when done
locationService.stopTracking(watchId);
```

### Submitting Chatbot Feedback
```typescript
import { chatbotFeedbackService } from '../services/chatbotFeedbackService';

// Submit feedback
await chatbotFeedbackService.submitChatbotFeedback(messageId, {
  isHelpful: true,
  feedbackText: 'Very helpful answer!'
});

// Get analytics
const analytics = await chatbotFeedbackService.getChatbotAnalytics();
console.log(`Helpful: ${analytics.helpfulPercentage}%`);
```

## Integration with Redux

All services work with Redux slices for state management:

- **notificationSlice** - Manages notification permissions, preferences, history, and UI state
- **biometricSlice** - Manages biometric status, devices, and enrollment flow
- **locationSlice** - Manages location data, preferences, and tracking state
- **chatbotSlice** - Manages chat history and messages (existing)

Services update Redux state through actions and selectors.

## Error Handling

All services follow consistent error handling patterns:

```typescript
try {
  const result = await service.someOperation();
} catch (error) {
  if (error instanceof ApiError) {
    console.error(`API Error [${error.code}]:`, error.message);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Token Management

Authentication tokens are automatically managed by `apiService`:

1. Token is loaded from localStorage on initialization
2. Automatically included in request headers
3. Automatically refreshed on 401 responses
4. Cleared on logout

Services inherit this token management automatically.

## Offline Support

Services integrate with IndexedDB for offline support:

- Push notification history can be cached
- Location history can be queued for sync
- Chat messages can be stored locally
- Automatic sync when connection restored

Implement using `indexedDBService` for persistence.

## Performance Considerations

- Services use request caching where appropriate
- Location tracking uses efficient polling intervals
- Notification history limits queries to recent items
- Batch operations supported for admin endpoints

## Testing

Each service includes:
- Request/response validation
- Error scenarios handled gracefully
- Fallback behaviors for offline mode
- Type safety through TypeScript interfaces

## Future Enhancements

- Add caching layer for frequently accessed data
- Implement retry logic with exponential backoff
- Add WebSocket support for real-time updates
- Batch multiple API calls for efficiency
