# API Integration Guide - Phase 1

## Overview

This guide walks through integrating the mobile app with the backend API. We've created a centralized API service layer that handles all HTTP communication.

## ✅ What's Been Done

### 1. API Service Layer Created
**File**: `mobile/src/services/apiService.ts` (400+ lines)

**Features**:
- Centralized HTTP client using axios
- Automatic token management
- Request/response interceptors
- Error handling with custom ApiError class
- Token refresh logic
- All 50+ API endpoints wrapped as methods

**Key Methods**:
```typescript
// Authentication
apiService.sendVerification(email)
apiService.verifyEmail(email, code)
apiService.joinOrganization(email, code, firstName, lastName)
apiService.logout()

// Users
apiService.getUserProfile()
apiService.updateUserProfile(data)

// Check-Ins
apiService.submitCheckIn(data)
apiService.getCheckInHistory(params)

// Alerts
apiService.getAlerts(params)
apiService.broadcastAlert(data)

// Contacts
apiService.getContacts(params)
apiService.createContact(data)
apiService.deleteContact(id)

// Knowledge Base
apiService.getGuides(params)
apiService.getGuideById(id)

// To-Go Bag
apiService.getToBagItems()
apiService.createToBagItem(data)
apiService.deleteToBagItem(id)

// And many more...
```

### 2. HomeScreen Connected to Backend
**File**: `mobile/src/screens/HomeScreen.tsx` (Updated)

**Changes**:
- Added loading state
- Added error handling
- Fetches check-in history on mount
- Fetches alerts on mount
- Shows loading spinner while fetching
- Shows error banner if request fails
- Displays real data from backend

**Code Example**:
```typescript
useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch check-ins
      const checkInsResponse = await apiService.getCheckInHistory({ pageSize: 10 });
      if (checkInsResponse.success && checkInsResponse.data.length > 0) {
        setLastCheckIn(checkInsResponse.data[0]);
      }

      // Fetch alerts
      const alertsResponse = await apiService.getAlerts({ pageSize: 5 });
      if (alertsResponse.success) {
        // Update Redux with alerts
      }
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, []);
```

## 🔄 How to Connect Other Screens

### Pattern to Follow

Each screen should follow this pattern:

```typescript
import apiService, { ApiError } from '../services/apiService';

const MyScreen: React.FC<MyScreenProps> = ({ navigation }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Call API
        const response = await apiService.getEndpoint(params);
        
        if (response.success) {
          setData(response.data);
        }
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError.message || 'Failed to load data');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Show loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary.teal} />
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={() => fetchData()}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Show data
  return (
    <View>
      {/* Render data */}
    </View>
  );
};
```

## 📋 Screens to Connect (Next Steps)

### 1. CheckInScreen
**Current**: Mock data
**API Endpoint**: `POST /api/check-ins`
**What to do**:
```typescript
const handleSubmit = async () => {
  try {
    setIsSubmitting(true);
    const response = await apiService.submitCheckIn({
      status,
      notes,
      location,
    });
    
    if (response.success) {
      Alert.alert('Success', 'Check-in submitted');
      navigation.goBack();
    }
  } catch (err) {
    Alert.alert('Error', 'Failed to submit check-in');
  } finally {
    setIsSubmitting(false);
  }
};
```

### 2. KnowledgeBaseScreen
**Current**: Mock data
**API Endpoint**: `GET /api/kb/guides`
**What to do**:
```typescript
useEffect(() => {
  const fetchGuides = async () => {
    try {
      const response = await apiService.getGuides({
        search: searchQuery,
        category: selectedCategory,
        pageSize: 20,
      });
      
      if (response.success) {
        setFilteredGuides(response.data);
      }
    } catch (err) {
      setError('Failed to load guides');
    }
  };

  fetchGuides();
}, [searchQuery, selectedCategory]);
```

### 3. ContactsScreen
**Current**: Mock data
**API Endpoints**: 
- `GET /api/contacts` - Get all contacts
- `POST /api/contacts` - Add contact
- `DELETE /api/contacts/:id` - Delete contact

**What to do**:
```typescript
const handleAddContact = async () => {
  try {
    const response = await apiService.createContact(newContact);
    if (response.success) {
      // Refresh contacts list
      const contactsResponse = await apiService.getContacts();
      setContacts(contactsResponse.data);
    }
  } catch (err) {
    Alert.alert('Error', 'Failed to add contact');
  }
};
```

### 4. ToBagScreen
**Current**: Mock data
**API Endpoints**:
- `GET /api/tobag` - Get items
- `POST /api/tobag` - Add item
- `DELETE /api/tobag/:id` - Delete item

**What to do**:
```typescript
useEffect(() => {
  const fetchItems = async () => {
    try {
      const response = await apiService.getToBagItems();
      if (response.success) {
        setItems(response.data);
      }
    } catch (err) {
      setError('Failed to load items');
    }
  };

  fetchItems();
}, []);
```

### 5. AlertsScreen
**Current**: Mock data
**API Endpoint**: `GET /api/alerts`
**What to do**:
```typescript
useEffect(() => {
  const fetchAlerts = async () => {
    try {
      const response = await apiService.getAlerts({ pageSize: 50 });
      if (response.success) {
        setAlerts(response.data);
      }
    } catch (err) {
      setError('Failed to load alerts');
    }
  };

  fetchAlerts();
}, []);
```

