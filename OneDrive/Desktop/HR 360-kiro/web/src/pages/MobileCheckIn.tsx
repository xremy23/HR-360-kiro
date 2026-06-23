import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addCheckIn, setLoading, setError } from '../store/slices/checkinSlice';
import { AppDispatch, RootState } from '../store/store';
import apiService from '../services/apiService';
import toast from 'react-hot-toast';

type CheckInStatus = 'safe' | 'need_help';

const MobileCheckIn: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { loading } = useSelector((state: RootState) => state.checkin);
  const [status, setStatus] = useState<CheckInStatus>('safe');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const statusOptions: { value: CheckInStatus; label: string; icon: string; color: string }[] = [
    { value: 'safe', label: 'Safe', icon: '✓', color: 'bg-success' },
    { value: 'need_help', label: 'Need Help', icon: '⚠️', color: 'bg-warning' },
  ];

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    setIsSubmitting(true);
    try {
      dispatch(setLoading(true));
      
      // Map MobileCheckIn's status to the checkinSlice's CheckIn type status
      const sliceStatus: 'injured' | 'safe' = status === 'need_help' ? 'injured' : 'safe';

      const checkIn = {
        id: `${Date.now()}`,
        userId: 'current-user',
        status: sliceStatus,
        notes: notes || undefined,
        timestamp: new Date().toISOString(),
        syncStatus: 'pending' as const,
      };

      // Call API to submit check-in
      try {
        const response = await apiService.submitCheckIn({
          status: status === 'need_help' ? 'need_help' : 'safe',
          notes: notes || undefined,
        });
        if (response.success) {
          dispatch(addCheckIn(response.data ? { ...response.data, status: sliceStatus } : { ...checkIn, syncStatus: 'synced' }));
        } else {
          throw new Error(response.error?.message || 'Failed to submit check-in');
        }
      } catch (apiError) {
        // Fallback to local storage if API fails
        console.warn('API call failed, saving locally:', apiError);
        dispatch(addCheckIn(checkIn));
      }

      toast.success('Check-in submitted!');
      setTimeout(() => navigate('/'), 1500);
    } catch (error) {
      dispatch(setError((error as any).message || 'Failed to submit check-in'));
      toast.error('Failed to submit check-in');
    } finally {
      setIsSubmitting(false);
      dispatch(setLoading(false));
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white dark:bg-neutral-900 border-b border-neutral-200 sticky top-0 z-40">
        <div className="px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-neutral-100 transition text-neutral-700"
          >
            ←
          </button>
          <div>
            <h1 className="font-display text-lg font-bold text-primary-black dark:text-white">Check In</h1>
            <p className="font-sans text-xs text-neutral-500">Update your status</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 pb-24 space-y-6">
        {/* Status Selection */}
        <div>
          <label className="block font-sans text-xs font-bold text-neutral-600 uppercase tracking-wider mb-4">
            Your Status
          </label>
          <div className="grid grid-cols-2 gap-3">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setStatus(option.value)}
                className={`p-5 rounded-lg transition font-sans font-semibold text-sm ${
                  status === option.value
                    ? `${option.color} text-white shadow-md scale-105`
                    : 'bg-white dark:bg-neutral-900 text-primary-black dark:text-white border-2 border-neutral-200 hover:border-primary-teal'
                }`}
              >
                <div className="text-3xl mb-2">{option.icon}</div>
                <p className="text-xs font-bold">{option.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Notes Section */}
        <div>
          <label className="block font-sans text-xs font-bold text-neutral-600 uppercase tracking-wider mb-3">
            Additional Notes <span className="text-neutral-400 font-normal">(Optional)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any additional information..."
            className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg font-sans text-sm focus:outline-none focus:border-primary-teal focus:ring-2 focus:ring-primary-teal focus:ring-opacity-10 transition resize-none"
            rows={4}
          />
          <p className="font-sans text-xs text-neutral-500 mt-2 text-right">
            {notes.length}/500
          </p>
        </div>

        {/* Location Info */}
        <div className="bg-white dark:bg-neutral-900 rounded-lg border-l-4 border-primary-teal p-4">
          <h3 className="font-sans text-sm font-bold text-primary-black dark:text-white mb-2">📍 Location Tracking</h3>
          <p className="font-sans text-xs text-neutral-600 mb-4">
            Your location helps emergency responders find you quickly in case of emergency.
          </p>
          <button className="w-full px-4 py-2.5 border-2 border-primary-teal text-primary-teal rounded-lg font-sans text-xs font-bold uppercase tracking-wider hover:bg-primary-teal hover:bg-opacity-5 transition">
            Enable Location
          </button>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full bg-primary-teal hover:bg-primary-teal/90 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white font-sans font-bold py-4 px-4 rounded-lg transition flex items-center justify-center gap-2 active:scale-95"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <span>✓</span>
              Submit Check-In
            </>
          )}
        </button>

        {/* Info Box */}
        <div className="bg-primary-teal bg-opacity-5 rounded-lg p-4 border border-primary-teal border-opacity-20">
          <p className="font-sans text-xs text-primary-black dark:text-white">
            <strong>💡 Tip:</strong> Your check-in will be saved locally and synced when online.
          </p>
        </div>
      </main>
    </div>
  );
};

export default MobileCheckIn;

