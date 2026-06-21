import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { Plus, Trash2, ThumbsUp, MapPin, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

interface CommunityReport {
  id: string;
  title: string;
  description: string;
  category: 'natural_disaster' | 'hazard' | 'safety_concern' | 'infrastructure' | 'other';
  severity: 'low' | 'medium' | 'high';
  location?: { latitude: number; longitude: number; address?: string };
  imageUrls?: string[];
  status: 'active' | 'resolved' | 'archived';
  upvotes: number;
  upvotedBy?: string[];
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  userId: string;
  userName?: string;
}

const CommunityReporting: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { token, user } = useSelector((state: RootState) => state.auth);
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'hazard' as const,
    severity: 'medium' as const,
    address: '',
    latitude: '',
    longitude: '',
  });

  // Fetch reports on mount
  useEffect(() => {
    fetchReports();
  }, [token]);

  const fetchReports = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/community-reports`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setReports(data.data || []);
      } else if (response.status !== 401) {
        toast.error('Failed to fetch community reports');
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Error loading community reports');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Title and description are required');
      return;
    }

    try {
      const payload: any = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        severity: formData.severity,
      };

      // Add location if coordinates provided
      if (formData.latitude && formData.longitude) {
        payload.location = {
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
          address: formData.address,
        };
      }

      const response = await fetch(`${apiUrl}/community-reports`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success('Report created successfully');
        setFormData({
          title: '',
          description: '',
          category: 'hazard',
          severity: 'medium',
          address: '',
          latitude: '',
          longitude: '',
        });
        setShowForm(false);
        fetchReports();
      } else {
        toast.error('Failed to create report');
      }
    } catch (error) {
      console.error('Error creating report:', error);
      toast.error('Error creating report');
    }
  };

  const handleDelete = async (reportId: string) => {
    if (!token) return;

    if (!window.confirm('Are you sure you want to delete this report?')) return;

    try {
      const response = await fetch(`${apiUrl}/community-reports/${reportId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success('Report deleted');
        fetchReports();
      } else {
        toast.error('Failed to delete report');
      }
    } catch (error) {
      console.error('Error deleting report:', error);
      toast.error('Error deleting report');
    }
  };

  const handleUpvote = async (reportId: string, isUpvoted: boolean) => {
    if (!token) return;

    try {
      const method = isUpvoted ? 'DELETE' : 'POST';
      const response = await fetch(`${apiUrl}/community-reports/${reportId}/upvote`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchReports();
      } else {
        toast.error('Failed to update upvote');
      }
    } catch (error) {
      console.error('Error upvoting report:', error);
      toast.error('Error updating upvote');
    }
  };

  const filteredReports = reports.filter((report) => {
    const severityMatch = filter === 'all' || report.severity === filter;
    const categoryMatch = categoryFilter === 'all' || report.category === categoryFilter;
    const statusMatch = report.status !== 'archived';
    return severityMatch && categoryMatch && statusMatch;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'medium':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'low':
        return 'bg-green-100 border-green-300 text-green-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return '🔴';
      case 'medium':
        return '🟡';
      case 'low':
        return '🟢';
      default:
        return '⚪';
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      natural_disaster: '🌍 Natural Disaster',
      hazard: '⚠️ Hazard',
      safety_concern: '🛡️ Safety Concern',
      infrastructure: '🏗️ Infrastructure',
      other: '📌 Other',
    };
    return labels[category] || category;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const expiresIn = (expiresAt: string) => {
    const date = new Date(expiresAt);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / 86400000);

    if (diffDays <= 0) return 'Expired';
    if (diffDays === 1) return 'Expires tomorrow';
    return `Expires in ${diffDays} days`;
  };

  const isReportOwner = (reportUserId: string) => user?.id === reportUserId;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Community Reports</h1>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
            >
              <Plus size={20} />
              New Report
            </button>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Share local hazards and safety concerns with your community. Reports auto-purge after 7 days.
          </p>
        </div>

        {/* Create Form */}
        {showForm && (
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Create New Report</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Brief title for your report"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg dark:bg-neutral-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed description of the hazard or concern"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg dark:bg-neutral-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Category & Severity */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg dark:bg-neutral-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="natural_disaster">Natural Disaster</option>
                    <option value="hazard">Hazard</option>
                    <option value="safety_concern">Safety Concern</option>
                    <option value="infrastructure">Infrastructure</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Severity
                  </label>
                  <select
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg dark:bg-neutral-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Location (Optional)
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Location address or description"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg dark:bg-neutral-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    placeholder="Latitude"
                    className="px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg dark:bg-neutral-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    placeholder="Longitude"
                    className="px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg dark:bg-neutral-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition font-medium"
                >
                  Create Report
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-gray-800 dark:text-white px-4 py-2 rounded-lg transition font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md p-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Severity
              </label>
              <div className="flex gap-2">
                {(['all', 'high', 'medium', 'low'] as const).map((sev) => (
                  <button
                    key={sev}
                    onClick={() => setFilter(sev)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                      filter === sev
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 dark:bg-neutral-700 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-neutral-600'
                    }`}
                  >
                    {sev === 'all' ? 'All' : sev.charAt(0).toUpperCase() + sev.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-1 border border-gray-300 dark:border-neutral-600 rounded-lg dark:bg-neutral-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">All Categories</option>
                <option value="natural_disaster">Natural Disaster</option>
                <option value="hazard">Hazard</option>
                <option value="safety_concern">Safety Concern</option>
                <option value="infrastructure">Infrastructure</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Reports List */}
        {loading ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            <p>Loading reports...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="text-center bg-white dark:bg-neutral-800 rounded-lg p-8">
            <AlertCircle size={48} className="mx-auto mb-2 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400">No reports found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReports.map((report) => (
              <div
                key={report.id}
                className={`border-l-4 rounded-lg shadow-md p-5 transition hover:shadow-lg dark:bg-neutral-800 ${getSeverityColor(report.severity)}`}
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{report.title}</h3>
                    <p className="text-sm opacity-75">{getCategoryLabel(report.category)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getSeverityIcon(report.severity)}</span>
                    {isReportOwner(report.userId) && (
                      <button
                        onClick={() => handleDelete(report.id)}
                        className="text-red-600 hover:text-red-800 transition"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="mb-3">{report.description}</p>

                {/* Location */}
                {report.location && (
                  <div className="flex items-center gap-2 mb-3 text-sm opacity-75">
                    <MapPin size={16} />
                    <span>{report.location.address || `${report.location.latitude}, ${report.location.longitude}`}</span>
                  </div>
                )}

                {/* Status and Expiry */}
                <div className="flex gap-4 text-sm opacity-75 mb-3">
                  <div className="flex items-center gap-1">
                    {report.status === 'active' ? (
                      <>
                        <Clock size={16} />
                        <span>{expiresIn(report.expiresAt)}</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={16} />
                        <span className="capitalize">{report.status}</span>
                      </>
                    )}
                  </div>
                  <span>{formatDate(report.createdAt)}</span>
                </div>

                {/* Upvote Button */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUpvote(report.id, report.upvotedBy?.includes(user?.id || '') || false)}
                    className={`flex items-center gap-1 px-3 py-1 rounded-lg transition text-sm ${
                      report.upvotedBy?.includes(user?.id || '')
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 dark:bg-neutral-700 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-neutral-600'
                    }`}
                  >
                    <ThumbsUp size={16} />
                    <span>{report.upvotes}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityReporting;
