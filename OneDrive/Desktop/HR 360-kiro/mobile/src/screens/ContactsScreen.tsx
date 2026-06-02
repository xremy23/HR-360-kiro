/**
 * Contacts Screen - Emergency contacts management
 * Display, add, edit, delete emergency contacts
 * UPDATED: Redux integration with real-time updates
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, FlatList, ActivityIndicator, Modal, Alert } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { colors, typography, spacing, borderRadius, shadows } from '../styles/designSystem';
import { RootState, AppDispatch } from '../store/store';
import { setLoading, setError, setItems, addItem, updateItem, removeItem } from '../store/slices/contactsSlice';
import apiService, { ApiError } from '../services/apiService';
import * as Linking from 'expo-linking';

interface ContactsScreenProps {
  navigation: any;
}

const ContactsScreen: React.FC<ContactsScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredContacts, setFilteredContacts] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingContact, setEditingContact] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Form state for adding/editing
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    role: '',
    notes: '',
  });

  // Redux selectors
  const contacts = useSelector((state: RootState) => state.contacts.items);
  const loading = useSelector((state: RootState) => state.contacts.loading);
  const error = useSelector((state: RootState) => state.contacts.error);

  // Fetch contacts on mount
  useEffect(() => {
    fetchContacts();
  }, []);

  // Filter contacts when search query changes
  useEffect(() => {
    let filtered = contacts;

    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (contact: any) =>
          contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          contact.phone?.includes(searchQuery) ||
          contact.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          contact.role?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredContacts(filtered);
  }, [searchQuery, contacts]);

  // Fetch contacts from backend
  const fetchContacts = async () => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));

      const response = await apiService.getEmergencyContacts({ pageSize: 100 });

      if (response.success && response.data) {
        dispatch(setItems(response.data));
      } else {
        dispatch(setError('Failed to load contacts'));
      }
    } catch (err) {
      const apiError = err as ApiError;
      dispatch(setError(apiError.message || 'Failed to load contacts'));
      console.error('Error fetching contacts:', err);
    } finally {
      setRefreshing(false);
      dispatch(setLoading(false));
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchContacts();
  };

  // Handle add contact
  const handleAddContact = () => {
    setEditingContact(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      role: '',
      notes: '',
    });
    setShowAddModal(true);
  };

  // Handle edit contact
  const handleEditContact = (contact: any) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      phone: contact.phone || '',
      email: contact.email || '',
      role: contact.role || '',
      notes: contact.notes || '',
    });
    setShowAddModal(true);
  };

  // Handle save contact
  const handleSaveContact = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Required', 'Contact name is required');
      return;
    }

    if (!formData.phone.trim() && !formData.email.trim()) {
      Alert.alert('Required', 'Please provide at least a phone number or email');
      return;
    }

    try {
      dispatch(setLoading(true));

      const contactData = {
        name: formData.name.trim(),
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined,
        role: formData.role.trim() || undefined,
        notes: formData.notes.trim() || undefined,
      };

      if (editingContact) {
        // Update existing
        const response = await apiService.updateContact(editingContact.id, contactData);
        if (response.success) {
          dispatch(updateItem({ id: editingContact.id, changes: response.data }));
          setShowAddModal(false);
        }
      } else {
        // Create new
        const response = await apiService.createContact(contactData);
        if (response.success) {
          dispatch(addItem(response.data));
          setShowAddModal(false);
        }
      }
    } catch (err) {
      const apiError = err as ApiError;
      Alert.alert('Error', apiError.message || 'Failed to save contact');
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Handle delete contact
  const handleDeleteContact = (contact: any) => {
    Alert.alert(
      'Delete Contact',
      `Are you sure you want to delete ${contact.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              dispatch(setLoading(true));
              const response = await apiService.deleteContact(contact.id);
              if (response.success) {
                dispatch(removeItem(contact.id));
              }
            } catch (err) {
              Alert.alert('Error', 'Failed to delete contact');
            } finally {
              dispatch(setLoading(false));
            }
          },
        },
      ]
    );
  };

  // Handle call
  const handleCall = (phone: string) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`);
  };

  // Handle email
  const handleEmail = (email: string) => {
    if (!email) return;
    Linking.openURL(`mailto:${email}`);
  };

  // Handle SMS
  const handleSMS = (phone: string) => {
    if (!phone) return;
    Linking.openURL(`sms:${phone}`);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Emergency Contacts</Text>
          <Text style={styles.headerSubtitle}>
            {filteredContacts.length} contact{filteredContacts.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleAddContact}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Error Banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
          <TouchableOpacity onPress={handleRefresh}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search contacts..."
          placeholderTextColor={colors.neutral[400]}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Loading State */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.teal} />
          <Text style={styles.loadingText}>Loading contacts...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredContacts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ContactCard
              contact={item}
              onCall={() => handleCall(item.phone)}
              onEmail={() => handleEmail(item.email)}
              onSMS={() => handleSMS(item.phone)}
              onEdit={() => handleEditContact(item)}
              onDelete={() => handleDeleteContact(item)}
            />
          )}
          contentContainerStyle={styles.contactsList}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>📞</Text>
              <Text style={styles.emptyStateTitle}>No contacts</Text>
              <Text style={styles.emptyStateText}>
                Add emergency contacts to get started
              </Text>
            </View>
          }
        />
      )}

      {/* Add/Edit Contact Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowAddModal(false)}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingContact ? 'Edit Contact' : 'Add Contact'}
            </Text>
            <TouchableOpacity
              style={styles.modalSaveButton}
              onPress={handleSaveContact}
            >
              <Text style={styles.modalSaveText}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Name *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Contact name"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Phone</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Phone number"
                keyboardType="phone-pad"
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Email</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Email address"
                keyboardType="email-address"
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Role</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g., Police, Fire, Ambulance"
                value={formData.role}
                onChangeText={(text) => setFormData({ ...formData, role: text })}
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Notes</Text>
              <TextInput
                style={[styles.formInput, { height: 80 }]}
                placeholder="Additional notes"
                multiline
                textAlignVertical="top"
                value={formData.notes}
                onChangeText={(text) => setFormData({ ...formData, notes: text })}
              />
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

interface ContactCardProps {
  contact: any;
  onCall: () => void;
  onEmail: () => void;
  onSMS: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const ContactCard: React.FC<ContactCardProps> = ({
  contact,
  onCall,
  onEmail,
  onSMS,
  onEdit,
  onDelete,
}) => (
  <View style={styles.contactCard}>
    <View style={styles.contactHeader}>
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{contact.name}</Text>
        {contact.role && <Text style={styles.contactRole}>{contact.role}</Text>}
      </View>
      <View style={styles.contactActions}>
        <TouchableOpacity
          style={styles.actionIconButton}
          onPress={onEdit}
        >
          <Text style={styles.actionIcon}>✎</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionIconButton}
          onPress={onDelete}
        >
          <Text style={styles.actionIcon}>🗑</Text>
        </TouchableOpacity>
      </View>
    </View>

    <View style={styles.contactDetails}>
      {contact.phone && (
        <TouchableOpacity
          style={styles.contactDetail}
          onPress={onCall}
        >
          <Text style={styles.contactDetailIcon}>☎️</Text>
          <Text style={styles.contactDetailText}>{contact.phone}</Text>
        </TouchableOpacity>
      )}

      {contact.email && (
        <TouchableOpacity
          style={styles.contactDetail}
          onPress={onEmail}
        >
          <Text style={styles.contactDetailIcon}>✉️</Text>
          <Text style={styles.contactDetailText}>{contact.email}</Text>
        </TouchableOpacity>
      )}

      {contact.notes && (
        <View style={styles.contactDetail}>
          <Text style={styles.contactDetailIcon}>📝</Text>
          <Text style={styles.contactDetailText}>{contact.notes}</Text>
        </View>
      )}
    </View>

    {(contact.phone || contact.email) && (
      <View style={styles.contactActions2}>
        {contact.phone && (
          <TouchableOpacity style={styles.quickButton} onPress={onCall}>
            <Text style={styles.quickButtonIcon}>📞</Text>
            <Text style={styles.quickButtonText}>Call</Text>
          </TouchableOpacity>
        )}
        {contact.phone && (
          <TouchableOpacity style={styles.quickButton} onPress={onSMS}>
            <Text style={styles.quickButtonIcon}>💬</Text>
            <Text style={styles.quickButtonText}>SMS</Text>
          </TouchableOpacity>
        )}
        {contact.email && (
          <TouchableOpacity style={styles.quickButton} onPress={onEmail}>
            <Text style={styles.quickButtonIcon}>📧</Text>
            <Text style={styles.quickButtonText}>Email</Text>
          </TouchableOpacity>
        )}
      </View>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.primary.teal,
  },
  headerContent: {
    flex: 1,
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
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  addButtonText: {
    fontSize: 24,
    color: colors.primary.white,
    fontWeight: '700',
  },
  errorBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.error,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: borderRadius.md,
  },
  errorText: {
    flex: 1,
    fontSize: typography.fontSize.body2.size,
    color: colors.primary.white,
    fontWeight: '600',
  },
  retryText: {
    fontSize: typography.fontSize.label1.size,
    color: colors.primary.white,
    fontWeight: '700',
    marginLeft: spacing.lg,
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  searchInput: {
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.body2.size,
    color: colors.primary.black,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: typography.fontSize.body2.size,
    color: colors.neutral[600],
    marginTop: spacing.lg,
  },
  contactsList: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  contactCard: {
    backgroundColor: colors.primary.white,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.sm,
  },
  contactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: typography.fontSize.h2.size,
    fontWeight: typography.fontSize.h2.weight,
    color: colors.primary.black,
    marginBottom: spacing.xs,
  },
  contactRole: {
    fontSize: typography.fontSize.body2.size,
    color: colors.neutral[500],
    fontWeight: '600',
  },
  contactActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    fontSize: 18,
  },
  contactDetails: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  contactDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  contactDetailIcon: {
    fontSize: 18,
    width: 24,
  },
  contactDetailText: {
    flex: 1,
    fontSize: typography.fontSize.body2.size,
    color: colors.neutral[600],
  },
  contactActions2: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
  },
  quickButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginHorizontal: spacing.xs,
  },
  quickButtonIcon: {
    fontSize: 20,
    marginBottom: spacing.xs,
  },
  quickButtonText: {
    fontSize: typography.fontSize.body2.size,
    color: colors.primary.teal,
    fontWeight: '600',
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
  modalContainer: {
    flex: 1,
    backgroundColor: colors.primary.white,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  modalCloseButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  modalCloseText: {
    fontSize: 24,
    color: colors.neutral[500],
  },
  modalTitle: {
    flex: 1,
    fontSize: typography.fontSize.h2.size,
    fontWeight: typography.fontSize.h2.weight,
    color: colors.primary.black,
    textAlign: 'center',
  },
  modalSaveButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  modalSaveText: {
    fontSize: typography.fontSize.label1.size,
    fontWeight: typography.fontSize.label1.weight,
    color: colors.primary.teal,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  formSection: {
    marginBottom: spacing.lg,
  },
  formLabel: {
    fontSize: typography.fontSize.label1.size,
    fontWeight: typography.fontSize.label1.weight,
    color: colors.primary.black,
    marginBottom: spacing.md,
  },
  formInput: {
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.body2.size,
    color: colors.primary.black,
  },
});

export default ContactsScreen;
