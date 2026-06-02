/**
 * To-Go Bag Screen - Emergency preparedness checklist
 * Track items for emergency go-bag
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { colors, typography, spacing, borderRadius, shadows } from '../styles/designSystem';
import { RootState, AppDispatch } from '../store/store';
import { setLoading, setError, setItems, addItem, updateItem, removeItem } from '../store/slices/tobagSlice';
import apiService, { ApiError } from '../services/apiService';

interface ToBagScreenProps {
  navigation: any;
}

const ToBagScreen: React.FC<ToBagScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [newItem, setNewItem] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const items = useSelector((state: RootState) => state.tobag.items);
  const loading = useSelector((state: RootState) => state.tobag.loading);
  const error = useSelector((state: RootState) => state.tobag.error);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      dispatch(setLoading(true));
      const response = await apiService.getToBagItems({ pageSize: 100 });
      if (response.success && response.data) {
        dispatch(setItems(response.data));
      } else {
        dispatch(setError('Failed to load items'));
      }
    } catch (err) {
      const apiError = err as ApiError;
      dispatch(setError(apiError.message || 'Failed to load items'));
    } finally {
      setRefreshing(false);
      dispatch(setLoading(false));
    }
  };

  const handleAddItem = async () => {
    if (!newItem.trim()) {
      Alert.alert('Required', 'Please enter an item name');
      return;
    }

    try {
      const response = await apiService.addToBagItem({ title: newItem.trim(), completed: false });
      if (response.success) {
        dispatch(addItem(response.data));
        setNewItem('');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to add item');
    }
  };

  const handleToggleItem = async (item: any) => {
    try {
      const response = await apiService.updateToBagItem(item.id, { completed: !item.completed });
      if (response.success) {
        dispatch(updateItem({ id: item.id, changes: { completed: !item.completed } }));
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to update item');
    }
  };

  const handleDeleteItem = (item: any) => {
    Alert.alert('Delete Item', `Remove "${item.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiService.deleteToBagItem(item.id);
            dispatch(removeItem(item.id));
          } catch (err) {
            Alert.alert('Error', 'Failed to delete item');
          }
        },
      },
    ]);
  };

  const packedCount = items.filter((i: any) => i.completed).length;
  const progress = items.length > 0 ? Math.round((packedCount / items.length) * 100) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>To-Go Bag</Text>
        <Text style={styles.headerSubtitle}>Be prepared for emergencies</Text>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      )}

      {/* Progress Section */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Preparedness</Text>
          <Text style={styles.progressPercent}>{progress}%</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {packedCount} of {items.length} items packed
        </Text>
      </View>

      {/* Add Item */}
      <View style={styles.addSection}>
        <TextInput
          style={styles.addInput}
          placeholder="Add item to your go-bag..."
          value={newItem}
          onChangeText={setNewItem}
          onSubmitEditing={handleAddItem}
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAddItem}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Items List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.teal} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.itemCard}>
              <TouchableOpacity
                style={styles.itemCheckbox}
                onPress={() => handleToggleItem(item)}
              >
                <Text style={styles.checkboxIcon}>
                  {item.completed ? '✓' : '○'}
                </Text>
              </TouchableOpacity>
              <Text
                style={[
                  styles.itemTitle,
                  item.completed && styles.itemTitleCompleted,
                ]}
              >
                {item.title}
              </Text>
              <TouchableOpacity
                style={styles.itemDelete}
                onPress={() => handleDeleteItem(item)}
              >
                <Text style={styles.deleteIcon}>🗑</Text>
              </TouchableOpacity>
            </View>
          )}
          contentContainerStyle={styles.itemsList}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🎒</Text>
              <Text style={styles.emptyTitle}>No items yet</Text>
              <Text style={styles.emptyText}>Add items to your go-bag</Text>
            </View>
          }
        />
      )}
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
    backgroundColor: colors.error,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    margin: spacing.lg,
    borderRadius: borderRadius.md,
  },
  errorText: {
    fontSize: typography.fontSize.body2.size,
    color: colors.primary.white,
    fontWeight: '600',
  },
  progressSection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  progressLabel: {
    fontSize: typography.fontSize.label1.size,
    fontWeight: typography.fontSize.label1.weight,
    color: colors.primary.black,
  },
  progressPercent: {
    fontSize: typography.fontSize.label1.size,
    fontWeight: typography.fontSize.label1.weight,
    color: colors.primary.teal,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.neutral[200],
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.success,
  },
  progressText: {
    fontSize: typography.fontSize.body2.size,
    color: colors.neutral[600],
    textAlign: 'center',
  },
  addSection: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  addInput: {
    flex: 1,
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.body2.size,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 24,
    color: colors.primary.white,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemsList: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
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
  itemCheckbox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.primary.teal,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  checkboxIcon: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary.teal,
  },
  itemTitle: {
    flex: 1,
    fontSize: typography.fontSize.body1.size,
    color: colors.primary.black,
  },
  itemTitleCompleted: {
    textDecorationLine: 'line-through',
    color: colors.neutral[400],
  },
  itemDelete: {
    padding: spacing.md,
  },
  deleteIcon: {
    fontSize: 18,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: typography.fontSize.h2.size,
    fontWeight: typography.fontSize.h2.weight,
    color: colors.primary.black,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: typography.fontSize.body2.size,
    color: colors.neutral[500],
  },
});

export default ToBagScreen;
