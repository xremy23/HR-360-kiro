# Remaining Screens Redux Integration Guide

**Status**: Ready to implement  
**Pattern**: Use HomeScreen as reference  
**Estimated Time**: 2-3 hours for all 5 screens

---

## QUICK REFERENCE: Redux Integration Pattern

Every screen should follow this pattern:

### 1. Import Redux
```typescript
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { setLoading, setError, setItems } from '../store/slices/[sliceName]Slice';
```

### 2. Setup Dispatch & Selectors
```typescript
const dispatch = useDispatch<AppDispatch>();

const data = useSelector((state: RootState) => state.[sliceName].items);
const loading = useSelector((state: RootState) => state.[sliceName].loading);
const error = useSelector((state: RootState) => state.[sliceName].error);
const isOffline = useSelector((state: RootState) => state.offline.isOnline === false);
```

### 3. Fetch Data on Mount
```typescript
useEffect(() => {
  fetchData();
}, []);

const fetchData = async () => {
  try {
    dispatch(setLoading(true));
    const response = await apiService.get[Data]({ pageSize: 10 });
    if (response.success && response.data) {
      dispatch(setItems(response.data));
    } else {
      dispatch(setError(response.error?.message || 'Failed to load data'));
    }
  } catch (err) {
    dispatch(setError((err as ApiError).message || 'Failed to load data'));
  }
};
```

### 4. Render with Loading/Error States
```typescript
{loading ? (
  <View style={styles.loadingCard}>
    <ActivityIndicator size="small" color={colors.primary.teal} />
    <Text style={styles.loadingText}>Loading...</Text>
  </View>
) : error ? (
  <View style={styles.errorCard}>
    <Text style={styles.errorText}>⚠️ {error}</Text>
  </View>
) : data.length > 0 ? (
  // Display data
) : null}
```

---

## SCREEN-BY-SCREEN IMPLEMENTATION

### 1. CheckInScreen

**File**: `mobile/src/screens/CheckInScreen.tsx`  
**Redux Slice**: `checkinSlice`  
**API Service**: `apiService.createCheckIn()`

**What to do**:
1. Remove local state for check-in form
2. Add Redux selectors for `checkin.loading`, `checkin.error`
3. On submit, dispatch `setLoading(true)` → call `apiService.createCheckIn()` → dispatch `setCurrentCheckIn()` or `addToHistory()`
4. Handle loading/error states
5. Show success message and navigate back

**Key Actions**:
- `setLoading(true)` - Before API call
- `setCurrentCheckIn(checkIn)` - After successful creation
- `addToHistory(checkIn)` - Add to history
- `setError(message)` - On error

---

### 2. AlertsScreen

**File**: `mobile/src/screens/AlertsScreen.tsx`  
**Redux Slice**: `alertsSlice`  
**API Service**: `apiService.getAlerts()`

**What to do**:
1. Remove local state for alerts list
2. Add Redux selectors for `alerts.items`, `alerts.loading`, `alerts.error`
3. On mount, dispatch `setLoading(true)` → call `apiService.getAlerts()` → dispatch `setItems()`
4. Display alerts from Redux
5. Handle mark as read: dispatch `markNotificationAsRead(id)`
6. Show unread count from Redux

**Key Actions**:
- `setLoading(true)` - Before API call
- `setItems(alerts)` - Set alerts list
- `markNotificationAsRead(id)` - Mark single alert as read
- `markAllNotificationsAsRead()` - Mark all as read
- `setError(message)` - On error

---

### 3. KnowledgeBaseScreen

**File**: `mobile/src/screens/KnowledgeBaseScreen.tsx`  
**Redux Slice**: `kbSlice`  
**API Service**: `apiService.getKBGuides()`

