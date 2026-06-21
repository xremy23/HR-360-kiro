import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Chatbot from './Chatbot';

/**
 * Floating Chatbot Button
 * Provides quick access to chatbot from anywhere in the app
 * Can be toggled between floating button and full-screen modal
 */

const ChatbotButton: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenChatbot = () => {
    // Option 1: Navigate to chatbot page
    navigate('/chatbot');
    
    // Option 2: Open in modal (uncomment to use)
    // setIsOpen(true);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={handleOpenChatbot}
        className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-gradient-to-r from-primary-teal to-secondary-medium text-primary-white shadow-lg hover:shadow-xl transform hover:scale-110 transition flex items-center justify-center z-30 animate-pulse"
        title="Open HR 360 Assistant"
      >
        <span className="text-2xl">💬</span>
      </button>

      {/* Modal (Optional - currently disabled) */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-end">
          <div className="w-full h-3/4 bg-primary-white rounded-t-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700">
              <h2 className="font-display text-h4 text-primary-black dark:text-white">HR 360 Assistant</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
              >
                ✕
              </button>
            </div>
            <div className="h-full overflow-hidden">
              <Chatbot />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatbotButton;

