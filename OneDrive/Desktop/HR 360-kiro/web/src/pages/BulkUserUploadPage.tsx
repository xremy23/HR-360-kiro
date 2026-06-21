/**
 * Bulk User Upload Page
 * HR Admin interface for importing users in bulk from CSV
 */

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { BulkUserUpload } from '../components/BulkUserUpload';

interface BulkUserUploadPageProps {
  onBack?: () => void;
  darkMode?: boolean;
}

export const BulkUserUploadPage: React.FC<BulkUserUploadPageProps> = ({ onBack, darkMode = true }) => {
  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      {/* Header with Back Button */}
      <div className="border-b border-gray-700 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className={`flex items-center gap-2 px-3 py-2 rounded ${
                darkMode
                  ? 'bg-gray-800 hover:bg-gray-700'
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              <ArrowLeft size={18} />
              Back
            </button>
          )}
          <h1 className="text-2xl font-bold">Bulk User Import</h1>
        </div>
      </div>

      {/* Content */}
      <div className={`p-6 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
        <BulkUserUpload />
      </div>
    </div>
  );
};

export default BulkUserUploadPage;
