import type { APIRoute } from "astro";
import { getEntry } from "astro:content";
import { fetchTimeSlots } from "@workspace/backend/booking/slots";

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

  const entry = await getEntry("services", eventTypeSlug);
  if (!entry) {
    return new Response(
      JSON.stringify({ success: false, error: `Unknown service type: ${eventTypeSlug}` }),
      { status: 404, headers: { "Content-Type": "application/json" } },
    );
  }

  const duration = entry.data.duration;

  const minDaysParam = url.searchParams.get("minDaysInAdvance");
  const maxDaysParam = url.searchParams.get("maxDaysInAdvance");
  const minDaysInAdvance =
    minDaysParam !== null ? Math.max(0, parseInt(minDaysParam, 10) || 0) : 1;
  const maxDaysInAdvance =
    maxDaysParam !== null ? Math.max(0, parseInt(maxDaysParam, 10) || 30) : 30;
  const effectiveMax = Math.max(maxDaysInAdvance, minDaysInAdvance);

  const result = await fetchTimeSlots(duration);
  if (!result.success || !result.data?.slots) {
    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const now = new Date();
  const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const minStart = new Date(todayUtc);
  minStart.setUTCDate(minStart.getUTCDate() + minDaysInAdvance);
  const maxEnd = new Date(todayUtc);
  maxEnd.setUTCDate(maxEnd.getUTCDate() + effectiveMax);
  maxEnd.setUTCHours(23, 59, 59, 999);

  const slots = result.data.slots.filter((slot) => {
    const start = new Date(slot.start_time);
    return start >= minStart && start <= maxEnd;
  });

  return new Response(
    JSON.stringify({ success: true, data: { slots, total: slots.length } }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
};
