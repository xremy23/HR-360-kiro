# 📱 HR 360 Mobile App Development Plan

**Date**: June 2, 2026  
**Status**: Starting Development (Expo/React Native)  
**Framework**: Expo + React Native  
**Target**: Complete mobile app to feature parity with web admin  
**Timeline**: Phase-based development

---

## 🎯 Mobile Development Overview

### Current Status
- ✅ Project structure: Expo + React Native configured
- ✅ Navigation: React Navigation setup (stack + tabs)
- ✅ State Management: Redux + Redux Toolkit ready
- ✅ Base services: API, auth, sync, location ready
- ✅ Design system: Colors, typography, spacing defined
- ✅ HomeScreen: Built and functional
- ⏳ Other screens: Structure exists, need implementation

### What Exists
```
Mobile App (Expo/React Native)
├── HomeScreen ✅ (Dashboard)
├── CheckInScreen ⏳ (Check-in creation)
├── AlertsScreen ⏳ (Alert viewing)
├── KnowledgeBaseScreen ⏳ (KB articles)
├── ContactsScreen ⏳ (Emergency contacts)
├── ToBagScreen ⏳ (To-go bag checklist)
└── SettingsScreen ⏳ (App settings)

Services (Ready) ✅
├── apiService (API calls)
├── authService (Authentication)
├── biometricService (Biometric auth)
├── locationService (GPS location)
├── notificationService (Push notifications)
├── syncService (Offline sync)
├── websocketService (Real-time updates)
└── dbService (Local database)
```

---

## 📋 DEVELOPMENT PHASES

### Phase 1: Complete Core Screens (8-10 hours)
**Goal**: All 7 screens fully functional

**1A: CheckInScreen** (1.5-2 hours)
- Display status selection (Safe, Need Help, SOS)
- Add note/description input
- Capture location
- Send check-in to backend
- Show confirmation
- Handle offline queuing

**1B: AlertsScreen** (1.5-2 hours)
- List all alerts from backend
- Filter by severity/type
- Search functionality
- Pull-to-refresh
- Alert detail view
- Mark as read

**1C: KnowledgeBaseScreen** (1.5-2 hours)
- List KB articles
- Search articles
- Filter by category/tags
- Article detail view with formatting
- Offline download capability
- Bookmark functionality

**1D: ContactsScreen** (1.5-2 hours)
- List emergency contacts
- Add/edit/delete contacts
- Display contact info
- One-tap calling
- WhatsApp/SMS integration
- Location-based contact suggestions

**1E: ToBagScreen** (1.5-2 hours)
- Checklist interface
- Add/remove items
- Mark as packed/unpacked
- Categories
- Share checklist
- Template suggestions

**1F: SettingsScreen** (1-1.5 hours)
- User profile management
- Notification preferences
- Language selection
- Theme settings
- Privacy settings
- About & support

**1G: Polish & Integration** (1-2 hours)
- Connect all screens
- Test navigation
- Fix styling issues
- Performance optimization
- Error handling

---

### Phase 2: Advanced Features (6-8 hours)
**Goal**: PWA-level features on mobile

**2A: Offline-First Implementation**
- IndexedDB-like storage (via SQLite)
- Operation queuing for offline
- Auto-sync when online
- Conflict resolution
- Data persistence

**2B: Real-time Updates**
- WebSocket connection
- Live alert notifications
- Check-in status updates
- Incident updates
- Real-time typing indicators

**2C: Biometric & Security**
- Fingerprint authentication
- Face ID support
- Secure token storage
- Session management
- Auto-logout

**2D: Location Features**
- GPS check-in location capture
- Nearby emergency contacts
- Location sharing (with permission)
- Geofencing (optional)
- Map integration

**2E: Notifications**
- Push notification handling
- Local notifications
- Notification categories
- Deep linking from notifications
- Notification history

---

### Phase 3: Native Features (4-6 hours)
**Goal**: Full native integration

**3A: Permissions & Capabilities**
- Request location permission
- Request biometric permission
- Request camera permission (if used)
- Request notification permission
- Handle permission denials

**3B: Performance Optimization**
- Lazy loading screens
- Image optimization
- Memory management
- Battery optimization
- Network optimization

**3C: Testing & QA**
- Manual testing on device/emulator
- Performance testing
- Battery usage testing
- Network testing (various speeds)
- Offline testing

---

## 🔧 IMPLEMENTATION DETAILS

### Screen Template

Each screen should follow this pattern:

