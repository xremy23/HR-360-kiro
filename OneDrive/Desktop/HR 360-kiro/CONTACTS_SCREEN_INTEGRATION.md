# ContactsScreen API Integration

## Overview
The ContactsScreen is now fully integrated with the backend API for managing emergency contacts. Users can fetch, add, and delete contacts with real-time feedback.

## Features Implemented

### 1. Fetch Contacts
- **Endpoint**: `GET /api/contacts`
- **Trigger**: On screen mount and pull-to-refresh
- **State Management**:
  - `loading` - Shows spinner during fetch
  - `error` - Shows error banner if fetch fails
  - `refreshing` - Handles pull-to-refresh
  - `contacts` - Stores fetched contacts

### 2. Add Contact
- **Endpoint**: `POST /api/contacts`
- **Validation**:
  - Name (required)
  - Phone (required)
  - Email (optional)
  - Relationship (optional)
- **Feedback**:
  - Loading spinner during submission
  - Success alert on completion
  - Error alert on failure
  - Form reset after success

### 3. Delete Contact
- **Endpoint**: `DELETE /api/contacts/:id`
- **Confirmation**: Alert dialog before deletion
- **Feedback**:
  - Success alert on completion
  - Error alert on failure
  - List refresh after deletion

### 4. Search Contacts
- **Type**: Client-side filtering
- **Search Fields**: Name, phone number
- **Real-time**: Updates as user types

## Code Structure

```typescript
// State Management
const [contacts, setContacts] = useState<any[]>([]);
const [searchQuery, setSearchQuery] = useState('');
const [filteredContacts, setFilteredContacts] = useState<any[]>([]);
const [showAddForm, setShowAddForm] = useState(false);
const [newContact, setNewContact] = useState({
  name: '',
  phone: '',
  email: '',
  relationship: '',
});
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [isSubmitting, setIsSubmitting] = useState(false);
const [refreshing, setRefreshing] = useState(false);

// Fetch on Mount
useEffect(() => {
  fetchContacts();
}, []);

// Filter on Search Change
useEffect(() => {
  if (searchQuery) {
    setFilteredContacts(
      contacts.filter(
        (contact) =>
          contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          contact.phone.includes(searchQuery)
      )
    );
  } else {
    setFilteredContacts(contacts);
  }
}, [searchQuery, contacts]);

// Fetch Function
const fetchContacts = async () => {
  try {
    setLoading(true);
    setError(null);

    const response = await apiService.getContacts({ pageSize: 100 });

    if (response.success) {
      setContacts(response.data);
    } else {
      setError(response.error?.message || 'Failed to load contacts');
    }
  } catch (err) {
    const apiError = err as ApiError;
    setError(apiError.message || 'Failed to load contacts');
    console.error('Error fetching contacts:', err);
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
};

// Add Contact Function
const handleAddContact = async () => {
  if (!newContact.name.trim() || !newContact.phone.trim()) {
    Alert.alert('Required', 'Please enter name and phone number');
    return;
  }

  setIsSubmitting(true);

  try {
    const response = await apiService.createContact({
      name: newContact.name.trim(),
      phone: newContact.phone.trim(),
      email: newContact.email.trim() || undefined,
      relationship: newContact.relationship.trim() || undefined,
    });

    if (response.success) {
      Alert.alert('Success', 'Contact added successfully');
      setNewContact({ name: '', phone: '', email: '', relationship: '' });
      setShowAddForm(false);
      await fetchContacts();
    } else {
      Alert.alert('Error', response.error?.message || 'Failed to add contact');
    }
  } catch (err) {
    const apiError = err as ApiError;
    Alert.alert('Error', apiError.message || 'Failed to add contact');
    console.error('Error adding contact:', err);
  } finally {
    setIsSubmitting(false);
  }
};

// Delete Contact Function
const handleDeleteContact = (contactId: string, contactName: string) => {
  Alert.alert('Delete Contact', `Are you sure you want to delete ${contactName}?`, [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Delete',
      style: 'destructive',
      onPress: async () => {
        try {
          const response = await apiService.deleteContact(contactId);

          if (response.success) {
            Alert.alert('Success', 'Contact deleted');
            await fetchContacts();
          } else {
            Alert.alert('Error', response.error?.message || 'Failed to delete contact');
          }
        } catch (err) {
          const apiError = err as ApiError;
          Alert.alert('Error', apiError.message || 'Failed to delete contact');
          console.error('Error deleting contact:', err);
        }
      },
    },
  ]);
};
```

## UI Components

### Header
- Title: "Emergency Contacts"
- Subtitle: "Quick access to important numbers"
- Background: Teal color

### Search Bar
- Placeholder: "Search contacts..."
- Real-time filtering
- Add button to toggle form

### Add Contact Form
- Name input (required)
- Phone input (required)
- Email input (optional)
- Relationship input (optional)
- Save and Cancel buttons

### Contact Card
- Avatar with contact initial
- Contact name
- Phone number
- Relationship (if available)
- Call button (📞)
- Delete button (🗑️)

### Empty State
- Icon: 📞
- Title: "No contacts yet"
- Message: "Add emergency contacts to quickly reach them in a crisis"

### Error Banner
- Red background
- Error message
- Retry button

### Loading State
- Spinner
- "Loading contacts..." text

## API Integration

### Request/Response Format

**Fetch Contacts**
```typescript
const response = await apiService.getContacts({ pageSize: 100 });
// Response: { success: true, data: Contact[], pagination: {...} }
```

**Create Contact**
```typescript
const response = await apiService.createContact({
  name: string,
  phone: string,
  email?: string,
  relationship?: string,
});
// Response: { success: true, data: Contact }
```

**Delete Contact**
```typescript
const response = await apiService.deleteContact(contactId);
// Response: { success: true }
```

## Error Handling

- Network errors show error banner with retry button
- Validation errors show alert dialogs
- API errors show user-friendly messages
- Errors don't expose sensitive information

## Testing

### Manual Testing Steps

1. **Load Contacts**
   - Open ContactsScreen
   - Verify loading spinner appears
   - Verify contacts load from backend
   - Verify error banner appears if network fails

2. **Add Contact**
   - Click "+ Add" button
   - Fill in contact details
   - Click "Save Contact"
   - Verify success alert
   - Verify contact appears in list
   - Verify form resets

3. **Delete Contact**
   - Click delete button on contact
   - Verify confirmation dialog
   - Click "Delete"
   - Verify success alert
   - Verify contact removed from list

4. **Search Contacts**
   - Type in search bar
   - Verify list filters in real-time
   - Clear search
   - Verify all contacts appear

5. **Pull-to-Refresh**
   - Pull down on contacts list
   - Verify refresh spinner
   - Verify list updates

## Performance Considerations

- Pagination: Fetches up to 100 contacts per request
- Search: Client-side filtering (no API call)
- Caching: Contacts stored in state
- Optimization: Only re-render on data change

## Security

- Token automatically added to requests
- Input validation prevents invalid data
- Confirmation dialogs prevent accidental deletion
- Error messages don't expose sensitive info

## Future Enhancements

1. **Edit Contact** - Update existing contacts
2. **Contact Groups** - Organize contacts by group
3. **Favorites** - Mark important contacts
4. **Contact Sync** - Sync with device contacts
5. **Offline Support** - Cache contacts locally
6. **Contact Details** - View full contact information
7. **Quick Actions** - Call, message, email from card

## Files Modified

- `mobile/src/screens/ContactsScreen.tsx` - Full API integration

## Status

✅ **COMPLETE** - ContactsScreen is fully integrated with the backend API and ready for testing.

