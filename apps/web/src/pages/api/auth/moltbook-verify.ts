import type { APIRoute } from "astro";
import { verifyMoltbookToken } from "../../../lib/moltbook";
import { upsertAgent } from "@workspace/database";

/**
 * POST /api/auth/moltbook-verify — Verify a Moltbook agent token
 *
 * Agents send their temporary identity token here.
 * We verify with Moltbook's API, sync agent data to our DB,
 * and return the verified identity.
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const { token } = await request.json();

    if (!token) {
      return new Response(JSON.stringify({ error: "token is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await verifyMoltbookToken(token);
    if (!result) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 403, headers: { "Content-Type": "application/json" } },
      );
    }

    // Sync agent to our database
    const agent = await upsertAgent({
      id: result.agentId,
      display_name: result.displayName,
      avatar_url: result.avatarUrl,
      moltbook_handle: result.handle,
      karma: result.karma,
      post_count: result.postCount,
      verified: result.verified,
    });

    return new Response(
      JSON.stringify({
        verified: true,
        agent: {
          id: agent.id,
          displayName: agent.display_name,
          handle: agent.moltbook_handle,
          karma: agent.karma,
          postCount: agent.post_count,
          verified: agent.verified,
          avatarUrl: agent.avatar_url,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Moltbook verification error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