```typescript
import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { colors, typography, spacing } from '../styles/designSystem';
import apiService from '../services/apiService';

interface ScreenProps {
  navigation: any;
  route?: any;
}

const Screen: React.FC<ScreenProps> = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const user = useSelector((state: any) => state.auth.user);
  
  // Redux state for data, loading, error
  const items = useSelector((state: any) => state.slice.items);
  const loading = useSelector((state: any) => state.slice.loading);
  const error = useSelector((state: any) => state.slice.error);
  
  useEffect(() => {
    // Fetch data on mount
    fetchData();
  }, []);
  
  const fetchData = async () => {
    // Call API, update Redux
  };
  
  return (
    <ScrollView style={styles.container}>
      {/* Content */}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary.white,
  },
});

export default Screen;
```

---

## 📊 Redux Slices Needed

### Existing Slices ✅
- `authSlice` - User authentication
- `checkinSlice` - Check-ins
- `alertsSlice` - Alerts
- `offlineSlice` - Offline status

### Slices to Create ⏳
1. **kbSlice** - Knowledge base articles
2. **contactsSlice** - Emergency contacts
3. **tobiSlice** - To-bag items
4. **settingsSlice** - User settings
5. **notificationsSlice** - Notifications

### Slice Template
```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface State {
  items: any[];
  loading: boolean;
  error: string | null;
}

const initialState: State = {
  items: [],
  loading: false,
  error: null,
};

const slice = createSlice({
  name: 'slice',
  initialState,
  reducers: {
    setItems: (state, action: PayloadAction<any[]>) => {
      state.items = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { setItems, setLoading, setError } = slice.actions;
export default slice.reducer;
```

---

## 🎨 Styling Guidelines

### Design System (Already Defined)
```typescript
colors = {
  primary: {
    teal: '#17A2B8',
    white: '#FFFFFF',
    black: '#000000',
  },
  secondary: {
    lightTeal: '#B3E5FC',
  },
  success: '#4CAF50',
  warning: '#FFC107',
  error: '#F44336',
  neutral: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    500: '#9E9E9E',
    600: '#757575',
  },
};

typography = {
  fontSize: {
    h1: { size: 28, weight: '700' },
    h2: { size: 24, weight: '700' },
    body1: { size: 16, weight: '400' },
    body2: { size: 14, weight: '400' },
    label1: { size: 14, weight: '600' },
  },
};

spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

borderRadius = {
  sm: 4,
  md: 8,
  lg: 16,
};
```

---

## 🔄 API Integration Pattern

### Get Data
```typescript
const fetchData = async () => {
  try {
    dispatch(setLoading(true));
    dispatch(setError(null));
    
    const response = await apiService.getEndpoint({ params });
    
    if (response.success && response.data) {
      dispatch(setItems(response.data));
    } else {
      dispatch(setError('Failed to load data'));
    }
  } catch (err) {
    dispatch(setError(err.message || 'Error occurred'));
  } finally {
    dispatch(setLoading(false));
  }
};
```

### Post Data
```typescript
const submitData = async (data: any) => {
  try {
    dispatch(setLoading(true));
    dispatch(setError(null));
    
    const response = await apiService.postEndpoint(data);
    
    if (response.success) {
      // Update Redux or navigate
      navigation.goBack();
    } else {
      dispatch(setError(response.message || 'Failed to submit'));
    }
  } catch (err) {
    dispatch(setError(err.message || 'Error occurred'));
  } finally {
    dispatch(setLoading(false));
  }
};
```

---

## 📋 Checklist: CheckInScreen

- [ ] Import necessary components and services
- [ ] Setup Redux selectors for check-in data
- [ ] Create status button component (Safe, Need Help, SOS)
- [ ] Add notes/description input field
- [ ] Integrate location service
- [ ] Add submit check-in logic
- [ ] Show loading state
- [ ] Show error messages
- [ ] Show success confirmation
- [ ] Handle offline queuing
- [ ] Add styling and polish
- [ ] Test on device/emulator

---

## 📋 Checklist: AlertsScreen

- [ ] Fetch alerts from backend
- [ ] Create filter tabs (All, Active, Resolved)
- [ ] Create alert card component
- [ ] Add search functionality
- [ ] Add pull-to-refresh
- [ ] Create alert detail modal
- [ ] Show alert actions (Mark read, etc.)
- [ ] Add loading states
- [ ] Add error handling
- [ ] Add empty state
- [ ] Add styling
- [ ] Test navigation

---

## 📋 Checklist: KnowledgeBaseScreen

- [ ] Fetch KB articles from backend
- [ ] Create article list with search
- [ ] Add category filtering
- [ ] Create article detail view
- [ ] Add formatted text rendering
- [ ] Add bookmark functionality
- [ ] Add offline download support
- [ ] Add rating system
- [ ] Show loading states
- [ ] Handle errors
- [ ] Add styling
- [ ] Test search and filtering

---

## 📋 Checklist: ContactsScreen

