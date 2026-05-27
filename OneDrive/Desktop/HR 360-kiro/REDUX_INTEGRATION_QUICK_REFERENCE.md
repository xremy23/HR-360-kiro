# Redux Integration Quick Reference Card

**For**: Mobile screens Redux integration  
**Pattern**: Redux-first data management  
**Reference**: HomeScreen implementation

---

## 5-MINUTE SETUP

### Step 1: Import Redux
```typescript
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { setLoading, setError, setItems } from '../store/slices/[sliceName]Slice';
```

### Step 2: Setup Dispatch & Selectors
```typescript
const dispatch = useDispatch<AppDispatch>();

const data = useSelector((state: RootState) => state.[sliceName].items);
const loading = useSelector((state: RootState) => state.[sliceName].loading);
const error = useSelector((state: RootState) => state.[sliceName].error);
```

### Step 3: Fetch on Mount
```typescript
useEffect(() => {
  fetchData();
}, []);

const fetchData = async () => {
  dispatch(setLoading(true));
  const response = await apiService.get[Data]();
  if (response.success) {
    dispatch(setItems(response.data));
  } else {
    dispatch(setError('Failed to load data'));
  }
};
```

### Step 4: Render
```typescript
{loading ? (
  <ActivityIndicator />
) : error ? (
  <Text>{error}</Text>
) : data.length > 0 ? (
  <FlatList data={data} renderItem={...} />
) : null}
```

---

## REDUX SLICES CHEAT SHEET

### checkinSlice
```typescript
// State
state.checkin.items          // CheckIn[]
state.checkin.loading        // boolean
state.checkin.error          // string | null
state.checkin.currentCheckIn // CheckIn | null

// Actions
setLoading(true/false)
setError(message)
setItems(checkIns)
setCurrentCheckIn(checkIn)
addToHistory(checkIn)
```

### alertsSlice
```typescript
// State
state.alerts.items           // Alert[]
state.alerts.loading         // boolean
state.alerts.error           // string | null
state.alerts.unreadCount     // number

// Actions
setLoading(true/false)
setError(message)
setItems(alerts)
addAlert(alert)
markNotificationAsRead(id)
markAllNotificationsAsRead()
```

### offlineSlice
```typescript
// State
state.offline.isOnline       // boolean
state.offline.isSyncing      // boolean
state.offline.lastSyncTime   // Date | null

// Actions
setOnlineStatus(true/false)
setSyncingStatus(true/false)
setLastSyncTime(date)
```

---

## COMMON PATTERNS

### Pattern 1: Simple List
```typescript
const items = useSelector((state: RootState) => state.slice.items);
const loading = useSelector((state: RootState) => state.slice.loading);
const error = useSelector((state: RootState) => state.slice.error);

useEffect(() => {
  dispatch(setLoading(true));
  apiService.getItems().then(res => {
    if (res.success) dispatch(setItems(res.data));
    else dispatch(setError('Failed'));
  });
}, []);

return (
  {loading ? <Loading /> : error ? <Error /> : <List items={items} />}
);
```

### Pattern 2: Form Submission
```typescript
const handleSubmit = async (formData) => {
  dispatch(setLoading(true));
  const res = await apiService.createItem(formData);
  if (res.success) {
    dispatch(addItem(res.data));
    navigation.goBack();
  } else {
    dispatch(setError(res.error?.message));
  }
};
```

### Pattern 3: Item Update
```typescript
const handleUpdate = async (id, updates) => {
  dispatch(setLoading(true));
  const res = await apiService.updateItem(id, updates);
  if (res.success) {
    dispatch(updateItem(id, res.data));
  } else {
    dispatch(setError(res.error?.message));
  }
};
```

### Pattern 4: Offline Check
```typescript
const isOffline = useSelector((state: RootState) => state.offline.isOnline === false);

{isOffline && <OfflineBanner />}
```

---

## COMMON MISTAKES TO AVOID

❌ **DON'T**: Use local state for data
```typescript
const [data, setData] = useState([]);  // ❌ Wrong
```

✅ **DO**: Use Redux selectors
```typescript
const data = useSelector((state: RootState) => state.slice.items);  // ✅ Right
```

---

❌ **DON'T**: Fetch data without dispatch
```typescript
const response = await apiService.getData();  // ❌ Wrong
```

✅ **DO**: Dispatch actions
```typescript
dispatch(setLoading(true));
const response = await apiService.getData();
if (response.success) dispatch(setItems(response.data));  // ✅ Right
```

---

❌ **DON'T**: Forget loading/error states
```typescript
return <List items={items} />;  // ❌ Wrong
```

✅ **DO**: Handle all states
```typescript
return (
  {loading ? <Loading /> : error ? <Error /> : <List items={items} />}  // ✅ Right
);
```

---

## REDUX STORE STRUCTURE

```
store
├── auth
│   ├── user
│   ├── token
│   ├── loading
│   └── error
├── checkin
│   ├── items
│   ├── currentCheckIn
│   ├── loading
│   └── error
├── alerts
│   ├── items
│   ├── loading
│   ├── error
│   └── unreadCount
├── kb
│   ├── items
│   ├── loading
│   └── error
└── offline
    ├── isOnline
    ├── isSyncing
    └── lastSyncTime
```

---

## SCREEN IMPLEMENTATION CHECKLIST

For each screen:
- [ ] Import Redux hooks and slices
- [ ] Setup dispatch and selectors
- [ ] Create fetch function
- [ ] Call fetch on mount with useEffect
- [ ] Dispatch setLoading(true) before fetch
- [ ] Dispatch setItems() on success
- [ ] Dispatch setError() on failure
- [ ] Render loading state
- [ ] Render error state
- [ ] Render data from Redux
- [ ] Test all states
- [ ] Test offline mode

---

## USEFUL COMMANDS

### Check Redux State (DevTools)
```typescript
// In browser console
store.getState()
```

### Dispatch Action Manually
```typescript
// In browser console
store.dispatch(setLoading(true))
```

### Subscribe to State Changes
```typescript
store.subscribe(() => {
  console.log('State changed:', store.getState());
});
```

---

## REFERENCE FILES

- **HomeScreen**: `mobile/src/screens/HomeScreen.tsx` (✅ Complete example)
- **Redux Store**: `mobile/src/store/store.ts`
- **Slices**: `mobile/src/store/slices/`
- **API Service**: `mobile/src/services/apiService.ts`
- **Types**: `mobile/src/types/index.ts`

---

## QUICK LINKS

- 📖 Full Guide: `HOMESCREEN_REDUX_IMPLEMENTATION_COMPLETE.md`
- 📋 Remaining Screens: `REMAINING_SCREENS_REDUX_GUIDE.md`
- ✅ Task Summary: `TASK_COMPLETION_SUMMARY.md`

---

**Need help? Check HomeScreen.tsx for a complete working example!**

