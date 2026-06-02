/**
 * ChatMessage Component
 * Displays individual chat messages with feedback options
 */

import React, { useState } from 'react';
import { colors, typography, spacing, borderRadius, shadows } from '../styles/designSystem';

interface ChatMessageProps {
  id: string;
  userQuestion: string;
  botResponse: string;
  context?: {
    relatedGuideIds?: string[];
    confidence?: number;
    keywords?: string[];
  };
  isHelpful?: boolean;
  createdAt: string;
  isOffline?: boolean;
  onFeedback: (messageId: string, isHelpful: boolean) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  id,
  userQuestion,
  botResponse,
  context,
  isHelpful,
  createdAt,
  isOffline,
  onFeedback,
}) => {
  const [showFeedback, setShowFeedback] = useState(!isHelpful);

  const handleFeedback = (helpful: boolean) => {
    onFeedback(id, helpful);
    setShowFeedback(false);
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Unknown time';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
      {/* User Message */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div
          style={{
            maxWidth: '70%',
            backgroundColor: colors.primary.teal,
            color: colors.primary.white,
            borderRadius: borderRadius.md,
            padding: spacing.lg,
            boxShadow: shadows.sm,
          }}
        >
          <p
            style={{
              fontSize: typography.fontSize.body2.size,
              fontWeight: typography.fontSize.body2.weight,
              margin: 0,
              marginBottom: spacing.sm,
              wordWrap: 'break-word',
            }}
          >
            {userQuestion}
          </p>
          <p
            style={{
              fontSize: typography.fontSize.label3.size,
              fontWeight: typography.fontSize.label3.weight,
              color: colors.neutral[100],
              margin: 0,
            }}
          >
            {formatTime(createdAt)}
          </p>
        </div>
      </div>

      {/* Bot Response */}
      <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
        <div
          style={{
            maxWidth: '70%',
            backgroundColor: colors.primary.white,
            border: `2px solid ${colors.neutral[200]}`,
            borderRadius: borderRadius.md,
            padding: spacing.lg,
            boxShadow: shadows.sm,
          }}
        >
          {/* Response Text */}
          <p
            style={{
              fontSize: typography.fontSize.body2.size,
              fontWeight: typography.fontSize.body2.weight,
              color: colors.primary.black,
              margin: 0,
              marginBottom: spacing.md,
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
              lineHeight: '1.5',
            }}
          >
            {botResponse}
          </p>

          {/* Metadata */}
          <div style={{ display: 'flex', gap: spacing.md, flexWrap: 'wrap', marginBottom: spacing.md }}>
            {context?.confidence !== undefined && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.sm,
                  fontSize: typography.fontSize.label3.size,
                  color: colors.neutral[600],
                }}
              >
                <span>📊</span>
                <span>Confidence: {Math.round(context.confidence * 100)}%</span>
              </div>
            )}

            {isOffline && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.sm,
                  fontSize: typography.fontSize.label3.size,
                  backgroundColor: colors.warning,
                  color: colors.primary.white,
                  padding: `${spacing.xs} ${spacing.sm}`,
                  borderRadius: borderRadius.sm,
                }}
              >
                <span>📡</span>
                <span>Offline</span>
              </div>
            )}
          </div>

          {/* Keywords */}
          {context?.keywords && context.keywords.length > 0 && (
            <div style={{ marginBottom: spacing.md }}>
              <p
                style={{
                  fontSize: typography.fontSize.label2.size,
                  fontWeight: typography.fontSize.label2.weight,
                  color: colors.primary.black,
                  margin: 0,
                  marginBottom: spacing.sm,
                }}
              >
                Keywords:
              </p>
              <div style={{ display: 'flex', gap: spacing.sm, flexWrap: 'wrap' }}>
                {context.keywords.map((keyword, index) => (
                  <span
                    key={index}
                    style={{
                      fontSize: typography.fontSize.label3.size,
                      backgroundColor: colors.neutral[100],
                      color: colors.primary.teal,
                      padding: `${spacing.xs} ${spacing.sm}`,
                      borderRadius: borderRadius.full,
                      border: `1px solid ${colors.primary.teal}`,
                    }}
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Feedback Buttons */}
          {showFeedback && (
            <div style={{ display: 'flex', gap: spacing.md, marginTop: spacing.md }}>
              <button
                onClick={() => handleFeedback(true)}
                style={{
                  flex: 1,
                  padding: `${spacing.sm} ${spacing.md}`,
                  backgroundColor: colors.success,
                  color: colors.primary.white,
                  border: 'none',
                  borderRadius: borderRadius.sm,
                  fontSize: typography.fontSize.label3.size,
                  fontWeight: typography.fontSize.label3.weight,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor = colors.primary.teal;
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor = colors.success;
                }}
              >
                👍 Helpful
              </button>
              <button
                onClick={() => handleFeedback(false)}
                style={{
                  flex: 1,
                  padding: `${spacing.sm} ${spacing.md}`,
                  backgroundColor: colors.error,
                  color: colors.primary.white,
                  border: 'none',
                  borderRadius: borderRadius.sm,
                  fontSize: typography.fontSize.label3.size,
                  fontWeight: typography.fontSize.label3.weight,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor = colors.warning;
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor = colors.error;
                }}
              >
                👎 Not Helpful
              </button>
            </div>
          )}

          {/* Feedback Submitted */}
          {!showFeedback && isHelpful !== undefined && (
            <div
              style={{
                marginTop: spacing.md,
                padding: spacing.md,
                backgroundColor: isHelpful ? colors.success : colors.error,
                color: colors.primary.white,
                borderRadius: borderRadius.sm,
                fontSize: typography.fontSize.label3.size,
                textAlign: 'center',
              }}
            >
              {isHelpful ? '✓ Thanks for the feedback!' : '✓ We\'ll improve'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
