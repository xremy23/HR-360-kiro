# End-to-End Test Scenarios

## Overview
This document outlines comprehensive E2E test scenarios for the HR 360 application, covering all major user flows and advanced features.

---

## 1. Authentication & Onboarding

### Scenario 1.1: User Registration and Login
**Objective**: Verify complete user registration and login flow

**Steps**:
1. User opens app and navigates to registration screen
2. User enters email, password, first name, last name
3. User receives verification code via email
4. User enters verification code
5. User is redirected to login screen
6. User logs in with credentials
7. User is redirected to dashboard

**Expected Results**:
- ✅ User account created in database
- ✅ Verification email sent
- ✅ User authenticated and JWT token issued
- ✅ User can access protected routes

**Test Data**:
- Email: test@example.com
- Password: SecurePass123!
- First Name: John
- Last Name: Doe

---

### Scenario 1.2: Password Reset Flow
**Objective**: Verify password reset functionality

**Steps**:
1. User clicks "Forgot Password" on login screen
2. User enters email address
3. User receives password reset email
4. User clicks reset link in email
5. User enters new password
6. User logs in with new password

**Expected Results**:
- ✅ Password reset email sent
- ✅ Reset link is valid for 24 hours
- ✅ Password updated in database
- ✅ User can login with new password

---

## 2. Alert Management

### Scenario 2.1: Alert Broadcast and Reception
**Objective**: Verify alert creation, broadcast, and reception

**Steps**:
1. Admin logs in to web console
2. Admin navigates to Alerts section
3. Admin creates new alert with:
   - Title: "Security Breach"
   - Message: "Unauthorized access detected"
   - Severity: High
   - Type: Security
4. Admin clicks "Broadcast"
5. Mobile users receive push notification
6. Mobile users see alert in Alerts screen
7. Mobile users can view alert details

**Expected Results**:
- ✅ Alert created in database
- ✅ Push notifications sent to all organization members
- ✅ WebSocket broadcast received by connected clients
- ✅ Alert appears in mobile app
- ✅ Alert details are accurate

**Verification Points**:
- Check database for alert record
- Verify push notification delivery logs
- Check WebSocket event logs
- Verify mobile app UI updates

---

### Scenario 2.2: Drill Alert
**Objective**: Verify drill alert functionality

**Steps**:
1. Admin creates alert with "isDrill" flag set to true
2. Alert is broadcast to organization
3. Mobile users receive notification marked as drill
4. Users can acknowledge drill alert
5. Admin can view drill statistics

**Expected Results**:
- ✅ Drill alert marked in database
- ✅ Users notified of drill status
- ✅ Acknowledgments tracked
- ✅ Statistics available in admin dashboard

---

## 3. Check-In Management

### Scenario 3.1: Check-In During Incident
**Objective**: Verify check-in flow during incident

**Steps**:
1. Admin creates incident
2. Mobile users receive incident notification
3. User opens app and sees check-in prompt
4. User selects status: "Safe"
5. User submits check-in
6. Check-in is synced to server
7. Admin can see check-in status in dashboard

**Expected Results**:
- ✅ Incident created and broadcast
- ✅ Check-in recorded in database
- ✅ Status visible in admin dashboard
- ✅ Real-time updates via WebSocket

---

### Scenario 3.2: Offline Check-In and Sync
**Objective**: Verify offline check-in and sync when online

**Steps**:
1. User is offline (airplane mode enabled)
2. Incident is created on server
3. User comes online
4. App syncs and receives incident
5. User performs check-in while offline
6. Check-in is queued locally
7. User comes online
8. Check-in is synced to server
9. Admin sees check-in status

**Expected Results**:
- ✅ Check-in queued locally with priority
- ✅ Sync completes when online
- ✅ No data loss
- ✅ Server reflects correct status

---

## 4. SOS Escalation

### Scenario 4.1: SOS Trigger and Notification
**Objective**: Verify SOS trigger and escalation

**Steps**:
1. User is in distress
2. User triggers SOS button
3. SOS escalation created
4. All organization members receive push notification
5. Admin receives SOS alert in dashboard
6. Admin can view SOS details and user location
7. Admin can acknowledge SOS

**Expected Results**:
- ✅ SOS escalation recorded with timestamp
- ✅ Push notifications sent immediately
- ✅ WebSocket broadcast to all connected users
- ✅ Location data captured
- ✅ Admin can take action

---

