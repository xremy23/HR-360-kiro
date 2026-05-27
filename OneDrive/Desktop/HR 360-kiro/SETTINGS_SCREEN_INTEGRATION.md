# SettingsScreen API Integration

## Overview
The SettingsScreen is now fully integrated with the backend API for managing user profile and account settings. Users can view their profile information and logout with proper error handling.

## Features Implemented

### 1. Fetch User Profile
- **Endpoint**: `GET /api/users/profile`
- **Trigger**: On screen mount
- **State Management**:
  - `user` - Stores user profile data
  - `loading` - Shows spinner during fetch
  - `error` - Shows error banner if fetch fails
- **Information Displayed**:
  - First name
  - Last name
  - Email
  - Organization

### 2. Logout
- **Endpoint**: `POST /api/auth/logout`
- **Confirmation**: Alert dialog before logout
- **Process**:
  1. Show confirmation dialog
  2. Call logout API
  3. Clear stored token
  4. Show success/error alert
  5. Navigate to login (future implementation)
- **Feedback**:
  - Loading spinner during logout
  - Success alert on completion
  - Error alert on failure

### 3. Settings Management
- **Notifications**: Toggle push notifications
- **Location Tracking**: Toggle location sharing
- **Biometric**: Toggle biometric authentication
- **Language**: Select language preference
- **Theme**: Select theme preference
- **Note**: These are UI toggles (backend integration can be added later)

### 4. Data Management
- **Clear Cache**: Clear cached data
- **Storage Usage**: Display storage usage
- **Note**: These are placeholder features

### 5. About Section
- **App Version**: Display version number
- **Privacy Policy**: Link to privacy policy
- **Terms of Service**: Link to terms

## Code Structure

```typescript
// State Management
const [user, setUser] = useState<any>(null);
const [notifications, setNotifications] = useState(true);
const [locationTracking, setLocationTracking] = useState(false);
const [biometricEnabled, setBiometricEnabled] = useState(false);
const [language, setLanguage] = useState('en');
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [isLoggingOut, setIsLoggingOut] = useState(false);

// Fetch User Profile on Mount
useEffect(() => {
  fetchUserProfile();
}, []);

// Fetch User Profile Function
const fetchUserProfile = async () => {
  try {
    setLoading(true);
    setError(null);

    const response = await apiService.getUserProfile();

    if (response.success) {
      setUser(response.data);
    } else {
      setError(response.error?.message || 'Failed to load profile');
    }
  } catch (err) {
    const apiError = err as ApiError;
    setError(apiError.message || 'Failed to load profile');
    console.error('Error fetching profile:', err);
  } finally {
    setLoading(false);
  }
};

// Logout Function
const handleLogout = () => {
  Alert.alert('Logout', 'Are you sure you want to logout?', [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Logout',
      style: 'destructive',
      onPress: async () => {
        setIsLoggingOut(true);

        try {
          const response = await apiService.logout();

          if (response.success) {
            // Clear token and navigate to login
            await apiService.clearToken();
            // TODO: Dispatch logout action to Redux
            // dispatch(logout());
            // navigation.replace('Login');
            Alert.alert('Success', 'Logged out successfully');
          } else {
            Alert.alert('Error', response.error?.message || 'Failed to logout');
          }
        } catch (err) {
          const apiError = err as ApiError;
          Alert.alert('Error', apiError.message || 'Failed to logout');
          console.error('Error logging out:', err);
        } finally {
          setIsLoggingOut(false);
        }
      },
    },
  ]);
};
```

## UI Components

### Header
- Title: "Settings"
- Background: Teal color

### Account Section
- Card with user information
- Name (first + last)
- Email
- Organization
- Dividers between fields

### Notifications Section
- Push Notifications toggle
- Description: "Receive emergency alerts and updates"

### Privacy & Security Section
- Location Tracking toggle
- Description: "Share location during emergencies"
- Biometric Authentication toggle
- Description: "Use fingerprint or face ID to unlock"

### Preferences Section
- Language selector
- Theme selector
- Tap to open options

### Data Section
- Clear Cache button
- Storage Usage display
- Tap to perform action

### About Section
- App Version display
- Privacy Policy link
- Terms of Service link

### Logout Button
- Red background
- Text: "Logout"
- Shows spinner during logout
- Disabled during logout

### Footer
- App name
- Version number

### Error Banner
- Red background
- Error message
- Retry button

### Loading State
- Spinner
- "Loading settings..." text

## API Integration

### Request/Response Format

**Fetch User Profile**
```typescript
const response = await apiService.getUserProfile();
// Response: { success: true, data: User }
```

**User Object Structure**
```typescript
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  organization?: string;
  role: 'admin' | 'hr' | 'manager' | 'employee';
  createdAt: string;
  updatedAt: string;
}
```

**Logout**
```typescript
const response = await apiService.logout();
// Response: { success: true }
```

## Error Handling

- Network errors show error banner with retry button
- API errors show user-friendly messages
- Logout errors show alert dialogs
- Errors don't expose sensitive information

## Testing

### Manual Testing Steps

1. **Load Profile**
   - Open SettingsScreen
   - Verify loading spinner appears
   - Verify user profile loads from backend
   - Verify user information displays correctly
   - Verify error banner appears if network fails

2. **Logout**
   - Click "Logout" button
   - Verify confirmation dialog appears
   - Click "Cancel"
   - Verify dialog closes
   - Click "Logout" again
   - Click "Logout" in confirmation
   - Verify loading spinner appears
   - Verify success alert appears
   - Verify token is cleared

3. **Settings Toggles**
   - Toggle notifications
   - Verify toggle state changes
   - Toggle location tracking
   - Verify toggle state changes
   - Toggle biometric
   - Verify toggle state changes

4. **Error Handling**
   - Disconnect network
   - Click retry on error banner
   - Verify error handling works
   - Reconnect network
   - Verify profile loads

## Performance Considerations

- Profile fetched once on mount
- Settings stored in local state
- No unnecessary API calls
- Logout clears token from storage

## Security

- Token automatically added to requests
- Token cleared on logout
- Error messages don't expose sensitive info
- Confirmation dialog prevents accidental logout
- HTTPS ready (when deployed)

## Future Enhancements

1. **Edit Profile** - Update user information
2. **Change Password** - Change account password
3. **Two-Factor Authentication** - Enable 2FA
4. **Session Management** - View active sessions
5. **Privacy Settings** - Granular privacy controls
6. **Notification Preferences** - Detailed notification settings
7. **Data Export** - Export user data
8. **Account Deletion** - Delete account
9. **Activity Log** - View account activity
10. **Device Management** - Manage connected devices

## Files Modified

- `mobile/src/screens/SettingsScreen.tsx` - Full API integration

## Status

✅ **COMPLETE** - SettingsScreen is fully integrated with the backend API and ready for testing.

