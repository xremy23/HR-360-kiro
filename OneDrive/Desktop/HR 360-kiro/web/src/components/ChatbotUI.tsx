/**
 * ChatbotUI Component
 * Main chatbot interface with message display and input
 */

import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import {
  setLoading,
  setError,
  setMessages,
  addMessage,
  setMessageFeedback,
  setOnlineStatus,
  clearMessages,
} from '../store/slices/chatbotSlice';
import { apiService } from '../services/apiService';
import { indexedDBService } from '../services/indexedDBService';
import { colors, typography, spacing, borderRadius, shadows } from '../styles/designSystem';
import ChatMessage from './ChatMessage';
import ChatFeedbackButtons from './ChatFeedbackButtons';
import toast from 'react-hot-toast';

const ChatbotUI: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { messages, loading, error, isOnline } = useSelector((state: RootState) => state.chatbot);
  const { user } = useSelector((state: RootState) => state.auth);

  const [inputValue, setInputValue] = useState('');
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat history on mount
  useEffect(() => {
    loadChatHistory();

    // Listen for online/offline changes
    const handleOnline = () => {
      dispatch(setOnlineStatus(true));
      toast.success('Back online!');
    };

    const handleOffline = () => {
      dispatch(setOnlineStatus(false));
      toast.error('You are offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [dispatch]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /**
   * Load chat history from API or IndexedDB
   */
  const loadChatHistory = async () => {
    try {
      setIsLoadingHistory(true);

      if (isOnline && navigator.onLine) {
        // Load from API
        const response = await apiService.getChatHistory({ limit: 50, offset: 0 });
        if (response.success && response.data) {
          dispatch(setMessages(response.data.messages || []));
        } else {
          dispatch(setError('Failed to load chat history'));
        }
      } else {
        // Load from IndexedDB (offline)
        const cachedMessages = await indexedDBService.getKBGuides();
        dispatch(setMessages(cachedMessages || []));
      }
    } catch (err) {
      console.error('Error loading chat history:', err);
      dispatch(setError('Failed to load chat history'));

      // Try IndexedDB as fallback
      try {
        const cachedMessages = await indexedDBService.getKBGuides();
        dispatch(setMessages(cachedMessages || []));
      } catch (dbErr) {
        console.error('Failed to load from IndexedDB:', dbErr);
      }
    } finally {
      setIsLoadingHistory(false);
    }
  };

  /**
   * Detect language from user input
   */
  const detectLanguage = (text: string): 'en' | 'tl' | 'ceb' => {
    // Tagalog indicators
    const tagalogIndicators = /\b(ano|kung|para|ang|nang|sa|ko|mo|ay|na|ng|kami|tayo|sila|kayo|ito|iyan|dito|diyan|narito|nariyan|bakit|kailan|nasaan|paano|salamat|puwede|ayos|dahil|talaga|sige|naman)\b/i;
    
    // Bisaya/Cebuano indicators
    const bisayaIndicators = /\b(unsa|kung|para|ang|nang|sa|ko|mo|kami|kayo|sila|ito|ato|diri|didto|ngano|kailan|asa|pagano|tayo|sala|baylo|bulbuli|usa|dugay)\b/i;

    const tagalogMatches = (text.match(tagalogIndicators) || []).length;
    const bisayaMatches = (text.match(bisayaIndicators) || []).length;

    if (bisayaMatches > tagalogMatches && bisayaMatches > 0) {
      return 'ceb';
    } else if (tagalogMatches > 0) {
      return 'tl';
    }
    return 'en';
  };

  /**
   * Send message to chatbot
   */
  const handleSendMessage = async (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!inputValue.trim()) {
      toast.error('Please enter a message');
      return;
    }

    if (inputValue.length > 5000) {
      toast.error('Message is too long (max 5000 characters)');
      return;
    }

    const userQuestion = inputValue;
    const detectedLanguage = detectLanguage(userQuestion);
    setInputValue('');
    dispatch(setLoading(true));

    try {
      if (isOnline && navigator.onLine) {
        // Send to API with language parameter
        const response = await apiService.saveChatMessage({
          userQuestion,
          language: detectedLanguage,
          context: {},
        });

        if (response.success && response.data) {
          const newMessage = {
            id: response.data.id,
            userQuestion,
            botResponse: response.data.botResponse,
            context: response.data.context,
            createdAt: response.data.createdAt,
          };

          dispatch(addMessage(newMessage));

          // Cache in IndexedDB
          await indexedDBService.saveKBGuides([newMessage]);

          toast.success('Message sent');
        } else {
          toast.error('Failed to send message');
          dispatch(setError('Failed to send message'));
        }
      } else {
        // Offline mode - create local message
        const offlineMessage = {
          id: `msg_${Date.now()}`,
          userQuestion,
          botResponse: 'This is an offline response. Your message will be sent when you go online.',
          context: {},
          createdAt: new Date().toISOString(),
        };

        dispatch(addMessage(offlineMessage));

        // Cache in IndexedDB
        await indexedDBService.saveKBGuides([offlineMessage]);

        toast.success('Message saved offline');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error('Failed to send message');
      dispatch(setError('Failed to send message'));
    } finally {
      dispatch(setLoading(false));
    }
  };

  /**
   * Handle feedback on message
   */
  const handleFeedback = async (messageId: string, isHelpful: boolean) => {
    try {
      if (isOnline && navigator.onLine) {
        await apiService.submitChatFeedback(messageId, {
          isHelpful,
          feedbackText: '',
        });
      }

      dispatch(setMessageFeedback({ messageId, isHelpful }));
      toast.success(isHelpful ? 'Thanks for the feedback!' : 'We\'ll improve');
    } catch (err) {
      console.error('Error submitting feedback:', err);
      toast.error('Failed to submit feedback');
    }
  };

  /**
   * Clear chat history
   */
  const handleClearHistory = async () => {
    if (!window.confirm('Are you sure you want to clear your conversation history?')) {
      return;
    }

    try {
      if (isOnline && navigator.onLine) {
        // Could call an API endpoint to clear server-side history
        // await apiService.clearChatHistory();
      }

      // Clear from IndexedDB
      await indexedDBService.saveKBGuides([]);
      dispatch(clearMessages());
      toast.success('Conversation history cleared');
    } catch (err) {
      console.error('Error clearing history:', err);
      toast.error('Failed to clear history');
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: colors.neutral[50],
      }}
    >
      {/* Header */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e5e7eb',
          padding: spacing.lg,
          boxShadow: 'none',
          color: colors.primary.black,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2
              style={{
                fontSize: typography.fontSize.h4.size,
                fontWeight: 'bold',
                margin: 0,
                marginBottom: spacing.sm,
                color: colors.primary.black,
              }}
            >
              HR 360 Assistant
            </h2>
            <p
              style={{
                fontSize: typography.fontSize.body3.size,
                margin: 0,
                color: colors.neutral[600],
              }}
            >
              {isOnline && navigator.onLine ? '🟢 Online' : '🔴 Offline Mode'}
            </p>
          </div>

          <button
            onClick={handleClearHistory}
            style={{
              padding: `${spacing.sm} ${spacing.lg}`,
              backgroundColor: colors.primary.teal,
              color: colors.primary.white,
              border: 'none',
              borderRadius: '6px',
              fontSize: typography.fontSize.label2.size,
              fontWeight: typography.fontSize.label2.weight,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.backgroundColor = colors.primary.darkTeal;
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.backgroundColor = colors.primary.teal;
            }}
          >
            🗑️ Clear
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: spacing.lg,
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.lg,
        }}
      >
        {isLoadingHistory ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: spacing.md }}>⏳</div>
              <p
                style={{
                  fontSize: typography.fontSize.body2.size,
                  color: colors.neutral[600],
                }}
              >
                Loading chat history...
              </p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '64px', marginBottom: spacing.md }}>💬</div>
              <h3
                style={{
                  fontSize: typography.fontSize.h4.size,
                  fontWeight: typography.fontSize.h4.weight,
                  color: colors.primary.black,
                  marginBottom: spacing.md,
                }}
              >
                Start a Conversation
              </h3>
              <p
                style={{
                  fontSize: typography.fontSize.body2.size,
                  color: colors.neutral[600],
                  maxWidth: '300px',
                }}
              >
                Ask me anything about emergency procedures, safety guidelines, or organizational policies.
              </p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id}>
              <ChatMessage
                id={message.id}
                userQuestion={message.userQuestion}
                botResponse={message.botResponse}
                context={message.context}
                isHelpful={message.isHelpful}
                createdAt={message.createdAt}
                onFeedback={handleFeedback}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: spacing.sm }}>
                <ChatFeedbackButtons
                  messageId={message.id}
                  isHelpful={message.isHelpful}
                  onFeedback={handleFeedback}
                />
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error Message */}
      {error && (
        <div
          style={{
            padding: spacing.md,
            backgroundColor: colors.error,
            color: colors.primary.white,
            fontSize: typography.fontSize.body3.size,
            textAlign: 'center',
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* Offline Warning */}
      {!isOnline && !navigator.onLine && (
        <div
          style={{
            padding: spacing.md,
            backgroundColor: colors.warning,
            color: colors.primary.white,
            fontSize: typography.fontSize.body3.size,
            textAlign: 'center',
          }}
        >
          📡 You are offline. Responses are based on cached knowledge base.
        </div>
      )}

      {/* Input Form */}
      <div
        style={{
          borderTop: `1px solid ${colors.neutral[200]}`,
          backgroundColor: colors.primary.white,
          padding: spacing.lg,
          boxShadow: 'none',
        }}
      >
        <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: spacing.md }}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
            placeholder="Ask me anything..."
            disabled={loading}
            style={{
              flex: 1,
              padding: spacing.md,
              border: `2px solid ${colors.neutral[200]}`,
              borderRadius: '8px',
              fontSize: typography.fontSize.body2.size,
              fontFamily: 'inherit',
              transition: 'all 0.2s',
              outline: 'none',
            }}
            onFocus={(e) => {
              (e.target as HTMLInputElement).style.borderColor = colors.primary.teal;
              (e.target as HTMLInputElement).style.boxShadow = `0 0 0 3px ${colors.primary.teal}20`;
            }}
            onBlur={(e) => {
              (e.target as HTMLInputElement).style.borderColor = colors.neutral[200];
              (e.target as HTMLInputElement).style.boxShadow = 'none';
            }}
          />
          <button
            type="submit"
            disabled={loading || !inputValue.trim()}
            style={{
              padding: `${spacing.md} ${spacing.lg}`,
              backgroundColor: loading || !inputValue.trim() ? colors.neutral[300] : colors.primary.teal,
              color: colors.primary.white,
              border: 'none',
              borderRadius: '8px',
              fontSize: typography.fontSize.label2.size,
              fontWeight: typography.fontSize.label2.weight,
              cursor: loading || !inputValue.trim() ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              if (!loading && inputValue.trim()) {
                (e.target as HTMLButtonElement).style.backgroundColor = colors.primary.darkTeal;
              }
            }}
            onMouseLeave={(e) => {
              if (!loading && inputValue.trim()) {
                (e.target as HTMLButtonElement).style.backgroundColor = colors.primary.teal;
              }
            }}
          >
            {loading ? '⏳' : '📤'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatbotUI;