**What to do**:
1. Remove local state for KB guides
2. Add Redux selectors for `kb.items`, `kb.loading`, `kb.error`
3. On mount, dispatch `setLoading(true)` → call `apiService.getKBGuides()` → dispatch `setItems()`
4. Display guides from Redux
5. Handle search/filter locally (don't need Redux for this)
6. Handle guide selection: dispatch `setSelectedGuide(guide)`

**Key Actions**:
- `setLoading(true)` - Before API call
- `setItems(guides)` - Set guides list
- `setSelectedGuide(guide)` - Select a guide
- `setError(message)` - On error

---

### 4. ContactsScreen

**File**: `mobile/src/screens/ContactsScreen.tsx`  
**Redux Slice**: Need to check if exists (might need to create)  
**API Service**: `apiService.getContacts()`

**What to do**:
1. Check if `contactsSlice` exists in Redux
2. If not, create it following the same pattern as `checkinSlice`
3. Remove local state for contacts
4. Add Redux selectors
5. On mount, fetch contacts and dispatch to Redux
6. Display contacts from Redux
7. Handle contact selection/calling

**Key Actions**:
- `setLoading(true)` - Before API call
- `setItems(contacts)` - Set contacts list
- `setSelectedContact(contact)` - Select a contact
- `setError(message)` - On error

---

### 5. ToBagScreen

**File**: `mobile/src/screens/ToBagScreen.tsx`  
**Redux Slice**: Need to check if exists (might need to create)  
**API Service**: `apiService.getToBagItems()`

**What to do**:
1. Check if `toBagSlice` exists in Redux
2. If not, create it following the same pattern as `checkinSlice`
3. Remove local state for to-bag items
4. Add Redux selectors
5. On mount, fetch items and dispatch to Redux
6. Display items from Redux
7. Handle item check/uncheck: dispatch `updateItem(id, { checked: true/false })`

**Key Actions**:
- `setLoading(true)` - Before API call
- `setItems(items)` - Set items list
- `updateItem(id, updates)` - Update item (check/uncheck)
- `addItem(item)` - Add new item
- `removeItem(id)` - Remove item
- `setError(message)` - On error

---

### 6. SettingsScreen

**File**: `mobile/src/screens/SettingsScreen.tsx` (NOT YET CREATED)  
**Redux Slice**: `authSlice` (for user settings)  
**API Service**: `apiService.updateUserSettings()`

**What to do**:
1. Create SettingsScreen component
2. Use `authSlice` for user data
3. Display user settings (name, email, phone, etc.)
4. Handle settings updates: dispatch `updateUser()` action
5. Handle logout: dispatch `clearAuth()` action
6. Show offline mode toggle: dispatch `updateOfflineSettings()`

**Key Actions**:
- `updateUser(user)` - Update user settings
- `clearAuth()` - Logout
- `updateOfflineSettings(settings)` - Update offline mode

---

## IMPLEMENTATION ORDER

**Recommended order** (easiest to hardest):

1. **AlertsScreen** - Simple list display, similar to HomeScreen
2. **KnowledgeBaseScreen** - Simple list display with search
3. **CheckInScreen** - Form submission with Redux
4. **ContactsScreen** - List display, might need new Redux slice
5. **ToBagScreen** - List with item updates, might need new Redux slice
6. **SettingsScreen** - User settings, uses existing authSlice

---

## COMMON PATTERNS

### Pattern 1: Simple List Display
```typescript
// Fetch on mount
useEffect(() => {
  fetchData();
}, []);

const fetchData = async () => {
  dispatch(setLoading(true));
  const response = await apiService.getData();
  if (response.success) {
    dispatch(setItems(response.data));
  } else {
    dispatch(setError(response.error?.message));
  }
};

// Render
{loading ? <Loading /> : error ? <Error /> : items.length > 0 ? <List /> : <Empty />}
```

### Pattern 2: Form Submission
```typescript
const handleSubmit = async (formData) => {
  dispatch(setLoading(true));
  const response = await apiService.createItem(formData);
  if (response.success) {
    dispatch(addItem(response.data));
    navigation.goBack();
  } else {
    dispatch(setError(response.error?.message));
  }
};
```

### Pattern 3: Item Update
```typescript
const handleUpdate = async (id, updates) => {
  dispatch(setLoading(true));
  const response = await apiService.updateItem(id, updates);
  if (response.success) {
    dispatch(updateItem(id, response.data));
  } else {
    dispatch(setError(response.error?.message));
  }
};
```

### Pattern 4: Offline Handling
```typescript
const isOffline = useSelector((state: RootState) => state.offline.isOnline === false);

{isOffline && (
  <View style={styles.offlineBanner}>
    <Text>📡 You're offline. Changes will sync when online.</Text>
  </View>
)}
```

---

## TESTING EACH SCREEN

For each screen, test:
- [ ] Screen loads without errors
- [ ] Redux selectors work
- [ ] Data fetches on mount
- [ ] Loading state shows
- [ ] Error state shows
- [ ] Data displays correctly
- [ ] Offline banner shows when offline
- [ ] User interactions work (buttons, forms, etc.)
- [ ] Navigation works
- [ ] Redux state updates correctly

---

## REDUX SLICES STATUS

| Slice | Status | Location |
|-------|--------|----------|
| `authSlice` | ✅ Exists | `mobile/src/store/slices/authSlice.ts` |
| `checkinSlice` | ✅ Updated | `mobile/src/store/slices/checkinSlice.ts` |
| `alertsSlice` | ✅ Updated | `mobile/src/store/slices/alertsSlice.ts` |
| `kbSlice` | ✅ Exists | `mobile/src/store/slices/kbSlice.ts` |
| `offlineSlice` | ✅ Exists | `mobile/src/store/slices/offlineSlice.ts` |
| `contactsSlice` | ❓ Check | Need to verify |
| `toBagSlice` | ❓ Check | Need to verify |

---

## NEXT STEPS

1. ✅ HomeScreen Redux integration - COMPLETE
2. ⏳ Implement AlertsScreen
3. ⏳ Implement KnowledgeBaseScreen
4. ⏳ Implement CheckInScreen
5. ⏳ Implement ContactsScreen (create slice if needed)
6. ⏳ Implement ToBagScreen (create slice if needed)
7. ⏳ Create SettingsScreen

**Ready to start? Pick a screen and follow the pattern!**

