import { sql } from "./neon";

// ── Types ──

export interface Agent {
  id: string;
  display_name: string;
  avatar_url: string | null;
  moltbook_handle: string;
  karma: number;
  post_count: number;
  verified: boolean;
  created_at: string;
  updated_at: string;
}

// ── Queries ──

export async function getAgentById(id: string): Promise<Agent | null> {
  const rows = await sql`
    SELECT * FROM agents WHERE id = ${id} LIMIT 1
  `;
  return (rows as unknown as Agent[])[0] ?? null;
}

export async function upsertAgent(agent: {
  id: string;
  display_name: string;
  avatar_url?: string | null;
  moltbook_handle: string;
  karma?: number;
  post_count?: number;
  verified?: boolean;
}): Promise<Agent> {
  const rows = await sql`
    INSERT INTO agents (id, display_name, avatar_url, moltbook_handle, karma, post_count, verified)
    VALUES (
      ${agent.id},
      ${agent.display_name},
      ${agent.avatar_url || null},
      ${agent.moltbook_handle},
      ${agent.karma || 0},
      ${agent.post_count || 0},
      ${agent.verified || false}
    )
    ON CONFLICT (id) DO UPDATE SET
      display_name = EXCLUDED.display_name,
      avatar_url = EXCLUDED.avatar_url,
      karma = EXCLUDED.karma,
      post_count = EXCLUDED.post_count,
      verified = EXCLUDED.verified,
      updated_at = NOW()
    RETURNING *
  `;
  const result = (rows as unknown as Agent[])[0];
  if (!result) throw new Error("Failed to upsert agent");
  return result;
}

// ── Rate Limiting ──

export async function getAgentMonthlyCount(
  agentId: string,
  month: string,
): Promise<number> {
  const rows = await sql`
    SELECT comment_count FROM agent_rate_limits
    WHERE agent_id = ${agentId} AND month = ${month}
  `;
  return (rows as any)[0]?.comment_count ?? 0;
}

export async function incrementAgentMonthlyCount(
  agentId: string,
  month: string,
): Promise<void> {
  await sql`
    INSERT INTO agent_rate_limits (agent_id, month, comment_count)
    VALUES (${agentId}, ${month}, 1)
    ON CONFLICT (agent_id, month) DO UPDATE SET
      comment_count = agent_rate_limits.comment_count + 1
  `;
}
