import apiService from './apiService';
import { indexedDBService } from './indexedDBService';

/**
 * Chatbot Service - Frontend service for chatbot interactions
 * Handles API calls, offline caching, and local processing
 */

interface ChatMessage {
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
  feedback?: string;
  createdAt: Date;
}

interface ChatResponse {
  message: string;
  context: {
    relatedGuideIds: string[];
    confidence: number;
    keywords: string[];
    matchType: 'exact' | 'semantic' | 'partial';
  };
  suggestedGuides: any[];
}

class ChatbotService {
  /**
   * Send message to chatbot
   */
  async sendMessage(message: string): Promise<ChatResponse> {
    try {
      const response = await apiService.post('/chatbot/messages', { message });
      
      if (response.success && response.data) {
        return {
          message: response.data.message,
          context: response.data.context,
          suggestedGuides: response.data.suggestedGuides || [],
        };
      }
      
      throw new Error('Failed to send message');
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(limit: number = 50, offset: number = 0): Promise<any> {
    try {
      const response = await apiService.get('/chatbot/messages', { limit, offset });
      
      if (response.success && response.data) {
        return {
          messages: response.data.messages,
          pagination: response.data.pagination,
        };
      }
      
      throw new Error('Failed to get conversation history');
    } catch (error) {
      console.error('Error getting conversation history:', error);
      throw error;
    }
  }

  /**
   * Get specific message
   */
  async getMessage(messageId: string): Promise<ChatMessage> {
    try {
      const response = await apiService.get(`/chatbot/messages/${messageId}`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error('Failed to get message');
    } catch (error) {
      console.error('Error getting message:', error);
      throw error;
    }
  }

  /**
   * Record feedback on message
   */
  async recordFeedback(messageId: string, isHelpful: boolean, feedback?: string): Promise<ChatMessage> {
    try {
      const response = await apiService.post(`/chatbot/messages/${messageId}/feedback`, {
        isHelpful,
        feedback,
      });
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error('Failed to record feedback');
    } catch (error) {
      console.error('Error recording feedback:', error);
      throw error;
    }
  }

  /**
   * Delete message
   */
  async deleteMessage(messageId: string): Promise<void> {
    try {
      const response = await apiService.delete(`/chatbot/messages/${messageId}`);
      
      if (!response.success) {
        throw new Error('Failed to delete message');
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }

  /**
   * Clear conversation history
   */
  async clearConversationHistory(): Promise<void> {
    try {
      const response = await apiService.delete('/chatbot/messages');
      
      if (!response.success) {
        throw new Error('Failed to clear conversation history');
      }
    } catch (error) {
      console.error('Error clearing conversation history:', error);
      throw error;
    }
  }

  /**
   * Get chatbot analytics (admin only)
   */
  async getAnalytics(): Promise<any> {
    try {
      const response = await apiService.get('/chatbot/analytics');
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error('Failed to get analytics');
    } catch (error) {
      console.error('Error getting analytics:', error);
      throw error;
    }
  }

  /**
   * Cache knowledge base for offline use
   */
  async cacheKnowledgeBase(): Promise<void> {
    try {
      // Get all guides from API
      const response = await apiService.get('/kb/guides', { limit: 1000 });
      
      if (response.success && response.data) {
        // Clear existing cache
        await indexedDBService.clear('kbGuides');
        
        // Cache all guides
        for (const guide of response.data) {
          await indexedDBService.add('kbGuides', guide);
        }
        
        console.log(`Cached ${response.data.length} guides for offline use`);
      }
    } catch (error) {
      console.error('Error caching knowledge base:', error);
      throw error;
    }
  }

  /**
   * Get cached knowledge base
   */
  async getCachedKnowledgeBase(): Promise<any[]> {
    try {
      return await indexedDBService.getAll('kbGuides');
    } catch (error) {
      console.error('Error getting cached knowledge base:', error);
      return [];
    }
  }

  /**
   * Process message offline using cached data
   */
  async processMessageOffline(userMessage: string): Promise<ChatResponse> {
    try {
      const cachedGuides = await this.getCachedKnowledgeBase();
      
      if (cachedGuides.length === 0) {
        return {
          message: 'You are currently offline and no cached knowledge base is available. Please go online to access the full chatbot.',
          context: {
            relatedGuideIds: [],
            confidence: 0,
            keywords: [],
            matchType: 'partial',
          },
          suggestedGuides: [],
        };
      }

      // Simple keyword matching for offline mode
      const keywords = this.extractKeywords(userMessage);
      const scored: { guide: any; score: number }[] = [];

      for (const guide of cachedGuides) {
        let score = 0;
        const guideText = `${guide.title} ${guide.content}`.toLowerCase();
        
        // Keyword matching
        const matchedKeywords = keywords.filter(kw => guideText.includes(kw)).length;
        score = keywords.length > 0 ? matchedKeywords / keywords.length : 0;

        if (score > 0.2) {
          scored.push({ guide, score });
        }
      }

      scored.sort((a, b) => b.score - a.score);

      let message = '';
      if (scored.length > 0) {
        const topGuide = scored[0];
        message = `(Offline) Based on your question, here's the relevant information:\n\n${topGuide.guide.content.substring(0, 300)}...`;
      } else {
        message = `(Offline) I couldn't find specific information about "${userMessage}". Please go online to access the full chatbot with better search capabilities.`;
      }

      return {
        message,
        context: {
          relatedGuideIds: scored.slice(0, 3).map(s => s.guide.id),
          confidence: scored.length > 0 ? Math.round(scored[0].score * 100) / 100 : 0,
          keywords,
          matchType: scored.length > 0 ? 'semantic' : 'partial',
        },
        suggestedGuides: scored.slice(0, 3).map(s => ({
          id: s.guide.id,
          title: s.guide.title,
          category: s.guide.category,
          score: Math.round(s.score * 100) / 100,
        })),
      };
    } catch (error) {
      console.error('Error processing offline message:', error);
      return {
        message: 'An error occurred while processing your message offline. Please try again.',
        context: {
          relatedGuideIds: [],
          confidence: 0,
          keywords: [],
          matchType: 'partial',
        },
        suggestedGuides: [],
      };
    }
  }

  /**
   * Extract keywords from message
   */
  private extractKeywords(message: string): string[] {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
      'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
      'could', 'should', 'may', 'might', 'must', 'can', 'what', 'which',
      'who', 'when', 'where', 'why', 'how', 'i', 'you', 'he', 'she', 'it',
      'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his',
      'her', 'its', 'our', 'their', 'this', 'that', 'these', 'those'
    ]);

    return message
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
      .map(word => word.replace(/[^a-z0-9]/g, ''))
      .filter((word, index, self) => self.indexOf(word) === index);
  }
}

export const chatbotService = new ChatbotService();
export default chatbotService;