### Scenario 4.2: SOS with Location Tracking
**Objective**: Verify SOS with real-time location

**Steps**:
1. User triggers SOS
2. User's location is captured
3. Location is sent to server
4. Admin can see user location on map
5. Admin can track user movement in real-time
6. Location updates are sent via WebSocket

**Expected Results**:
- ✅ Location captured with accuracy
- ✅ Location stored in database
- ✅ Real-time location updates
- ✅ Location visible in admin dashboard

---

## 5. Offline Functionality

### Scenario 5.1: Complete Offline Operation
**Objective**: Verify app functionality when offline

**Steps**:
1. User enables airplane mode
2. User navigates through app
3. User views cached data (alerts, contacts, KB)
4. User creates check-in (queued)
5. User creates contact (queued)
6. User disables airplane mode
7. App syncs all queued operations
8. Server reflects all changes

**Expected Results**:
- ✅ App remains functional offline
- ✅ Cached data available
- ✅ Operations queued with priority
- ✅ Sync completes successfully
- ✅ No data loss or conflicts

---

### Scenario 5.2: Conflict Resolution
**Objective**: Verify conflict resolution during sync

**Steps**:
1. User is offline
2. User updates contact information
3. Admin updates same contact on server
4. User comes online
5. Sync detects conflict
6. Conflict resolved using merge strategy
7. Final data reflects both changes

**Expected Results**:
- ✅ Conflict detected
- ✅ Merge strategy applied
- ✅ Both changes preserved where possible
- ✅ User notified of resolution

---

## 6. Location Tracking

### Scenario 6.1: Geofence Entry/Exit
**Objective**: Verify geofence functionality

**Steps**:
1. User creates geofence around office (500m radius)
2. User travels towards office
3. User enters geofence
4. Geofence entry event triggered
5. Notification sent to user
6. User travels away from office
7. User exits geofence
8. Geofence exit event triggered
9. Notification sent to user

**Expected Results**:
- ✅ Geofence created in database
- ✅ Entry/exit events detected
- ✅ Notifications sent
- ✅ Events logged for admin

---

### Scenario 6.2: Nearby Users Discovery
**Objective**: Verify nearby users feature

**Steps**:
1. Multiple users enable location sharing
2. User opens "Nearby Users" screen
3. App queries for users within 5km
4. List of nearby users displayed with distance
5. User can tap on nearby user to see details
6. User can send message to nearby user

**Expected Results**:
- ✅ Nearby users list accurate
- ✅ Distances calculated correctly
- ✅ Real-time updates as users move
- ✅ User details accessible

---

## 7. Push Notifications

### Scenario 7.1: Push Notification Delivery
**Objective**: Verify push notification delivery

**Steps**:
1. User registers device token
2. Alert is broadcast
3. Push notification sent to device
4. User receives notification
5. User taps notification
6. App opens to alert detail screen
7. User can interact with alert

**Expected Results**:
- ✅ Device token registered
- ✅ Notification delivered
- ✅ Deep link works correctly
- ✅ User navigated to correct screen

---

### Scenario 7.2: Notification Preferences
**Objective**: Verify notification preference management

**Steps**:
1. User opens Settings
2. User navigates to Notification Preferences
3. User disables alerts for "Low" severity
4. User saves preferences
5. Low severity alert is broadcast
6. User does not receive notification
7. High severity alert is broadcast
8. User receives notification

**Expected Results**:
- ✅ Preferences saved
- ✅ Notifications filtered correctly
- ✅ User only receives relevant notifications

---

## 8. Knowledge Base

### Scenario 8.1: KB Search and Access
**Objective**: Verify KB functionality

**Steps**:
1. User opens Knowledge Base
2. User searches for "evacuation"
3. Search results displayed
4. User taps on guide
5. Guide content displayed
6. User can read full guide
7. User can acknowledge guide
8. Acknowledgment recorded

**Expected Results**:
- ✅ Search works correctly
- ✅ Guide content displayed
- ✅ Acknowledgment recorded
- ✅ Admin can see acknowledgment stats

---

## 9. Contacts Management

### Scenario 9.1: Add and Manage Contacts
**Objective**: Verify contacts functionality

**Steps**:
1. User opens Contacts
2. User taps "Add Contact"
3. User enters contact details
4. User saves contact
5. Contact appears in list
6. User can edit contact
7. User can delete contact
8. Changes synced to server

