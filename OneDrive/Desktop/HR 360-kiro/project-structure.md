# Emergency Management Mobile App - Project Structure

## Overview
Android-first, iOS-ready mobile app with offline-first architecture for emergency management, team check-ins, and knowledge base access.

## Tech Stack
- **Frontend**: React Native / Expo (cross-platform)
- **State Management**: Redux Toolkit
- **Offline Storage**: SQLite (via expo-sqlite) + AsyncStorage
- **Backend**: Node.js/Express (optional, for sync when online)
- **Database**: PostgreSQL (backend)
- **Authentication**: Email-based with JWT
- **Real-time**: WebSockets for alerts and check-in updates
- **Maps**: React Native Maps (location-aware contacts)
- **Biometric**: expo-local-authentication

## Directory Structure
```
emergency-app/
├── mobile/                          # React Native app
│   ├── src/
│   │   ├── screens/
│   │   │   ├── auth/
│   │   │   │   ├── LoginScreen.tsx
│   │   │   │   ├── VerificationScreen.tsx
│   │   │   │   └── OrgOnboardingScreen.tsx
│   │   │   ├── home/
│   │   │   │   ├── HomeScreen.tsx
│   │   │   │   └── DashboardScreen.tsx
│   │   │   ├── checkin/
│   │   │   │   ├── CheckInScreen.tsx
│   │   │   │   ├── CheckInHistoryScreen.tsx
│   │   │   │   └── TeamCheckInDashboard.tsx
│   │   │   ├── kb/
│   │   │   │   ├── KBListScreen.tsx
│   │   │   │   ├── KBDetailScreen.tsx
│   │   │   │   └── KBSearchScreen.tsx
│   │   │   ├── contacts/
│   │   │   │   ├── ContactsScreen.tsx
│   │   │   │   ├── AddContactScreen.tsx
│   │   │   │   └── LocationAwareContactsScreen.tsx
│   │   │   ├── tobag/
│   │   │   │   ├── ToBagScreen.tsx
│   │   │   │   └── ToBagItemScreen.tsx
│   │   │   ├── alerts/
│   │   │   │   ├── AlertsScreen.tsx
│   │   │   │   └── AlertDetailScreen.tsx
│   │   │   ├── settings/
│   │   │   │   ├── SettingsScreen.tsx
│   │   │   │   ├── ProfileScreen.tsx
│   │   │   │   └── BiometricScreen.tsx
│   │   │   └── admin/
│   │   │       ├── AdminDashboard.tsx
│   │   │       ├── KBManagementScreen.tsx
│   │   │       ├── OrgManagementScreen.tsx
│   │   │       ├── AlertBroadcastScreen.tsx
│   │   │       ├── DrillModeScreen.tsx
│   │   │       └── IncidentLogScreen.tsx
│   │   ├── components/
│   │   │   ├── CheckInButton.tsx
│   │   │   ├── AlertBanner.tsx
│   │   │   ├── OfflineIndicator.tsx
│   │   │   ├── TeamMemberCard.tsx
│   │   │   └── KBCard.tsx
│   │   ├── services/
│   │   │   ├── authService.ts
│   │   │   ├── dbService.ts
│   │   │   ├── syncService.ts
│   │   │   ├── locationService.ts
│   │   │   ├── notificationService.ts
│   │   │   ├── biometricService.ts
│   │   │   └── sosService.ts
│   │   ├── store/
│   │   │   ├── slices/
│   │   │   │   ├── authSlice.ts
│   │   │   │   ├── kbSlice.ts
│   │   │   │   ├── checkinSlice.ts
│   │   │   │   ├── contactsSlice.ts
│   │   │   │   ├── alertsSlice.ts
│   │   │   │   ├── userSlice.ts
│   │   │   │   └── syncSlice.ts
│   │   │   └── store.ts
│   │   ├── utils/
│   │   │   ├── constants.ts
│   │   │   ├── validators.ts
│   │   │   ├── formatters.ts
│   │   │   └── permissions.ts
│   │   ├── types/
│   │   │   ├── index.ts
│   │   │   ├── auth.ts
│   │   │   ├── kb.ts
│   │   │   ├── checkin.ts
│   │   │   ├── contacts.ts
│   │   │   ├── alerts.ts
│   │   │   └── user.ts
│   │   ├── i18n/
│   │   │   ├── en.json
│   │   │   ├── fil.json
│   │   │   └── i18n.ts
│   │   ├── App.tsx
│   │   └── Navigation.tsx
│   ├── app.json
│   ├── package.json
│   └── tsconfig.json
│
├── web/                             # Admin/HR web console
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── KBManagementPage.tsx
│   │   │   ├── OrgManagementPage.tsx
│   │   │   ├── UserManagementPage.tsx
│   │   │   ├── AlertBroadcastPage.tsx
│   │   │   ├── IncidentLogPage.tsx
│   │   │   └── DrillModePage.tsx
│   │   ├── components/
│   │   ├── services/
│   │   ├── store/
│   │   ├── types/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── tsconfig.json
│
├── backend/                         # Node.js/Express API
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── kb.ts
│   │   │   ├── checkin.ts
│   │   │   ├── contacts.ts
│   │   │   ├── alerts.ts
│   │   │   ├── users.ts
│   │   │   ├── org.ts
│   │   │   └── incidents.ts
│   │   ├── controllers/
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   ├── rbac.ts
│   │   │   └── errorHandler.ts
│   │   ├── models/
│   │   │   ├── User.ts
│   │   │   ├── KBGuide.ts
│   │   │   ├── CheckIn.ts
│   │   │   ├── Alert.ts
│   │   │   ├── Org.ts
│   │   │   ├── Team.ts
│   │   │   └── IncidentLog.ts
│   │   ├── services/
│   │   │   ├── emailService.ts
│   │   │   ├── syncService.ts
│   │   │   ├── alertService.ts
│   │   │   └── sosService.ts
│   │   ├── db/
│   │   │   ├── migrations/
│   │   │   └── seeds/
│   │   ├── config/
│   │   ├── app.ts
│   │   └── server.ts
│   ├── package.json
│   └── tsconfig.json
│
└── docs/
    ├── API.md
    ├── ARCHITECTURE.md
    ├── OFFLINE_STRATEGY.md
    ├── DEPLOYMENT.md
    └── CONTRIBUTING.md
```

## Key Features Implementation Order
1. **Phase 1**: Auth, offline DB, basic KB
2. **Phase 2**: Check-in system, contacts
3. **Phase 3**: Admin console, alerts
4. **Phase 4**: Advanced features (biometric, location-aware, SOS escalation)
5. **Phase 5**: i18n, drill mode, incident logging
