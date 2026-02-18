import type { APIRoute } from "astro";
import { validateBookingToken, getBookingById, rescheduleBooking } from "@workspace/backend";

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