**Expected Results**:
- ✅ Contact created
- ✅ Contact appears in list
- ✅ Edit/delete works
- ✅ Changes synced

---

## 10. Admin Dashboard

### Scenario 10.1: Real-Time Dashboard Updates
**Objective**: Verify admin dashboard real-time updates

**Steps**:
1. Admin opens dashboard
2. Mobile user triggers SOS
3. Dashboard updates in real-time
4. SOS alert appears
5. Admin can see user location
6. Admin can see check-in status
7. Admin can see incident summary

**Expected Results**:
- ✅ Dashboard updates in real-time
- ✅ All data accurate
- ✅ WebSocket connection stable
- ✅ Admin can take actions

---

## 11. Performance & Stress Testing

### Scenario 11.1: High Volume Alert Broadcast
**Objective**: Verify system handles high volume

**Steps**:
1. System has 1000+ users
2. Admin broadcasts alert
3. Push notifications sent to all users
4. WebSocket broadcasts to all connected clients
5. Database handles concurrent updates
6. No timeouts or errors

**Expected Results**:
- ✅ All notifications delivered
- ✅ No performance degradation
- ✅ Response times acceptable
- ✅ No data loss

---

### Scenario 11.2: Concurrent Sync Operations
**Objective**: Verify system handles concurrent syncs

**Steps**:
1. 100+ users come online simultaneously
2. All users sync pending operations
3. Server handles concurrent requests
4. No conflicts or data loss
5. All syncs complete successfully

**Expected Results**:
- ✅ All syncs complete
- ✅ No data loss
- ✅ Server remains responsive
- ✅ Database handles load

---

## 12. Security Testing

### Scenario 12.1: Authentication & Authorization
**Objective**: Verify security controls

**Steps**:
1. Unauthenticated user tries to access protected route
2. Request rejected with 401
3. User with wrong role tries to access admin route
4. Request rejected with 403
5. User tries to access other user's data
6. Request rejected with 403

**Expected Results**:
- ✅ Authentication enforced
- ✅ Authorization enforced
- ✅ No unauthorized access
- ✅ Proper error responses

---

### Scenario 12.2: Data Encryption
**Objective**: Verify data encryption

**Steps**:
1. User sends sensitive data (location, health status)
2. Data transmitted over HTTPS
3. Data encrypted in transit
4. Data encrypted at rest in database
5. Only authorized users can access

**Expected Results**:
- ✅ HTTPS enforced
- ✅ Data encrypted in transit
- ✅ Data encrypted at rest
- ✅ Access controls enforced

---

## Test Execution Plan

### Phase 1: Unit Tests
- Run all service unit tests
- Run all entity tests
- Coverage target: >80%

### Phase 2: Integration Tests
- Run offline + notifications integration tests
- Run API integration tests
- Run database integration tests

### Phase 3: E2E Tests
- Execute all scenarios in order
- Test on multiple devices (iOS, Android)
- Test on different network conditions

### Phase 4: Performance Tests
- Load testing with 1000+ concurrent users
- Stress testing with high volume operations
- Memory and CPU profiling

### Phase 5: Security Tests
- Penetration testing
- SQL injection testing
- XSS testing
- CSRF testing

---

## Test Environment Setup

### Backend
- Node.js 18+
- PostgreSQL 14+
- Redis (for caching)
- Expo Server SDK configured

### Mobile
- iOS 14+ simulator/device
- Android 10+ emulator/device
- Expo Go app

### Web Console
- Chrome/Firefox latest
- Safari latest

### Network Conditions
- 4G/LTE
- 3G
- WiFi
- Offline (airplane mode)

---

## Success Criteria

- ✅ All unit tests pass (>80% coverage)
- ✅ All integration tests pass
- ✅ All E2E scenarios pass
- ✅ No critical security issues
- ✅ Performance meets SLA (response time <500ms)
- ✅ Zero data loss in offline scenarios
- ✅ All notifications delivered within 5 seconds

---

## Regression Testing

After each release:
1. Run full test suite
2. Execute critical path scenarios
3. Verify no regressions
4. Performance benchmarking
5. Security scanning

---

## Known Issues & Workarounds

(To be updated as issues are discovered)

---

## Test Metrics

- **Test Coverage**: Target >80%
- **Pass Rate**: Target 100%
- **Performance**: Response time <500ms
- **Availability**: Target 99.9%
- **Data Integrity**: Zero loss in all scenarios
