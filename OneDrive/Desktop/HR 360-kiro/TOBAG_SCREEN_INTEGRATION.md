# ToBagScreen API Integration

## Overview
The ToBagScreen is now fully integrated with the backend API for managing emergency to-go bag items. Users can fetch, add, and delete items with real-time progress tracking.

## Features Implemented

### 1. Fetch To-Go Bag Items
- **Endpoint**: `GET /api/tobag`
- **Trigger**: On screen mount and pull-to-refresh
- **State Management**:
  - `items` - Stores fetched items
  - `loading` - Shows spinner during fetch
  - `error` - Shows error banner if fetch fails
  - `refreshing` - Handles pull-to-refresh

### 2. Add Item
- **Endpoint**: `POST /api/tobag`
- **Fields**:
  - Name (required)
  - Category (required): documents, medications, electronics, clothing, supplies, other
  - Priority (required): high, medium, low
- **Validation**:
  - Name must not be empty
  - Category must be selected
  - Priority must be selected
- **Feedback**:
  - Loading spinner during submission
  - Success alert on completion
  - Error alert on failure
  - Form reset after success
  - List refresh after success

### 3. Delete Item
- **Endpoint**: `DELETE /api/tobag/:id`
- **Confirmation**: Alert dialog before deletion
- **Feedback**:
  - Success alert on completion
  - Error alert on failure
  - List refresh after deletion

### 4. Track Completion
- **Type**: Client-side state management
- **Progress Bar**: Shows percentage of items packed
- **Completion Counter**: Shows "X of Y items packed"
- **Visual Feedback**: Progress bar color changes to green at 100%

### 5. Group Items by Category
- **Type**: Client-side grouping
- **Categories**: Dynamically extracted from items
- **Display**: Items grouped under category headers

## Code Structure

```typescript
// State Management
const [items, setItems] = useState<any[]>([]);
const [showAddForm, setShowAddForm] = useState(false);
const [newItem, setNewItem] = useState({
  name: '',
  category: 'documents',
  priority: 'high',
});
const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [isSubmitting, setIsSubmitting] = useState(false);
const [refreshing, setRefreshing] = useState(false);

// Fetch on Mount
useEffect(() => {
  fetchItems();
}, []);

// Fetch Function
const fetchItems = async () => {
  try {
    setLoading(true);
    setError(null);

    const response = await apiService.getToBagItems();

    if (response.success) {
      setItems(response.data);
    } else {
      setError(response.error?.message || 'Failed to load items');
    }
  } catch (err) {
    const apiError = err as ApiError;
    setError(apiError.message || 'Failed to load items');
    console.error('Error fetching items:', err);
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
};

// Add Item Function
const handleAddItem = async () => {
  if (!newItem.name.trim()) {
    Alert.alert('Required', 'Please enter item name');
    return;
  }

  setIsSubmitting(true);

  try {
    const response = await apiService.createToBagItem({
      name: newItem.name.trim(),
      category: newItem.category,
      priority: newItem.priority as 'high' | 'medium' | 'low',
    });

    if (response.success) {
      Alert.alert('Success', 'Item added to your to-go bag');
      setNewItem({ name: '', category: 'documents', priority: 'high' });
      setShowAddForm(false);
      await fetchItems();
    } else {
      Alert.alert('Error', response.error?.message || 'Failed to add item');
    }
  } catch (err) {
    const apiError = err as ApiError;
    Alert.alert('Error', apiError.message || 'Failed to add item');
    console.error('Error adding item:', err);
  } finally {
    setIsSubmitting(false);
  }
};

// Delete Item Function
const handleDeleteItem = (itemId: string, itemName: string) => {
  Alert.alert('Delete Item', `Remove "${itemName}" from your to-go bag?`, [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Delete',
      style: 'destructive',
      onPress: async () => {
        try {
          const response = await apiService.deleteToBagItem(itemId);

          if (response.success) {
            Alert.alert('Success', 'Item removed');
            await fetchItems();
          } else {
            Alert.alert('Error', response.error?.message || 'Failed to delete item');
          }
        } catch (err) {
          const apiError = err as ApiError;
          Alert.alert('Error', apiError.message || 'Failed to delete item');
          console.error('Error deleting item:', err);
        }
      },
    },
  ]);
};

// Toggle Item Completion
const handleToggleItem = (itemId: string) => {
  const newCompleted = new Set(completedItems);
  if (newCompleted.has(itemId)) {
    newCompleted.delete(itemId);
  } else {
    newCompleted.add(itemId);
  }
  setCompletedItems(newCompleted);
};

// Calculate Completion Percentage
const completionPercentage = items.length > 0 
  ? Math.round((completedItems.size / items.length) * 100)
  : 0;

// Group Items by Category
const groupedItems = categories.reduce((acc, category) => {
  const categoryItems = items.filter((item) => item.category === category);
  if (categoryItems.length > 0) {
    acc[category] = categoryItems;
  }
  return acc;
}, {} as Record<string, any[]>);
```

