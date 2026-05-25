import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { addCheckIn } from '../store/slices/checkinSlice';
import { AppDispatch } from '../store/store';
import toast from 'react-hot-toast';

type CheckInStatus = 'safe' | 'injured' | 'missing' | 'unknown';

const MobileCheckIn: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [status, setStatus] = useState<CheckInStatus>('safe');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const statusOptions: { value: CheckInStatus; label: string; icon: string; color: string }[] = [
    { value: 'safe', label: 'Safe', icon: '✓', color: 'bg-success' },
    { value: 'injured', label: 'Injured', icon: '⚠️', color: 'bg-warning' },
    { value: 'missing', label: 'Missing', icon: '❌', color: 'bg-error' },
    { value: 'unknown', label: 'Unknown', icon: '❓', color: 'bg-neutral-400' },
  ];

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const checkIn = {
        id: `${Date.now()}`,
        userId: 'current-user',
        status,
        notes: notes || undefined,
        timestamp: new Date().toISOString(),
        syncStatus: 'pending' as const,
      };

      dispatch(addCheckIn(checkIn));
      toast.success('Check-in submitted!');
      setTimeout(() => navigate('/'), 1500);
    } catch (error) {
      toast.error('Failed to submit check-in');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
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
            <h1 className="font-display text-h3 text-primary-white">Check In</h1>
            <p className="font-sans text-body3 text-secondary-light">Update your status</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 pb-24">
        {/* Status Selection */}
        <div className="mb-8">
          <h2 className="font-sans text-h5 text-primary-black mb-4">How are you?</h2>
          <div className="grid grid-cols-2 gap-4">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setStatus(option.value)}
                className={`p-6 rounded-xl transition transform ${
                  status === option.value
                    ? `${option.color} text-primary-white shadow-lg scale-105`
                    : 'bg-primary-white text-primary-black border-2 border-neutral-200 hover:border-primary-teal'
                }`}
              >
                <div className="text-4xl mb-2">{option.icon}</div>
                <p className="font-sans text-label1 font-semibold">{option.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Notes Section */}
        <div className="mb-8">
          <label className="block font-sans text-h5 text-primary-black mb-3">
            Additional Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any additional information..."
            className="w-full px-4 py-3 border-2 border-secondary-light rounded-lg font-sans text-body2 focus:outline-none focus:border-primary-teal focus:ring-2 focus:ring-primary-teal focus:ring-opacity-20 transition resize-none"
            rows={4}
          />
          <p className="font-sans text-body3 text-neutral-500 mt-2">
            {notes.length}/500 characters
          </p>
        </div>

        {/* Location Info */}
        <div className="bg-primary-white rounded-xl p-4 mb-8 border-l-4 border-primary-teal">
          <h3 className="font-sans text-label1 text-primary-black font-semibold mb-2">
            📍 Location
          </h3>
          <p className="font-sans text-body2 text-neutral-600">
            Location tracking is ready to be enabled. Your location will help emergency responders locate you quickly.
          </p>
          <button className="mt-3 w-full px-4 py-2 border-2 border-primary-teal text-primary-teal rounded-lg font-sans text-label1 font-semibold hover:bg-primary-teal hover:text-primary-white transition">
            Enable Location
          </button>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full bg-primary-teal hover:bg-secondary-medium disabled:bg-neutral-400 text-primary-white font-sans font-semibold py-4 rounded-lg transition flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-primary-white border-t-transparent rounded-full animate-spin"></div>
              Submitting...
            </>
          ) : (
            '✓ Submit Check-In'
          )}
        </button>

        {/* Info Box */}
        <div className="mt-6 bg-secondary-light bg-opacity-10 rounded-lg p-4 border border-secondary-light border-opacity-30">
          <p className="font-sans text-body3 text-primary-black">
            <strong>💡 Tip:</strong> Your check-in will be saved locally and synced when you're online.
          </p>
        </div>
      </main>
    </div>
  );
};

export default MobileCheckIn;
