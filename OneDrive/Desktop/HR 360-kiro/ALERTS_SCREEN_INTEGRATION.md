# AlertsScreen API Integration

## Overview
The AlertsScreen is now fully integrated with the backend API for viewing emergency alerts. Users can fetch, filter, and view alert details with real-time updates.

## Features Implemented

### 1. Fetch Alerts
- **Endpoint**: `GET /api/alerts`
- **Trigger**: On screen mount and pull-to-refresh
- **State Management**:
  - `alerts` - Stores fetched alerts
  - `loading` - Shows spinner during fetch
  - `error` - Shows error banner if fetch fails
  - `refreshing` - Handles pull-to-refresh

### 2. Filter Alerts
- **Filter Options**:
  - All - Show all alerts
  - Unread - Show only unread alerts
  - Read - Show only read alerts
- **Type**: Client-side filtering
- **UI**: Tab-based filter interface

### 3. View Alert Details
- **Trigger**: Tap on alert card
- **Modal Display**: Bottom sheet modal
- **Information Shown**:
  - Alert title
  - Severity level
  - Full message
  - Timestamp
  - Action button (if available)

### 4. Severity Indicators
- **Critical**: Red (#EF4444) - 🚨
- **High**: Orange (#F59E0B) - ⚠️
- **Medium**: Teal (#038F8D) - ℹ️
- **Low**: Green (#10B981) - ✓

### 5. Unread Indicators
- **Visual**: Blue dot on unread alerts
- **Styling**: Unread alerts have light background

## Code Structure

```typescript
// State Management
const [alerts, setAlerts] = useState<any[]>([]);
const [selectedAlert, setSelectedAlert] = useState<any>(null);
const [filterStatus, setFilterStatus] = useState<'all' | 'unread' | 'read'>('all');
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [refreshing, setRefreshing] = useState(false);

// Fetch on Mount
useEffect(() => {
  fetchAlerts();
}, []);

// Fetch Function
const fetchAlerts = async () => {
  try {
    setLoading(true);
    setError(null);

    const response = await apiService.getAlerts({ pageSize: 100 });

    if (response.success) {
      setAlerts(response.data);
    } else {
      setError(response.error?.message || 'Failed to load alerts');
    }
  } catch (err) {
    const apiError = err as ApiError;
    setError(apiError.message || 'Failed to load alerts');
    console.error('Error fetching alerts:', err);
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
};

// Handle Refresh
const handleRefresh = () => {
  setRefreshing(true);
  fetchAlerts();
};

// Filter Alerts
const filteredAlerts = alerts.filter((alert) => {
  if (filterStatus === 'unread') return !alert.read;
  if (filterStatus === 'read') return alert.read;
  return true;
});

// Handle Alert Press
const handleAlertPress = (alert: any) => {
  setSelectedAlert(alert);
};

// Get Severity Color
const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'critical':
      return colors.error;
    case 'high':
      return colors.warning;
    case 'medium':
      return colors.primary.teal;
    case 'low':
      return colors.success;
    default:
      return colors.neutral[400];
  }
};

// Get Severity Icon
const getSeverityIcon = (severity: string) => {
  switch (severity) {
    case 'critical':
      return '🚨';
    case 'high':
      return '⚠️';
    case 'medium':
      return 'ℹ️';
    case 'low':
      return '✓';
    default:
      return '📢';
  }
};
```

## UI Components

### Header
- Title: "Emergency Alerts"
- Subtitle: Shows alert count
- Background: Teal color

### Filter Tabs
- All - Shows all alerts
- Unread - Shows unread alerts only
- Read - Shows read alerts only
- Active tab: Underlined in teal

### Alert Card
- Severity indicator (colored box with icon)
- Alert title
- Alert message (2 lines max)
- Timestamp
- Unread indicator (blue dot)
- Tap to view details

### Alert Detail Modal
- Close button (✕)
- Header with severity color and icon
- Alert title
- Severity level
- Full message
- Timestamp
- Action button (if available)

### Empty State
- Icon: 📭
- Title: "No alerts"
- Message: "You're all caught up! No new alerts at this time."

### Error Banner
- Red background
- Error message
- Retry button

### Loading State
- Spinner
- "Loading alerts..." text

## API Integration

### Request/Response Format

**Fetch Alerts**
```typescript
const response = await apiService.getAlerts({ pageSize: 100 });
// Response: { success: true, data: Alert[], pagination: {...} }
```

**Alert Object Structure**
```typescript
interface Alert {
  id: string;
  title: string;
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}
```

## Severity Levels

| Level | Color | Icon | Use Case |
|-------|-------|------|----------|
| Critical | Red | 🚨 | Immediate danger, life-threatening |
| High | Orange | ⚠️ | Urgent, requires immediate action |
| Medium | Teal | ℹ️ | Important, should be addressed soon |
| Low | Green | ✓ | Informational, for awareness |

## Error Handling

- Network errors show error banner with retry button
- API errors show user-friendly messages
- Errors don't expose sensitive information
- Graceful degradation if alerts unavailable

## Testing

### Manual Testing Steps

1. **Load Alerts**
   - Open AlertsScreen
   - Verify loading spinner appears
   - Verify alerts load from backend
   - Verify error banner appears if network fails

2. **Filter Alerts**
   - Click "All" tab
   - Verify all alerts display
   - Click "Unread" tab
   - Verify only unread alerts display
   - Click "Read" tab
   - Verify only read alerts display

3. **View Alert Details**
   - Tap on alert card
   - Verify modal opens
   - Verify alert details display correctly
   - Verify severity color matches
   - Verify timestamp displays
   - Close modal

4. **Severity Indicators**
   - Verify critical alerts show red
   - Verify high alerts show orange
   - Verify medium alerts show teal
   - Verify low alerts show green

5. **Unread Indicators**
   - Verify unread alerts have blue dot
   - Verify unread alerts have light background
   - Verify read alerts don't have dot

6. **Pull-to-Refresh**
   - Pull down on alerts list
   - Verify refresh spinner
   - Verify list updates

7. **Empty State**
   - Clear all alerts from backend
   - Verify empty state displays
   - Verify message is helpful

## Performance Considerations

- Pagination: Fetches up to 100 alerts per request
- Filtering: Client-side filtering (no API call)
- Caching: Alerts stored in state
- Optimization: Only re-render on data change

## Security

- Token automatically added to requests
- Error messages don't expose sensitive info
- No sensitive data in alert messages
- HTTPS ready (when deployed)

## Future Enhancements

1. **Mark as Read** - Mark individual alerts as read
2. **Dismiss Alert** - Remove alert from view
3. **Archive Alerts** - Archive old alerts
4. **Search Alerts** - Search alert history
5. **Alert History** - View past alerts
6. **Notifications** - Push notifications for new alerts
7. **Alert Actions** - Take action from alert detail
8. **Bulk Actions** - Mark multiple as read
9. **Alert Preferences** - Filter by severity
10. **Export Alerts** - Export alert history

## Files Modified

- `mobile/src/screens/AlertsScreen.tsx` - Full API integration

## Status

✅ **COMPLETE** - AlertsScreen is fully integrated with the backend API and ready for testing.

