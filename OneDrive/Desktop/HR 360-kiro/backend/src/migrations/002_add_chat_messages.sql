-- Chat Messages Table Migration
-- Version: 002
-- Description: Add chat messages table for chatbot feature

-- Chat Messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_message TEXT NOT NULL,
    bot_response TEXT NOT NULL,
    context JSONB DEFAULT '{}',
    is_helpful BOOLEAN,
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_org_id ON chat_messages(org_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_is_helpful ON chat_messages(is_helpful);

-- Apply updated_at trigger
CREATE TRIGGER update_chat_messages_updated_at BEFORE UPDATE ON chat_messages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
