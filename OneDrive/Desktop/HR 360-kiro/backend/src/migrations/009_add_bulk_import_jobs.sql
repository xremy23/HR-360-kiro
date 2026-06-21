-- Create bulk_import_jobs table for tracking batch user imports
CREATE TABLE IF NOT EXISTS bulk_import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(10) NOT NULL CHECK (file_type IN ('csv', 'xlsx')),
  column_mapping JSONB NOT NULL, -- { sourceColumn: targetField }
  import_settings JSONB NOT NULL, -- { targetOrganization, defaultRole, skipDuplicates, requirePhoneValidation }
  total_rows INT NOT NULL,
  success_count INT NOT NULL DEFAULT 0,
  error_count INT NOT NULL DEFAULT 0,
  warning_count INT NOT NULL DEFAULT 0,
  execution_details JSONB NOT NULL DEFAULT '{"errors": [], "warnings": [], "successEmails": []}',
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  error_report TEXT,
  report_storage_url VARCHAR(500), -- GCS path to report CSV
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP,
  
  -- Indexes for common queries
  CONSTRAINT bulk_import_jobs_org_created_idx UNIQUE (org_id, id)
);

CREATE INDEX idx_bulk_import_jobs_org_id ON bulk_import_jobs(org_id);
CREATE INDEX idx_bulk_import_jobs_created_by ON bulk_import_jobs(created_by);
CREATE INDEX idx_bulk_import_jobs_status ON bulk_import_jobs(status);
CREATE INDEX idx_bulk_import_jobs_created_at ON bulk_import_jobs(created_at DESC);