### 6. SettingsScreen
**Current**: Mock data
**API Endpoints**:
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `POST /api/auth/logout` - Logout

**What to do**:
```typescript
useEffect(() => {
  const fetchProfile = async () => {
    try {
      const response = await apiService.getUserProfile();
      if (response.success) {
        setUser(response.data);
      }
    } catch (err) {
      setError('Failed to load profile');
    }
  };

  fetchProfile();
}, []);

const handleLogout = async () => {
  try {
    await apiService.logout();
    await apiService.clearToken();
    // Navigate to login
  } catch (err) {
    Alert.alert('Error', 'Failed to logout');
  }
};
```

## 🔐 Authentication

### Token Management

The API service automatically handles tokens:

1. **Storing Token**:
```typescript
// After login
const response = await apiService.verifyEmail(email, code);
if (response.success && response.data?.token) {
  await apiService.setToken(response.data.token);
}
```

2. **Automatic Token Injection**:
```typescript
// Token is automatically added to all requests
// No need to manually add Authorization header
```

3. **Token Refresh**:
```typescript
// Automatically refreshes token if it expires
// No action needed from screens
```

4. **Logout**:
```typescript
await apiService.logout();
await apiService.clearToken();
```

## 🚨 Error Handling

### ApiError Class

```typescript
try {
  const response = await apiService.getContacts();
} catch (err) {
  const apiError = err as ApiError;
  
  console.log(apiError.code);        // 'VALIDATION_ERROR'
  console.log(apiError.statusCode);  // 400
  console.log(apiError.message);     // 'Invalid email'
  console.log(apiError.originalError); // Original axios error
}
```

### Common Error Codes

- `VALIDATION_ERROR` (400) - Invalid input
- `UNAUTHORIZED` (401) - Not authenticated
- `FORBIDDEN` (403) - Not authorized
- `NOT_FOUND` (404) - Resource not found
- `CONFLICT` (409) - Resource already exists
- `SERVER_ERROR` (500) - Server error
- `UNKNOWN_ERROR` - Network or unknown error

## 📊 API Response Format

### Success Response
```typescript
{
  success: true,
  data: { /* actual data */ },
  statusCode: 200
}
```

### Error Response
```typescript
{
  success: false,
  error: {
    code: 'VALIDATION_ERROR',
    message: 'Invalid email format'
  },
  statusCode: 400
}
```

### Paginated Response
```typescript
{
  success: true,
  data: [ /* array of items */ ],
  pagination: {
    page: 1,
    pageSize: 20,
    total: 100,
    totalPages: 5
  },
  statusCode: 200
}
```

## 🧪 Testing the API

### Manual Testing

1. **Start Backend**:
```bash
cd backend
npm run dev
```

2. **Test API Endpoint**:
```bash
curl -X GET http://localhost:3000/api/check-ins/history \
  -H "Authorization: Bearer YOUR_TOKEN"
```

3. **Check Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "123",
      "status": "safe",
      "notes": "All good",
      "createdAt": "2026-05-26T10:00:00Z"
    }
  ],
  "statusCode": 200
}
```

## 📝 Implementation Checklist

- [x] API Service Layer created
- [x] HomeScreen connected to backend
- [ ] CheckInScreen connected
- [ ] KnowledgeBaseScreen connected
- [ ] ContactsScreen connected
- [ ] ToBagScreen connected
- [ ] AlertsScreen connected
- [ ] SettingsScreen connected
- [ ] Error handling tested
- [ ] Loading states tested
- [ ] Token refresh tested
- [ ] Logout tested

## 🚀 Next Steps

1. **Connect CheckInScreen** (1-2 hours)
   - Add API call to submit check-in
   - Add loading state
   - Add error handling

2. **Connect KnowledgeBaseScreen** (1-2 hours)
   - Add API call to fetch guides
   - Add search functionality
   - Add filtering

3. **Connect ContactsScreen** (1-2 hours)
   - Add API calls for CRUD operations
   - Add loading states
   - Add error handling

4. **Connect ToBagScreen** (1-2 hours)
   - Add API calls for CRUD operations
   - Add loading states
   - Add error handling

5. **Connect AlertsScreen** (1 hour)
   - Add API call to fetch alerts
   - Add filtering
   - Add loading states

6. **Connect SettingsScreen** (1-2 hours)
   - Add API call to fetch profile
   - Add API call to update profile
   - Add logout functionality

**Total Estimated Time**: 6-10 hours

## 📚 Resources

- **API Documentation**: `docs/API.md`
- **Backend Routes**: `backend/src/routes/`
- **API Service**: `mobile/src/services/apiService.ts`
- **Example Screen**: `mobile/src/screens/HomeScreen.tsx`

## 💡 Tips

1. **Always handle errors** - Users need to know what went wrong
2. **Show loading states** - Users need to know something is happening
3. **Test with real data** - Mock data doesn't catch real issues
4. **Use Redux** - Store data in Redux for consistency
5. **Implement retry logic** - Network requests can fail
6. **Cache responses** - Reduce API calls and improve performance

---

**Status**: ✅ API Service Ready
**Next**: Connect remaining screens
**Estimated Time**: 6-10 hours