- [ ] Fetch emergency contacts
- [ ] Create contact list view
- [ ] Add add/edit/delete contact modal
- [ ] Add one-tap calling
- [ ] Add SMS functionality
- [ ] Add location-based suggestions
- [ ] Add emergency contact quick-dial
- [ ] Show contact details
- [ ] Add loading states
- [ ] Handle errors
- [ ] Add styling
- [ ] Test all interactions

---

## 📋 Checklist: ToBagScreen

- [ ] Fetch or load to-bag items
- [ ] Create checklist interface
- [ ] Add item toggle (packed/unpacked)
- [ ] Add add/edit/delete item
- [ ] Add item categories
- [ ] Add share checklist
- [ ] Add predefined templates
- [ ] Show progress percentage
- [ ] Add loading states
- [ ] Handle errors
- [ ] Add styling
- [ ] Test all functionality

---

## 📋 Checklist: SettingsScreen

- [ ] Display user profile
- [ ] Add edit profile
- [ ] Add notification preferences
- [ ] Add language selection
- [ ] Add theme selection
- [ ] Add privacy settings
- [ ] Add about section
- [ ] Add support/help link
- [ ] Add logout
- [ ] Show version info
- [ ] Add styling
- [ ] Test all settings

---

## 🚀 Getting Started

### Step 1: Start Expo Dev Server
```bash
cd mobile
npm start
# Choose web (for testing in browser) or android/ios
```

### Step 2: Choose Development Order
1. CheckInScreen (most critical - core functionality)
2. AlertsScreen (important for awareness)
3. KnowledgeBaseScreen (helpful information)
4. ContactsScreen (emergency contacts)
5. ToBagScreen (preparedness)
6. SettingsScreen (user preferences)

### Step 3: For Each Screen
1. Read the existing code
2. Complete the implementation
3. Test functionality
4. Test styling
5. Test error handling
6. Test offline mode

---

## 📊 Development Timeline

```
CURRENT: Analysis & Planning ✅
├─ 0-2 hours      Phase 1A: CheckInScreen ⏳
├─ 2-4 hours      Phase 1B: AlertsScreen ⏳
├─ 4-6 hours      Phase 1C: KnowledgeBaseScreen ⏳
├─ 6-8 hours      Phase 1D: ContactsScreen ⏳
├─ 8-10 hours     Phase 1E: ToBagScreen ⏳
├─ 10-11 hours    Phase 1F: SettingsScreen ⏳
├─ 11-12 hours    Phase 1G: Polish & Integration ⏳
├─ 12-20 hours    Phase 2: Advanced Features ⏳
└─ 20-26 hours    Phase 3: Native Features & Testing ⏳

TOTAL: ~26 hours for complete mobile app
RECOMMENDED: 1-2 weeks part-time or 3-4 days full-time
```

---

## 🎯 Success Criteria

### Minimum Viable Product (MVP)
- [x] User can log in
- [ ] User can submit check-in (Safe, Need Help, SOS)
- [ ] User can view recent alerts
- [ ] User can view KB articles
- [ ] User can view emergency contacts
- [ ] User can access to-bag checklist
- [ ] User can access settings
- [ ] Offline mode works for reading data
- [ ] No critical errors
- [ ] App launches without crashes

### Production Ready
- [x] All MVP features work
- [ ] Offline sync works (queue + auto-sync)
- [ ] Real-time updates work
- [ ] Notifications work
- [ ] Location capture works
- [ ] Biometric auth works (optional)
- [ ] Performance optimized
- [ ] Battery usage optimized
- [ ] 100% error handling
- [ ] Full test coverage

---

## 📞 Quick Reference

### Run Mobile App
```bash
cd mobile
npm start
# Then select web, ios, or android
```

### Build for Production
```bash
# Web
npm run web

# iOS
npm run ios

# Android
npm run android
```

### Update Expo
```bash
npm install expo@latest
npx expo prebuild --clean
```

---

## 🎓 Key Points

1. **Use Redux**: All state goes through Redux for consistency
2. **Use Design System**: Never hard-code colors/sizes
3. **Use API Service**: Never call API directly
4. **Handle Loading**: Always show loading state
5. **Handle Errors**: Always show error messages
6. **Test Offline**: Always test without network
7. **Test on Device**: Web testing isn't enough
8. **Use Types**: TypeScript strict mode enabled

---

## 📚 Resources

- **Expo Docs**: https://docs.expo.dev
- **React Native Docs**: https://reactnative.dev
- **Redux Docs**: https://redux.js.org
- **Design System**: `mobile/src/styles/designSystem.ts`
- **API Service**: `mobile/src/services/apiService.ts`

---

**Next Action**: Start with Phase 1A (CheckInScreen)  
**Timeline**: ~2 hours per screen  
**Total**: ~12 hours for Phase 1  

🚀 **Let's build the mobile app!**
