# Redux Architecture Diagram

**Purpose**: Visual representation of Redux integration in HR 360 mobile app  
**Reference**: HomeScreen implementation

---

## Redux Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERACTION                          │
│                    (Button Click, Form Submit)                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DISPATCH ACTION                             │
│                                                                   │
│  dispatch(setLoading(true))                                      │
│  dispatch(setItems(data))                                        │
│  dispatch(setError(message))                                     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    REDUX REDUCER                                 │
│                                                                   │
│  checkinSlice.ts                                                 │
│  ├── setLoading: state.loading = action.payload                 │
│  ├── setItems: state.items = action.payload                     │
│  └── setError: state.error = action.payload                     │
│                                                                   │
│  alertsSlice.ts                                                  │
│  ├── setLoading: state.loading = action.payload                 │
│  ├── setItems: state.items = action.payload                     │
│  └── setError: state.error = action.payload                     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    REDUX STORE                                   │
│                                                                   │
│  {                                                                │
│    auth: { user, token, loading, error },                        │
│    checkin: { items, loading, error },                           │
│    alerts: { items, loading, error },                            │
│    kb: { items, loading, error },                                │
│    offline: { isOnline, isSyncing, lastSyncTime }               │
│  }                                                                │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SELECTOR (useSelector)                        │
│                                                                   │
│  const items = useSelector(state => state.slice.items)          │
│  const loading = useSelector(state => state.slice.loading)      │
│  const error = useSelector(state => state.slice.error)          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    COMPONENT RE-RENDER                           │
│                                                                   │
│  {loading ? <Loading /> : error ? <Error /> : <List />}         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Redux Store Structure

```
Redux Store
│
├── auth (authSlice)
│   ├── user: User | null
│   ├── token: string | null
│   ├── loading: boolean
│   └── error: string | null
│
├── checkin (checkinSlice) ✅ UPDATED
│   ├── items: CheckIn[]
│   ├── currentCheckIn: CheckIn | null
│   ├── history: CheckInHistory[]
│   ├── teamCheckIns: { [userId]: CheckIn }
│   ├── loading: boolean
│   ├── error: string | null
│   └── lastCheckInTime: string | null
│
├── alerts (alertsSlice) ✅ UPDATED
│   ├── items: Alert[]
│   ├── alerts: Alert[]
│   ├── notifications: AlertNotification[]
│   ├── unreadCount: number
│   ├── loading: boolean
│   ├── error: string | null
│   └── selectedAlert: Alert | null
│
├── kb (kbSlice)
│   ├── items: KBGuide[]
│   ├── loading: boolean
│   ├── error: string | null
│   └── selectedGuide: KBGuide | null
│
└── offline (offlineSlice) ✅ ADDED TO STORE
    ├── isOnline: boolean
    ├── isSyncing: boolean
    ├── lastSyncTime: Date | null
    ├── pendingSyncCount: number
    ├── syncErrors: SyncError[]
    ├── conflictedItems: ConflictedItem[]
    ├── dataFreshness: { [entityType]: Date | null }
    └── offlineMode: { enabled, cacheSize, maxCacheAge }
```

---

## HomeScreen Redux Integration

```
HomeScreen Component
│
├── useDispatch() → dispatch
├── useSelector() → checkIns, checkInsLoading, checkInsError
├── useSelector() → alerts, alertsLoading, alertsError
├── useSelector() → isOffline
│
├── useEffect(() => {
│   fetchHomeData()
│ }, [])
│
├── fetchHomeData()
│   ├── dispatch(setCheckInLoading(true))
│   ├── apiService.getCheckInHistory()
│   ├── if success: dispatch(setCheckInItems(data))
│   ├── if error: dispatch(setCheckInError(message))
│   │
│   ├── dispatch(setAlertLoading(true))
│   ├── apiService.getAlerts()
│   ├── if success: dispatch(setAlertItems(data))
│   └── if error: dispatch(setAlertError(message))
│
└── Render
    ├── Header
    ├── Offline Banner (if isOffline)
    ├── Quick Actions
    ├── Last Check-In
    │   ├── if checkInsLoading: <Loading />
    │   ├── if checkInsError: <Error />
    │   └── if checkIns.length > 0: <CheckInCard />
    ├── Recent Alerts
    │   ├── if alertsLoading: <Loading />
    │   ├── if alertsError: <Error />
    │   └── if alerts.length > 0: <AlertCards />
    └── Resources
        ├── Knowledge Base
        ├── Contacts
        ├── To-Go Bag
        └── Settings
```

---

## Data Flow Example: Fetch Check-ins

```
1. Component Mount
   └─ useEffect(() => { fetchHomeData() }, [])

2. Dispatch Loading
   └─ dispatch(setCheckInLoading(true))
   └─ Redux State: { checkin: { loading: true } }

3. API Call
   └─ apiService.getCheckInHistory({ pageSize: 10 })
   └─ Network Request: GET /api/checkins?pageSize=10

4. API Response
   └─ { success: true, data: [...], pagination: {...} }

5. Dispatch Success
   └─ dispatch(setCheckInItems(response.data))
   └─ Redux State: { checkin: { items: [...], loading: false, error: null } }

6. Component Re-render
   └─ useSelector gets new items
   └─ Component re-renders with new data

7. Display Data
   └─ checkIns.map(item => <CheckInCard key={item.id} {...item} />)
```

