/**
 * Knowledge Base Screen - Browse emergency guides
 * Displays guides with search and filtering capabilities
 * UPDATED: Redux integration with real-time updates
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, FlatList, ActivityIndicator, Modal } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { colors, typography, spacing, borderRadius, shadows } from '../styles/designSystem';
import { RootState, AppDispatch } from '../store/store';
import { setLoading, setError, setItems } from '../store/slices/kbSlice';
import apiService, { ApiError } from '../services/apiService';

interface KnowledgeBaseScreenProps {
  navigation: any;
}

const KnowledgeBaseScreen: React.FC<KnowledgeBaseScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredGuides, setFilteredGuides] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedGuide, setSelectedGuide] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Redux selectors
  const guides = useSelector((state: RootState) => state.kb.items);
  const loading = useSelector((state: RootState) => state.kb.loading);
  const error = useSelector((state: RootState) => state.kb.error);

  // Fetch guides on mount
  useEffect(() => {
    fetchGuides();
  }, []);

  // Filter guides when search or category changes
  useEffect(() => {
    let filtered = guides;

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (guide: any) =>
          guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          guide.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          guide.content?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter((guide: any) => {
        const tags = Array.isArray(guide.tags) ? guide.tags : [];
        return tags.includes(selectedCategory);
      });
    }

    setFilteredGuides(filtered);

    // Extract unique categories
    const allCategories = new Set<string>();
    guides.forEach((guide: any) => {
      if (Array.isArray(guide.tags)) {
        guide.tags.forEach((tag: string) => allCategories.add(tag));
      }
    });
    setCategories(Array.from(allCategories).sort());
  }, [searchQuery, selectedCategory, guides]);

  // Fetch guides from backend
  const fetchGuides = async () => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));

      const response = await apiService.getKBGuides({ pageSize: 100 });

      if (response.success && response.data) {
        dispatch(setItems(response.data));
      } else {
        dispatch(setError('Failed to load guides'));
      }
    } catch (err) {
      const apiError = err as ApiError;
      dispatch(setError(apiError.message || 'Failed to load guides'));
      console.error('Error fetching guides:', err);
    } finally {
      setRefreshing(false);
      dispatch(setLoading(false));
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchGuides();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Emergency Guides</Text>
        <Text style={styles.headerSubtitle}>
          {filteredGuides.length} guide{filteredGuides.length !== 1 ? 's' : ''}
        </Text>
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
          placeholder="Search guides..."
          placeholderTextColor={colors.neutral[400]}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Category Filter */}
      {categories.length > 0 && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesScroll}
        >
          <View style={styles.categories}>
            <TouchableOpacity
              style={[
                styles.categoryTag,
                selectedCategory === null && styles.categoryTagActive,
              ]}
              onPress={() => setSelectedCategory(null)}
            >
              <Text
                style={[
                  styles.categoryTagText,
                  selectedCategory === null && styles.categoryTagTextActive,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>

            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryTag,
                  selectedCategory === category && styles.categoryTagActive,
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text
                  style={[
                    styles.categoryTagText,
                    selectedCategory === category && styles.categoryTagTextActive,
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}

      {/* Loading State */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.teal} />
          <Text style={styles.loadingText}>Loading guides...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredGuides}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <GuideCard
              guide={item}
              onPress={() => setSelectedGuide(item)}
            />
          )}
          contentContainerStyle={styles.guidesList}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>📚</Text>
              <Text style={styles.emptyStateTitle}>No guides found</Text>
              <Text style={styles.emptyStateText}>
                {searchQuery.trim() || selectedCategory
                  ? 'Try adjusting your search or filters'
                  : 'No guides available at this time'}
              </Text>
            </View>
          }
        />
      )}

      {/* Guide Detail Modal */}
      {selectedGuide && (
        <Modal
          visible={true}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setSelectedGuide(null)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.modalBackButton}
                onPress={() => setSelectedGuide(null)}
              >
                <Text style={styles.modalBackText}>← Back</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Guide Details</Text>
              <View style={{ width: 60 }} />
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.modalGuideContent}>
                <Text style={styles.modalGuideTitle}>{selectedGuide.title}</Text>
                <Text style={styles.modalGuideDescription}>
                  {selectedGuide.description}
                </Text>

                {Array.isArray(selectedGuide.tags) && selectedGuide.tags.length > 0 && (
                  <View style={styles.tagsContainer}>
                    {selectedGuide.tags.map((tag: string) => (
                      <View key={tag} style={styles.tag}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}

                <View style={styles.contentSection}>
                  <Text style={styles.contentLabel}>Content</Text>
                  <Text style={styles.contentText}>
                    {selectedGuide.content || 'No content available'}
                  </Text>
                </View>

                <View style={styles.metaInfo}>
                  <Text style={styles.metaLabel}>
                    Last updated: {new Date(selectedGuide.updatedAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </Modal>
      )}
    </View>
  );
};

interface GuideCardProps {
  guide: any;
  onPress: () => void;
}

const GuideCard: React.FC<GuideCardProps> = ({ guide, onPress }) => (
  <TouchableOpacity style={styles.guideCard} onPress={onPress}>
    <View style={styles.guideIcon}>
      <Text style={styles.guideIconText}>📖</Text>
    </View>

    <View style={styles.guideContent}>
      <Text style={styles.guideTitle}>{guide.title}</Text>
      <Text style={styles.guideDescription} numberOfLines={2}>
        {guide.description}
      </Text>

      {Array.isArray(guide.tags) && guide.tags.length > 0 && (
        <View style={styles.guideTags}>
          {guide.tags.slice(0, 2).map((tag: string) => (
            <View key={tag} style={styles.guideTag}>
              <Text style={styles.guideTagText}>{tag}</Text>
            </View>
          ))}
          {guide.tags.length > 2 && (
            <Text style={styles.guideTagMore}>+{guide.tags.length - 2}</Text>
          )}
        </View>
      )}
    </View>

    <Text style={styles.guideChevron}>›</Text>
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
  categoriesScroll: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  categories: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  categoryTag: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  categoryTagActive: {
    backgroundColor: colors.primary.teal,
    borderColor: colors.primary.teal,
  },
  categoryTagText: {
    fontSize: typography.fontSize.label1.size,
    fontWeight: typography.fontSize.label1.weight,
    color: colors.neutral[600],
  },
  categoryTagTextActive: {
    color: colors.primary.white,
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
  guidesList: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  guideCard: {
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
  guideIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.neutral[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  guideIconText: {
    fontSize: 24,
  },
  guideContent: {
    flex: 1,
  },
  guideTitle: {
    fontSize: typography.fontSize.label1.size,
    fontWeight: typography.fontSize.label1.weight,
    color: colors.primary.black,
    marginBottom: spacing.xs,
  },
  guideDescription: {
    fontSize: typography.fontSize.body2.size,
    color: colors.neutral[600],
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  guideTags: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  guideTag: {
    backgroundColor: colors.neutral[100],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  guideTagText: {
    fontSize: typography.fontSize.body2.size,
    color: colors.neutral[600],
  },
  guideTagMore: {
    fontSize: typography.fontSize.body2.size,
    color: colors.neutral[500],
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  guideChevron: {
    fontSize: 24,
    color: colors.neutral[300],
    marginLeft: spacing.lg,
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
  modalBackButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  modalBackText: {
    fontSize: typography.fontSize.label1.size,
    fontWeight: typography.fontSize.label1.weight,
    color: colors.primary.teal,
  },
  modalTitle: {
    fontSize: typography.fontSize.h2.size,
    fontWeight: typography.fontSize.h2.weight,
    color: colors.primary.black,
  },
  modalContent: {
    flex: 1,
  },
  modalGuideContent: {
    padding: spacing.lg,
  },
  modalGuideTitle: {
    fontSize: typography.fontSize.h2.size,
    fontWeight: typography.fontSize.h2.weight,
    color: colors.primary.black,
    marginBottom: spacing.md,
  },
  modalGuideDescription: {
    fontSize: typography.fontSize.body1.size,
    color: colors.neutral[600],
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  tag: {
    backgroundColor: colors.primary.teal,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  tagText: {
    fontSize: typography.fontSize.body2.size,
    color: colors.primary.white,
    fontWeight: '600',
  },
  contentSection: {
    marginBottom: spacing.lg,
  },
  contentLabel: {
    fontSize: typography.fontSize.label1.size,
    fontWeight: typography.fontSize.label1.weight,
    color: colors.primary.black,
    marginBottom: spacing.md,
  },
  contentText: {
    fontSize: typography.fontSize.body1.size,
    color: colors.neutral[700],
    lineHeight: 24,
  },
  metaInfo: {
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    marginTop: spacing.lg,
  },
  metaLabel: {
    fontSize: typography.fontSize.body2.size,
    color: colors.neutral[500],
  },
});

export default KnowledgeBaseScreen;
