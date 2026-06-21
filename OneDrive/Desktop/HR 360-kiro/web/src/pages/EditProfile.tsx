import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import toast from 'react-hot-toast';
import apiService, { ApiError } from '../services/apiService';

const EditProfile: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    address: '',
    latitude: '',
    longitude: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
  });

  useEffect(() => {
    // Initialize form with user data
    if (user) {
      setFormData({
        firstName: user.name?.split(' ')[0] || '',
        lastName: user.name?.split(' ').slice(1).join(' ') || '',
        address: '',
        latitude: '',
        longitude: '',
        emergencyContactName: user.emergencyContactName || '',
        emergencyContactPhone: user.emergencyContactPhone || '',
        emergencyContactRelationship: user.emergencyContactRelationship || '',
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName.trim()) {
      toast.error('First name is required');
      return;
    }

    setLoading(true);
    try {
      const updateData: any = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
      };

      if (formData.address.trim()) {
        updateData.address = formData.address.trim();
      }

      if (formData.latitude && formData.longitude) {
        updateData.latitude = parseFloat(formData.latitude);
        updateData.longitude = parseFloat(formData.longitude);
      }

      // Add emergency contact info if provided
      if (formData.emergencyContactName.trim()) {
        updateData.emergencyContactName = formData.emergencyContactName.trim();
        updateData.emergencyContactPhone = formData.emergencyContactPhone.trim();
        updateData.emergencyContactRelationship = formData.emergencyContactRelationship.trim();
      }

      const response = await apiService.updateUserProfile(updateData);

      if (response.success) {
        toast.success('Profile updated successfully!');
        navigate(-1);
      } else {
        toast.error('Failed to update profile');
      }
    } catch (error: any) {
      const apiError = error as ApiError;
      toast.error(apiError.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary-teal to-secondary-medium sticky top-0 z-40 shadow-md">
        <div className="px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-secondary-light hover:bg-opacity-20 transition text-primary-white"
          >
            ←
          </button>
          <div>
            <h1 className="font-display text-h3 text-primary-white">Edit Profile</h1>
            <p className="font-sans text-body3 text-secondary-light">Update your information</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 pb-24 max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="bg-primary-white rounded-xl shadow-md p-6">
            <h2 className="font-sans text-h5 text-primary-black dark:text-white font-semibold mb-4">
              Personal Information
            </h2>

            <div className="space-y-4">
              {/* First Name */}
              <div>
                <label className="block font-sans text-label1 text-primary-black dark:text-white font-semibold mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Enter your first name"
                  className="w-full px-4 py-3 border-2 border-neutral-200 dark:border-neutral-700 rounded-lg font-sans text-body2 focus:outline-none focus:border-primary-teal focus:ring-2 focus:ring-primary-teal focus:ring-opacity-20 transition"
                  disabled={loading}
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="block font-sans text-label1 text-primary-black dark:text-white font-semibold mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Enter your last name"
                  className="w-full px-4 py-3 border-2 border-neutral-200 dark:border-neutral-700 rounded-lg font-sans text-body2 focus:outline-none focus:border-primary-teal focus:ring-2 focus:ring-primary-teal focus:ring-opacity-20 transition"
                  disabled={loading}
                />
              </div>

              {/* Email (Read-only) */}
              <div>
                <label className="block font-sans text-label1 text-primary-black dark:text-white font-semibold mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  placeholder="Your email"
                  className="w-full px-4 py-3 border-2 border-neutral-200 dark:border-neutral-700 rounded-lg font-sans text-body2 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 cursor-not-allowed"
                  disabled
                />
                <p className="font-sans text-label3 text-neutral-600 mt-1">
                  Email cannot be changed
                </p>
              </div>

              {/* Address */}
              <div>
                <label className="block font-sans text-label1 text-primary-black dark:text-white font-semibold mb-2">
                  Address (Optional)
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter your address"
                  className="w-full px-4 py-3 border-2 border-neutral-200 dark:border-neutral-700 rounded-lg font-sans text-body2 focus:outline-none focus:border-primary-teal focus:ring-2 focus:ring-primary-teal focus:ring-opacity-20 transition"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div className="bg-primary-white rounded-xl shadow-md p-6">
            <h2 className="font-sans text-h5 text-primary-black dark:text-white font-semibold mb-4">
              Location (Optional)
            </h2>

            <div className="space-y-4">
              {/* Latitude */}
              <div>
                <label className="block font-sans text-label1 text-primary-black dark:text-white font-semibold mb-2">
                  Latitude
                </label>
                <input
                  type="number"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleChange}
                  placeholder="e.g., 40.7128"
                  step="0.0001"
                  className="w-full px-4 py-3 border-2 border-neutral-200 dark:border-neutral-700 rounded-lg font-sans text-body2 focus:outline-none focus:border-primary-teal focus:ring-2 focus:ring-primary-teal focus:ring-opacity-20 transition"
                  disabled={loading}
                />
              </div>

              {/* Longitude */}
              <div>
                <label className="block font-sans text-label1 text-primary-black dark:text-white font-semibold mb-2">
                  Longitude
                </label>
                <input
                  type="number"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleChange}
                  placeholder="e.g., -74.0060"
                  step="0.0001"
                  className="w-full px-4 py-3 border-2 border-neutral-200 dark:border-neutral-700 rounded-lg font-sans text-body2 focus:outline-none focus:border-primary-teal focus:ring-2 focus:ring-primary-teal focus:ring-opacity-20 transition"
                  disabled={loading}
                />
              </div>

              <p className="font-sans text-label3 text-neutral-600">
                📍 Provide your coordinates for location-based features
              </p>
            </div>
          </div>

          {/* Emergency Contact Information */}
          <div className="bg-primary-white rounded-xl shadow-md p-6">
            <h2 className="font-sans text-h5 text-primary-black dark:text-white font-semibold mb-2 flex items-center gap-2">
              🆘 Emergency Contact
            </h2>
            <p className="font-sans text-body3 text-neutral-600 dark:text-neutral-400 mb-4">
              Your emergency contact will be notified if needed
            </p>

            <div className="space-y-4">
              {/* Emergency Contact Name */}
              <div>
                <label className="block font-sans text-label1 text-primary-black dark:text-white font-semibold mb-2">
                  Contact Name (Optional)
                </label>
                <input
                  type="text"
                  name="emergencyContactName"
                  value={formData.emergencyContactName}
                  onChange={handleChange}
                  placeholder="e.g., John Doe"
                  className="w-full px-4 py-3 border-2 border-neutral-200 dark:border-neutral-700 rounded-lg font-sans text-body2 focus:outline-none focus:border-primary-teal focus:ring-2 focus:ring-primary-teal focus:ring-opacity-20 transition"
                  disabled={loading}
                />
              </div>

              {/* Emergency Contact Phone */}
              <div>
                <label className="block font-sans text-label1 text-primary-black dark:text-white font-semibold mb-2">
                  Contact Phone (Optional)
                </label>
                <input
                  type="tel"
                  name="emergencyContactPhone"
                  value={formData.emergencyContactPhone}
                  onChange={handleChange}
                  placeholder="e.g., +63 917 123-4567"
                  className="w-full px-4 py-3 border-2 border-neutral-200 dark:border-neutral-700 rounded-lg font-sans text-body2 focus:outline-none focus:border-primary-teal focus:ring-2 focus:ring-primary-teal focus:ring-opacity-20 transition"
                  disabled={loading}
                />
              </div>

              {/* Emergency Contact Relationship */}
              <div>
                <label className="block font-sans text-label1 text-primary-black dark:text-white font-semibold mb-2">
                  Relationship (Optional)
                </label>
                <select
                  name="emergencyContactRelationship"
                  value={formData.emergencyContactRelationship}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    emergencyContactRelationship: e.target.value
                  }))}
                  className="w-full px-4 py-3 border-2 border-neutral-200 dark:border-neutral-700 rounded-lg font-sans text-body2 focus:outline-none focus:border-primary-teal focus:ring-2 focus:ring-primary-teal focus:ring-opacity-20 transition"
                  disabled={loading}
                >
                  <option value="">Select a relationship</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Parent">Parent</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Child">Child</option>
                  <option value="Friend">Friend</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 px-4 py-3 bg-neutral-200 text-primary-black dark:text-white rounded-lg font-sans font-semibold hover:bg-neutral-300 transition disabled:opacity-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-primary-teal text-primary-white rounded-lg font-sans font-semibold hover:bg-secondary-medium transition disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default EditProfile;

