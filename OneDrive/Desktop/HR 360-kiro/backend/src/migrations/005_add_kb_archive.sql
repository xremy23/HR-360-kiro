-- Add archive column to KB guides table
ALTER TABLE kb_guides
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;

-- Create index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_kb_guides_is_archived ON kb_guides(is_archived);
