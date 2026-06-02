/**
 * ChatFeedbackButtons Component
 * Feedback controls for chatbot messages (thumbs up/down)
 */

import React, { useState } from 'react';
import { apiService } from '../services/apiService';
import toast from 'react-hot-toast';
import { colors, spacing, typography, borderRadius } from '../styles/designSystem';

interface ChatFeedbackButtonsProps {
  messageId: string;
  onFeedbackSubmitted?: (isHelpful: boolean) => void;
  disabled?: boolean;
}

const ChatFeedbackButtons: React.FC<ChatFeedbackButtonsProps> = ({
  messageId,
  onFeedbackSubmitted,
  disabled = false,
}) => {
  const [feedback, setFeedback] = useState<'helpful' | 'not-helpful' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [suggestion, setSuggestion] = useState('');

  const handleFeedback = async (isHelpful: boolean) => {
    try {
      setIsSubmitting(true);

      if (!isHelpful) {
        // Show suggestion modal
        setFeedback('not-helpful');
        setShowSuggestion(true);
        return;
      }

      // Submit positive feedback
      await apiService.post(`/chatbot/messages/${messageId}/feedback`, {
        isHelpful: true,
      });

      setFeedback('helpful');
      toast.success('Thanks for the feedback!');
      onFeedbackSubmitted?.(true);

      // Reset after 2 seconds
      setTimeout(() => {
        setFeedback(null);
      }, 2000);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitSuggestion = async () => {
    try {
      setIsSubmitting(true);

      await apiService.post(`/chatbot/messages/${messageId}/feedback`, {
        isHelpful: false,
        feedbackText: suggestion,
      });

      setFeedback('not-helpful');
      toast.success('Thank you for your suggestion. We will improve!');
      onFeedbackSubmitted?.(false);

      // Reset after 2 seconds
      setTimeout(() => {
        setFeedback(null);
        setShowSuggestion(false);
        setSuggestion('');
      }, 2000);
    } catch (error) {
      console.error('Error submitting suggestion:', error);
      toast.error('Failed to submit suggestion');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show suggestion modal
  if (showSuggestion) {
    return (
      <div
        style={{
          marginTop: spacing.md,
          padding: spacing.md,
          backgroundColor: '#FFF8F0',
          borderRadius: borderRadius.md,
          border: `1px solid ${colors.borderLight}`,
        }}
      >
        <div style={{ marginBottom: spacing.sm }}>
          <label style={{ display: 'block', fontWeight: 'bold', fontSize: typography.sizes.sm, marginBottom: spacing.xs }}>
            How could we improve this answer?
          </label>
          <textarea
            value={suggestion}
            onChange={e => setSuggestion(e.target.value)}
            placeholder="Share your suggestion here..."
            style={{
              width: '100%',
              padding: spacing.sm,
              border: `1px solid ${colors.borderLight}`,
              borderRadius: borderRadius.sm,
              fontSize: typography.sizes.sm,
              fontFamily: 'inherit',
              resize: 'vertical',
              minHeight: '80px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: spacing.sm }}>
          <button
            onClick={() => {
              setShowSuggestion(false);
              setSuggestion('');
              setFeedback(null);
            }}
            disabled={isSubmitting}
            style={{
              flex: 1,
              padding: `${spacing.sm} ${spacing.md}`,
              border: `1px solid ${colors.borderLight}`,
              borderRadius: borderRadius.sm,
              backgroundColor: colors.white,
              color: colors.textSecondary,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              fontSize: typography.sizes.xs,
              fontWeight: 'bold',
              transition: 'all 0.2s',
              opacity: isSubmitting ? 0.6 : 1,
            }}
          >
            Cancel
          </button>

          <button
            onClick={handleSubmitSuggestion}
            disabled={isSubmitting || !suggestion.trim()}
            style={{
              flex: 1,
              padding: `${spacing.sm} ${spacing.md}`,
              border: 'none',
              borderRadius: borderRadius.sm,
              backgroundColor: colors.primary,
              color: colors.white,
              cursor: isSubmitting || !suggestion.trim() ? 'not-allowed' : 'pointer',
              fontSize: typography.sizes.xs,
              fontWeight: 'bold',
              transition: 'all 0.2s',
              opacity: isSubmitting || !suggestion.trim() ? 0.6 : 1,
            }}
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>
    );
  }

  // Show feedback buttons
  return (
    <div
      style={{
        marginTop: spacing.md,
        display: 'flex',
        gap: spacing.sm,
        alignItems: 'center',
      }}
    >
      <span style={{ fontSize: typography.sizes.xs, color: colors.textSecondary }}>
        Was this helpful?
      </span>

      <button
        onClick={() => handleFeedback(true)}
        disabled={disabled || isSubmitting || feedback !== null}
        style={{
          padding: `${spacing.xs} ${spacing.sm}`,
          border: `1px solid ${feedback === 'helpful' ? colors.primary : colors.borderLight}`,
          borderRadius: borderRadius.sm,
          backgroundColor: feedback === 'helpful' ? colors.primaryLight : colors.white,
          color: feedback === 'helpful' ? colors.primary : colors.textSecondary,
          cursor: disabled || isSubmitting || feedback !== null ? 'not-allowed' : 'pointer',
          fontSize: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          transition: 'all 0.2s',
          opacity: disabled || isSubmitting || feedback !== null ? 0.5 : 1,
        }}
        title="This answer was helpful"
        onMouseOver={e =>
          !disabled &&
          !isSubmitting &&
          feedback === null &&
          (e.currentTarget.style.backgroundColor = colors.primaryLight)
        }
        onMouseOut={e =>
          (e.currentTarget.style.backgroundColor = feedback === 'helpful' ? colors.primaryLight : colors.white)
        }
      >
        👍
        {feedback === 'helpful' && ' Done'}
      </button>

      <button
        onClick={() => handleFeedback(false)}
        disabled={disabled || isSubmitting || feedback !== null}
        style={{
          padding: `${spacing.xs} ${spacing.sm}`,
          border: `1px solid ${feedback === 'not-helpful' ? '#FFB6C1' : colors.borderLight}`,
          borderRadius: borderRadius.sm,
          backgroundColor: feedback === 'not-helpful' ? '#FFF0F5' : colors.white,
          color: feedback === 'not-helpful' ? '#FF69B4' : colors.textSecondary,
          cursor: disabled || isSubmitting || feedback !== null ? 'not-allowed' : 'pointer',
          fontSize: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          transition: 'all 0.2s',
          opacity: disabled || isSubmitting || feedback !== null ? 0.5 : 1,
        }}
        title="This answer was not helpful"
        onMouseOver={e =>
          !disabled &&
          !isSubmitting &&
          feedback === null &&
          (e.currentTarget.style.backgroundColor = '#FFF0F5')
        }
        onMouseOut={e =>
          (e.currentTarget.style.backgroundColor = feedback === 'not-helpful' ? '#FFF0F5' : colors.white)
        }
      >
        👎
        {feedback === 'not-helpful' && ' Thanks'}
      </button>
    </div>
  );
};

export default ChatFeedbackButtons;
