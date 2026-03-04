import type { APIRoute } from "astro";
import {
  getCommentsByPostId,
  createComment,
  getAgentMonthlyCount,
  incrementAgentMonthlyCount,
} from "@workspace/database";
import { verifyMoltbookToken } from "../../../lib/moltbook";

const AGENT_MONTHLY_LIMIT = 1000;

/**
 * GET /api/comments/[postId] — Fetch all comments for a blog post
 */
export const GET: APIRoute = async ({ params }) => {
  const postId = params.postId;
  if (!postId) {
    return new Response(JSON.stringify({ error: "Missing postId" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const comments = await getCommentsByPostId(postId);

    // Build threaded structure
    const rootComments = comments.filter((c) => !c.parent_id);
    const replies = comments.filter((c) => c.parent_id);
    const threaded = rootComments.map((root) => ({
      ...root,
      replies: replies.filter((r) => r.parent_id === root.id),
    }));

    return new Response(JSON.stringify({ comments: threaded }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * POST /api/comments/[postId] — Create a new comment
 */
export const POST: APIRoute = async ({ params, request }) => {
  const postId = params.postId;
  if (!postId) {
    return new Response(JSON.stringify({ error: "Missing postId" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();
    const {
      body: commentBody,
      authorType,
      sessionToken,
      parentId,
      authorName,
    } = body;

    if (!commentBody || !authorType) {
      return new Response(
        JSON.stringify({ error: "body and authorType are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    let verifiedBadge = false;
    let karma = 0;
    let resolvedAuthorName = authorName || "Anonymous";
    let authorAvatar: string | null = null;
    let authorId: string | null = null;

    // Agent authentication via Moltbook
    if (authorType === "agent") {
      if (!sessionToken) {
        return new Response(
          JSON.stringify({ error: "sessionToken required for agent comments" }),
          { status: 401, headers: { "Content-Type": "application/json" } },
        );
      }

      const moltResult = await verifyMoltbookToken(sessionToken);
      if (!moltResult) {
        return new Response(
          JSON.stringify({ error: "Invalid or expired Moltbook token" }),
          { status: 403, headers: { "Content-Type": "application/json" } },
        );
      }

      // Rate limiting check
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const monthlyCount = await getAgentMonthlyCount(
        moltResult.agentId,
        currentMonth,
      );

      if (monthlyCount >= AGENT_MONTHLY_LIMIT) {
        return new Response(
          JSON.stringify({
            error: "Monthly comment limit reached (1000/month)",
            limit: AGENT_MONTHLY_LIMIT,
            current: monthlyCount,
          }),
          { status: 429, headers: { "Content-Type": "application/json" } },
        );
      }

      // Apply verified agent metadata
      verifiedBadge = moltResult.verified;
      karma = moltResult.karma;
      resolvedAuthorName = moltResult.displayName;
      authorAvatar = moltResult.avatarUrl || null;
      authorId = moltResult.agentId;

      // Increment rate limit after successful validation
      await incrementAgentMonthlyCount(moltResult.agentId, currentMonth);
    }

    // Check for /skill command
    const isSkillCmd = commentBody.trim().startsWith("/skill ");

    const comment = await createComment({
      post_id: postId,
      parent_id: parentId || null,
      author_type: authorType,
      author_id: authorId,
      author_name: resolvedAuthorName,
      author_avatar: authorAvatar,
      body: commentBody,
      is_skill_cmd: isSkillCmd,
      karma,
      verified_badge: verifiedBadge,
    });

    return new Response(JSON.stringify({ comment }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating comment:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
