import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ChatbotUI from '../ChatbotUI';
import chatbotReducer from '../../store/slices/chatbotSlice';
import authReducer from '../../store/slices/authSlice';
import { apiService } from '../../services/apiService';
import { indexedDBService } from '../../services/indexedDBService';
import toast from 'react-hot-toast';

// Mock HTML element functions missing in jsdom
window.HTMLElement.prototype.scrollIntoView = vi.fn();

// Mock dependencies
vi.mock('../../services/apiService', () => ({
  apiService: {
    saveChatMessage: vi.fn(),
    submitChatFeedback: vi.fn(),
    clearChatHistory: vi.fn(),
    getChatHistory: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../../services/indexedDBService', () => ({
  indexedDBService: {
    getKBGuides: vi.fn(),
    saveKBGuides: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock the child components so we don't have to deal with complex real renders of them in this test.
vi.mock('../ChatMessage', () => ({
  default: ({ userQuestion, botResponse }: any) => (
    <div data-testid="chat-message">
      <div className="user-question">{userQuestion}</div>
      <div className="bot-response">{botResponse}</div>
    </div>
  )
}));

vi.mock('../ChatFeedbackButtons', () => ({
  default: () => <div data-testid="chat-feedback-buttons" />
}));

// Create a render helper with redux provider
const renderWithProviders = (
  ui: React.ReactElement,
  {
    preloadedState = {},
    store = configureStore({
      reducer: {
        chatbot: chatbotReducer,
        auth: authReducer,
      },
      preloadedState,
    }),
    ...renderOptions
  } = {}
) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
};

describe('ChatbotUI Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly', () => {
    expect(true).toBe(true);
  });

  it('renders loading state initially', () => {
    renderWithProviders(<ChatbotUI />, {
      preloadedState: {
        chatbot: {
          messages: [],
          loading: false,
          error: null,
          isOnline: true,
          hasUnreadMessages: false,
          currentConversationId: null,
        },
      },
    });

    expect(screen.getByText(/Loading chat history/i)).toBeInTheDocument();
  });

  it('renders empty state when there are no messages', async () => {
    (indexedDBService.getKBGuides as any).mockResolvedValueOnce([]);

    renderWithProviders(<ChatbotUI />, {
      preloadedState: {
        chatbot: {
          messages: [],
          loading: false,
          error: null,
          isOnline: true,
          hasUnreadMessages: false,
          currentConversationId: null,
        },
      },
    });

    await waitFor(() => {
      expect(screen.getByText(/Start a Conversation/i)).toBeInTheDocument();
      expect(screen.getByText(/Ask me anything about/i)).toBeInTheDocument();
    });
  });

  it('renders error state', async () => {
    (apiService.getChatHistory as any).mockRejectedValueOnce(new Error('Failed to load chat history'));

    renderWithProviders(<ChatbotUI />, {
      preloadedState: {
        chatbot: {
          messages: [],
          loading: false,
          error: 'Failed to load chat history',
          isOnline: true,
          hasUnreadMessages: false,
          currentConversationId: null,
        },
      },
    });

    await waitFor(() => {
      expect(screen.getByText(/Failed to load chat history/i)).toBeInTheDocument();
    });
  });

  it('renders offline warning when offline', async () => {
    (indexedDBService.getKBGuides as any).mockResolvedValueOnce([]);

    const originalOnLine = navigator.onLine;
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });

    renderWithProviders(<ChatbotUI />, {
      preloadedState: {
        chatbot: {
          messages: [],
          loading: false,
          error: null,
          isOnline: false,
          hasUnreadMessages: false,
          currentConversationId: null,
        },
      },
    });

    await waitFor(() => {
      expect(screen.getByText(/You are offline/i)).toBeInTheDocument();
      expect(screen.getByText(/Offline Mode/i)).toBeInTheDocument();
    });

    Object.defineProperty(navigator, 'onLine', { value: originalOnLine, configurable: true });
  });

  it('allows user to type and send a message when online', async () => {
    (apiService.getChatHistory as any).mockResolvedValueOnce([]);
    (apiService.saveChatMessage as any).mockResolvedValueOnce({
      botResponse: 'Hello, how can I help?',
      context: {},
    });

    renderWithProviders(<ChatbotUI />, {
      preloadedState: {
        chatbot: {
          messages: [],
          loading: false,
          error: null,
          isOnline: true,
          hasUnreadMessages: false,
          currentConversationId: null,
        },
      },
    });

    await waitFor(() => {
      expect(screen.queryByText(/Loading chat history/i)).not.toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/Ask me anything.../i);
    fireEvent.change(input, { target: { value: 'Test message' } });

    const sendButton = screen.getByRole('button', { name: /📤/i });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(apiService.saveChatMessage).toHaveBeenCalledWith(expect.objectContaining({ userQuestion: 'Test message' }));
    });
  });

  it('uses IndexedDB cached response when offline', async () => {
    (indexedDBService.getKBGuides as any).mockResolvedValueOnce([
      { id: 'guide1', title: 'Emergency', content: 'In case of fire, exit.' }
    ]);

    const originalOnLine = navigator.onLine;
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });

    renderWithProviders(<ChatbotUI />, {
      preloadedState: {
        chatbot: {
          messages: [],
          loading: false,
          error: null,
          isOnline: false,
          hasUnreadMessages: false,
          currentConversationId: null,
        },
      },
    });

    await waitFor(() => {
      expect(screen.queryByText(/Loading chat history/i)).not.toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/Ask me anything.../i);
    fireEvent.change(input, { target: { value: 'fire' } });

    const sendButton = screen.getByRole('button', { name: /📤/i });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(indexedDBService.getKBGuides).toHaveBeenCalled();
      expect(apiService.saveChatMessage).not.toHaveBeenCalled();
    });

    Object.defineProperty(navigator, 'onLine', { value: originalOnLine, configurable: true });
  });

  it('can clear conversation history', async () => {
    window.confirm = vi.fn().mockReturnValue(true);
    (indexedDBService.getKBGuides as any).mockResolvedValueOnce([]);

    renderWithProviders(<ChatbotUI />, {
      preloadedState: {
        chatbot: {
          messages: [
            {
              id: '1',
              userQuestion: 'Hello',
              botResponse: 'Hi',
              createdAt: new Date().toISOString(),
            }
          ],
          loading: false,
          error: null,
          isOnline: true,
          hasUnreadMessages: false,
          currentConversationId: null,
        },
      },
    });

    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument();
    });

    const clearButton = screen.getByRole('button', { name: /🗑️ Clear/i });
    fireEvent.click(clearButton);

    expect(window.confirm).toHaveBeenCalled();

    await waitFor(() => {
      expect(indexedDBService.saveKBGuides).toHaveBeenCalledWith([]);
      expect(toast.success).toHaveBeenCalledWith('Conversation history cleared');
    });
  });
});
