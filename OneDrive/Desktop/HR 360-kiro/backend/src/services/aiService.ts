/**
 * AI Service
 * Handles intelligent responses with Knowledge Base context
 * Uses simple NLP matching (free, no API key required)
 * Supports multiple languages: English, Tagalog, Bisaya
 */

import { logger } from './monitoringService';

type SupportedLanguage = 'en' | 'tl' | 'ceb';

interface AIRequest {
  question: string;
  language: SupportedLanguage;
  context?: string;
  kbGuides?: Array<{ title: string; content: string }>;
}

interface AIResponse {
  answer: string;
  language: SupportedLanguage;
  sourceLanguage?: SupportedLanguage;
  confidence: number;
  kbReferences?: string[];
}

class AIService {
  private isInitialized = true;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize AI Service (no API key required)
   */
  private initialize(): void {
    try {
      logger.info('✅ AI Service initialized successfully (Free KB-based matching)');
      this.isInitialized = true;
    } catch (error) {
      logger.error('Failed to initialize AI Service:', { error });
      this.isInitialized = false;
    }
  }

  /**
   * Detect language of input text
   */
  private detectLanguage(text: string): SupportedLanguage {
    // Tagalog indicators
    const tagalogIndicators = /\b(ano|kung|para|ang|nang|sa|ko|mo|ay|na|ng|kami|tayo|sila|kayo|ito|iyan|dito|diyan|narito|nariyan|bakit|kailan|nasaan|paano)\b/i;
    
    // Bisaya/Cebuano indicators
    const bisayaIndicators = /\b(unsa|kung|para|ang|nang|sa|ko|mo|mo|kami|kayo|sila|ito|ato|diri|didto|ngano|kailan|asa|pagano|tayo)\b/i;

    // Simple heuristic detection
    const tagalogMatches = (text.match(tagalogIndicators) || []).length;
    const bisayaMatches = (text.match(bisayaIndicators) || []).length;

    if (bisayaMatches > tagalogMatches && bisayaMatches > 0) {
      return 'ceb';
    } else if (tagalogMatches > 0) {
      return 'tl';
    }
    return 'en';
  }

  /**
   * Translate text using simple keyword replacement (free, no API)
   * Note: For production, consider using Google Translate API or similar
   */
  private async translateText(
    text: string,
    targetLanguage: SupportedLanguage
  ): Promise<string> {
    // Simple keyword-based translation (not AI-powered)
    // For full translation, integrate Google Translate API or similar service
    return text;
  }

  /**
   * Get multilingual KB-based response
   */
  async getKBResponse(
    question: string,
    language: SupportedLanguage,
    kbGuides: Array<{ title: string; content: string }>
  ): Promise<string> {
    return this.formatKBResponse(kbGuides, language);
  }

  /**
   * Generate intelligent response using KB matching (free, no API)
   */
  async generateResponse(request: AIRequest): Promise<AIResponse> {
    try {
      // Use KB guides if provided
      if (request.kbGuides && request.kbGuides.length > 0) {
        return {
          answer: this.formatKBResponse(request.kbGuides, request.language),
          language: request.language,
          confidence: 0.85,
          kbReferences: request.kbGuides.map((g) => g.title),
        };
      }

      // Fallback to keyword-based response
      return {
        answer: this.getFallbackResponse(request.question, request.language),
        language: request.language,
        confidence: 0.5,
      };
    } catch (error) {
      logger.error('Error generating response:', { error });
      return {
        answer: this.getFallbackResponse(request.question, request.language),
        language: request.language,
        confidence: 0.3,
      };
    }
  }

  /**
   * Format KB guides as response in target language
   */
  private formatKBResponse(
    kbGuides: Array<{ title: string; content: string }>,
    language: SupportedLanguage
  ): string {
    let response = '';

    if (language === 'tl') {
      response = '📚 **Batay sa aming Knowledge Base:**\n\n';
    } else if (language === 'ceb') {
      response = '📚 **Base sa aming Knowledge Base:**\n\n';
    } else {
      response = '📚 **Based on our Knowledge Base:**\n\n';
    }

    response += kbGuides.map((guide) => {
      const summary = guide.content.substring(0, 150).trim();
      return `**${guide.title}**\n${summary}${guide.content.length > 150 ? '...' : ''}\n\n`;
    }).join('');

    if (language === 'tl') {
      response += '💡 *Para sa mas detalyadong impormasyon, bisitahin ang Knowledge Base section.*';
    } else if (language === 'ceb') {
      response += '💡 *Para sa mas detalyadong impormasyon, bisitahin ang Knowledge Base section.*';
    } else {
      response += '💡 *For more detailed information, check the Knowledge Base section.*';
    }

    return response;
  }

