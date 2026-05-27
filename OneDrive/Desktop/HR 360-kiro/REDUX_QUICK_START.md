# Redux Quick Start Guide

**For**: Developers integrating with HR 360 Redux  
**Date**: May 27, 2026  
**Status**: Complete

---

## 🚀 QUICK START

### 1. Import Redux Hooks
```typescript
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
```

### 2. Setup Component
```typescript
const MyComponent: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const data = useSelector((state: RootState) => state.slice.items);
  const loading = useSelector((state: RootState) => state.slice.loading);
  const error = useSelector((state: RootState) => state.slice.error);
```

### 3. Fetch Data on Mount
```typescript
useEffect(() => {
  dispatch(setLoading(true));
  apiService.getData()
    .then(res => {
      if (res.success) dispatch(setItems(res.data));
      else dispatch(setError('Failed'));
    })
    .catch(err => dispatch(setError(err.message)));
}, [dispatch]);
```

### 4. Render with States
```typescript
{loading ? (
  <Loading />
) : error ? (
  <Error message={error} />
) : (
  <Content data={data} />
)}
```

---

## 📦 AVAILABLE REDUX SLICES

### Mobile & Web
- **authSlice** - User authentication
- **checkinSlice** - Check-in data
- **alertSlice** (mobile) / **alertSlice** (web) - Alert data
- **kbSlice** - Knowledge base data

### Web Only
- **incidentSlice** - Incident data

---

## 🎯 COMMON PATTERNS

### Pattern 1: Fetch List
```typescript
useEffect(() => {
  dispatch(setLoading(true));
  apiService.getItems()
    .then(res => {
      if (res.success) dispatch(setItems(res.data));
      else dispatch(setError('Failed to load'));
    })
    .catch(err => dispatch(setError(err.message)));
}, [dispatch]);
```

### Pattern 2: Create Item
```typescript
const handleCreate = async (formData) => {
  dispatch(setLoading(true));
  try {
    const res = await apiService.createItem(formData);
    if (res.success) {
      dispatch(addItem(res.data));
      toast.success('Created!');
    } else {
      dispatch(setError(res.error?.message));
    }
  } catch (err) {
    dispatch(setError((err as any).message));
  }
};
```

### Pattern 3: Update Item
```typescript
const handleUpdate = async (id, formData) => {
  dispatch(setLoading(true));
  try {
    const res = await apiService.updateItem(id, formData);
    if (res.success) {
      dispatch(updateItem(res.data));
      toast.success('Updated!');
    } else {
      dispatch(setError(res.error?.message));
    }
  } catch (err) {
    dispatch(setError((err as any).message));
  }
};
```

### Pattern 4: Delete Item
```typescript
const handleDelete = async (id) => {
  dispatch(setLoading(true));
  try {
    const res = await apiService.deleteItem(id);
    if (res.success) {
      dispatch(deleteItem(id));
      toast.success('Deleted!');
    } else {
      dispatch(setError(res.error?.message));
    }
  } catch (err) {
    dispatch(setError((err as any).message));
  }
};
```

### Pattern 5: WebSocket Updates
```typescript
useEffect(() => {
  const unsubscribe = websocketService.on('item:created', (data) => {
    dispatch(addItem(data));
  });
  return () => unsubscribe();
}, [dispatch]);
```

---

## 🔍 REDUX SLICE STRUCTURE

### State
```typescript
{
  items: T[],           // Main data array
  [specific]: T[],      // Specific filtered data
  loading: boolean,     // Loading state
  error: string | null  // Error message
}
```

### Actions
```typescript
setLoading(boolean)     // Set loading state
setError(string | null) // Set error message
setItems(T[])          // Set items array
add*(T)                // Add single item
update*(T)             // Update single item
delete*(id)            // Delete single item
```

---

## 📋 CHECKLIST FOR NEW PAGES

- [ ] Import useSelector, useDispatch
- [ ] Import RootState, AppDispatch
- [ ] Import slice actions
- [ ] Setup dispatch and selectors
- [ ] Add useEffect for data fetch
- [ ] Handle loading state
- [ ] Handle error state
- [ ] Display data from Redux
- [ ] Add form handlers if needed
- [ ] Dispatch actions on form submit
- [ ] Test in Redux DevTools
- [ ] Verify TypeScript compilation

---

## 🐛 DEBUGGING

### Redux DevTools
1. Install Redux DevTools browser extension
2. Open DevTools → Redux tab
3. See all actions dispatched
4. See state changes
5. Time-travel debug

### Common Issues

**Issue**: Data not updating  
**Solution**: Check if dispatch is in dependency array

**Issue**: Loading state stuck  
**Solution**: Make sure to dispatch setLoading(false) after fetch

**Issue**: Error not showing  
**Solution**: Check if error selector is used in render

**Issue**: TypeScript errors  
**Solution**: Use RootState and AppDispatch types

---

## 📚 EXAMPLE IMPLEMENTATIONS

### Mobile: HomeScreen
```typescript
// Location: mobile/src/screens/HomeScreen.tsx
// Redux Slices: checkin, alerts
// Pattern: Fetch on mount, WebSocket updates
```

### Web: Dashboard
```typescript
// Location: web/src/pages/Dashboard.tsx
// Redux Slices: alert, checkin
// Pattern: Fetch on mount, WebSocket updates
```

### Web: AlertManagement
```typescript
// Location: web/src/pages/AlertManagement.tsx
// Redux Slices: alert
// Pattern: Fetch on mount, Create/Update/Delete
```

---

## 🔗 USEFUL LINKS

- Redux Documentation: https://redux.js.org/
- React-Redux Hooks: https://react-redux.js.org/api/hooks
- Redux Toolkit: https://redux-toolkit.js.org/
- Redux DevTools: https://github.com/reduxjs/redux-devtools

---

## ✅ VERIFICATION

After implementing Redux integration:

1. **TypeScript Compilation**
   ```bash
   npm run build
   ```
   Should show 0 errors

2. **Redux DevTools**
   - Open Redux DevTools
   - Verify actions are dispatched
   - Verify state updates correctly

3. **Browser Console**
   - No TypeScript errors
   - No Redux warnings
   - No console errors

4. **Functionality**
   - Data loads on mount
   - Loading state shows
   - Error state shows
   - Data displays correctly
   - Forms submit correctly

---

## 🎯 BEST PRACTICES

1. **Always use dispatch in dependency array**
   ```typescript
   useEffect(() => { ... }, [dispatch]);
   ```

2. **Always handle loading and error states**
   ```typescript
   {loading ? <Loading /> : error ? <Error /> : <Content />}
   ```

3. **Use TypeScript types**
   ```typescript
   const dispatch = useDispatch<AppDispatch>();
   const state = useSelector((state: RootState) => state.slice);
   ```

4. **Dispatch actions consistently**
   ```typescript
   dispatch(setLoading(true));
   // ... fetch data ...
   dispatch(setItems(data));
   dispatch(setLoading(false));
   ```

5. **Handle errors gracefully**
   ```typescript
   .catch(err => dispatch(setError(err.message)));
   ```

---

## 🚀 READY TO GO!

You now have everything you need to:
- ✅ Use Redux in any component
- ✅ Fetch data from API
- ✅ Handle loading/error states
- ✅ Create/Update/Delete items
- ✅ Integrate WebSocket updates
- ✅ Debug with Redux DevTools

**Happy coding!** 🎉
