-- Up Migration
CREATE SCHEMA IF NOT EXISTS practitioner;

COMMENT ON SCHEMA practitioner IS 'Schema for storing practitioner information and API credentials';

CREATE TABLE practitioner.practitioners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE practitioner.api_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practitioner_id UUID NOT NULL REFERENCES practitioner.practitioners(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  scope TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(practitioner_id, provider)
);

CREATE INDEX idx_practitioners_email ON practitioner.practitioners(email);
CREATE INDEX idx_api_credentials_practitioner_id ON practitioner.api_credentials(practitioner_id);
CREATE INDEX idx_api_credentials_provider ON practitioner.api_credentials(provider);
CREATE INDEX idx_api_credentials_expires ON practitioner.api_credentials(token_expires_at);

GRANT USAGE ON SCHEMA practitioner TO PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA practitioner TO PUBLIC;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA practitioner TO PUBLIC;
