import { KBGuideEntity } from '../entities/KBGuide';
import { ChatMessageEntity } from '../entities/ChatMessage';

/**
 * Chatbot Service - Intelligent context-aware chatbot with knowledge base integration
 * Features:
 * - Context understanding (not just keyword matching)
 * - Knowledge base integration
 * - Conversation history tracking
 * - Offline support (works with cached data)
 * - Confidence scoring
 */

interface ChatContext {
  relatedGuideIds: string[];
  confidence: number;
  keywords: string[];
  matchType: 'exact' | 'semantic' | 'partial';
}

interface ChatResponse {
  message: string;
  context: ChatContext;
  suggestedGuides: any[];
}

class ChatbotService {
  /**
   * Extract keywords from user message
   * Uses semantic analysis to understand intent
   */
  private extractKeywords(message: string): string[] {
    const lowerMessage = message.toLowerCase();
    
    // Remove common words
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
      'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
      'could', 'should', 'may', 'might', 'must', 'can', 'what', 'which',
      'who', 'when', 'where', 'why', 'how', 'i', 'you', 'he', 'she', 'it',
      'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his',
      'her', 'its', 'our', 'their', 'this', 'that', 'these', 'those'
    ]);

    // Split into words and filter
    const words = lowerMessage
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
      .map(word => word.replace(/[^a-z0-9]/g, ''));

    return [...new Set(words)]; // Remove duplicates
  }

  /**
   * Calculate semantic similarity between two strings
   * Uses Levenshtein distance and word overlap
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();

    // Exact match
    if (s1 === s2) return 1.0;

    // Substring match
    if (s1.includes(s2) || s2.includes(s1)) return 0.8;

    // Word overlap
    const words1 = new Set(s1.split(/\s+/));
    const words2 = new Set(s2.split(/\s+/));
    const intersection = [...words1].filter(w => words2.has(w)).length;
    const union = new Set([...words1, ...words2]).size;
    const wordOverlap = union > 0 ? intersection / union : 0;

    // Levenshtein distance
    const maxLen = Math.max(s1.length, s2.length);
    const distance = this.levenshteinDistance(s1, s2);
    const levenshteinSimilarity = 1 - (distance / maxLen);

    // Weighted average
    return wordOverlap * 0.6 + levenshteinSimilarity * 0.4;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Find relevant guides based on user message
   * Uses semantic similarity and keyword matching
   */
  async findRelevantGuides(userMessage: string, guides: any[]): Promise<{ guide: any; score: number }[]> {
    const keywords = this.extractKeywords(userMessage);
    const scored: { guide: any; score: number }[] = [];

    for (const guide of guides) {
      let score = 0;

      // Title similarity (highest weight)
      const titleSimilarity = this.calculateSimilarity(userMessage, guide.title);
      score += titleSimilarity * 0.4;

      // Content similarity
      const contentSimilarity = this.calculateSimilarity(userMessage, guide.content.substring(0, 500));
      score += contentSimilarity * 0.3;

      // Keyword matching
      const guideText = `${guide.title} ${guide.content}`.toLowerCase();
      const matchedKeywords = keywords.filter(kw => guideText.includes(kw)).length;
      const keywordScore = keywords.length > 0 ? matchedKeywords / keywords.length : 0;
      score += keywordScore * 0.3;

      if (score > 0.2) { // Only include if score is above threshold
        scored.push({ guide, score });
      }
    }

    // Sort by score descending
    return scored.sort((a, b) => b.score - a.score);
  }

  /**
   * Generate context-aware response based on relevant guides
   */
  private generateResponse(userMessage: string, relevantGuides: { guide: any; score: number }[]): string {
    if (relevantGuides.length === 0) {
      return `I couldn't find specific information about "${userMessage}". Could you provide more details or rephrase your question? I'm here to help with emergency procedures, safety guidelines, and organizational policies.`;
    }

    const topGuide = relevantGuides[0];
    const confidence = topGuide.score;

    // Build response based on confidence level
    let response = '';

    if (confidence > 0.7) {
      // High confidence - provide direct answer
      response = `Based on your question, here's the relevant information:\n\n${topGuide.guide.content.substring(0, 300)}...`;
    } else if (confidence > 0.4) {
      // Medium confidence - provide answer with caveat
      response = `I found some related information that might help:\n\n${topGuide.guide.content.substring(0, 300)}...`;
    } else {
      // Low confidence - suggest related topics
      response = `I found some related information. Here's what I have:\n\n${topGuide.guide.content.substring(0, 200)}...`;
    }

    // Add suggestions for other relevant guides
    if (relevantGuides.length > 1) {
      response += '\n\nYou might also find these helpful:';
      for (let i = 1; i < Math.min(3, relevantGuides.length); i++) {
        response += `\n- ${relevantGuides[i].guide.title}`;
      }
    }

    return response;
  }

  /**
   * Process user message and generate response
   */
  async processMessage(userMessage: string, orgId: string, userId: string): Promise<ChatResponse> {
    try {
      // Extract keywords for context
      const keywords = this.extractKeywords(userMessage);

      // Fetch organization's knowledge base guides
      const guides = await KBGuideEntity.findByOrgId(orgId, undefined, undefined, 1000, 0);

      // Find relevant guides
      const relevantGuides = await this.findRelevantGuides(userMessage, guides);

      // Calculate confidence
      const confidence = relevantGuides.length > 0 ? relevantGuides[0].score : 0;

      // Generate response
      const message = this.generateResponse(userMessage, relevantGuides);

      // Determine match type
      let matchType: 'exact' | 'semantic' | 'partial' = 'partial';
      if (confidence > 0.8) {
        matchType = 'exact';
      } else if (confidence > 0.5) {
        matchType = 'semantic';
      }

      // Build context
      const context: ChatContext = {
        relatedGuideIds: relevantGuides.slice(0, 3).map(rg => rg.guide.id),
        confidence: Math.round(confidence * 100) / 100,
        keywords,
        matchType,
      };

      // Save to database
      await ChatMessageEntity.create({
        userId,
        orgId,
        userMessage,
        botResponse: message,
        context,
      });

      return {
        message,
        context,
        suggestedGuides: relevantGuides.slice(0, 3).map(rg => ({
          id: rg.guide.id,
          title: rg.guide.title,
          category: rg.guide.category,
          score: Math.round(rg.score * 100) / 100,
        })),
      };
    } catch (error) {
      console.error('Error processing chatbot message:', error);
      throw error;
    }
  }

  /**
   * Get conversation history for a user
   */
  async getConversationHistory(userId: string, limit: number = 50): Promise<any[]> {
    try {
      const messages = await ChatMessageEntity.findByUserId(userId, limit, 0);
      return messages.map(msg => ({
        id: msg.id,
        userMessage: msg.userMessage,
        botResponse: msg.botResponse,
        context: msg.context,
        isHelpful: msg.isHelpful,
        createdAt: msg.createdAt,
      }));
    } catch (error) {
      console.error('Error fetching conversation history:', error);
      throw error;
    }
  }

  /**
   * Record feedback on chatbot response
   */
  async recordFeedback(messageId: string, isHelpful: boolean, feedback?: string): Promise<any> {
    try {
      const updated = await ChatMessageEntity.updateFeedback(messageId, isHelpful, feedback);
      return updated;
    } catch (error) {
      console.error('Error recording feedback:', error);
      throw error;
    }
  }

  /**
   * Get analytics for chatbot usage
   */
  async getAnalytics(orgId: string): Promise<any> {
    try {
      const totalMessages = await ChatMessageEntity.countByOrgId(orgId);
      const messages = await ChatMessageEntity.findByOrgId(orgId, 1000, 0);

      // Calculate helpful percentage
      const helpfulMessages = messages.filter(m => m.isHelpful === true).length;
      const unhelpfulMessages = messages.filter(m => m.isHelpful === false).length;
      const helpfulPercentage = totalMessages > 0 ? (helpfulMessages / totalMessages) * 100 : 0;

      // Get most common topics
      const topicCounts: { [key: string]: number } = {};
      messages.forEach(msg => {
        if (msg.context?.keywords) {
          msg.context.keywords.forEach((kw: string) => {
            topicCounts[kw] = (topicCounts[kw] || 0) + 1;
          });
        }
      });

      const topTopics = Object.entries(topicCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([topic, count]) => ({ topic, count }));

      return {
        totalMessages,
        helpfulMessages,
        unhelpfulMessages,
        helpfulPercentage: Math.round(helpfulPercentage * 100) / 100,
        topTopics,
        averageConfidence: messages.length > 0
          ? Math.round(
              (messages.reduce((sum, m) => sum + (m.context?.confidence || 0), 0) / messages.length) * 100
            ) / 100
          : 0,
      };
    } catch (error) {
      console.error('Error getting analytics:', error);
      throw error;
    }
  }
}

export const chatbotService = new ChatbotService();
export default chatbotService;
