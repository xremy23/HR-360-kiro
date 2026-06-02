/**
 * KB Guide Management Page
 * Manage knowledge base guides and help content
 */

import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { setLoading, setError, setItems, addGuide, updateGuide, deleteGuide } from '../store/slices/kbSlice';
import { colors, typography, spacing, borderRadius, shadows } from '../styles/designSystem';
import apiService, { ApiError } from '../services/apiService';

interface GuideFormData {
  title: string;
  content: string;
  category: string;
  description?: string;
  tags?: string[];
}

interface GuideStats {
  total: number;
  byCategory: { [key: string]: number };
}

const KBManagement: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { items: guides, loading, error } = useSelector((state: RootState) => state.kb);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [stats, setStats] = useState<GuideStats>({
    total: 0,
    byCategory: {},
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [formData, setFormData] = useState<GuideFormData>({
    title: '',
    content: '',
    category: 'General',
    description: '',
    tags: [],
  });

  // Fetch guides on mount
  useEffect(() => {
    const fetchGuides = async () => {
      dispatch(setLoading(true));
      try {
        const response = await apiService.getGuides({ pageSize: 100 });
        if (response.success && response.data) {
          dispatch(setItems(response.data));
          calculateStats(response.data);
        } else {
          dispatch(setError('Failed to load guides'));
        }
      } catch (err) {
        const apiError = err as ApiError;
        dispatch(setError(apiError.message || 'Failed to load guides'));
      } finally {
        dispatch(setLoading(false));
      }
    };

    fetchGuides();
  }, [dispatch]);

  const calculateStats = (guideList: any[]) => {
    const categories: { [key: string]: number } = {};
    guideList.forEach((guide) => {
      const cat = guide.category || 'General';
      categories[cat] = (categories[cat] || 0) + 1;
    });

    setStats({
      total: guideList.length,
      byCategory: categories,
    });
  };

  const handleCreateOrUpdateGuide = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.content || !formData.category) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      dispatch(setLoading(true));

      let response;
      if (editingId) {
        response = await apiService.updateGuide(editingId as string, formData);
        if (response.success && response.data) {
          dispatch(updateGuide(response.data));
        }
      } else {
        response = await apiService.createGuide(formData);
        if (response.success && response.data) {
          dispatch(addGuide(response.data));
        }
      }

      if (response.success) {
        setFormData({
          title: '',
          content: '',
          category: 'General',
          description: '',
          tags: [],
        });
        setEditingId(null);
        setShowForm(false);
        alert(editingId ? 'Guide updated successfully!' : 'Guide created successfully!');
      } else {
        dispatch(setError('Failed to save guide'));
      }
    } catch (err) {
      const apiError = err as ApiError;
      dispatch(setError(apiError.message || 'Failed to save guide'));
      alert(apiError.message || 'Failed to save guide');
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleDeleteGuide = async (id: string | number) => {
    if (confirm('Are you sure you want to delete this guide?')) {
      try {
        dispatch(setLoading(true));
        const response = await apiService.deleteGuide(id as string);
        if (response.success) {
          dispatch(deleteGuide(id));
          const updated = guides.filter((g) => g.id !== id);
          calculateStats(updated);
        }
      } catch (err) {
        const apiError = err as ApiError;
        dispatch(setError(apiError.message || 'Failed to delete guide'));
      } finally {
        dispatch(setLoading(false));
      }
    }
  };

  const handleEditGuide = (guide: any) => {
    setFormData({
      title: guide.title || '',
      content: guide.content || '',
      category: guide.category || 'General',
      description: guide.description || '',
      tags: guide.tags || [],
    });
    setEditingId(guide.id);
    setShowForm(true);
  };

  const filteredGuides = guides.filter((guide) => {
    const matchesSearch =
      guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guide.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || guide.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Object.keys(stats.byCategory);

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: colors.primary.white,
        padding: spacing.xl,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: spacing.xxl,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: typography.fontSize.display2.size,
              fontWeight: typography.fontSize.display2.weight,
              color: colors.primary.black,
              margin: 0,
            }}
          >
            Knowledge Base
          </h1>
        </div>
        <button
          onClick={() => {
            setFormData({
              title: '',
              content: '',
              category: 'General',
              description: '',
              tags: [],
            });
            setEditingId(null);
            setShowForm(!showForm);
          }}
          style={{
            padding: `${spacing.md} ${spacing.lg}`,
            backgroundColor: colors.primary.teal,
            color: colors.primary.white,
            border: 'none',
            borderRadius: borderRadius.md,
            fontSize: typography.fontSize.label1.size,
            fontWeight: typography.fontSize.label1.weight,
            cursor: 'pointer',
            boxShadow: shadows.md,
            transition: 'all 200ms ease-in-out',
          }}
        >
          {showForm ? 'Cancel' : 'Create Guide'}
        </button>
      </div>

      {/* Stats Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: spacing.lg,
          marginBottom: spacing.xxl,
        }}
      >
        <StatCard label="Total Guides" value={stats.total} color={colors.neutral[400]} />
        {categories.map((cat) => (
          <StatCard
            key={cat}
            label={cat}
            value={stats.byCategory[cat]}
            color={colors.secondary.mediumTeal}
          />
        ))}
      </div>

      {/* Search and Filter */}
      <div
        style={{
          display: 'flex',
          gap: spacing.lg,
          marginBottom: spacing.xl,
          flexWrap: 'wrap',
        }}
      >
        <input
          type="text"
          placeholder="Search guides..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: 1,
            minWidth: '200px',
            padding: spacing.md,
            fontSize: typography.fontSize.body1.size,
            border: `1px solid ${colors.neutral[300]}`,
            borderRadius: borderRadius.md,
            boxSizing: 'border-box',
          }}
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{
            padding: spacing.md,
            fontSize: typography.fontSize.body1.size,
            border: `1px solid ${colors.neutral[300]}`,
            borderRadius: borderRadius.md,
            backgroundColor: colors.primary.white,
            cursor: 'pointer',
            minWidth: '150px',
          }}
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Form */}
      {showForm && (
        <div
          style={{
            padding: spacing.xl,
            backgroundColor: colors.neutral[50],
            border: `2px solid ${colors.primary.teal}`,
            borderRadius: borderRadius.md,
            marginBottom: spacing.xl,
          }}
        >
          <h2
            style={{
              fontSize: typography.fontSize.h3.size,
              fontWeight: typography.fontSize.h3.weight,
              color: colors.primary.black,
              marginTop: 0,
              marginBottom: spacing.lg,
            }}
          >
            {editingId ? 'Edit Guide' : 'Create New Guide'}
          </h2>

          <form onSubmit={handleCreateOrUpdateGuide}>
            <div style={{ marginBottom: spacing.lg }}>
              <label style={labelStyle}>Title *</label>
              <input
                type="text"
                placeholder="Guide title..."
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: spacing.lg }}>
              <label style={labelStyle}>Description</label>
              <textarea
                placeholder="Short description..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                style={{
                  ...inputStyle,
                  minHeight: '60px',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                } as React.CSSProperties}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.lg, marginBottom: spacing.lg }}>
              <div>
                <label style={labelStyle}>Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={inputStyle}
                >
                  <option value="General">General</option>
                  <option value="Emergency Procedures">Emergency Procedures</option>
                  <option value="Contact Information">Contact Information</option>
                  <option value="Safety Guidelines">Safety Guidelines</option>
                  <option value="Evacuation">Evacuation</option>
                  <option value="Health & Wellness">Health & Wellness</option>
                  <option value="Communication">Communication</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Tags (comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. emergency, safety, important"
                  value={formData.tags?.join(', ') || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tags: e.target.value.split(',').map((t) => t.trim()),
                    })
                  }
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ marginBottom: spacing.lg }}>
              <label style={labelStyle}>Content *</label>
              <textarea
                placeholder="Guide content in markdown format..."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                style={{
                  ...inputStyle,
                  minHeight: '200px',
                  resize: 'vertical',
                  fontFamily: 'monospace',
                } as React.CSSProperties}
              />
            </div>

            <button
              type="submit"
              style={{
                padding: `${spacing.md} ${spacing.xl}`,
                backgroundColor: colors.primary.teal,
                color: colors.primary.white,
                border: 'none',
                borderRadius: borderRadius.md,
                fontSize: typography.fontSize.label1.size,
                fontWeight: typography.fontSize.label1.weight,
                cursor: 'pointer',
                boxShadow: shadows.md,
              }}
            >
              {editingId ? 'Update Guide' : 'Create Guide'}
            </button>
          </form>
        </div>
      )}

      {/* Guides List */}
      <div>
        <h2
          style={{
            fontSize: typography.fontSize.h2.size,
            fontWeight: typography.fontSize.h2.weight,
            color: colors.primary.black,
            marginBottom: spacing.lg,
          }}
        >
          Guides ({filteredGuides.length})
        </h2>

        {loading ? (
          <div style={emptyStateStyle}>Loading guides...</div>
        ) : error ? (
          <div style={{ ...emptyStateStyle, backgroundColor: colors.error, color: colors.primary.white }}>
            {error}
          </div>
        ) : filteredGuides.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
            {filteredGuides.map((guide) => (
              <div
                key={guide.id}
                style={{
                  padding: spacing.lg,
                  backgroundColor: colors.primary.white,
                  border: `2px solid ${colors.primary.teal}`,
                  borderRadius: borderRadius.md,
                  boxShadow: shadows.md,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: spacing.md }}>
                  <div style={{ flex: 1 }}>
                    <h3
                      style={{
                        fontSize: typography.fontSize.h4.size,
                        fontWeight: typography.fontSize.h4.weight,
                        color: colors.primary.black,
                        margin: 0,
                        marginBottom: spacing.sm,
                      }}
                    >
                      {guide.title}
                    </h3>
                    {guide.description && (
                      <p
                        style={{
                          fontSize: typography.fontSize.body2.size,
                          color: colors.neutral[600],
                          margin: 0,
                          marginBottom: spacing.sm,
                          lineHeight: '1.5',
                        }}
                      >
                        {guide.description}
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: spacing.md, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span
                        style={{
                          padding: `${spacing.xs} ${spacing.sm}`,
                          backgroundColor: colors.secondary.mediumTeal,
                          color: colors.primary.white,
                          borderRadius: borderRadius.sm,
                          fontSize: typography.fontSize.label2.size,
                          fontWeight: typography.fontSize.label2.weight,
                        }}
                      >
                        {guide.category}
                      </span>
                      {guide.tags?.map((tag) => (
                        <span
                          key={tag}
                          style={{
                            padding: `${spacing.xs} ${spacing.sm}`,
                            backgroundColor: colors.neutral[200],
                            color: colors.neutral[700],
                            borderRadius: borderRadius.sm,
                            fontSize: typography.fontSize.body3.size,
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: spacing.md, borderTop: `1px solid ${colors.neutral[200]}` }}>
                  <p
                    style={{
                      fontSize: typography.fontSize.caption.size,
                      color: colors.neutral[500],
                      margin: 0,
                    }}
                  >
                    {guide.createdAt && new Date(guide.createdAt).toLocaleString()}
                  </p>
                  <div style={{ display: 'flex', gap: spacing.md }}>
                    <button
                      onClick={() => handleEditGuide(guide)}
                      style={{
                        padding: `${spacing.xs} ${spacing.sm}`,
                        backgroundColor: colors.primary.teal,
                        color: colors.primary.white,
                        border: 'none',
                        borderRadius: borderRadius.sm,
                        fontSize: typography.fontSize.label2.size,
                        cursor: 'pointer',
                        transition: 'all 200ms',
                      }}
                      onMouseOver={(e) => {
                        (e.target as HTMLButtonElement).style.opacity = '0.8';
                      }}
                      onMouseOut={(e) => {
                        (e.target as HTMLButtonElement).style.opacity = '1';
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteGuide(guide.id)}
                      style={{
                        padding: `${spacing.xs} ${spacing.sm}`,
                        backgroundColor: colors.error,
                        color: colors.primary.white,
                        border: 'none',
                        borderRadius: borderRadius.sm,
                        fontSize: typography.fontSize.label2.size,
                        cursor: 'pointer',
                        transition: 'all 200ms',
                      }}
                      onMouseOver={(e) => {
                        (e.target as HTMLButtonElement).style.opacity = '0.8';
                      }}
                      onMouseOut={(e) => {
                        (e.target as HTMLButtonElement).style.opacity = '1';
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={emptyStateStyle}>
            {searchQuery || selectedCategory ? 'No guides match your search' : 'No guides yet'}
          </div>
        )}
      </div>
    </div>
  );
};

interface StatCardProps {
  label: string;
  value: number;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, color }) => (
  <div
    style={{
      padding: spacing.lg,
      backgroundColor: colors.primary.white,
      border: `2px solid ${color}`,
      borderRadius: borderRadius.md,
      boxShadow: shadows.sm,
      textAlign: 'center',
    }}
  >
    <p
      style={{
        fontSize: typography.fontSize.body2.size,
        color: colors.neutral[600],
        margin: 0,
        marginBottom: spacing.sm,
      }}
    >
      {label}
    </p>
    <p
      style={{
        fontSize: typography.fontSize.display3.size,
        fontWeight: typography.fontSize.display3.weight,
        color,
        margin: 0,
      }}
    >
      {value}
    </p>
  </div>
);

// Reusable styles
const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: typography.fontSize.label1.size,
  fontWeight: typography.fontSize.label1.weight,
  color: colors.primary.black,
  marginBottom: spacing.sm,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: spacing.md,
  fontSize: typography.fontSize.body1.size,
  border: `1px solid ${colors.neutral[300]}`,
  borderRadius: borderRadius.md,
  boxSizing: 'border-box',
};

const emptyStateStyle: React.CSSProperties = {
  padding: spacing.xl,
  backgroundColor: colors.neutral[50],
  borderRadius: borderRadius.md,
  textAlign: 'center',
  color: colors.neutral[500],
};

export default KBManagement;
