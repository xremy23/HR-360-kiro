import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../store/store';
import toast from 'react-hot-toast';
import { chatbotService } from '../services/chatbotService';
import { indexedDBService } from '../services/indexedDBService';

interface Message {
  id: string;
  userMessage: string;
  botResponse: string;
  context?: {
    relatedGuideIds?: string[];
    confidence?: number;
    keywords?: string[];
  };
  suggestedGuides?: any[];
  isHelpful?: boolean;
  createdAt: Date;
  isOffline?: boolean;
}

const Chatbot: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversation history on mount
  useEffect(() => {
    loadConversationHistory();
    
    // Listen for online/offline changes
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /**
   * Load conversation history from API or IndexedDB (offline)
   */
  const loadConversationHistory = async () => {
    try {
      if (isOnline) {
        // Load from API using chatbotService
        const history = await chatbotService.getConversationHistory(50, 0);
        if (history && history.messages) {
          setMessages(history.messages.map((msg: any) => ({
            ...msg,
            createdAt: new Date(msg.createdAt),
            isOffline: false,
          })));
        }
      } else {
        // Load from IndexedDB
        const cachedMessages = await indexedDBService.getKBGuides();
        setMessages(cachedMessages.map((msg: any) => ({
          ...msg,
          createdAt: new Date(msg.createdAt),
          isOffline: true,
        })));
      }
    } catch (error) {
      console.error('Failed to load conversation history:', error);
      // Try to load from IndexedDB as fallback
      try {
        const cachedMessages = await indexedDBService.getKBGuides();
        setMessages(cachedMessages);
      } catch (dbError) {
        console.error('Failed to load from IndexedDB:', dbError);
      }
    }
  };

  /**
   * Send message to chatbot
   */
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim()) {
      toast.error('Please enter a message');
      return;
    }

    if (inputValue.length > 5000) {
      toast.error('Message is too long (max 5000 characters)');
      return;
    }

    const userMessage = inputValue;
    setInputValue('');
    setIsLoading(true);

    try {
      if (isOnline) {
        // Send to API using chatbotService
        const response = await chatbotService.sendMessage(userMessage);
        
        if (response) {
          const newMessage: Message = {
            id: response.context?.relatedGuideIds?.[0] || `msg_${Date.now()}`,
            userMessage,
            botResponse: response.message,
            context: response.context,
            suggestedGuides: response.suggestedGuides,
            createdAt: new Date(),
            isOffline: false,
          };
          
          setMessages([...messages, newMessage]);
          
          // Cache message in IndexedDB
          await indexedDBService.saveKBGuides([newMessage]);
          
          toast.success('Message sent');
        } else {
          toast.error('Failed to send message');
        }
      } else {
        // Offline mode - use local processing
        const offlineResponse = await chatbotService.processMessageOffline(userMessage);
        
        const newMessage: Message = {
          id: `msg_${Date.now()}`,
          userMessage,
          botResponse: offlineResponse.message,
          context: offlineResponse.context,
          suggestedGuides: offlineResponse.suggestedGuides,
          createdAt: new Date(),
          isOffline: true,
        };
        
        setMessages([...messages, newMessage]);
        
        // Cache message in IndexedDB
        await indexedDBService.saveKBGuides([newMessage]);
        
        toast.success('Message processed offline');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Record feedback on message
   */
  const handleFeedback = async (messageId: string, isHelpful: boolean) => {
    try {
      if (isOnline) {
        await chatbotService.recordFeedback(messageId, isHelpful);
        toast.success(isHelpful ? 'Thanks for the feedback!' : 'We\'ll improve');
      } else {
        toast.info('Feedback will be sent when you go online');
      }

      // Update local message
      setMessages(messages.map(msg => 
        msg.id === messageId ? { ...msg, isHelpful } : msg
      ));
    } catch (error) {
      console.error('Error recording feedback:', error);
      toast.error('Failed to record feedback');
    }
  };

  /**
   * Clear conversation history
   */
  const handleClearHistory = async () => {
    if (!window.confirm('Are you sure you want to clear your conversation history?')) {
      return;
    }

    try {
      if (isOnline) {
        await chatbotService.clearConversationHistory();
      }
      
      // Clear from IndexedDB
      await indexedDBService.saveKBGuides([]);
      setMessages([]);
      toast.success('Conversation history cleared');
    } catch (error) {
      console.error('Error clearing history:', error);
      toast.error('Failed to clear history');
    }
  };

  /**
   * Navigate back to home screen
   */
  const handleGoBack = () => {
    navigate('/');
  };

  return (
    <div className="flex flex-col h-full bg-neutral-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-teal to-secondary-medium p-4 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-h4 text-primary-white">HR 360 Assistant</h2>
            <p className="font-sans text-body3 text-secondary-light">
              {isOnline ? '🟢 Online' : '🔴 Offline Mode'}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleClearHistory}
              className="px-3 py-2 bg-secondary-light hover:bg-secondary-medium text-primary-white rounded-lg font-sans text-label2 transition"
            >
              Clear History
            </button>
            <button
              onClick={handleGoBack}
              className="px-3 py-2 bg-secondary-light hover:bg-secondary-medium text-primary-white rounded-lg font-sans text-label2 transition"
            >
              ← Back
            </button>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-5xl mb-4">💬</div>
              <h3 className="font-sans text-h5 text-primary-black mb-2">Start a Conversation</h3>
              <p className="font-sans text-body2 text-neutral-600">
                Ask me anything about emergency procedures, safety guidelines, or organizational policies.
              </p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="space-y-3">
              {/* User Message */}
              <div className="flex justify-end">
                <div className="max-w-xs bg-primary-teal text-primary-white rounded-lg p-3 shadow-md">
                  <p className="font-sans text-body2">{message.userMessage}</p>
                  <p className="font-sans text-label3 text-secondary-light mt-1">
                    {new Date(message.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>

              {/* Bot Response */}
              <div className="flex justify-start">
                <div className="max-w-xs bg-primary-white border-2 border-neutral-200 rounded-lg p-3 shadow-md">
                  <p className="font-sans text-body2 text-primary-black whitespace-pre-wrap">
                    {message.botResponse}
                  </p>
                  
                  {/* Confidence Badge */}
                  {message.context?.confidence !== undefined && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="font-sans text-label3 text-neutral-600">
                        Confidence: {Math.round(message.context.confidence * 100)}%
                      </span>
                      {message.isOffline && (
                        <span className="font-sans text-label3 bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                          Offline
                        </span>
                      )}
                    </div>
                  )}

                  {/* Suggested Guides */}
                  {message.suggestedGuides && message.suggestedGuides.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-neutral-200">
                      <p className="font-sans text-label2 text-primary-black font-semibold mb-2">
                        Related Topics:
                      </p>
                      <div className="space-y-1">
                        {message.suggestedGuides.map((guide) => (
                          <div
                            key={guide.id}
                            className="font-sans text-label3 text-primary-teal hover:underline cursor-pointer"
                          >
                            • {guide.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Feedback Buttons */}
                  {!message.isHelpful && (
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => handleFeedback(message.id, true)}
                        className="flex-1 px-2 py-1 bg-green-100 hover:bg-green-200 text-green-800 rounded font-sans text-label3 transition"
                      >
                        👍 Helpful
                      </button>
                      <button
                        onClick={() => handleFeedback(message.id, false)}
                        className="flex-1 px-2 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded font-sans text-label3 transition"
                      >
                        👎 Not Helpful
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="border-t border-neutral-200 bg-primary-white p-4 shadow-lg">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask me anything..."
            disabled={isLoading}
            className="flex-1 px-4 py-3 border-2 border-neutral-200 rounded-lg font-sans text-body2 focus:outline-none focus:border-primary-teal focus:ring-2 focus:ring-primary-teal focus:ring-opacity-20 transition disabled:bg-neutral-100"
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="px-6 py-3 bg-primary-teal hover:bg-secondary-medium disabled:bg-neutral-300 text-primary-white font-sans font-semibold rounded-lg transition"
          >
            {isLoading ? '⏳' : '📤'}
          </button>
        </form>
        
        {!isOnline && (
          <p className="font-sans text-label3 text-yellow-700 mt-2 bg-yellow-50 p-2 rounded">
            ⚠️ You are offline. Responses are based on cached knowledge base.
          </p>
        )}
      </div>
    </div>
  );
};

export default Chatbot;
