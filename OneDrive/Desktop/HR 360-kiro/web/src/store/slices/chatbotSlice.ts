/**
 * Chatbot Redux Slice
 * Manages chatbot conversation state, messages, and feedback
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ChatMessage {
  id: string;
  userQuestion: string;
  botResponse: string;
  context?: {
    relatedGuideIds?: string[];
    confidence?: number;
    keywords?: string[];
  };
  isHelpful?: boolean;
  feedbackText?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ChatbotState {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  isOnline: boolean;
  hasUnreadMessages: boolean;
  currentConversationId: string | null;
}

const initialState: ChatbotState = {
  messages: [],
  loading: false,
  error: null,
  isOnline: true,
  hasUnreadMessages: false,
  currentConversationId: null,
};

const chatbotSlice = createSlice({
  name: 'chatbot',
  initialState,
  reducers: {
    // Loading states
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    // Error handling
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    // Message management
    setMessages: (state, action: PayloadAction<ChatMessage[]>) => {
      state.messages = action.payload;
    },

    addMessage: (state, action: PayloadAction<ChatMessage>) => {
      state.messages.push(action.payload);
      state.hasUnreadMessages = true;
    },

    updateMessage: (state, action: PayloadAction<ChatMessage>) => {
      const index = state.messages.findIndex(msg => msg.id === action.payload.id);
      if (index !== -1) {
        state.messages[index] = action.payload;
      }
    },

    clearMessages: (state) => {
      state.messages = [];
      state.hasUnreadMessages = false;
    },

    // Feedback management
    setMessageFeedback: (state, action: PayloadAction<{ messageId: string; isHelpful: boolean; feedbackText?: string }>) => {
      const message = state.messages.find(msg => msg.id === action.payload.messageId);
      if (message) {
        message.isHelpful = action.payload.isHelpful;
        message.feedbackText = action.payload.feedbackText;
        message.updatedAt = new Date().toISOString();
      }
    },

    // Online/offline status
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
    },

    // Conversation management
    setCurrentConversation: (state, action: PayloadAction<string | null>) => {
      state.currentConversationId = action.payload;
    },

    // Mark messages as read
    markMessagesAsRead: (state) => {
      state.hasUnreadMessages = false;
    },

    // Reset state
    resetChatbot: (state) => {
      return initialState;
    },
  },
});

export const {
  setLoading,
  setError,
  setMessages,
  addMessage,
  updateMessage,
  clearMessages,
  setMessageFeedback,
  setOnlineStatus,
  setCurrentConversation,
  markMessagesAsRead,
  resetChatbot,
} = chatbotSlice.actions;

export default chatbotSlice.reducer;
