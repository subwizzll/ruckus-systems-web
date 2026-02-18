-- Up Migration
CREATE TABLE public.auth_session (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES practitioner.practitioners(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_auth_session_user_id ON public.auth_session(user_id);
CREATE INDEX idx_auth_session_token ON public.auth_session(token);
CREATE INDEX idx_auth_session_expires_at ON public.auth_session(expires_at);

COMMENT ON TABLE public.auth_session IS 'User authentication sessions with token-based authentication';
COMMENT ON COLUMN public.auth_session.user_id IS 'Foreign key reference to practitioner.practitioners(id)';
COMMENT ON COLUMN public.auth_session.token IS 'Unique session token for authentication';
COMMENT ON COLUMN public.auth_session.expires_at IS 'Session expiration timestamp';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.auth_session TO PUBLIC;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO PUBLIC;
