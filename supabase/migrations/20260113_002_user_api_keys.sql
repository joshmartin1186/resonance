-- User API Keys Storage
-- Allows users to provide their own API keys for AI services

-- API keys table (encrypted at rest by Supabase)
CREATE TABLE user_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,

  -- Service provider
  provider TEXT NOT NULL CHECK (provider IN ('anthropic', 'openai', 'replicate', 'stability')),

  -- Encrypted key (use pgcrypto for application-level encryption)
  -- The actual encryption happens in the application layer
  encrypted_key TEXT NOT NULL,

  -- Key metadata (non-sensitive)
  key_hint TEXT, -- Last 4 characters for identification, e.g., "...a1b2"

  -- Status
  is_valid BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  last_error TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Only one key per provider per organization
  UNIQUE(organization_id, provider)
);

-- Index for fast lookups
CREATE INDEX idx_api_keys_org ON user_api_keys(organization_id);
CREATE INDEX idx_api_keys_provider ON user_api_keys(provider);

-- Enable RLS
ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;

-- Users can only see their own organization's keys
CREATE POLICY "Users can view own org keys" ON user_api_keys
  FOR SELECT USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

-- Only admins/owners can insert keys
CREATE POLICY "Admins can insert keys" ON user_api_keys
  FOR INSERT WITH CHECK (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    AND (SELECT role FROM users WHERE id = auth.uid()) IN ('owner', 'admin')
  );

-- Only admins/owners can update keys
CREATE POLICY "Admins can update keys" ON user_api_keys
  FOR UPDATE USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    AND (SELECT role FROM users WHERE id = auth.uid()) IN ('owner', 'admin')
  );

-- Only admins/owners can delete keys
CREATE POLICY "Admins can delete keys" ON user_api_keys
  FOR DELETE USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    AND (SELECT role FROM users WHERE id = auth.uid()) IN ('owner', 'admin')
  );

-- Update timestamp trigger
CREATE TRIGGER user_api_keys_updated_at
  BEFORE UPDATE ON user_api_keys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Add generation tracking for API usage
ALTER TABLE generations ADD COLUMN IF NOT EXISTS api_provider TEXT;
ALTER TABLE generations ADD COLUMN IF NOT EXISTS api_tokens_used INTEGER;
