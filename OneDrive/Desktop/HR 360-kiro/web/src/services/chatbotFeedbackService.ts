/**
 * Chatbot Feedback Service
 * Handles chatbot feedback and conversation analytics
 */

import { apiService } from './apiService';

export interface ChatMessage {
  id: string;
  userQuestion: string;
  botResponse: string;
  context?: Record<string, any>;
  feedback?: {
    isHelpful: boolean;
    feedbackText?: string;
  };
  createdAt: string;
}

export interface FeedbackAnalytics {
  totalMessages: number;
  helpfulCount: number;
  unhelpfulCount: number;
  helpfulPercentage: number;
  topQuestions: Array<{ question: string; count: number }>;
  topCategories: Array<{ category: string; count: number }>;
}

/**
 * Submit feedback for a chatbot message
 */
export const submitChatbotFeedback = async (
  messageId: string,
  feedback: {
    isHelpful: boolean;
    feedbackText?: string;
  }
): Promise<any> => {
  try {
    const response = await apiService.post(
      `/chatbot/messages/${messageId}/feedback`,
      {
        isHelpful: feedback.isHelpful,
        feedbackText: feedback.feedbackText || '',
      }
    );

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to submit feedback');
    }

    return response.data;
  } catch (error) {
    console.error('Error submitting chatbot feedback:', error);
    throw error;
  }
};

/**
 * Get chatbot conversation analytics
 */
export const getChatbotAnalytics = async (): Promise<FeedbackAnalytics> => {
  try {
    const response = await apiService.get('/chatbot/analytics');

    if (!response.success || !response.data) {
      throw new Error('Failed to get chatbot analytics');
    }

    return response.data;
  } catch (error) {
    console.error('Error getting chatbot analytics:', error);
    throw error;
  }
};

/**
 * Get chatbot statistics
 */
export const getChatbotStats = async (): Promise<any> => {
  try {
    const response = await apiService.get('/chatbot/admin/stats');

    if (!response.success || !response.data) {
      throw new Error('Failed to get chatbot statistics');
    }

    return response.data;
  } catch (error) {
    console.error('Error getting chatbot statistics:', error);
    throw error;
  }
};

/**
 * Get chat history with feedback
 */
export const getChatHistoryWithFeedback = async (params?: {
  limit?: number;
  offset?: number;
  feedbackType?: 'all' | 'helpful' | 'unhelpful';
}): Promise<ChatMessage[]> => {
  try {
    const response = await apiService.get('/chatbot/history', params);

    if (!response.success || !response.data) {
      throw new Error('Failed to get chat history');
    }

    return Array.isArray(response.data) ? response.data : response.data.messages || [];
  } catch (error) {
    console.error('Error getting chat history with feedback:', error);
    throw error;
  }
};

/**
 * Get feedback queue (for admins)
 */
export const getFeedbackQueue = async (params?: {
  status?: string;
  priority?: string;
  limit?: number;
  offset?: number;
}): Promise<any[]> => {
  try {
    const response = await apiService.get('/chatbot/admin/feedback-queue', params);

    if (!response.success || !response.data) {
      throw new Error('Failed to get feedback queue');
    }

    return Array.isArray(response.data) ? response.data : response.data.items || [];
  } catch (error) {
    console.error('Error getting feedback queue:', error);
    throw error;
  }
};

/**
 * Get feedback item details
 */
export const getFeedbackItem = async (id: string): Promise<any> => {
  try {
    const response = await apiService.get(`/chatbot/admin/feedback-queue/${id}`);

    if (!response.success || !response.data) {
      throw new Error('Failed to get feedback item');
    }

    return response.data;
  } catch (error) {
    console.error('Error getting feedback item:', error);
    throw error;
  }
};

/**
 * Update feedback item (admin action)
 */
export const updateFeedbackItem = async (
  id: string,
  data: {
    status?: string;
    adminAction?: string;
    assignedTo?: string;
  }
): Promise<any> => {
  try {
    const response = await apiService.put(
      `/chatbot/admin/feedback-queue/${id}`,
      data
    );

    if (!response.success) {
      throw new Error('Failed to update feedback item');
    }

    return response.data;
  } catch (error) {
    console.error('Error updating feedback item:', error);
    throw error;
  }
};

/**
 * Resolve feedback item with action
 */
export const resolveFeedbackItem = async (
  id: string,
  adminAction: string,
  updatedResponseId?: string
): Promise<any> => {
  try {
    const response = await apiService.post(
      `/chatbot/admin/feedback-queue/${id}/resolve`,
      {
        adminAction,
        updatedResponseId,
      }
    );

    if (!response.success) {
      throw new Error('Failed to resolve feedback item');
    }

    return response.data;
  } catch (error) {
    console.error('Error resolving feedback item:', error);
    throw error;
  }
};

/**
 * Create new chatbot response (admin only)
 */
export const createChatbotResponse = async (data: {
  questionPattern: string;
  response: string;
  category?: string;
  priority?: number;
}): Promise<any> => {
  try {
    const response = await apiService.post('/chatbot/admin/responses', data);

    if (!response.success) {
      throw new Error('Failed to create chatbot response');
    }

    return response.data;
  } catch (error) {
    console.error('Error creating chatbot response:', error);
    throw error;
  }
};

/**
 * Get chatbot responses (admin only)
 */
export const getChatbotResponses = async (params?: {
  category?: string;
  limit?: number;
  offset?: number;
}): Promise<any[]> => {
  try {
    const response = await apiService.get('/chatbot/admin/responses', params);

    if (!response.success || !response.data) {
      throw new Error('Failed to get chatbot responses');
    }

    return Array.isArray(response.data) ? response.data : response.data.responses || [];
  } catch (error) {
    console.error('Error getting chatbot responses:', error);
    throw error;
  }
};

/**
 * Update chatbot response (admin only)
 */
export const updateChatbotResponse = async (
  id: string,
  data: {
    questionPattern?: string;
    response?: string;
    category?: string;
    priority?: number;
  }
): Promise<any> => {
  try {
    const response = await apiService.put(`/chatbot/admin/responses/${id}`, data);

    if (!response.success) {
      throw new Error('Failed to update chatbot response');
    }

    return response.data;
  } catch (error) {
    console.error('Error updating chatbot response:', error);
    throw error;
  }
};

/**
 * Delete chatbot response (admin only)
 */
export const deleteChatbotResponse = async (id: string): Promise<void> => {
  try {
    const response = await apiService.delete(`/chatbot/admin/responses/${id}`);

    if (!response.success) {
      throw new Error('Failed to delete chatbot response');
    }
  } catch (error) {
    console.error('Error deleting chatbot response:', error);
    throw error;
  }
};

export const chatbotFeedbackService = {
  submitChatbotFeedback,
  getChatbotAnalytics,
  getChatbotStats,
  getChatHistoryWithFeedback,
  getFeedbackQueue,
  getFeedbackItem,
  updateFeedbackItem,
  resolveFeedbackItem,
  createChatbotResponse,
  getChatbotResponses,
  updateChatbotResponse,
  deleteChatbotResponse,
};

export default chatbotFeedbackService;
