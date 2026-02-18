import type { APIRoute } from "astro";
import { login } from "@workspace/backend";

export const POST: APIRoute = async ({ request }) => {
  try {
    return await login(request);
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        message: error instanceof Error ? error.message : "Internal server error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
