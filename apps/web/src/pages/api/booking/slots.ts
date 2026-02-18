import type { APIRoute } from "astro";
import { fetchTimeSlots } from "@workspace/backend/booking/slots";

const SERVICE_DURATION_MINUTES: Record<string, number> = {
  "strategy-call": 60,
  "workflow-audit": 120,
};

export const GET: APIRoute = async ({ url }) => {
  if (process.env.BOOKING_ENABLED === "false") {
    return new Response(JSON.stringify({ success: false, error: "Booking is currently disabled" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  const eventTypeSlug = url.searchParams.get("eventTypeSlug");
  if (!eventTypeSlug) {
    return new Response(
      JSON.stringify({ success: false, error: "Missing required parameter: eventTypeSlug" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const duration = SERVICE_DURATION_MINUTES[eventTypeSlug];
  if (!duration) {
    return new Response(
      JSON.stringify({ success: false, error: `Unknown service type: ${eventTypeSlug}` }),
      { status: 404, headers: { "Content-Type": "application/json" } },
    );
  }

  const result = await fetchTimeSlots(duration);
  return new Response(JSON.stringify(result), {
    status: result.success ? 200 : 500,
    headers: { "Content-Type": "application/json" },
  });
};