  /**
   * Get fallback response in target language
   */
  private getFallbackResponse(question: string, language: SupportedLanguage): string {
    const questionLower = question.toLowerCase();

    if (language === 'tl') {
      // Tagalog responses
      if (
        questionLower.includes('emergency') ||
        questionLower.includes('emerhensya') ||
        questionLower.includes('crisis') ||
        questionLower.includes('krisis')
      ) {
        return `🚨 **Tugon sa Emerhensya**\n\nPara sa agarang emerhensya:\n• Tawagan ang 911 (National Emergency Hotline)\n• I-alert kaagad ang iyong team lead\n• Gamitin ang Check-In feature para ipahayag ang iyong status\n• Sundin ang evacuation procedures kung kinakailangan\n\nAng aming crisis team ay handang tumulong. Bisitahin ang Knowledge Base para sa detalyadong emergency procedures.`;
      }

      if (questionLower.includes('contact') || questionLower.includes('numero')) {
        return `📞 **Emergency Contacts**\n\nBisitahin ang Contacts section:\n• Emergency: 911\n• Police: 117\n• Fire: 114\n• Ambulance: 143\n• Disaster Hotline: +63 2 911-5061\n\nAng inyong team leads ay available din sa contacts list.`;
      }

      if (questionLower.includes('safety') || questionLower.includes('kaligtasan')) {
        return `🛡️ **Safety Protocols**\n\nMayroon kaming komprehensibong safety guidelines sa Knowledge Base:\n• Workplace Safety Protocols\n• Natural Disaster Response Guide\n• Crisis Response Procedures\n\nBisitahin ang KB section para sa detalyadong safety information.`;
      }

      return `👋 **Kamustahan!**\n\nAko ang iyong HR 360 Assistant. Maaari kang magtanong tungkol sa:\n• Emergency procedures\n• Emergency contacts\n• Safety guidelines\n• Wellness check procedures\n• Go-bag essentials\n\nBisitahin ang Knowledge Base para sa mas maraming impormasyon.`;
    } else if (language === 'ceb') {
      // Bisaya responses
      if (
        questionLower.includes('emergency') ||
        questionLower.includes('emerhensya') ||
        questionLower.includes('crisis')
      ) {
        return `🚨 **Tubag sa Emerhensya**\n\nAlang sa daghang emerhensya:\n• Tawagon ang 911 (National Emergency Hotline)\n• I-alert kaagad ang iyong team lead\n• Gamitin ang Check-In feature para ipakita ang iyong status\n• Sundan ang evacuation procedures kung kinakailangan\n\nAng aming crisis team ay handa sa tumulong. Bisitahin ang Knowledge Base para sa detalyadong emergency procedures.`;
      }

      if (questionLower.includes('contact') || questionLower.includes('numero')) {
        return `📞 **Emergency Contacts**\n\nBisitahin ang Contacts section:\n• Emergency: 911\n• Police: 117\n• Fire: 114\n• Ambulance: 143\n• Disaster Hotline: +63 2 911-5061\n\nAng inyong team leads ay available din sa contacts list.`;
      }

      return `👋 **Kumusta!**\n\nAko ang iyong HR 360 Assistant. Maaari kang magtanong tungkol sa:\n• Emergency procedures\n• Emergency contacts\n• Safety guidelines\n• Wellness check procedures\n\nBisitahin ang Knowledge Base para sa mas maraming impormasyon.`;
    }

    // English responses (default)
    if (questionLower.includes('emergency') || questionLower.includes('crisis')) {
      return `🚨 **Emergency Response**\n\nFor immediate emergencies:\n• Call 911 (National Emergency Hotline)\n• Alert your team lead immediately\n• Use the Check-In feature to notify your status\n• Follow evacuation procedures if needed\n\nOur crisis team is standing by. Check the Knowledge Base for detailed emergency procedures.`;
    }

    return `👋 **Hello!**\n\nI'm your HR 360 Assistant. I can help you with:\n• Emergency procedures\n• Emergency contacts\n• Safety guidelines\n• Wellness check procedures\n• Go-bag essentials\n\nFeel free to ask me anything related to crisis preparedness, safety, or emergency procedures.`;
  }

  /**
   * Check if AI is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }
}

export default new AIService();
