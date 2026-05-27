# Web Redux Integration Guide

**Objective**: Connect all 8 web pages to Redux for consistent state management  
**Estimated Time**: 4-5 hours  
**Difficulty**: Medium

---

## CURRENT STATE

### Web Pages (8 total):
1. **Dashboard** - Main console view
2. **AlertManagement** - Broadcast and manage alerts
3. **IncidentManagement** - Manage incidents
4. **LoginPage** - User authentication
5. **AdminConsole** - Admin settings
6. **EmployeeApp** - Employee dashboard
7. **MobileAlerts** - Mobile alerts view
8. **MobileCheckIn** - Mobile check-in view

### Redux Slices (4 total):
- ✅ authSlice - User authentication (updated)
- ✅ alertSlice - Alert data (updated)
- ✅ checkinSlice - Check-in data (updated)
- ✅ kbSlice - Knowledge base data (updated)

---

## REDUX INTEGRATION PATTERN FOR WEB

All web pages follow this pattern:

```typescript
// 1. Setup
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { setLoading, setError, setItems } from '../store/slices/[sliceName]Slice';

const dispatch = useDispatch<AppDispatch>();
const data = useSelector((state: RootState) => state.slice.items);
const loading = useSelector((state: RootState) => state.slice.loading);
const error = useSelector((state: RootState) => state.slice.error);

// 2. Fetch on mount
useEffect(() => {
  fetchData();
}, []);

// 3. Dispatch actions
const fetchData = async () => {
  dispatch(setLoading(true));
  try {
    const response = await apiService.getData();
    if (response.success && response.data) {
      dispatch(setItems(response.data));
    } else {
      dispatch(setError('Failed to load data'));
    }
  } catch (err) {
    dispatch(setError((err as ApiError).message || 'Failed to load data'));
  }
};

// 4. Render
{loading ? <Loading /> : error ? <Error /> : <Content data={data} />}
```

---

## WEB PAGES IMPLEMENTATION PLAN

### 1. LoginPage ✅ (Already using Redux)
- **Status**: Already integrated
- **Redux Slices**: authSlice
- **Features**: Email/password login, dispatch loginSuccess
- **No changes needed**

### 2. Dashboard (Priority 1)
- **Redux Slices**: alert, checkin
- **Features**: Real-time incident status, check-ins, alerts
- **Implementation**:
  - Fetch alerts on mount
  - Fetch check-ins on mount
  - Subscribe to WebSocket updates
  - Dispatch to Redux on updates
  - Display from Redux

### 3. AlertManagement (Priority 1)
- **Redux Slices**: alert
- **Features**: Broadcast alerts, manage alerts
- **Implementation**:
  - Fetch alerts on mount
  - Dispatch setItems() on success
  - Add new alerts via dispatch
  - Update alerts via dispatch
  - Delete alerts via dispatch

### 4. IncidentManagement (Priority 2)
- **Redux Slices**: Need to create incidentSlice
- **Features**: Manage incidents, track status
- **Implementation**:
  - Create incidentSlice
  - Fetch incidents on mount
  - Dispatch to Redux
  - Display from Redux

### 5. AdminConsole (Priority 2)
- **Redux Slices**: auth, kb
- **Features**: Admin settings, manage users, manage KB
- **Implementation**:
  - Fetch users on mount
  - Fetch KB guides on mount
  - Dispatch to Redux
  - Display from Redux

### 6. EmployeeApp (Priority 2)
- **Redux Slices**: checkin, alert, kb
- **Features**: Employee dashboard, check-ins, alerts, KB
- **Implementation**:
  - Fetch check-ins on mount
  - Fetch alerts on mount
  - Fetch KB guides on mount
  - Dispatch to Redux
  - Display from Redux

### 7. MobileAlerts (Priority 3)
- **Redux Slices**: alert
- **Features**: Mobile alerts view
- **Implementation**:
  - Fetch alerts on mount
  - Dispatch to Redux
  - Display from Redux

### 8. MobileCheckIn (Priority 3)
- **Redux Slices**: checkin
- **Features**: Mobile check-in view
- **Implementation**:
  - Fetch check-ins on mount
  - Dispatch to Redux
  - Display from Redux

---

## IMPLEMENTATION ORDER

### Phase 1: Core Pages (2-3 hours)
1. Dashboard - Real-time data
2. AlertManagement - Alert management
3. LoginPage - Already done

### Phase 2: Admin Pages (1-2 hours)
1. AdminConsole - Admin settings
2. IncidentManagement - Incident management

### Phase 3: Employee Pages (1 hour)
1. EmployeeApp - Employee dashboard
2. MobileAlerts - Mobile alerts
3. MobileCheckIn - Mobile check-in

---

## REDUX SLICES READY

### authSlice ✅
```typescript
State: {
  user: User | null,
  isAuthenticated: boolean,
  loading: boolean,
  error: string | null,
  token: string | null
}

Actions: setLoading, setError, loginSuccess, logout, updateUser
```

### alertSlice ✅
```typescript
State: {
  items: Alert[],
  alerts: Alert[],
  activeAlerts: Alert[],
  loading: boolean,
  error: string | null
}

Actions: setLoading, setError, setItems, setAlerts, addAlert, updateAlert, deleteAlert
```

### checkinSlice ✅
```typescript
State: {
  items: CheckIn[],
  checkIns: CheckIn[],
  lastCheckIn: CheckIn | null,
  loading: boolean,
  error: string | null
}

Actions: setLoading, setError, setItems, setCheckIns, addCheckIn, updateCheckInSyncStatus
```

### kbSlice ✅
```typescript
State: {
  items: KBGuide[],
  guides: KBGuide[],
  selectedGuide: KBGuide | null,
  loading: boolean,
  error: string | null,
  searchQuery: string
}

Actions: setLoading, setError, setItems, setGuides, addGuide, updateGuide, deleteGuide, selectGuide, setSearchQuery
```

---

## COMMON PATTERNS

### Pattern 1: Simple Data Fetch
```typescript
useEffect(() => {
  dispatch(setLoading(true));
  apiService.getData().then(res => {
    if (res.success) dispatch(setItems(res.data));
    else dispatch(setError('Failed'));
  });
}, []);
```

### Pattern 2: Form Submission
```typescript
const handleSubmit = async (formData) => {
  dispatch(setLoading(true));
  const res = await apiService.createItem(formData);
  if (res.success) {
    dispatch(addAlert(res.data));
    toast.success('Created successfully');
  } else {
    dispatch(setError(res.error?.message));
  }
};
```

### Pattern 3: Real-time Updates
```typescript
useEffect(() => {
  const unsubscribe = websocketService.on('alert:created', (data) => {
    dispatch(addAlert(data));
  });
  return () => unsubscribe();
}, []);
```

---

## TESTING CHECKLIST

For each page, test:
- [ ] Page loads without errors
- [ ] Redux selectors work
- [ ] Data fetches on mount
- [ ] Loading state shows
- [ ] Error state shows
- [ ] Data displays correctly
- [ ] User interactions work
- [ ] Redux state updates correctly
- [ ] WebSocket updates work (if applicable)

---

## NEXT STEPS

1. Start with Dashboard (most complex)
2. Then AlertManagement
3. Then AdminConsole
4. Then IncidentManagement
5. Then EmployeeApp
6. Then MobileAlerts and MobileCheckIn

---

**Ready to implement? Start with Dashboard!**

