/**
 * To-Go Bag Screen - Emergency essentials checklist
 * Track items needed for emergency evacuation
 * UPDATED: Redux integration with real-time updates
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, FlatList, Alert, ActivityIndicator } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { colors, typography, spacing, borderRadius, shadows } from '../styles/designSystem';
import { RootState, AppDispatch } from '../store/store';
import apiService, { ApiError } from '../services/apiService';

interface ToBagScreenProps {
  navigation: any;
}

const ToBagScreen: React.FC<ToBagScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
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

  const categories = ['documents', 'medications', 'electronics', 'clothing', 'supplies', 'other'];
  const priorities = ['high', 'medium', 'low'];

  // Fetch items on mount
  useEffect(() => {
    fetchItems();
  }, []);

  // Fetch items from backend
  const fetchItems = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.getToBagItems();

      if (response.success && response.data) {
        setItems(response.data);
      } else {
        setError('Failed to load items');
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

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchItems();
  };

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
        // Refresh items list
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

  const handleToggleItem = (itemId: string) => {
    const newCompleted = new Set(completedItems);
    if (newCompleted.has(itemId)) {
      newCompleted.delete(itemId);
    } else {
      newCompleted.add(itemId);
    }
    setCompletedItems(newCompleted);
  };

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
              // Refresh items list
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

  const groupedItems = categories.reduce((acc, category) => {
    const categoryItems = items.filter((item) => item.category === category);
    if (categoryItems.length > 0) {
      acc[category] = categoryItems;
    }
    return acc;
  }, {} as Record<string, any[]>);

  const completionPercentage = items.length > 0 
    ? Math.round((completedItems.size / items.length) * 100)
    : 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>To-Go Bag</Text>
        <Text style={styles.headerSubtitle}>Emergency essentials checklist</Text>
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

      {/* Loading State */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.teal} />
          <Text style={styles.loadingText}>Loading items...</Text>
        </View>
      ) : (
        <>
          {/* Progress Bar */}
          <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Preparation Progress</Text>
          <Text style={styles.progressPercentage}>{completionPercentage}%</Text>
        </View>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${completionPercentage}%`,
                backgroundColor: completionPercentage === 100 ? colors.success : colors.primary.teal,
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {completedItems.size} of {items.length} items packed
        </Text>
      </View>

      {/* Add Item Button */}
      <View style={styles.actionSection}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddForm(!showAddForm)}
        >
          <Text style={styles.addButtonText}>+ Add Item</Text>
        </TouchableOpacity>
      </View>

      {/* Add Item Form */}
      {showAddForm && (
        <View style={styles.formSection}>
          <Text style={styles.formTitle}>Add New Item</Text>
          <TextInput
            style={styles.formInput}
            placeholder="Item name"
            placeholderTextColor={colors.neutral[400]}
            value={newItem.name}
            onChangeText={(text) => setNewItem({ ...newItem, name: text })}
          />
          <Text style={styles.formLabel}>Category</Text>
          <View style={styles.categoryGrid}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryOption,
                  {
                    backgroundColor: newItem.category === cat ? colors.primary.teal : colors.neutral[100],
                  },
                ]}
                onPress={() => setNewItem({ ...newItem, category: cat })}
              >
                <Text
                  style={[
                    styles.categoryOptionText,
                    {
                      color: newItem.category === cat ? colors.primary.white : colors.primary.black,
                    },
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.formLabel}>Priority</Text>
          <View style={styles.priorityGrid}>
            {priorities.map((priority) => (
              <TouchableOpacity
                key={priority}
                style={[
                  styles.priorityOption,
                  {
                    backgroundColor: newItem.priority === priority ? colors.primary.teal : colors.neutral[100],
                  },
                ]}
                onPress={() => setNewItem({ ...newItem, priority })}
              >
                <Text
                  style={[
                    styles.priorityOptionText,
                    {
                      color: newItem.priority === priority ? colors.primary.white : colors.primary.black,
                    },
                  ]}
                >
                  {priority}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.formButtons}>
            <TouchableOpacity
              style={[styles.formButton, { backgroundColor: colors.primary.teal }]}
              onPress={handleAddItem}
            >
              <Text style={styles.formButtonText}>Add Item</Text>
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

      {/* Items List */}
      <ScrollView style={styles.itemsList} showsVerticalScrollIndicator={false}>
        {Object.entries(groupedItems).map(([category, categoryItems]) => (
          <View key={category} style={styles.categorySection}>
            <Text style={styles.categoryTitle}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Text>
            {categoryItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                isCompleted={completedItems.has(item.id)}
                onToggle={() => handleToggleItem(item.id)}
                onDelete={() => handleDeleteItem(item.id, item.name)}
              />
            ))}
          </View>
        ))}
        {items.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🎒</Text>
            <Text style={styles.emptyStateTitle}>No items yet</Text>
            <Text style={styles.emptyStateText}>
              Add items to prepare your emergency to-go bag
            </Text>
          </View>
        )}
      </ScrollView>
        </>
      )}
    </View>
  );
};

interface ItemCardProps {
  item: any;
  isCompleted: boolean;
  onToggle: () => void;
  onDelete: () => void;
}

const ItemCard: React.FC<ItemCardProps> = ({ item, isCompleted, onToggle, onDelete }) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return colors.error;
      case 'medium':
        return colors.warning;
      case 'low':
        return colors.success;
      default:
        return colors.neutral[400];
    }
  };

  return (
    <View style={[styles.itemCard, isCompleted && styles.itemCardCompleted]}>
      <TouchableOpacity style={styles.itemCheckbox} onPress={onToggle}>
        <Text style={styles.itemCheckboxText}>{isCompleted ? '✓' : ''}</Text>
      </TouchableOpacity>
      <View style={styles.itemInfo}>
        <Text
          style={[
            styles.itemName,
            isCompleted && styles.itemNameCompleted,
          ]}
        >
          {item.name}
        </Text>
        <View style={styles.itemMeta}>
          <View
            style={[
              styles.priorityBadge,
              { backgroundColor: getPriorityColor(item.priority) },
            ]}
          >
            <Text style={styles.priorityBadgeText}>{item.priority}</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
        <Text style={styles.deleteButtonText}>🗑️</Text>
      </TouchableOpacity>
    </View>
  );
};

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
    fontSize: typography.fontSize.label2.size,
    color: colors.primary.white,
    fontWeight: '700',
    marginLeft: spacing.lg,
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
  progressSection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.neutral[50],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  progressLabel: {
    fontSize: typography.fontSize.label1.size,
    fontWeight: typography.fontSize.label1.weight,
    color: colors.primary.black,
  },
  progressPercentage: {
    fontSize: typography.fontSize.h2.size,
    fontWeight: typography.fontSize.h2.weight,
    color: colors.primary.teal,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.neutral[200],
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  progressText: {
    fontSize: typography.fontSize.body2.size,
    color: colors.neutral[600],
  },
  actionSection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  addButton: {
    backgroundColor: colors.primary.teal,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
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
    marginBottom: spacing.lg,
  },
  formLabel: {
    fontSize: typography.fontSize.label1.size,
    fontWeight: typography.fontSize.label1.weight,
    color: colors.primary.black,
    marginBottom: spacing.md,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  categoryOption: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  categoryOptionText: {
    fontSize: typography.fontSize.label2.size,
    fontWeight: typography.fontSize.label2.weight,
  },
  priorityGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  priorityOption: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  priorityOptionText: {
    fontSize: typography.fontSize.label1.size,
    fontWeight: typography.fontSize.label1.weight,
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
  itemsList: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  categorySection: {
    marginBottom: spacing.xl,
  },
  categoryTitle: {
    fontSize: typography.fontSize.h2.size,
    fontWeight: typography.fontSize.h2.weight,
    color: colors.primary.black,
    marginBottom: spacing.md,
    textTransform: 'capitalize',
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.white,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.sm,
  },
  itemCardCompleted: {
    backgroundColor: colors.neutral[50],
    borderColor: colors.success,
  },
  itemCheckbox: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.primary.teal,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  itemCheckboxText: {
    fontSize: 18,
    color: colors.primary.teal,
    fontWeight: 'bold',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: typography.fontSize.label1.size,
    fontWeight: typography.fontSize.label1.weight,
    color: colors.primary.black,
    marginBottom: spacing.sm,
  },
  itemNameCompleted: {
    textDecorationLine: 'line-through',
    color: colors.neutral[500],
  },
  itemMeta: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  priorityBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  priorityBadgeText: {
    fontSize: typography.fontSize.body2.size,
    fontWeight: '600',
    color: colors.primary.white,
    textTransform: 'capitalize',
  },
  deleteButton: {
    paddingHorizontal: spacing.md,
  },
  deleteButtonText: {
    fontSize: 18,
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

export default ToBagScreen;
