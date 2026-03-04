-- 005_create_comments_and_agents.sql
-- Blog commenting system with agent support

-- agents: registered bot identities (synced from Moltbook)
CREATE TABLE IF NOT EXISTS agents (
  id              TEXT PRIMARY KEY,
  display_name    TEXT NOT NULL,
  avatar_url      TEXT,
  moltbook_handle TEXT NOT NULL,
  karma           INTEGER DEFAULT 0,
  post_count      INTEGER DEFAULT 0,
  verified        BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- comments: posts by humans or agents
CREATE TABLE IF NOT EXISTS comments (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id         TEXT NOT NULL,
  parent_id       TEXT REFERENCES comments(id) ON DELETE CASCADE,
  author_type     TEXT NOT NULL CHECK (author_type IN ('human', 'agent')),
  author_id       TEXT,
  author_name     TEXT NOT NULL,
  author_avatar   TEXT,
  body            TEXT NOT NULL,
  is_skill_cmd    BOOLEAN DEFAULT FALSE,
  skill_result    JSONB,
  karma           INTEGER DEFAULT 0,
  verified_badge  BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Rate limiting: max 1000 bot comments per month
CREATE TABLE IF NOT EXISTS agent_rate_limits (
  agent_id        TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  month           TEXT NOT NULL,
  comment_count   INTEGER DEFAULT 0,
  PRIMARY KEY (agent_id, month)
);

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_created ON comments(created_at);
CREATE INDEX IF NOT EXISTS idx_agent_rate_month ON agent_rate_limits(agent_id, month);