---

## Redux Slice Pattern

```
Redux Slice (checkinSlice.ts)
│
├── State Interface
│   └── CheckInState { items, loading, error, ... }
│
├── Initial State
│   └── { items: [], loading: false, error: null, ... }
│
├── Reducers (Pure Functions)
│   ├── setLoading(state, action)
│   │   └─ state.loading = action.payload
│   ├── setError(state, action)
│   │   └─ state.error = action.payload
│   ├── setItems(state, action)
│   │   └─ state.items = action.payload
│   │   └─ state.loading = false
│   │   └─ state.error = null
│   └── ...
│
├── Actions (Exported)
│   ├── setLoading
│   ├── setError
│   ├── setItems
│   └── ...
│
└── Reducer (Default Export)
    └─ Combines all reducers
```

---

## Component Integration Pattern

```
Screen Component
│
├── 1. Import Redux
│   ├── import { useSelector, useDispatch } from 'react-redux'
│   ├── import { RootState, AppDispatch } from '../store/store'
│   └── import { setLoading, setError, setItems } from '../store/slices/...'
│
├── 2. Setup Hooks
│   ├── const dispatch = useDispatch<AppDispatch>()
│   ├── const data = useSelector((state: RootState) => state.slice.items)
│   ├── const loading = useSelector((state: RootState) => state.slice.loading)
│   └── const error = useSelector((state: RootState) => state.slice.error)
│
├── 3. Fetch on Mount
│   ├── useEffect(() => {
│   │   fetchData()
│   │ }, [])
│   │
│   └── const fetchData = async () => {
│       ├── dispatch(setLoading(true))
│       ├── const response = await apiService.getData()
│       ├── if (response.success) {
│       │   dispatch(setItems(response.data))
│       │ } else {
│       │   dispatch(setError(response.error?.message))
│       │ }
│       └── }
│
└── 4. Render
    ├── {loading ? <Loading /> : null}
    ├── {error ? <Error /> : null}
    └── {data.length > 0 ? <List /> : null}
```

---

## API Service Integration

```
Component
│
├── dispatch(setLoading(true))
│
├── apiService.getData()
│   │
│   ├── axios.get('/api/endpoint')
│   │   │
│   │   ├── Request Interceptor
│   │   │   └─ Add Authorization header
│   │   │
│   │   ├── Response Interceptor
│   │   │   ├─ Handle 401 (refresh token)
│   │   │   └─ Handle errors
│   │   │
│   │   └─ Return Response
│   │
│   └─ Return { success, data, error }
│
├── if (response.success)
│   └─ dispatch(setItems(response.data))
│
└─ if (!response.success)
   └─ dispatch(setError(response.error?.message))
```

---

## Offline Support Integration

```
Component
│
├── const isOffline = useSelector(
│   (state: RootState) => state.offline.isOnline === false
│ )
│
├── {isOffline && (
│   <View style={styles.offlineBanner}>
│     <Text>📡 You're offline. Data will sync when online.</Text>
│   </View>
│ )}
│
└── When Online:
    ├── Sync pending changes
    ├── Fetch fresh data
    ├── Update Redux state
    └── Show success message
```

---

## Error Handling Flow

```
API Call
│
├── Success
│   ├── dispatch(setLoading(false))
│   ├── dispatch(setItems(data))
│   ├── dispatch(setError(null))
│   └── Component displays data
│
└── Error
    ├── dispatch(setLoading(false))
    ├── dispatch(setError(message))
    ├── dispatch(setItems([]))
    └── Component displays error message
```

---

## Loading State Flow

```
Initial State
└─ { items: [], loading: false, error: null }

User Triggers Fetch
└─ dispatch(setLoading(true))
└─ { items: [], loading: true, error: null }
└─ Component shows <Loading />

API Response Received
├─ Success: dispatch(setItems(data))
│  └─ { items: [...], loading: false, error: null }
│  └─ Component shows <List />
│
└─ Error: dispatch(setError(message))
   └─ { items: [], loading: false, error: message }
   └─ Component shows <Error />
```

---

## Redux DevTools Integration

```
Redux DevTools (Browser Extension)
│
├── View Redux State
│   └─ See current state of all slices
│
├── Time Travel Debugging
│   ├─ Go back to previous state
│   ├─ Go forward to next state
│   └─ See what changed
│
├── Dispatch Actions
│   └─ Manually dispatch actions to test
│
├── Action History
│   ├─ See all dispatched actions
│   ├─ See action payloads
│   └─ See state changes
│
└── Performance
    ├─ See which actions are slow
    ├─ See which components re-render
    └─ Optimize performance
```

---

## Summary

This Redux architecture provides:
- ✅ Centralized state management
- ✅ Predictable data flow
- ✅ Easy debugging with DevTools
- ✅ Offline support built-in
- ✅ Error handling
- ✅ Loading states
- ✅ Type safety with TypeScript

All screens follow the same pattern for consistency and maintainability.

