import type { APIRoute } from "astro";
import { validateBookingToken, getBookingById, rescheduleBooking } from "@workspace/backend";
import servicesJson from "../../../data/services.json";

const servicesConfig = servicesJson as Array<{ id: string; minDaysInAdvance: number; maxDaysInAdvance: number }>;

export const GET: APIRoute = async ({ url }) => {
  try {
    if (process.env.BOOKING_ENABLED === "false") {
      return new Response(JSON.stringify({ success: false, error: "Booking is currently disabled" }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      });
    }

    const token = url.searchParams.get("token");
    if (!token) {
      return new Response(JSON.stringify({ success: false, error: "Missing token parameter" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const validation = validateBookingToken(token, "reschedule");
    if (!validation.valid || !validation.payload) {
      return new Response(
        JSON.stringify({ success: false, error: validation.error || "Invalid or expired token" }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }

    const booking = await getBookingById(validation.payload.bookingId);
    if (!booking) {
      return new Response(JSON.stringify({ success: false, error: "Booking not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (booking.client_email !== validation.payload.email) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
    const startTime = new Date(booking.start_time);
    if (startTime.getTime() <= Date.now()) {
      return new Response(
        JSON.stringify({ success: false, error: "Appointment has already started" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const serviceConfig = servicesConfig.find((s) => s.id === booking.service_id);
    const minDaysInAdvance = serviceConfig?.minDaysInAdvance ?? 1;
    const maxDaysInAdvance = serviceConfig?.maxDaysInAdvance ?? 30;

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          bookingId: booking.id,
          serviceTitle: booking.service_title,
          serviceId: booking.service_id,
          currentStartTime: booking.start_time,
          durationMinutes: booking.duration_minutes,
          timezone: booking.timezone,
          format: booking.format,
          clientName: `${booking.client_first_name} ${booking.client_last_name}`,
          clientEmail: booking.client_email,
          minDaysInAdvance,
          maxDaysInAdvance,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to validate token",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    if (process.env.BOOKING_ENABLED === "false") {
      return new Response(JSON.stringify({ success: false, error: "Booking is currently disabled" }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const { token, newStartTime } = body;
    if (!token || !newStartTime) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields: token, newStartTime" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const validation = validateBookingToken(token, "reschedule");
    if (!validation.valid || !validation.payload) {
      return new Response(
        JSON.stringify({ success: false, error: validation.error || "Invalid or expired token" }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }

    const booking = await getBookingById(validation.payload.bookingId);
    if (!booking) {
      return new Response(JSON.stringify({ success: false, error: "Booking not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (booking.client_email !== validation.payload.email) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
    const bookingStartTime = new Date(booking.start_time);
    if (bookingStartTime.getTime() <= Date.now()) {
      return new Response(
        JSON.stringify({ success: false, error: "Appointment has already started" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const serviceConfig = servicesConfig.find((s) => s.id === booking.service_id);
    const minDays = serviceConfig?.minDaysInAdvance ?? 1;
    const maxDays = serviceConfig?.maxDaysInAdvance ?? 30;
    const now = new Date();
    const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const minStart = new Date(todayUtc);
    minStart.setUTCDate(minStart.getUTCDate() + minDays);
    const maxEnd = new Date(todayUtc);
    maxEnd.setUTCDate(maxEnd.getUTCDate() + Math.max(maxDays, minDays));
    maxEnd.setUTCHours(23, 59, 59, 999);
    const start = new Date(newStartTime);
    if (start < minStart || start > maxEnd) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `New time must be between ${minDays} and ${maxDays} days from today.`,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const result = await rescheduleBooking(validation.payload.bookingId, new Date(newStartTime));
    if (!result.success) throw new Error(result.error || "Failed to reschedule booking");

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to reschedule booking",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
