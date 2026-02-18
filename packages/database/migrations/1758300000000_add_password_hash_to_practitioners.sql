-- Up Migration
ALTER TABLE practitioner.practitioners
ADD COLUMN password_hash TEXT;

COMMENT ON COLUMN practitioner.practitioners.password_hash IS 'Bcrypt hash of user password. NULL for OAuth-only users.';
