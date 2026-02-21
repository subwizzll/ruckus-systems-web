import type { APIRoute } from "astro";
import { getFreeBookingByEmail } from "@workspace/database";

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

async function verifyTurnstileToken(token: string): Promise<boolean> {
  const secret = import.meta.env.TURNSTILE_SECRET_KEY || process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;

  try {
    const res = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
    });
    const data = await res.json();
    return data.success === true;
  } catch {
    return false;
  }
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const email = (body.email || "").trim().toLowerCase();
    const serviceId = body.serviceId || "";
    const turnstileToken = body.turnstileToken || "";

    if (!email || !serviceId) {
      return new Response(
        JSON.stringify({ eligible: false, reason: "Email and service ID are required." }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const turnstileOk = await verifyTurnstileToken(turnstileToken);
    if (!turnstileOk) {
      return new Response(
        JSON.stringify({ eligible: false, reason: "Bot verification failed. Please try again." }),
        { status: 403, headers: { "Content-Type": "application/json" } },
      );
    }

    const existing = await getFreeBookingByEmail(email, serviceId);
    if (existing) {
      return new Response(
        JSON.stringify({
          eligible: false,
          reason: "You've already used your free strategy session. Please select a paid service.",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ eligible: true }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        eligible: false,
        reason: error instanceof Error ? error.message : "Eligibility check failed.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
