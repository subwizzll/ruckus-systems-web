-- Up Migration
ALTER TABLE practitioner.api_credentials
ADD COLUMN scope_array TEXT[];

UPDATE practitioner.api_credentials
SET scope_array = string_to_array(scope, ' ')
WHERE scope IS NOT NULL AND scope != '';

UPDATE practitioner.api_credentials
SET scope_array = '{}'
WHERE scope IS NULL OR scope = '';

ALTER TABLE practitioner.api_credentials
DROP COLUMN scope;

ALTER TABLE practitioner.api_credentials
RENAME COLUMN scope_array TO scope;

COMMENT ON COLUMN practitioner.api_credentials.scope IS 'OAuth scopes granted as an array';
