-- Chatbot Training Data Migration
-- Version: 002
-- Description: Add tables for managing chatbot responses and training data

-- ============================================================================
-- CHATBOT RESPONSES (Admin-managed responses for common questions)
-- ============================================================================

CREATE TABLE chatbot_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  question_pattern VARCHAR(500) NOT NULL, -- Pattern to match user questions
  response TEXT NOT NULL, -- The response to provide
  category VARCHAR(100), -- natural_disaster, hr_protocol, work_protocol, etc
  priority INT DEFAULT 0, -- Higher priority responses are matched first
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(organization_id, question_pattern)
);

CREATE INDEX idx_chatbot_responses_organization_id ON chatbot_responses(organization_id);
CREATE INDEX idx_chatbot_responses_category ON chatbot_responses(category);
CREATE INDEX idx_chatbot_responses_is_active ON chatbot_responses(is_active);
CREATE INDEX idx_chatbot_responses_priority ON chatbot_responses(priority);

-- ============================================================================
-- CHATBOT FEEDBACK QUEUE (Admin todo list for improving chatbot)
-- ============================================================================

CREATE TABLE chatbot_feedback_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_question TEXT NOT NULL,
  bot_response TEXT NOT NULL,
  user_feedback TEXT,
  is_helpful BOOLEAN,
  priority VARCHAR(50) DEFAULT 'medium', -- high, medium, low
  status VARCHAR(50) DEFAULT 'pending', -- pending, reviewed, resolved, archived
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP,
  resolved_at TIMESTAMP,
  admin_action TEXT, -- What action was taken (e.g., "updated response", "created new pattern")
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chatbot_feedback_queue_organization_id ON chatbot_feedback_queue(organization_id);
CREATE INDEX idx_chatbot_feedback_queue_status ON chatbot_feedback_queue(status);
CREATE INDEX idx_chatbot_feedback_queue_priority ON chatbot_feedback_queue(priority);
CREATE INDEX idx_chatbot_feedback_queue_assigned_to ON chatbot_feedback_queue(assigned_to);
CREATE INDEX idx_chatbot_feedback_queue_created_at ON chatbot_feedback_queue(created_at);

-- Apply updated_at trigger
CREATE TRIGGER update_chatbot_responses_updated_at BEFORE UPDATE ON chatbot_responses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chatbot_feedback_queue_updated_at BEFORE UPDATE ON chatbot_feedback_queue
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
