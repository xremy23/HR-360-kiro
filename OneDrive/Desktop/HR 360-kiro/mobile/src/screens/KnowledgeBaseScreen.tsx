/**
 * Knowledge Base Screen - Browse emergency guides
 * Displays guides with search and filtering capabilities
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useSelector } from 'react-redux';
import { colors, typography, spacing, borderRadius, shadows } from '../styles/designSystem';
import { RootState } from '../store';
import apiService, { ApiError } from '../services/apiService';

interface KnowledgeBaseScreenProps {
  navigation: any;
}

const KnowledgeBaseScreen: React.FC<KnowledgeBaseScreenProps> = ({ navigation }) => {
  const [guides, setGuides] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredGuides, setFilteredGuides] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch guides on mount
  useEffect(() => {
    fetchGuides();
  }, []);

  // Filter guides when search or category changes
  useEffect(() => {
    let filtered = guides;

    if (searchQuery) {
      filtered = filtered.filter(
        (guide) =>
          guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          guide.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter((guide) => guide.category === selectedCategory);
    }

    setFilteredGuides(filtered);
  }, [searchQuery, selectedCategory, guides]);

  // Extract unique categories from guides
  useEffect(() => {
    const uniqueCategories = Array.from(new Set(guides.map((g) => g.category)));
    setCategories(uniqueCategories as string[]);
  }, [guides]);

  // Fetch guides from backend
  const fetchGuides = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.getGuides({ pageSize: 100 });

      if (response.success) {
        setGuides(response.data);
      } else {
        setError(response.error?.message || 'Failed to load guides');
      }
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to load guides');
      console.error('Error fetching guides:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchGuides();
  };

  const handleGuidePress = (guide: any) => {
    navigation.navigate('GuideDetail', { guide });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Emergency Guides</Text>
        <Text style={styles.headerSubtitle}>Learn how to respond to emergencies</Text>
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
          <Text style={styles.loadingText}>Loading guides...</Text>
        </View>
      ) : (
        <>
          {/* Search Bar */}
          <View style={styles.searchSection}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search guides..."
              placeholderTextColor={colors.neutral[400]}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Categories */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesScroll}
            contentContainerStyle={styles.categoriesContainer}
          >
            <CategoryButton
              label="All"
              isSelected={selectedCategory === null}
              onPress={() => setSelectedCategory(null)}
            />
            {categories.map((category) => (
              <CategoryButton
                key={category}
                label={category}
                isSelected={selectedCategory === category}
                onPress={() => setSelectedCategory(category)}
              />
            ))}
          </ScrollView>

          {/* Guides List */}
          <FlatList
            data={filteredGuides}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <GuideCard guide={item} onPress={() => handleGuidePress(item)} />
            )}
            contentContainerStyle={styles.guidesList}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateIcon}>📚</Text>
                <Text style={styles.emptyStateTitle}>No guides found</Text>
                <Text style={styles.emptyStateText}>
                  Try adjusting your search or filters
                </Text>
              </View>
            }
          />
        </>
      )}
    </View>
  );
};

interface CategoryButtonProps {
  label: string;
  isSelected: boolean;
  onPress: () => void;
}

const CategoryButton: React.FC<CategoryButtonProps> = ({ label, isSelected, onPress }) => (
  <TouchableOpacity
    style={[
      styles.categoryButton,
      {
        backgroundColor: isSelected ? colors.primary.teal : colors.neutral[100],
      },
    ]}
    onPress={onPress}
  >
    <Text
      style={[
        styles.categoryButtonText,
        {
          color: isSelected ? colors.primary.white : colors.primary.black,
        },
      ]}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

interface GuideCardProps {
  guide: any;
  onPress: () => void;
}

const GuideCard: React.FC<GuideCardProps> = ({ guide, onPress }) => (
  <TouchableOpacity style={styles.guideCard} onPress={onPress}>
    <View style={styles.guideCardHeader}>
      <View style={styles.guideCardTitleContainer}>
        <Text style={styles.guideCardTitle}>{guide.title}</Text>
        <Text style={styles.guideCardCategory}>{guide.category}</Text>
      </View>
      <Text style={styles.guideCardArrow}>›</Text>
    </View>
    <Text style={styles.guideCardDescription} numberOfLines={2}>
      {guide.description}
    </Text>
    <View style={styles.guideCardFooter}>
      <Text style={styles.guideCardVersion}>v{guide.version}</Text>
      <Text style={styles.guideCardDate}>
        Updated {new Date(guide.updatedAt).toLocaleDateString()}
      </Text>
    </View>
  </TouchableOpacity>
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
  searchSection: {
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
  categoriesScroll: {
    maxHeight: 50,
  },
  categoriesContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  categoryButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    ...shadows.sm,
  },
  categoryButtonText: {
    fontSize: typography.fontSize.label2.size,
    fontWeight: typography.fontSize.label2.weight,
  },
  guidesList: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  guideCard: {
    backgroundColor: colors.primary.white,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.sm,
  },
  guideCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  guideCardTitleContainer: {
    flex: 1,
  },
  guideCardTitle: {
    fontSize: typography.fontSize.label1.size,
    fontWeight: typography.fontSize.label1.weight,
    color: colors.primary.black,
    marginBottom: spacing.xs,
  },
  guideCardCategory: {
    fontSize: typography.fontSize.body2.size,
    color: colors.primary.teal,
    fontWeight: '600',
  },
  guideCardArrow: {
    fontSize: 24,
    color: colors.neutral[400],
    marginLeft: spacing.md,
  },
  guideCardDescription: {
    fontSize: typography.fontSize.body2.size,
    color: colors.neutral[600],
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  guideCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  guideCardVersion: {
    fontSize: typography.fontSize.body2.size,
    color: colors.neutral[500],
    fontWeight: '600',
  },
  guideCardDate: {
    fontSize: typography.fontSize.body2.size,
    color: colors.neutral[500],
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
  },
});

export default KnowledgeBaseScreen;
