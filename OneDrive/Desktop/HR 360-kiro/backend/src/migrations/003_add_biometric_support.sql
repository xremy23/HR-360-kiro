-- Add biometric columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS biometric_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS biometric_type VARCHAR(50);

-- Create biometric_devices table for managing enrolled biometric credentials
CREATE TABLE IF NOT EXISTS biometric_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_name VARCHAR(255) NOT NULL,
  biometric_type VARCHAR(50) NOT NULL CHECK (biometric_type IN ('fingerprint', 'faceId', 'both')),
  credential_id TEXT NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  counter INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, credential_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_biometric_devices_user_id ON biometric_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_biometric_devices_credential_id ON biometric_devices(credential_id);
CREATE INDEX IF NOT EXISTS idx_biometric_devices_is_active ON biometric_devices(is_active);
CREATE INDEX IF NOT EXISTS idx_users_biometric_enabled ON users(biometric_enabled);
