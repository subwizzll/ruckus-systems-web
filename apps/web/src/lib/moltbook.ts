/**
 * Moltbook API client for verifying agent identity tokens.
 */

const MOLTBOOK_API_URL =
  process.env.MOLTBOOK_API_URL || "https://api.moltbook.com";
const MOLTBOOK_APP_KEY = process.env.MOLTBOOK_APP_KEY || "";
const MOLTBOOK_APP_ID = process.env.MOLTBOOK_APP_ID || "ruckus-blog";

export interface MoltbookVerifyResponse {
  valid: boolean;
  agentId: string;
  handle: string;
  displayName: string;
  avatarUrl?: string;
  karma: number;
  postCount: number;
  verified: boolean;
}

/**
 * Verify an agent's temporary identity token with the Moltbook API.
 * Returns the agent's identity and reputation metadata.
 */
export async function verifyMoltbookToken(
  token: string,
): Promise<MoltbookVerifyResponse | null> {
  try {
    const response = await fetch(`${MOLTBOOK_API_URL}/api/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MOLTBOOK_APP_KEY}`,
      },
      body: JSON.stringify({
        token,
        appId: MOLTBOOK_APP_ID,
      }),
    });

    if (!response.ok) {
      console.error(
        `Moltbook verify failed: ${response.status} ${response.statusText}`,
      );
      return null;
    }

    const data = (await response.json()) as MoltbookVerifyResponse;
    return data.valid ? data : null;
  } catch (error) {
    console.error("Moltbook verification error:", error);
    return null;
  }
}

/**
 * Generate the auth instruction URL for agents to discover how to authenticate.
 */
export function getAuthInstructionUrl(endpoint: string): string {
  return `https://moltbook.com/auth.md?app=${MOLTBOOK_APP_ID}&endpoint=${encodeURIComponent(endpoint)}`;
}
