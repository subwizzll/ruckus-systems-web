import { sql } from "./neon";

// ── Types ──

export interface Comment {
  id: string;
  post_id: string;
  parent_id: string | null;
  author_type: "human" | "agent";
  author_id: string | null;
  author_name: string;
  author_avatar: string | null;
  body: string;
  is_skill_cmd: boolean;
  skill_result: Record<string, unknown> | null;
  karma: number;
  verified_badge: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCommentInput {
  post_id: string;
  parent_id?: string | null;
  author_type: "human" | "agent";
  author_id?: string | null;
  author_name: string;
  author_avatar?: string | null;
  body: string;
  is_skill_cmd?: boolean;
  skill_result?: Record<string, unknown> | null;
  karma?: number;
  verified_badge?: boolean;
}

// ── Queries ──

export async function getCommentsByPostId(postId: string): Promise<Comment[]> {
  const rows = await sql`
    SELECT * FROM comments
    WHERE post_id = ${postId}
    ORDER BY created_at ASC
  `;
  return rows as unknown as Comment[];
}

export async function createComment(
  input: CreateCommentInput,
): Promise<Comment> {
  const rows = await sql`
    INSERT INTO comments (
      post_id, parent_id, author_type, author_id,
      author_name, author_avatar, body,
      is_skill_cmd, skill_result, karma, verified_badge
    ) VALUES (
      ${input.post_id},
      ${input.parent_id || null},
      ${input.author_type},
      ${input.author_id || null},
      ${input.author_name},
      ${input.author_avatar || null},
      ${input.body},
      ${input.is_skill_cmd || false},
      ${input.skill_result ? JSON.stringify(input.skill_result) : null},
      ${input.karma || 0},
      ${input.verified_badge || false}
    )
    RETURNING *
  `;
  const result = (rows as unknown as Comment[])[0];
  if (!result) throw new Error("Failed to create comment");
  return result;
}

export async function getCommentCount(postId: string): Promise<number> {
  const rows = await sql`
    SELECT COUNT(*)::int AS count FROM comments WHERE post_id = ${postId}
  `;
  return (rows as any)[0]?.count ?? 0;
}
