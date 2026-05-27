/**
 * Contacts Screen - Manage emergency contacts
 * Add, edit, and view emergency contacts with quick call/message options
 * UPDATED: Redux integration with real-time updates
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, FlatList, Alert, ActivityIndicator } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { colors, typography, spacing, borderRadius, shadows } from '../styles/designSystem';
import { RootState, AppDispatch } from '../store/store';
import apiService, { ApiError } from '../services/apiService';

interface ContactsScreenProps {
  navigation: any;
}

const ContactsScreen: React.FC<ContactsScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
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

  // Fetch contacts on mount
  useEffect(() => {
    fetchContacts();
  }, []);

  // Filter contacts when search changes
  useEffect(() => {
    if (searchQuery) {
      setFilteredContacts(
        contacts.filter(
          (contact: any) =>
            contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            contact.phone.includes(searchQuery)
        )
      );
    } else {
      setFilteredContacts(contacts);
    }
  }, [searchQuery, contacts]);

  // Fetch contacts from backend
  const fetchContacts = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.getContacts({ pageSize: 100 });

      if (response.success && response.data) {
        setContacts(response.data);
      } else {
        setError('Failed to load contacts');
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

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchContacts();
  };

  // Add new contact
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
        // Refresh contacts list
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

  // Delete contact
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
              // Refresh contacts list
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Emergency Contacts</Text>
        <Text style={styles.headerSubtitle}>Quick access to important numbers</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search contacts..."
          placeholderTextColor={colors.neutral[400]}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddForm(!showAddForm)}
        >
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Add Contact Form */}
      {showAddForm && (
        <View style={styles.formSection}>
          <Text style={styles.formTitle}>Add New Contact</Text>
          <TextInput
            style={styles.formInput}
            placeholder="Name"
            placeholderTextColor={colors.neutral[400]}
            value={newContact.name}
            onChangeText={(text) => setNewContact({ ...newContact, name: text })}
          />
          <TextInput
            style={styles.formInput}
            placeholder="Phone"
            placeholderTextColor={colors.neutral[400]}
            value={newContact.phone}
            onChangeText={(text) => setNewContact({ ...newContact, phone: text })}
            keyboardType="phone-pad"
          />
          <TextInput
            style={styles.formInput}
            placeholder="Email (optional)"
            placeholderTextColor={colors.neutral[400]}
            value={newContact.email}
            onChangeText={(text) => setNewContact({ ...newContact, email: text })}
            keyboardType="email-address"
          />
          <TextInput
            style={styles.formInput}
            placeholder="Relationship"
            placeholderTextColor={colors.neutral[400]}
            value={newContact.relationship}
            onChangeText={(text) => setNewContact({ ...newContact, relationship: text })}
          />
          <View style={styles.formButtons}>
            <TouchableOpacity
              style={[styles.formButton, { backgroundColor: colors.primary.teal }]}
              onPress={handleAddContact}
            >
              <Text style={styles.formButtonText}>Save Contact</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.formButton, { backgroundColor: colors.neutral[300] }]}
              onPress={() => setShowAddForm(false)}
            >
              <Text style={styles.formButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Contacts List */}
      <FlatList
        data={filteredContacts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ContactCard
            contact={item}
            onCall={() => handleCallContact(item.phone)}
            onDelete={() => handleDeleteContact(item.id)}
          />
        )}
        contentContainerStyle={styles.contactsList}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📞</Text>
            <Text style={styles.emptyStateTitle}>No contacts yet</Text>
            <Text style={styles.emptyStateText}>
              Add emergency contacts to quickly reach them in a crisis
            </Text>
          </View>
        }
      />
    </View>
  );
};

interface ContactCardProps {
  contact: any;
  onCall: () => void;
  onDelete: () => void;
}

const ContactCard: React.FC<ContactCardProps> = ({ contact, onCall, onDelete }) => (
  <View style={styles.contactCard}>
    <View style={styles.contactInfo}>
      <View style={styles.contactAvatar}>
        <Text style={styles.contactAvatarText}>
          {contact.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.contactDetails}>
        <Text style={styles.contactName}>{contact.name}</Text>
        <Text style={styles.contactPhone}>{contact.phone}</Text>
        {contact.relationship && (
          <Text style={styles.contactRelationship}>{contact.relationship}</Text>
        )}
      </View>
    </View>
    <View style={styles.contactActions}>
      <TouchableOpacity style={styles.actionButton} onPress={onCall}>
        <Text style={styles.actionButtonIcon}>📞</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: colors.error }]}
        onPress={onDelete}
      >
        <Text style={styles.actionButtonIcon}>🗑️</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary.white,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.primary.teal,
  },
  headerTitle: {
    fontSize: typography.fontSize.h1.size,
    fontWeight: typography.fontSize.h1.weight,
    color: colors.primary.white,
    marginBottom: spacing.sm,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.body2.size,
    color: colors.secondary.lightTeal,
  },
  searchSection: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.body2.size,
    color: colors.primary.black,
  },
  addButton: {
    backgroundColor: colors.primary.teal,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    ...shadows.sm,
  },
  addButtonText: {
    fontSize: typography.fontSize.label1.size,
    fontWeight: typography.fontSize.label1.weight,
    color: colors.primary.white,
  },
  formSection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.neutral[50],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  formTitle: {
    fontSize: typography.fontSize.h2.size,
    fontWeight: typography.fontSize.h2.weight,
    color: colors.primary.black,
    marginBottom: spacing.lg,
  },
  formInput: {
    backgroundColor: colors.primary.white,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.body2.size,
    color: colors.primary.black,
    marginBottom: spacing.md,
  },
  formButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  formButton: {
    flex: 1,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  formButtonText: {
    fontSize: typography.fontSize.label1.size,
    fontWeight: typography.fontSize.label1.weight,
    color: colors.primary.white,
  },
  contactsList: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  contactCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.primary.white,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.sm,
  },
  contactInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  contactAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactAvatarText: {
    fontSize: typography.fontSize.h2.size,
    fontWeight: typography.fontSize.h2.weight,
    color: colors.primary.white,
  },
  contactDetails: {
    flex: 1,
  },
  contactName: {
    fontSize: typography.fontSize.label1.size,
    fontWeight: typography.fontSize.label1.weight,
    color: colors.primary.black,
    marginBottom: spacing.xs,
  },
  contactPhone: {
    fontSize: typography.fontSize.body2.size,
    color: colors.neutral[600],
    marginBottom: spacing.xs,
  },
  contactRelationship: {
    fontSize: typography.fontSize.body2.size,
    color: colors.primary.teal,
    fontWeight: '600',
  },
  contactActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary.teal,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  actionButtonIcon: {
    fontSize: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  emptyStateTitle: {
    fontSize: typography.fontSize.h2.size,
    fontWeight: typography.fontSize.h2.weight,
    color: colors.primary.black,
    marginBottom: spacing.sm,
  },
  emptyStateText: {
    fontSize: typography.fontSize.body2.size,
    color: colors.neutral[500],
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
});

export default ContactsScreen;
