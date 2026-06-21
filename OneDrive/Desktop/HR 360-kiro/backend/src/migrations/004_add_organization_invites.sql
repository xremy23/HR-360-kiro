-- Add organization invites table
CREATE TABLE IF NOT EXISTS organization_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  code VARCHAR(20) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true
);

-- Create index on code for faster lookups
CREATE INDEX IF NOT EXISTS idx_org_invites_code ON organization_invites(code);
CREATE INDEX IF NOT EXISTS idx_org_invites_org_id ON organization_invites(organization_id);
