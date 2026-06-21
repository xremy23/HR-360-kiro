-- Create community_reports table for crowd-sourced hazard reporting
CREATE TABLE IF NOT EXISTS community_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  location JSONB, -- { latitude: number, longitude: number, address?: string }
  category VARCHAR(50) NOT NULL CHECK (category IN ('natural_disaster', 'hazard', 'safety_concern', 'infrastructure', 'other')),
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  image_urls JSONB DEFAULT '[]', -- Array of uploaded image URLs
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'archived')),
  upvotes INT DEFAULT 0,
  upvoted_by JSONB DEFAULT '[]', -- Array of user IDs who upvoted
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  
  -- Indexes for common queries
  CONSTRAINT community_reports_org_created_idx UNIQUE (org_id, id)
);

CREATE INDEX idx_community_reports_org_id ON community_reports(org_id);
CREATE INDEX idx_community_reports_user_id ON community_reports(user_id);
CREATE INDEX idx_community_reports_created_at ON community_reports(created_at DESC);
CREATE INDEX idx_community_reports_status ON community_reports(status);
CREATE INDEX idx_community_reports_expires_at ON community_reports(expires_at);
CREATE INDEX idx_community_reports_upvotes ON community_reports(upvotes DESC);

-- Trigger to update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_community_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER community_reports_update_timestamp
  BEFORE UPDATE ON community_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_community_reports_updated_at();
