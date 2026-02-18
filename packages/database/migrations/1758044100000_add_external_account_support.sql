-- Up Migration
ALTER TABLE practitioner.api_credentials
DROP CONSTRAINT IF EXISTS practitioner_api_credentials_practitioner_id_provider_key;

ALTER TABLE practitioner.api_credentials
ADD COLUMN external_account_id VARCHAR(255);

COMMENT ON COLUMN practitioner.api_credentials.external_account_id IS 'External account identifier (e.g., email for Google, user_id for Zoom)';

ALTER TABLE practitioner.api_credentials
ADD CONSTRAINT unique_practitioner_provider_account
UNIQUE(practitioner_id, provider, external_account_id);

CREATE INDEX idx_api_credentials_external_account ON practitioner.api_credentials(external_account_id);