## UI Components

### Header
- Title: "To-Go Bag"
- Subtitle: "Emergency essentials checklist"
- Background: Teal color

### Progress Section
- Progress label: "Preparation Progress"
- Percentage display: "X%"
- Progress bar: Visual representation
- Counter: "X of Y items packed"

### Add Item Button
- Text: "+ Add Item"
- Color: Teal
- Toggles form visibility

### Add Item Form
- Name input (required)
- Category selector (6 options)
- Priority selector (3 options)
- Add Item and Cancel buttons

### Item Card
- Checkbox for completion
- Item name
- Priority badge (color-coded)
- Delete button
- Strikethrough when completed

### Category Section
- Category title (capitalized)
- Items grouped under category

### Empty State
- Icon: 🎒
- Title: "No items yet"
- Message: "Add items to prepare your emergency to-go bag"

### Error Banner
- Red background
- Error message
- Retry button

### Loading State
- Spinner
- "Loading items..." text

## API Integration

### Request/Response Format

**Fetch Items**
```typescript
const response = await apiService.getToBagItems();
// Response: { success: true, data: ToBagItem[] }
```

**Create Item**
```typescript
const response = await apiService.createToBagItem({
  name: string,
  category: string,
  priority: 'high' | 'medium' | 'low',
});
// Response: { success: true, data: ToBagItem }
```

**Delete Item**
```typescript
const response = await apiService.deleteToBagItem(itemId);
// Response: { success: true }
```

## Priority Colors

- **High**: Red (#EF4444)
- **Medium**: Orange (#F59E0B)
- **Low**: Green (#10B981)

## Categories

1. Documents
2. Medications
3. Electronics
4. Clothing
5. Supplies
6. Other

## Error Handling

- Network errors show error banner with retry button
- Validation errors show alert dialogs
- API errors show user-friendly messages
- Errors don't expose sensitive information

## Testing

### Manual Testing Steps

1. **Load Items**
   - Open ToBagScreen
   - Verify loading spinner appears
   - Verify items load from backend
   - Verify error banner appears if network fails

2. **Add Item**
   - Click "+ Add Item" button
   - Fill in item details
   - Select category
   - Select priority
   - Click "Add Item"
   - Verify success alert
   - Verify item appears in list
   - Verify form resets

3. **Delete Item**
   - Click delete button on item
   - Verify confirmation dialog
   - Click "Delete"
   - Verify success alert
   - Verify item removed from list

4. **Track Completion**
   - Click checkbox on item
   - Verify item marked as completed
   - Verify progress bar updates
   - Verify completion counter updates
   - Verify progress bar turns green at 100%

5. **Category Grouping**
   - Verify items grouped by category
   - Verify category headers display
   - Verify items appear under correct category

6. **Pull-to-Refresh**
   - Pull down on items list
   - Verify refresh spinner
   - Verify list updates

## Performance Considerations

- Grouping: Client-side categorization
- Completion: Local state management
- Caching: Items stored in state
- Optimization: Only re-render on data change

## Security

- Token automatically added to requests
- Input validation prevents invalid data
- Confirmation dialogs prevent accidental deletion
- Error messages don't expose sensitive info

## Future Enhancements

1. **Edit Item** - Update existing items
2. **Offline Support** - Cache items locally
3. **Sync** - Sync with cloud storage
4. **Sharing** - Share to-go bag with others
5. **Templates** - Pre-made to-go bag templates
6. **Reminders** - Remind to pack items
7. **Checklists** - Multiple to-go bags for different scenarios

## Files Modified

- `mobile/src/screens/ToBagScreen.tsx` - Full API integration

## Status

✅ **COMPLETE** - ToBagScreen is fully integrated with the backend API and ready for testing.

